import { NextResponse } from 'next/server';
import { studyRepository } from '@/backend/repositories/studyRepository';
import { StudyHeartbeatPayload } from '@/backend/domain/types';
import { requireSession } from '@/backend/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const auth = await requireSession(['STUDENT']);
    if (auth.error) return auth.error;
    const session = auth.user;

    const body: Partial<StudyHeartbeatPayload> = await req.json();

    if (typeof body.activeSeconds !== 'number') {
      return NextResponse.json({ error: 'Invalid activeSeconds payload' }, { status: 400 });
    }

    // Safety guard: max 120s active duration per single heartbeat ping
    const sanitizedSeconds = Math.min(Math.max(0, body.activeSeconds), 120);

    await studyRepository.recordHeartbeat({
      userId: session.userId,
      topicId: body.topicId,
      activeSeconds: sanitizedSeconds,
      timestamp: body.timestamp || new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Heartbeat telemetry error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

