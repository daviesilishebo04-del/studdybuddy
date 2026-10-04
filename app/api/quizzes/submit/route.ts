import { NextResponse } from 'next/server';
import { evaluateQuiz } from '@/backend/services/gradingService';
import { analyzeMetacognitiveCalibration } from '@/backend/services/telemetryService';
import { studyRepository } from '@/backend/repositories/studyRepository';
import { MetacognitiveRating, Question } from '@/backend/domain/types';

interface QuizSubmitPayload {
  userId: string;
  userRole?: string;
  topicId: string;
  durationSeconds: number;
  selfRating?: MetacognitiveRating;
  answers: {
    questionId: string;
    userResponse: string;
    timeTakenSec: number;
  }[];
}

export async function POST(req: Request) {
  try {
    const roleHeader = req.headers.get('x-user-role');
    const payload: QuizSubmitPayload = await req.json();

    const role = roleHeader || payload.userRole || 'STUDENT';

    // RBAC Barrier: Guardians cannot submit quiz attempts
    if (role === 'GUARDIAN') {
      return NextResponse.json(
        {
          error: "Access denied: Role 'GUARDIAN' is not authorized to submit quiz answers. Student role required.",
          code: 'FORBIDDEN_ROLE',
        },
        { status: 403 }
      );
    }

    if (!payload.userId || !payload.topicId || !Array.isArray(payload.answers)) {
      return NextResponse.json({ error: 'Missing required quiz fields' }, { status: 400 });
    }

    const topicQuestions = await studyRepository.getQuestionsByTopic(payload.topicId);
    const questionMap = new Map<string, Question>(topicQuestions.map((q) => [q.id, q]));

    const gradeInputs = payload.answers
      .filter((a) => questionMap.has(a.questionId))
      .map((a) => ({
        question: questionMap.get(a.questionId)!,
        userResponse: a.userResponse,
        timeTakenSec: a.timeTakenSec,
      }));

    const evaluation = evaluateQuiz(gradeInputs);
    const calibration = analyzeMetacognitiveCalibration(payload.selfRating, evaluation.scorePercent);

    // Save to real PostgreSQL database via Prisma
    const attempt = await studyRepository.recordQuizAttempt({
      id: `attempt-${Date.now()}`,
      userId: payload.userId,
      topicId: payload.topicId,
      scorePercent: evaluation.scorePercent,
      totalQuestions: evaluation.totalQuestions,
      correctCount: evaluation.correctCount,
      durationSeconds: payload.durationSeconds,
      selfRating: payload.selfRating,
      isWeekendReview: false,
      completedAt: new Date().toISOString(),
      answers: evaluation.results.map((r) => r.answer),
    });

    return NextResponse.json({
      success: true,
      attempt,
      evaluation,
      calibration,
    });
  } catch (error) {
    console.error('Quiz submit error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
