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

    // Ensure seed data exists
    await studyRepository.getSubjects();

    const { searchParams } = new URL(request.url);
    const rawStudentId = searchParams.get('studentId');
    let targetStudentId: string;
    if (rawStudentId) {
      targetStudentId = rawStudentId;
    } else {
      const firstStudent = await prisma.user.findFirst({ where: { role: 'STUDENT' }, select: { id: true } });
      targetStudentId = firstStudent?.id || 'student-nisa';
    }

    const overview = await adminRepository.getStudentOverview(targetStudentId);
    return NextResponse.json(overview);
  } catch (error) {
    console.error('Admin overview error:', error);
    return NextResponse.json({ error: 'Failed to load overview' }, { status: 500 });
  }
}
