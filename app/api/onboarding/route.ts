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
      subjectRatings = {},
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

      // 3. Upsert SubjectPriority for each tapped subject with 3-tier rating
      for (const sub of subjects) {
        const rating =
          subjectRatings[sub.slug] ||
          (hardSubjectSlugs.includes(sub.slug) ? 'HARD' : 'OK');
        const isHard = rating === 'HARD';
        const priority = isHard ? 1.0 : rating === 'OK' ? 0.5 : 0.2;

        await tx.subjectPriority.upsert({
          where: {
            userId_subjectId: {
              userId,
              subjectId: sub.id,
            },
          },
          update: {
            isHard,
            priority,
          },
          create: {
            userId,
            subjectId: sub.id,
            isHard,
            priority,
          },
        });
      }

      // 4. Generate balanced weekly timetable slots across all selected subjects
      await tx.timetableSlot.deleteMany({
        where: { userId },
      });

      // Distribute slots across weekdays
      const weekdays = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
      const slotData: {
        userId: string;
        subjectId: string;
        startTime: string;
        endTime: string;
        dayOfWeek: string;
        activity: string;
      }[] = [];

      // Sort subjects by priority descending
      const sortedSubs = [...subjects].sort((a, b) => {
        const ratingA = subjectRatings[a.slug] || (hardSubjectSlugs.includes(a.slug) ? 'HARD' : 'OK');
        const ratingB = subjectRatings[b.slug] || (hardSubjectSlugs.includes(b.slug) ? 'HARD' : 'OK');
        const scoreA = ratingA === 'HARD' ? 3 : ratingA === 'OK' ? 2 : 1;
        const scoreB = ratingB === 'HARD' ? 3 : ratingB === 'OK' ? 2 : 1;
        return scoreB - scoreA;
      });

      let subIdx = 0;
      for (let dayIdx = 0; dayIdx < weekdays.length; dayIdx++) {
        const day = weekdays[dayIdx];
        const s1 = sortedSubs[subIdx % sortedSubs.length];
        subIdx++;
        let s2 = sortedSubs[subIdx % sortedSubs.length];
        if (s2.id === s1.id && sortedSubs.length > 1) {
          subIdx++;
          s2 = sortedSubs[subIdx % sortedSubs.length];
        }
        subIdx++;

        const isS1Hard =
          (subjectRatings[s1.slug] || (hardSubjectSlugs.includes(s1.slug) ? 'HARD' : 'OK')) === 'HARD';

        slotData.push({
          userId,
          subjectId: s1.id,
          startTime: '18:00',
          endTime: '18:40',
          dayOfWeek: day,
          activity: isS1Hard ? 'LEARN' : 'QUIZ',
        });

        slotData.push({
          userId,
          subjectId: s2.id,
          startTime: '19:00',
          endTime: '19:40',
          dayOfWeek: day,
          activity: 'QUIZ',
        });
      }

      // Create an initial PUBLISHED plan
      const initialPlan = await tx.timetablePlan.create({
        data: {
          userId,
          status: 'PUBLISHED',
          source: 'FALLBACK',
          title: 'Initial Onboarding Schedule',
          aiRationale: 'Generated from initial student subject choices and self-reported difficulty ratings.',
          publishedAt: new Date(),
          slots: {
            create: slotData.map((s) => ({
              userId: s.userId,
              subjectId: s.subjectId,
              startTime: s.startTime,
              endTime: s.endTime,
              dayOfWeek: s.dayOfWeek,
              activity: s.activity,
            })),
          },
        },
      });

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

