import { NextResponse } from 'next/server';
import { adminRepository } from '@/backend/repositories/adminRepository';
import { studyRepository } from '@/backend/repositories/studyRepository';

export async function GET() {
  try {
    // Ensure seed data exists
    await studyRepository.getSubjects();

    const overview = await adminRepository.getStudentOverview('student-alex');
    return NextResponse.json(overview);
  } catch (error) {
    console.error('Admin overview error:', error);
    return NextResponse.json({ error: 'Failed to load overview' }, { status: 500 });
  }
}
