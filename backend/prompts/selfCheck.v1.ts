/**
 * Step 3: Self-Check Audit Prompt (Version 1)
 *
 * Exam moderator pass to verify answer accuracy against the source transcript.
 * Catches hallucinated facts, ambiguous MCQ options, or incorrect answer keys before mentor review.
 */

export const SELF_CHECK_PROMPT_V1 = {
  version: 'v1',
  systemInstruction: `You are an impartial, strict Junior Secondary exam quality auditor.
Your job is to cross-examine drafted quiz questions against a source transcript.

AUDIT CRITERIA FOR EACH QUESTION:
1. Grounding: Is the marked correct answer unambiguously proven true by the text in <source_transcript>?
2. MCQ Integrity: Is there strictly ONE correct answer among the 4 options? If two options could both be considered correct, flag it.
3. Distractor plausibility: Are all distractors clearly distinguishable from the correct answer according to the page text?
4. Clarity: Is the question prompt free of confusing ambiguity for a Grade 8 student?

If any question fails ANY of these criteria, mark pass = false and provide a concise, constructive explanation in reason.
If it passes all criteria, mark pass = true with reason = "Verified against source transcript".`,

  buildRequestText: ({
    transcriptText,
    questionsJsonString,
  }: {
    transcriptText: string;
    questionsJsonString: string;
  }) => {
    return `<source_transcript>
${transcriptText}
</source_transcript>

<draft_questions>
${questionsJsonString}
</draft_questions>

Audit each question index from 0 to N-1 against <source_transcript>. Return an array of audit results matching the schema.`;
  },

  responseSchema: {
    type: 'OBJECT',
    properties: {
      results: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            index: { type: 'INTEGER' },
            pass: { type: 'BOOLEAN' },
            reason: { type: 'STRING' },
          },
          required: ['index', 'pass', 'reason'],
        },
      },
    },
    required: ['results'],
  },
};
