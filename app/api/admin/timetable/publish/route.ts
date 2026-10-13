import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/backend/lib/prisma';
import { requireSession } from '@/backend/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireSession(['GUARDIAN']);
    if (auth.error) return auth.error;

    const body = await request.json();
    const { planId } = body;

    if (!planId) {
      return NextResponse.json({ error: 'planId is required' }, { status: 400 });
    }

    const planToPublish = await prisma.timetablePlan.findUnique({
      where: { id: planId },
      include: { slots: true },
    });

    if (!planToPublish) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Archive previously published plans for this student
      await tx.timetablePlan.updateMany({
        where: {
          userId: planToPublish.userId,
          status: 'PUBLISHED',
          id: { not: planId },
        },
        data: {
          status: 'ARCHIVED',
        },
      });

      // 2. Mark this plan as PUBLISHED
      await tx.timetablePlan.update({
        where: { id: planId },
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date(),
        },
      });

      // 3. Clear legacy standalone slots and copy this plan's slots as active slots
      await tx.timetableSlot.deleteMany({
        where: {
          userId: planToPublish.userId,
          planId: null,
        },
      });
    });

    const updatedPlan = await prisma.timetablePlan.findUnique({
      where: { id: planId },
      include: {
        slots: {
          include: { subject: true },
          orderBy: [{ startTime: 'asc' }],
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Timetable plan published successfully. Student schedule is now live.',
      plan: updatedPlan,
    });
  } catch (error: unknown) {
    console.error('Failed to publish timetable:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
