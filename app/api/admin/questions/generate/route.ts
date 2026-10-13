import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/backend/lib/auth';
import { generateQuestionsFromSnaps } from '@/backend/services/questionGenerationService';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const auth = await requireSession(['GUARDIAN']);
    if (auth.error) return auth.error;

    const body = await request.json();
    const {
      topicId,
      submissionId,
      imageUrls,
      type,
      count = 5,
      mentorGuidance,
    } = body;

    if (!topicId) {
      return NextResponse.json(
        { error: 'topicId is required' },
        { status: 400 }
      );
    }

    if (!['MCQ', 'SHORT_ANSWER'].includes(type)) {
      return NextResponse.json(
        { error: 'type must be either MCQ or SHORT_ANSWER' },
        { status: 400 }
      );
    }

    const result = await generateQuestionsFromSnaps({
      topicId,
      submissionId,
      imageUrls,
      questionType: type,
      count: Number(count) || 5,
      mentorGuidance,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error generating AI questions:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to generate questions with AI',
      },
      { status: 500 }
    );
  }
}
