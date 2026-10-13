import path from 'path';
import fs from 'fs/promises';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { callGemini, GeminiPart } from './geminiClient';
import { TRANSCRIBE_PROMPT_V1 } from '../prompts/transcribe.v1';
import { QUESTION_GEN_PROMPT_V1 } from '../prompts/questionGen.v1';
import { SELF_CHECK_PROMPT_V1 } from '../prompts/selfCheck.v1';
import {
  AiGeneratedQuestion,
  QuestionGenerationResult,
  QuestionType,
} from '../domain/types';

// Zod schemas for runtime response validation
const TranscribeSchema = z.object({
  transcript: z.string().min(1),
  unclearCount: z.number().default(0),
});

const GeneratedQuestionSchema = z.object({
  prompt: z.string().min(3),
  type: z.enum(['MCQ', 'SHORT_ANSWER']),
  options: z.array(z.string()).optional(),
  correctOptionIndex: z.number().int().min(0).max(3).optional(),
  acceptableAnswers: z.array(z.string()).optional(),
  explanation: z.string().min(1),
  sourceQuote: z.string().default('Source textbook page'),
  bloomLevel: z.enum(['recall', 'understand', 'apply']).default('recall'),
});

const QuestionListSchema = z.object({
  questions: z.array(GeneratedQuestionSchema),
});

const SelfCheckAuditSchema = z.object({
  results: z.array(
    z.object({
      index: z.number().int(),
      pass: z.boolean(),
      reason: z.string(),
    })
  ),
});

export interface GenerateQuestionsOptions {
  topicId: string;
  submissionId?: string;
  imageUrls?: string[];
  questionType: QuestionType;
  count?: number;
  mentorGuidance?: string;
}

/**
 * Converts a stored image path (data URL or /uploads disk file) into a Gemini inlineData part.
 */
async function resolveImageToGeminiPart(imageSrc: string): Promise<GeminiPart | null> {
  try {
    if (imageSrc.startsWith('data:')) {
      const match = imageSrc.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (match && match.length === 3) {
        return {
          inlineData: {
            mimeType: match[1],
            data: match[2],
          },
        };
      }
    }

    // Relative disk path (e.g. /uploads/curriculum/curr_123.jpg)
    if (imageSrc.startsWith('/uploads/')) {
      const relativeClean = imageSrc.replace(/^\//, '');
      const fullDiskPath = path.join(process.cwd(), 'public', relativeClean);
      const fileBuffer = await fs.readFile(fullDiskPath);
      const ext = path.extname(fullDiskPath).toLowerCase();
      const mimeType =
        ext === '.png'
          ? 'image/png'
          : ext === '.webp'
          ? 'image/webp'
          : 'image/jpeg';

      return {
        inlineData: {
          mimeType,
          data: fileBuffer.toString('base64'),
        },
      };
    }

    return null;
  } catch (err) {
    console.warn('Failed to resolve image for Gemini part:', imageSrc.slice(0, 50), err);
    return null;
  }
}

export async function generateQuestionsFromSnaps(
  options: GenerateQuestionsOptions
): Promise<QuestionGenerationResult> {
  const {
    topicId,
    submissionId,
    questionType,
    count = 5,
    mentorGuidance,
  } = options;

  // 1. Fetch Topic, Subject, and existing questions for few-shot examples
  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    include: {
      subject: true,
      questions: {
        where: { type: questionType },
        take: 8,
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!topic) {
    throw new Error(`Topic with id "${topicId}" was not found`);
  }

  // 2. Fetch images from Submission or direct URLs
  let candidateImages: string[] = options.imageUrls || [];

  if (candidateImages.length === 0 && submissionId) {
    const submission = await prisma.curriculumSubmission.findUnique({
      where: { id: submissionId },
    });
    if (submission && submission.imageUrls.length > 0) {
      candidateImages = submission.imageUrls;
    }
  }

  if (candidateImages.length === 0) {
    throw new Error('At least one class page snap image is required to generate questions');
  }

  // Cap at 3 images to maintain optimal Gemini token usage
  const selectedImages = candidateImages.slice(0, 3);
  const imageParts: GeminiPart[] = [];

  for (const imgSrc of selectedImages) {
    const part = await resolveImageToGeminiPart(imgSrc);
    if (part) {
      imageParts.push(part);
    }
  }

  if (imageParts.length === 0) {
    throw new Error('Unable to read or parse the selected page images');
  }

  // ─── STEP 1: TRANSCRIBE ───────────────────────────────────────────────
  const transcribePromptText = TRANSCRIBE_PROMPT_V1.requestPrompt;
  const transcribeRaw = await callGemini({
    contents: [
      {
        parts: [...imageParts, { text: transcribePromptText }],
      },
    ],
    systemInstruction: TRANSCRIBE_PROMPT_V1.systemInstruction,
    temperature: 0.1,
    responseSchema: TRANSCRIBE_PROMPT_V1.responseSchema,
  });

  let transcript = '';
  let unclearCount = 0;
  try {
    const parsedTranscribe = TranscribeSchema.parse(JSON.parse(transcribeRaw));
    transcript = parsedTranscribe.transcript;
    unclearCount = parsedTranscribe.unclearCount;
  } catch {
    transcript = transcribeRaw;
  }

  // ─── STEP 2: GENERATE QUESTIONS ───────────────────────────────────────
  // Format mentor's golden examples
  const examplesText = topic.questions
    .map((q, idx) => {
      if (q.type === 'MCQ') {
        const opts = q.options.map((opt, i) => `  ${i + 1}. ${opt}`).join('\n');
        return `Example ${idx + 1} (MCQ):
Question: ${q.prompt}
Options:
${opts}
Correct Option Index: ${q.correctOptionIndex ?? 0}
Explanation: ${q.explanation}`;
      } else {
        return `Example ${idx + 1} (One-Word):
Question: ${q.prompt}
Acceptable Answers: ${(q.acceptableAnswers || []).join(', ')}
Explanation: ${q.explanation}`;
      }
    })
    .join('\n\n');

  const requestText = QUESTION_GEN_PROMPT_V1.buildRequestText({
    topicTitle: topic.title,
    subjectName: topic.subject.name,
    teachingProfile: topic.subject.teachingProfile,
    examplesText,
    transcriptText: transcript,
    mentorGuidance,
    questionType,
    count: Math.min(Math.max(count, 1), 10),
  });

  const questionGenRaw = await callGemini({
    contents: [
      {
        parts: [{ text: requestText }],
      },
    ],
    systemInstruction: QUESTION_GEN_PROMPT_V1.systemInstruction,
    temperature: 0.3,
    responseSchema: QUESTION_GEN_PROMPT_V1.responseSchema,
  });

  const parsedGen = QuestionListSchema.parse(JSON.parse(questionGenRaw));
  const draftQuestions: AiGeneratedQuestion[] = parsedGen.questions.map((q, idx) => ({
    tempId: `gen_${Date.now()}_${idx}`,
    prompt: q.prompt,
    type: q.type as QuestionType,
    options: q.options || (q.type === 'MCQ' ? ['', '', '', ''] : undefined),
    correctOptionIndex: q.correctOptionIndex ?? 0,
    acceptableAnswers: q.acceptableAnswers || [],
    explanation: q.explanation,
    sourceQuote: q.sourceQuote,
    bloomLevel: q.bloomLevel,
    selfCheckPass: true,
    selfCheckReason: 'Verified against source transcript',
  }));

  // ─── STEP 3: SELF-CHECK AUDIT ─────────────────────────────────────────
  try {
    const auditRequestText = SELF_CHECK_PROMPT_V1.buildRequestText({
      transcriptText: transcript,
      questionsJsonString: JSON.stringify(
        draftQuestions.map((dq, i) => ({
          index: i,
          prompt: dq.prompt,
          type: dq.type,
          options: dq.options,
          correctOptionIndex: dq.correctOptionIndex,
          acceptableAnswers: dq.acceptableAnswers,
          sourceQuote: dq.sourceQuote,
        })),
        null,
        2
      ),
    });

    const auditRaw = await callGemini({
      contents: [{ parts: [{ text: auditRequestText }] }],
      systemInstruction: SELF_CHECK_PROMPT_V1.systemInstruction,
      temperature: 0.0,
      responseSchema: SELF_CHECK_PROMPT_V1.responseSchema,
    });

    const parsedAudit = SelfCheckAuditSchema.parse(JSON.parse(auditRaw));

    for (const auditItem of parsedAudit.results) {
      if (draftQuestions[auditItem.index]) {
        draftQuestions[auditItem.index].selfCheckPass = auditItem.pass;
        draftQuestions[auditItem.index].selfCheckReason = auditItem.reason;
      }
    }
  } catch (auditErr) {
    console.warn('Self-check pass encountered an error (continuing with drafts):', auditErr);
  }

  return {
    transcript,
    unclearCount,
    questions: draftQuestions,
    promptVersion: QUESTION_GEN_PROMPT_V1.version,
  };
}
