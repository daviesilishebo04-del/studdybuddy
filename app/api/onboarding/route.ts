import { NextResponse } from 'next/server';
import { prisma } from '@/backend/lib/prisma';
import { requireSession, setSessionCookie } from '@/backend/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const auth = await requireSession(['STUDENT']);
    if (auth.error) return auth.error;
    const session = auth.user;

    const body = await req.json();
    const {
      studentName,
      grade,
      selectedSubjectSlugs = [],
      hardSubjectSlugs = [],
    } = body;
    const userId = session.userId;

    console.log(`[${new Date().toISOString()}] Processing Onboarding for authenticated user: ${userId}`);


    const result = await prisma.$transaction(async (tx) => {
      // 1. Update User with real timestamp and custom name if provided
      const completedTimestamp = new Date();
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          ...(studentName?.trim() ? { name: studentName.trim() } : {}),
          grade: grade || 'Grade 8 / Form One',
          onboardingCompletedAt: completedTimestamp,
        },
      });

      // 2. Resolve subjects
      const subjects = await tx.subject.findMany({
        where: {
          slug: { in: selectedSubjectSlugs },
        },
      });

      // 3. Upsert SubjectPriority for each tapped subject
      for (const sub of subjects) {
        const isHard = hardSubjectSlugs.includes(sub.slug);
        await tx.subjectPriority.upsert({
          where: {
            userId_subjectId: {
              userId,
              subjectId: sub.id,
            },
          },
          update: {
            isHard,
            priority: isHard ? 1.0 : 0.3,
          },
          create: {
            userId,
            subjectId: sub.id,
            isHard,
            priority: isHard ? 1.0 : 0.3,
          },
        });
      }

      // 4. Create two TimetableSlot rows: 18:00-18:40 & 19:00-19:40
      await tx.timetableSlot.deleteMany({
        where: { userId },
      });

      const firstSub = subjects.find((s) => s.slug === 'math') || subjects[0];
      const secondSub =
        subjects.find((s) => s.slug === 'literature') || subjects[1] || subjects[0];

      if (firstSub && secondSub) {
        await tx.timetableSlot.createMany({
          data: [
            {
              userId,
              subjectId: firstSub.id,
              startTime: '18:00',
              endTime: '18:40',
              dayOfWeek: 'WEEKDAY',
            },
            {
              userId,
              subjectId: secondSub.id,
              startTime: '19:00',
              endTime: '19:40',
              dayOfWeek: 'WEEKDAY',
            },
          ],
        });
      }

      const createdSlots = await tx.timetableSlot.findMany({
        where: { userId },
        include: { subject: true },
      });

      const priorities = await tx.subjectPriority.findMany({
        where: { userId },
        include: { subject: true },
      });

      return {
        user: updatedUser,
        priorities,
        slots: createdSlots,
      };
    });

    // Re-issue session cookie with updated name
    await setSessionCookie({
      userId,
      name: result.user.name,
      role: session.role,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    console.error('Onboarding persistence error:', error);
    const message = error instanceof Error ? error.message : 'Failed to save onboarding data';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

