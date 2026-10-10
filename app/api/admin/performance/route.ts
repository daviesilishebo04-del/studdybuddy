import { NextRequest, NextResponse } from 'next/server';
import { adminRepository } from '@/backend/repositories/adminRepository';
import { studyRepository } from '@/backend/repositories/studyRepository';

export async function GET(request: NextRequest) {
  try {
    await studyRepository.getSubjects(); // ensure seed

    const url = request.nextUrl;
    const weekParam = url.searchParams.get('week') || url.searchParams.get('weekStart');
    const studentId = url.searchParams.get('studentId') || 'student-alex';

    // Default to current week's Monday
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7)); // Go back to Monday
    monday.setHours(0, 0, 0, 0);

    const weekStart = weekParam ?? monday.toISOString().split('T')[0];

    const performance = await adminRepository.getWeeklyPerformance(studentId, weekStart);
    return NextResponse.json(performance);
  } catch (error) {
    console.error('Admin performance error:', error);
    return NextResponse.json({ error: 'Failed to load performance' }, { status: 500 });
  }
}
