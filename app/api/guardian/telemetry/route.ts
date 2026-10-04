import { NextResponse } from 'next/server';
import { studyRepository } from '@/backend/repositories/studyRepository';

export async function GET(req: Request) {
  const role = req.headers.get('x-user-role') || 'STUDENT'; // default simulated student

  // RBAC Barrier: Students cannot view Guardian telemetry
  if (role !== 'GUARDIAN') {
    return NextResponse.json(
      {
        error: "Access denied: Role 'STUDENT' is not authorized to access Guardian Telemetry. Guardian role required.",
        code: 'FORBIDDEN_ROLE',
      },
      { status: 403 }
    );
  }

  const attempts = await studyRepository.getQuizAttempts('student-alex');
  const activeSeconds = await studyRepository.getTotalActiveStudySeconds('student-alex');

  return NextResponse.json({
    success: true,
    student: 'Alex (Grade 8 / Form One)',
    totalActiveMinutes: Math.round(activeSeconds / 60),
    quizzesCompleted: attempts.length,
    attempts,
  });
}
