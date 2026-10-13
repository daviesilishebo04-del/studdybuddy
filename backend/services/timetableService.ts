import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { PlanSource, PlanStatus } from '@prisma/client';
import { callGemini } from './geminiClient';

export interface SubjectWithPriority {
  id: string;
  slug: string;
  name: string;
  colorTheme: string;
  priority: number;
  isHard: boolean;
  rating: 'EASY' | 'OK' | 'HARD';
  accuracyPercent?: number;
}

export interface GeneratedSlot {
  subjectId: string;
  subjectSlug: string;
  subjectName: string;
  subjectTheme: string;
  dayOfWeek: 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';
  startTime: string;
  endTime: string;
  activity: 'LEARN' | 'QUIZ' | 'REVIEW';
}

export interface TimetableGenerationResult {
  source: PlanSource;
  aiRationale: string;
  slots: GeneratedSlot[];
}

const AIResponseSchema = z.object({
  aiRationale: z.string(),
  slots: z.array(
    z.object({
      subjectSlug: z.string(),
      dayOfWeek: z.enum(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']),
      startTime: z.string().regex(/^\d{2}:\d{2}$/),
      endTime: z.string().regex(/^\d{2}:\d{2}$/),
      activity: z.enum(['LEARN', 'QUIZ', 'REVIEW']).default('LEARN'),
    })
  ),
});

/**
 * 1. Rule-Based Deterministic Generator (Reliable Fallback)
 * - Prioritizes HARD subjects first while energy is highest.
 * - Distributes 2 sessions per weekday (18:00-18:40 & 19:00-19:40).
 * - Rotates subjects across the 5 weekdays so hard subjects appear 2-3 times
 *   and all selected subjects get spaced practice.
 */
export function generateRuleBasedTimetable(
  subjects: SubjectWithPriority[],
  mentorNotes?: string
): TimetableGenerationResult {
  if (subjects.length === 0) {
    return {
      source: 'FALLBACK',
      aiRationale: 'No subjects were selected for this student.',
      slots: [],
    };
  }

  // Sort subjects: Highest priority (hardest) first
  const sorted = [...subjects].sort((a, b) => b.priority - a.priority);

  const weekdays: ('MON' | 'TUE' | 'WED' | 'THU' | 'FRI')[] = [
    'MON',
    'TUE',
    'WED',
    'THU',
    'FRI',
  ];

  const slots: GeneratedSlot[] = [];

  // Build a weighted queue of subjects
  // Hard subjects appear 3x, OK subjects 2x, Easy subjects 1x
  const weightedPool: SubjectWithPriority[] = [];
  for (const s of sorted) {
    const weight = s.isHard || s.rating === 'HARD' ? 3 : s.rating === 'OK' ? 2 : 1;
    for (let i = 0; i < weight; i++) {
      weightedPool.push(s);
    }
  }

  let poolIdx = 0;

  for (let dayIdx = 0; dayIdx < weekdays.length; dayIdx++) {
    const day = weekdays[dayIdx];

    // Slot 1 (18:00 - 18:40): Priority session
    const sub1 = weightedPool[poolIdx % weightedPool.length];
    poolIdx++;

    // Slot 2 (19:00 - 19:40): Different subject for variety
    let sub2 = weightedPool[poolIdx % weightedPool.length];
    if (sub2.id === sub1.id && subjects.length > 1) {
      poolIdx++;
      sub2 = weightedPool[poolIdx % weightedPool.length];
    }
    poolIdx++;

    slots.push({
      subjectId: sub1.id,
      subjectSlug: sub1.slug,
      subjectName: sub1.name,
      subjectTheme: sub1.colorTheme,
      dayOfWeek: day,
      startTime: '18:00',
      endTime: '18:40',
      activity: sub1.isHard ? 'LEARN' : 'QUIZ',
    });

    slots.push({
      subjectId: sub2.id,
      subjectSlug: sub2.slug,
      subjectName: sub2.name,
      subjectTheme: sub2.colorTheme,
      dayOfWeek: day,
      startTime: '19:00',
      endTime: '19:40',
      activity: 'QUIZ',
    });
  }

  const rationale = mentorNotes?.trim()
    ? `Rule-based schedule crafted incorporating mentor guidance: "${mentorNotes}". Hard subjects scheduled first with 20-min recharge breaks.`
    : 'Deterministic cognitive schedule: Hard subjects prioritized during peak evening focus with distributed retrieval practice.';

  return {
    source: 'FALLBACK',
    aiRationale: rationale,
    slots,
  };
}

/**
 * 2. Gemini AI Generator (Structured Output)
 * Calls Google Gemini REST endpoint directly without heavy SDK dependencies.
 * Automatically falls back to rule-based scheduler if API key is missing or call fails.
 */
export async function generateGeminiTimetable(
  studentName: string,
  grade: string,
  subjects: SubjectWithPriority[],
  mentorNotes?: string
): Promise<TimetableGenerationResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.log('GEMINI_API_KEY not set. Using deterministic rule-based scheduler.');
    return generateRuleBasedTimetable(subjects, mentorNotes);
  }

  try {
    const prompt = `
You are an expert pedagogical study scheduler for junior secondary / middle school students.
Create an optimal weekly study timetable for a student with the following profile:

Student Name: ${studentName}
Grade Level: ${grade}
Available Subjects and Self-Reported Difficulty:
${subjects
  .map(
    (s) =>
      `- ${s.name} (slug: "${s.slug}"): Difficulty = ${s.rating}, Priority Weight = ${s.priority.toFixed(1)}${
        s.accuracyPercent !== undefined ? `, Recent Quiz Accuracy = ${s.accuracyPercent}%` : ''
      }`
  )
  .join('\n')}

Mentor's Custom Instructions:
${mentorNotes?.trim() ? `"${mentorNotes.trim()}"` : 'None provided. Optimize for balanced retention.'}

Rules for the timetable:
1. Schedule 2 sessions per weekday from Monday (MON) to Friday (FRI).
2. Time slot 1 is strictly 18:00 to 18:40 (40 mins).
3. Time slot 2 is strictly 19:00 to 19:40 (40 mins). There is a mandatory 20-minute break in between.
4. Schedule harder subjects earlier in the week or in Slot 1.
5. Do NOT schedule the same subject twice in the same day if more than 1 subject is available.
6. Activities can be: 'LEARN' (concept acquisition), 'QUIZ' (retrieval practice), or 'REVIEW' (spaced repetition).
7. Return ONLY a valid JSON object matching this exact structure:
{
  "aiRationale": "A concise, supportive 2-sentence explanation of why this timetable was arranged this way for the mentor to review.",
  "slots": [
    {
      "subjectSlug": "<exact slug from list>",
      "dayOfWeek": "MON",
      "startTime": "18:00",
      "endTime": "18:40",
      "activity": "LEARN"
    }
  ]
}
`;

    const rawText = await callGemini({
      contents: [{ parts: [{ text: prompt }] }],
      temperature: 0.3,
      responseMimeType: 'application/json',
    });

    const parsedJson = JSON.parse(rawText);
    const validated = AIResponseSchema.parse(parsedJson);

    // Map AI slots back to valid DB subject records
    const subjectMap = new Map(subjects.map((s) => [s.slug.toLowerCase(), s]));

    const mappedSlots: GeneratedSlot[] = [];

    for (const slot of validated.slots) {
      const matched = subjectMap.get(slot.subjectSlug.toLowerCase());
      if (matched) {
        mappedSlots.push({
          subjectId: matched.id,
          subjectSlug: matched.slug,
          subjectName: matched.name,
          subjectTheme: matched.colorTheme,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          activity: slot.activity,
        });
      }
    }

    if (mappedSlots.length === 0) {
      console.warn('Gemini response contained no matching subject slugs. Falling back.');
      return generateRuleBasedTimetable(subjects, mentorNotes);
    }

    return {
      source: 'AI',
      aiRationale: validated.aiRationale,
      slots: mappedSlots,
    };
  } catch (err) {
    console.error('Gemini generation failed, using deterministic fallback:', err);
    return generateRuleBasedTimetable(subjects, mentorNotes);
  }
}
