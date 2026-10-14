import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/backend/lib/prisma';
import { requireSession } from '@/backend/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireSession(['STUDENT', 'GUARDIAN']);
    if (auth.error) return auth.error;
    const session = auth.user;

    const { searchParams } = new URL(request.url);
    const targetUserId =
      session.role === 'GUARDIAN' && searchParams.get('studentId')
        ? (searchParams.get('studentId') as string)
        : session.userId;

    // 1. Try to find the latest published plan
    const publishedPlan = await prisma.timetablePlan.findFirst({
      where: {
        userId: targetUserId,
        status: 'PUBLISHED',
      },
      orderBy: { publishedAt: 'desc' },
      include: {
        slots: {
          include: { subject: true },
          orderBy: [{ startTime: 'asc' }],
        },
      },
    });

    if (publishedPlan && publishedPlan.slots.length > 0) {
      return NextResponse.json({
        success: true,
        planTitle: publishedPlan.title,
        mentorNotes: publishedPlan.mentorNotes,
        slots: publishedPlan.slots.map((s) => ({
          id: s.id,
          subjectId: s.subjectId,
          subjectName: s.subject.name,
          subjectSlug: s.subject.slug,
          subjectTheme: s.subject.colorTheme,
          startTime: s.startTime,
          endTime: s.endTime,
          dayOfWeek: s.dayOfWeek,
          activity: s.activity,
        })),
      });
    }

    // 2. Fallback to standalone legacy TimetableSlot rows
    const legacySlots = await prisma.timetableSlot.findMany({
      where: { userId: targetUserId },
      include: { subject: true },
      orderBy: [{ startTime: 'asc' }],
    });

    return NextResponse.json({
      success: true,
      planTitle: 'Daily Study Schedule',
      mentorNotes: null,
      slots: legacySlots.map((s) => ({
        id: s.id,
        subjectId: s.subjectId,
        subjectName: s.subject.name,
        subjectSlug: s.subject.slug,
        subjectTheme: s.subject.colorTheme,
        startTime: s.startTime,
        endTime: s.endTime,
        dayOfWeek: s.dayOfWeek,
        activity: s.activity,
      })),
    });
  } catch (error: unknown) {
    console.error('Error fetching timetable:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch timetable';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
