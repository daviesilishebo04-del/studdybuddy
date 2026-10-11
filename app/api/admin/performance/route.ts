import { NextRequest, NextResponse } from 'next/server';
import { adminRepository } from '@/backend/repositories/adminRepository';
import { studyRepository } from '@/backend/repositories/studyRepository';
import { requireSession } from '@/backend/lib/auth';
import { prisma } from '@/backend/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireSession(['GUARDIAN']);
    if (auth.error) return auth.error;

    await studyRepository.getSubjects(); // ensure seed

    const url = request.nextUrl;
    const weekParam = url.searchParams.get('week') || url.searchParams.get('weekStart');
    const rawStudentId = url.searchParams.get('studentId');
    let targetStudentId: string;
    if (rawStudentId) {
      targetStudentId = rawStudentId;
    } else {
      const firstStudent = await prisma.user.findFirst({ where: { role: 'STUDENT' }, select: { id: true } });
      targetStudentId = firstStudent?.id || 'student-nisa';
    }

    // Default to current week's Monday
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7)); // Go back to Monday
    monday.setHours(0, 0, 0, 0);

    const weekStart = weekParam ?? monday.toISOString().split('T')[0];

    const performance = await adminRepository.getWeeklyPerformance(targetStudentId, weekStart);
    return NextResponse.json(performance);
  } catch (error) {
    console.error('Admin performance error:', error);
    return NextResponse.json({ error: 'Failed to load performance' }, { status: 500 });
  }
}
