import { NextRequest, NextResponse } from 'next/server';
import { adminRepository } from '@/backend/repositories/adminRepository';
import { studyRepository } from '@/backend/repositories/studyRepository';
import { requireSession } from '@/backend/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireSession(['GUARDIAN']);
    if (auth.error) return auth.error;

    // Ensure seed data exists
    await studyRepository.getSubjects();

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId') || 'student-alex';

    const overview = await adminRepository.getStudentOverview(studentId);
    return NextResponse.json(overview);
  } catch (error) {
    console.error('Admin overview error:', error);
    return NextResponse.json({ error: 'Failed to load overview' }, { status: 500 });
  }
}
