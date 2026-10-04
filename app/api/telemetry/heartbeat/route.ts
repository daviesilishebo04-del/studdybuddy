import { NextResponse } from 'next/server';
import { studyRepository } from '@/backend/repositories/studyRepository';
import { StudyHeartbeatPayload } from '@/backend/domain/types';

export async function POST(req: Request) {
  try {
    const body: StudyHeartbeatPayload = await req.json();

    if (!body.userId || typeof body.activeSeconds !== 'number') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Safety guard: max 120s active duration per single heartbeat ping
    const sanitizedSeconds = Math.min(Math.max(0, body.activeSeconds), 120);

    await studyRepository.recordHeartbeat({
      ...body,
      activeSeconds: sanitizedSeconds,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Heartbeat telemetry error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
