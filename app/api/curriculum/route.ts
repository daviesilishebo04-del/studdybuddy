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
    const auth = await requireSession(['STUDENT', 'GUARDIAN']);
    if (auth.error) return auth.error;
    const session = auth.user;

    const contentType = request.headers.get('content-type') || '';

    let userId = session.userId;
    let subjectId = '';
    let subjectName = '';
    let chapterTitle = '';
    let notes = '';
    const imageUrls: string[] = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      if (session.role === 'GUARDIAN' && formData.get('userId')) {
        userId = formData.get('userId') as string;
      }
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
        const mime = file.type || (safeExt === '.png' ? 'image/png' : 'image/jpeg');

        // Optional local disk write (graceful on serverless/Vercel read-only filesystems)
        let savedPath: string | null = null;
        try {
          const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'curriculum');
          await fs.mkdir(uploadDir, { recursive: true });
          const fileName = `curr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${safeExt}`;
          const filePath = path.join(uploadDir, fileName);
          await fs.writeFile(filePath, buffer);
          savedPath = `/uploads/curriculum/${fileName}`;
        } catch {
          // Filesystem is read-only (e.g. Vercel serverless Lambda) — fallback to Data URL
          savedPath = null;
        }

        if (savedPath) {
          imageUrls.push(savedPath);
        } else {
          imageUrls.push(`data:${mime};base64,${buffer.toString('base64')}`);
        }
      }
    } else {
      // JSON format with base64 data URLs (client-side compressed images)
      const body = await request.json();
      if (session.role === 'GUARDIAN' && body.userId) {
        userId = body.userId;
      }
      subjectId = body.subjectId || '';
      subjectName = body.subjectName || body.subject || '';
      chapterTitle = body.chapterTitle || '';
      notes = body.notes || '';

      if (Array.isArray(body.images)) {
        for (const dataUrl of body.images) {
          if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) continue;

          // Attempt optional disk cache if writable, otherwise use data URL directly
          let savedPath: string | null = null;
          const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

          if (matches && matches.length === 3) {
            try {
              const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'curriculum');
              await fs.mkdir(uploadDir, { recursive: true });
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
              savedPath = `/uploads/curriculum/${fileName}`;
            } catch {
              // Filesystem read-only (Vercel / AWS Lambda) — use data URL directly in database
              savedPath = null;
            }
          }

          imageUrls.push(savedPath || dataUrl);
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
  } catch (error: unknown) {
    console.error('Error handling curriculum submission:', error);
    const message = error instanceof Error ? error.message : 'Internal server error processing submission';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
