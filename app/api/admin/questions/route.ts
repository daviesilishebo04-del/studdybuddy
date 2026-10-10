import { NextRequest, NextResponse } from 'next/server';
import { adminRepository } from '@/backend/repositories/adminRepository';
import { requireSession } from '@/backend/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET: List questions for a topic, optionally filtered by type.
 * Query params: ?topicId=...&type=MCQ|SHORT_ANSWER
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireSession(['GUARDIAN']);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const topicId = searchParams.get('topicId');
    const type = searchParams.get('type') as 'MCQ' | 'SHORT_ANSWER' | null;

    if (!topicId) {
      return NextResponse.json(
        { error: 'topicId query parameter is required' },
        { status: 400 }
      );
    }

    const questions = await adminRepository.getQuestionsByTopic(
      topicId,
      type || undefined
    );
    return NextResponse.json(questions);
  } catch (error) {
    console.error('Failed to get questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}

/**
 * POST: Create a new question for a topic (MCQ or SHORT_ANSWER).
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireSession(['GUARDIAN']);
    if (auth.error) return auth.error;

    const body = await request.json();
    const {
      topicId,
      prompt,
      type,
      options,
      correctOptionIndex,
      acceptableAnswers,
      explanation,
      order,
    } = body;

    if (!topicId || !prompt || !type) {
      return NextResponse.json(
        { error: 'topicId, prompt, and type are required' },
        { status: 400 }
      );
    }

    if (type !== 'MCQ' && type !== 'SHORT_ANSWER') {
      return NextResponse.json(
        { error: 'type must be either MCQ or SHORT_ANSWER' },
        { status: 400 }
      );
    }

    if (type === 'MCQ') {
      if (!Array.isArray(options) || options.length < 2) {
        return NextResponse.json(
          { error: 'MCQ requires at least 2 options' },
          { status: 400 }
        );
      }
      if (
        correctOptionIndex === undefined ||
        correctOptionIndex < 0 ||
        correctOptionIndex >= options.length
      ) {
        return NextResponse.json(
          { error: 'MCQ requires a valid correctOptionIndex' },
          { status: 400 }
        );
      }
    }

    if (type === 'SHORT_ANSWER') {
      if (!Array.isArray(acceptableAnswers) || acceptableAnswers.length === 0) {
        return NextResponse.json(
          { error: 'SHORT_ANSWER requires at least one acceptable answer' },
          { status: 400 }
        );
      }
    }

    const question = await adminRepository.createQuestion({
      topicId,
      prompt,
      type,
      options: type === 'MCQ' ? options : [],
      correctOptionIndex: type === 'MCQ' ? correctOptionIndex : undefined,
      acceptableAnswers:
        type === 'SHORT_ANSWER'
          ? acceptableAnswers.map((a: string) => a.trim().toLowerCase())
          : [],
      explanation: explanation || '',
      order: typeof order === 'number' ? order : 0,
    });

    return NextResponse.json(question, { status: 201 });
  } catch (error) {
    console.error('Failed to create question:', error);
    return NextResponse.json(
      { error: 'Failed to create question' },
      { status: 500 }
    );
  }
}
