import { NextRequest, NextResponse } from 'next/server';
import { studyRepository } from '@/backend/repositories/studyRepository';
import { requireSession } from '@/backend/lib/auth';
import { prisma } from '@/backend/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await requireSession(['GUARDIAN']);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(req.url);
  let studentId = searchParams.get('studentId');

  if (!studentId) {
    const defaultStudent = await prisma.user.findFirst({
      where: { role: 'STUDENT' },
      select: { id: true, name: true, grade: true },
      orderBy: { createdAt: 'desc' },
    });
    studentId = defaultStudent?.id || 'student-nisa';
  }

  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: { name: true, grade: true },
  });

  const attempts = await studyRepository.getQuizAttempts(studentId);
  const activeSeconds = await studyRepository.getTotalActiveStudySeconds(studentId);

  return NextResponse.json({
    success: true,
    student: student ? `${student.name} (${student.grade || 'Grade 8'})` : 'Student',
    totalActiveMinutes: Math.round(activeSeconds / 60),
    quizzesCompleted: attempts.length,
    attempts,
  });
}

