import { NextRequest, NextResponse } from 'next/server';
import { studyRepository } from '@/backend/repositories/studyRepository';
import { requireSession } from '@/backend/lib/auth';
import path from 'path';
import fs from 'fs/promises';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireSession();
    if (auth.error) return auth.error;
    const session = auth.user;

    const { searchParams } = new URL(request.url);
    // Students can only see their own submissions; Guardians can see all or filter by student
    const userId = session.role === 'STUDENT' ? session.userId : (searchParams.get('userId') || undefined);

    const submissions = await studyRepository.getCurriculumSubmissions(userId);
    return NextResponse.json({ submissions });
  } catch (error) {
    console.error('Failed to fetch curriculum submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch curriculum submissions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireSession(['STUDENT']);
    if (auth.error) return auth.error;
    const session = auth.user;

    const contentType = request.headers.get('content-type') || '';

    const userId = session.userId;
    let subjectId = '';
    let subjectName = '';
    let chapterTitle = '';
    let notes = '';
    const imageUrls: string[] = [];

    // Ensure storage directory exists: public/uploads/curriculum
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'curriculum');
    await fs.mkdir(uploadDir, { recursive: true });

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      subjectId = (formData.get('subjectId') as string) || '';
      subjectName = (formData.get('subjectName') as string) || (formData.get('subject') as string) || '';
      chapterTitle = (formData.get('chapterTitle') as string) || '';
      notes = (formData.get('notes') as string) || '';

      const files = formData.getAll('files') as File[];

      for (const file of files) {
        if (!file || typeof file === 'string' || file.size === 0) continue;

        const buffer = Buffer.from(await file.arrayBuffer());
        const ext = path.extname(file.name) || '.jpg';
        const safeExt = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext.toLowerCase())
          ? ext.toLowerCase()
          : '.jpg';
        const fileName = `curr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${safeExt}`;
        const filePath = path.join(uploadDir, fileName);

        await fs.writeFile(filePath, buffer);
        imageUrls.push(`/uploads/curriculum/${fileName}`);
      }
    } else {
      // JSON format with base64 data URLs (client-side compressed images)
      const body = await request.json();
      subjectId = body.subjectId || '';
      subjectName = body.subjectName || body.subject || '';
      chapterTitle = body.chapterTitle || '';
      notes = body.notes || '';

      if (Array.isArray(body.images)) {
        for (const dataUrl of body.images) {
          if (typeof dataUrl !== 'string') continue;

          // Match data:image/xxx;base64,.....
          const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            const mimeType = matches[1];
            const base64Data = matches[2];
            const ext = mimeType.includes('png')
              ? '.png'
              : mimeType.includes('webp')
              ? '.webp'
              : '.jpg';
            const fileName = `curr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
            const filePath = path.join(uploadDir, fileName);

            await fs.writeFile(filePath, Buffer.from(base64Data, 'base64'));
            imageUrls.push(`/uploads/curriculum/${fileName}`);
          }
        }
      }
    }

    if (!subjectId && !subjectName.trim()) {
      return NextResponse.json({ error: 'Subject is required' }, { status: 400 });
    }

    if (imageUrls.length === 0) {
      return NextResponse.json(
        { error: 'At least one page photo is required' },
        { status: 400 }
      );
    }

    const submission = await studyRepository.createCurriculumSubmission({
      userId,
      subjectId: subjectId || undefined,
      subjectName: subjectName.trim() || undefined,
      chapterTitle: chapterTitle.trim() || undefined,
      notes: notes.trim() || undefined,
      imageUrls,
    });

    return NextResponse.json({ success: true, submission }, { status: 201 });
  } catch (error) {
    console.error('Error handling curriculum submission:', error);
    return NextResponse.json(
      { error: 'Internal server error processing submission' },
      { status: 500 }
    );
  }
}
