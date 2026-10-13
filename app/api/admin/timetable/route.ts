import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/backend/lib/prisma';
import { requireSession } from '@/backend/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireSession(['GUARDIAN']);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json({ error: 'studentId is required' }, { status: 400 });
    }

    const student = await prisma.user.findUnique({
      where: { id: studentId },
      include: {
        priorities: {
          include: { subject: true },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Get latest published plan
    const publishedPlan = await prisma.timetablePlan.findFirst({
      where: { userId: studentId, status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' },
      include: {
        slots: {
          include: { subject: true },
          orderBy: [{ startTime: 'asc' }],
        },
      },
    });

    // Get latest draft plan if one exists
    const draftPlan = await prisma.timetablePlan.findFirst({
      where: { userId: studentId, status: 'DRAFT' },
      orderBy: { updatedAt: 'desc' },
      include: {
        slots: {
          include: { subject: true },
          orderBy: [{ startTime: 'asc' }],
        },
      },
    });

    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        name: student.name,
        grade: student.grade,
      },
      priorities: student.priorities.map((p) => ({
        subjectId: p.subjectId,
        subjectName: p.subject.name,
        subjectSlug: p.subject.slug,
        subjectTheme: p.subject.colorTheme,
        priority: p.priority,
        isHard: p.isHard,
        rating: p.isHard ? 'HARD' : p.priority >= 0.4 ? 'OK' : 'EASY',
      })),
      publishedPlan,
      draftPlan,
    });
  } catch (error: unknown) {
    console.error('Failed to get admin timetable:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
