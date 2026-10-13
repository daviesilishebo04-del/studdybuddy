import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/backend/lib/auth';
import { prisma } from '@/backend/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSession(['GUARDIAN']);
    if (auth.error) return auth.error;

    const { id } = await params;
    const subject = await prisma.subject.findUnique({
      where: { id },
      select: { id: true, name: true, slug: true, teachingProfile: true },
    });

    if (!subject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
    }

    return NextResponse.json(subject);
  } catch (error: any) {
    console.error('Error fetching teaching profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teaching profile' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSession(['GUARDIAN']);
    if (auth.error) return auth.error;

    const { id } = await params;
    const body = await request.json();
    const { teachingProfile } = body;

    const updated = await prisma.subject.update({
      where: { id },
      data: {
        teachingProfile: typeof teachingProfile === 'string' ? teachingProfile.trim() : null,
      },
      select: { id: true, name: true, slug: true, teachingProfile: true },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error saving teaching profile:', error);
    return NextResponse.json(
      { error: 'Failed to update teaching profile' },
      { status: 500 }
    );
  }
}
