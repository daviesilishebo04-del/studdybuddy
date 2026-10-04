import { NextRequest, NextResponse } from 'next/server';
import { adminRepository } from '@/backend/repositories/adminRepository';

/**
 * PUT: Update an existing question.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updateData: any = {};
    if (body.prompt !== undefined) updateData.prompt = body.prompt;
    if (body.options !== undefined) updateData.options = body.options;
    if (body.correctOptionIndex !== undefined)
      updateData.correctOptionIndex = body.correctOptionIndex;
    if (body.acceptableAnswers !== undefined)
      updateData.acceptableAnswers = body.acceptableAnswers.map((a: string) =>
        a.trim().toLowerCase()
      );
    if (body.explanation !== undefined)
      updateData.explanation = body.explanation;
    if (body.order !== undefined) updateData.order = body.order;

    const updated = await adminRepository.updateQuestion(id, updateData);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update question:', error);
    return NextResponse.json(
      { error: 'Failed to update question' },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Remove a question.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await adminRepository.deleteQuestion(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete question:', error);
    return NextResponse.json(
      { error: 'Failed to delete question' },
      { status: 500 }
    );
  }
}
