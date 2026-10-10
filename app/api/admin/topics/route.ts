import { NextRequest, NextResponse } from 'next/server';
import { adminRepository } from '@/backend/repositories/adminRepository';
import { studyRepository } from '@/backend/repositories/studyRepository';
import { requireSession } from '@/backend/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const auth = await requireSession(['GUARDIAN']);
    if (auth.error) return auth.error;

    await studyRepository.getSubjects(); // ensure seed
    const topics = await adminRepository.getTopicsWithCounts();
    return NextResponse.json(topics);
  } catch (error) {
    console.error('Admin topics GET error:', error);
    return NextResponse.json({ error: 'Failed to load topics' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireSession(['GUARDIAN']);
    if (auth.error) return auth.error;

    await studyRepository.getSubjects(); // ensure seed
    const body = await request.json();

    const { subjectId, title, summary, notesMarkdown, weekNumber, order, videoUrl } = body;

    if (!subjectId || !title || !notesMarkdown) {
      return NextResponse.json(
        { error: 'subjectId, title, and notesMarkdown are required' },
        { status: 400 }
      );
    }

    // Auto-generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    const topic = await adminRepository.createTopic({
      subjectId,
      title,
      slug,
      summary: summary ?? '',
      notesMarkdown,
      weekNumber: weekNumber ?? 1,
      order: order ?? 0,
      videoUrl: videoUrl ?? undefined,
    });

    return NextResponse.json(topic, { status: 201 });
  } catch (error) {
    console.error('Admin topics POST error:', error);
    return NextResponse.json({ error: 'Failed to create topic' }, { status: 500 });
  }
}
