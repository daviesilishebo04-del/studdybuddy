import { NextRequest, NextResponse } from 'next/server';
import { studyRepository } from '@/backend/repositories/studyRepository';
import { SubmissionStatus } from '@/backend/domain/types';
import { requireSession } from '@/backend/lib/auth';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSession(['GUARDIAN']);
    if (auth.error) return auth.error;

    const { id } = await context.params;
    const body = await request.json();
    const { status } = body;

    if (!['PENDING', 'REVIEWED', 'ARCHIVED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid submission status' },
        { status: 400 }
      );
    }

    const updated = await studyRepository.updateCurriculumSubmissionStatus(
      id,
      status as SubmissionStatus
    );

    return NextResponse.json({ success: true, submission: updated });
  } catch (error) {
    console.error('Failed to update curriculum submission:', error);
    return NextResponse.json(
      { error: 'Failed to update curriculum submission' },
      { status: 500 }
    );
  }
}
