import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/backend/lib/prisma';
import { requireSession } from '@/backend/lib/auth';
import {
  generateGeminiTimetable,
  SubjectWithPriority,
} from '@/backend/services/timetableService';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireSession(['GUARDIAN']);
    if (auth.error) return auth.error;

    const body = await request.json();
    const { studentId, mentorNotes } = body;

    if (!studentId) {
      return NextResponse.json({ error: 'studentId is required' }, { status: 400 });
    }

    const student = await prisma.user.findUnique({
      where: { id: studentId },
      include: {
        priorities: {
          include: { subject: true },
        },
        quizAttempts: {
          orderBy: { completedAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Resolve subjects with priority & difficulty rating
    let subjectsToPlan: SubjectWithPriority[] = student.priorities.map((p) => {
      // Calculate recent accuracy for this subject if available
      const relatedAttempts = student.quizAttempts.filter(
        (a) => a.scorePercent !== undefined
      );
      const avgAccuracy =
        relatedAttempts.length > 0
          ? Math.round(
              relatedAttempts.reduce((acc, curr) => acc + curr.scorePercent, 0) /
                relatedAttempts.length
            )
          : undefined;

      return {
        id: p.subject.id,
        slug: p.subject.slug,
        name: p.subject.name,
        colorTheme: p.subject.colorTheme,
        priority: p.priority,
        isHard: p.isHard,
        rating: p.isHard ? 'HARD' : p.priority >= 0.4 ? 'OK' : 'EASY',
        accuracyPercent: avgAccuracy,
      };
    });

    // If student has no priorities saved yet, load all available subjects
    if (subjectsToPlan.length === 0) {
      const allSubjects = await prisma.subject.findMany({});
      subjectsToPlan = allSubjects.map((s) => ({
        id: s.id,
        slug: s.slug,
        name: s.name,
        colorTheme: s.colorTheme,
        priority: s.slug === 'math' ? 1.0 : 0.5,
        isHard: s.slug === 'math',
        rating: s.slug === 'math' ? 'HARD' : 'OK',
      }));
    }

    // Call Generator (Gemini AI with deterministic fallback)
    const result = await generateGeminiTimetable(
      student.name,
      student.grade || 'Grade 8 / Form One',
      subjectsToPlan,
      mentorNotes
    );

    // Save as DRAFT plan in a transaction
    const savedDraftPlan = await prisma.$transaction(async (tx) => {
      // Archive or delete previous DRAFT plans for this student
      await tx.timetablePlan.deleteMany({
        where: { userId: studentId, status: 'DRAFT' },
      });

      const plan = await tx.timetablePlan.create({
        data: {
          userId: studentId,
          status: 'DRAFT',
          source: result.source,
          title: `Weekly Study Plan (${result.source === 'AI' ? 'Gemini AI' : 'Rule-Based'})`,
          mentorNotes: mentorNotes?.trim() || null,
          aiRationale: result.aiRationale,
          slots: {
            create: result.slots.map((s) => ({
              userId: studentId,
              subjectId: s.subjectId,
              startTime: s.startTime,
              endTime: s.endTime,
              dayOfWeek: s.dayOfWeek,
              activity: s.activity,
            })),
          },
        },
        include: {
          slots: {
            include: { subject: true },
            orderBy: [{ startTime: 'asc' }],
          },
        },
      });

      return plan;
    });

    return NextResponse.json({
      success: true,
      source: result.source,
      aiRationale: result.aiRationale,
      plan: savedDraftPlan,
    });
  } catch (error: unknown) {
    console.error('Failed to generate timetable:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
