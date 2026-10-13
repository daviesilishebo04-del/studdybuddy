import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/backend/lib/prisma';
import { requireSession } from '@/backend/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSession(['GUARDIAN']);
    if (auth.error) return auth.error;

    const { id: studentId } = await context.params;

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    const targetStudent = await prisma.user.findUnique({
      where: { id: studentId },
    });

    if (!targetStudent) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Reset onboarding completion flag
      await tx.user.update({
        where: { id: studentId },
        data: {
          onboardingCompletedAt: null,
        },
      });

      // 2. Clear old priorities so pupil can re-rate subjects honestly
      await tx.subjectPriority.deleteMany({
        where: { userId: studentId },
      });

      // 3. Clear old timetable slots
      await tx.timetableSlot.deleteMany({
        where: { userId: studentId },
      });

      // 4. Archive any existing timetable plans
      await tx.timetablePlan.updateMany({
        where: { userId: studentId, status: { not: 'ARCHIVED' } },
        data: { status: 'ARCHIVED' },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Onboarding has been successfully reset for ${targetStudent.name}. They will be prompted with fresh onboarding on their next visit.`,
      student: {
        id: targetStudent.id,
        name: targetStudent.name,
      },
    });
  } catch (error: unknown) {
    console.error('Failed to reset student onboarding:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
