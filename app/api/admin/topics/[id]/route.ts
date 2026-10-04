import { NextRequest, NextResponse } from 'next/server';
import { adminRepository } from '@/backend/repositories/adminRepository';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const topic = await adminRepository.updateTopic(id, body);
    return NextResponse.json(topic);
  } catch (error) {
    console.error('Admin topic PUT error:', error);
    return NextResponse.json({ error: 'Failed to update topic' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await adminRepository.deleteTopic(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin topic DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete topic' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const topic = await adminRepository.getTopicById(id);
    if (!topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }
    return NextResponse.json(topic);
  } catch (error) {
    console.error('Admin topic GET error:', error);
    return NextResponse.json({ error: 'Failed to load topic' }, { status: 500 });
  }
}
