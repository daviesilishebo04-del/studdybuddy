import { NextRequest, NextResponse } from 'next/server';
import { adminRepository } from '@/backend/repositories/adminRepository';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const VIDEOS_DIR = join(process.cwd(), 'public', 'videos');

// Ensure the videos directory exists
async function ensureVideosDir() {
  if (!existsSync(VIDEOS_DIR)) {
    await mkdir(VIDEOS_DIR, { recursive: true });
  }
}

/**
 * POST: Upload a video file for a topic.
 * Accepts multipart/form-data with a "video" field.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureVideosDir();

    const formData = await request.formData();
    const file = formData.get('video') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No video file provided' }, { status: 400 });
    }

    // Validate it's a video file
    if (!file.type.startsWith('video/')) {
      return NextResponse.json({ error: 'File must be a video' }, { status: 400 });
    }

    // Generate filename: {topicId}-{timestamp}.{ext}
    const ext = file.name.split('.').pop() || 'mp4';
    const filename = `${id}-${Date.now()}.${ext}`;
    const filepath = join(VIDEOS_DIR, filename);

    // Write file to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Update topic's videoUrl in database
    const videoUrl = `/videos/${filename}`;
    await adminRepository.updateTopic(id, { videoUrl });

    return NextResponse.json({ videoUrl, filename }, { status: 201 });
  } catch (error) {
    console.error('Video upload error:', error);
    return NextResponse.json({ error: 'Failed to upload video' }, { status: 500 });
  }
}

/**
 * DELETE: Remove video file and clear videoUrl from topic.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get current topic to find video path
    const topic = await adminRepository.getTopicById(id);
    if (!topic || !topic.videoUrl) {
      return NextResponse.json({ error: 'No video to delete' }, { status: 404 });
    }

    // Delete the file from disk
    const filename = topic.videoUrl.replace('/videos/', '');
    const filepath = join(VIDEOS_DIR, filename);

    try {
      await unlink(filepath);
    } catch {
      // File may not exist on disk, continue to clear DB
      console.warn(`Video file not found at ${filepath}, clearing DB reference anyway`);
    }

    // Clear videoUrl in database
    await adminRepository.updateTopic(id, { videoUrl: null });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Video delete error:', error);
    return NextResponse.json({ error: 'Failed to delete video' }, { status: 500 });
  }
}
