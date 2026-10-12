import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/backend/lib/prisma';
import { setSessionCookie } from '@/backend/lib/auth';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

// In-memory rate limiting map: identifier -> { count, lockUntil }
const rateLimitMap = new Map<string, { attempts: number; lockUntil: number }>();

function checkRateLimit(key: string): { allowed: boolean; waitMinutes?: number } {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record) {
    return { allowed: true };
  }

  if (record.lockUntil > now) {
    const waitMinutes = Math.ceil((record.lockUntil - now) / (60 * 1000));
    return { allowed: false, waitMinutes };
  }

  if (record.lockUntil <= now && record.attempts >= 5) {
    // Reset after lockout expires
    rateLimitMap.delete(key);
    return { allowed: true };
  }

  return { allowed: true };
}

function recordAttempt(key: string, success: boolean) {
  if (success) {
    rateLimitMap.delete(key);
    return;
  }

  const now = Date.now();
  const record = rateLimitMap.get(key) || { attempts: 0, lockUntil: 0 };
  record.attempts += 1;

  if (record.attempts >= 5) {
    record.lockUntil = now + 15 * 60 * 1000; // 15-minute lockout after 5 failures
  }

  rateLimitMap.set(key, record);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const username = (body.username || body.identifier || '').trim();
    const password = (body.password || '').trim();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Please enter both your name and password.' },
        { status: 400 }
      );
    }

    const rateLimitKey = username.toLowerCase();
    const rateCheck = checkRateLimit(rateLimitKey);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `Too many failed attempts. Please try again in ${rateCheck.waitMinutes} minutes.` },
        { status: 429 }
      );
    }

    const lower = username.toLowerCase();
    const isNisa = lower === 'nisa' || lower === 'nisa mubuwa mboloma';
    const isDavie = lower === 'davie' || lower === 'mentor davie' || lower === 'admin';

    // Lookup user by name (case-insensitive) or friendly alias
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { name: { equals: username, mode: 'insensitive' as const } },
          ...(isNisa ? [{ id: 'student-nisa' }, { name: { equals: 'Nisa Mubuwa Mboloma', mode: 'insensitive' as const } }] : []),
          ...(isDavie ? [{ id: 'guardian-davie' }, { name: { equals: 'Mentor Davie', mode: 'insensitive' as const } }] : []),
        ],
      },
    });

    if (!user) {
      recordAttempt(rateLimitKey, false);
      return NextResponse.json(
        { error: 'User not found. Ask your mentor to register your name.' },
        { status: 401 }
      );
    }

    if (!user.passwordHash) {
      recordAttempt(rateLimitKey, false);
      return NextResponse.json(
        { error: 'Account has no password configured. Please contact your administrator.' },
        { status: 401 }
      );
    }

    // Verify password with constant-time bcrypt comparison
    const passwordValid = await bcrypt.compare(password, user.passwordHash);

    if (!passwordValid) {
      recordAttempt(rateLimitKey, false);
      return NextResponse.json(
        { error: 'Incorrect password. Ask your mentor if you forgot it.' },
        { status: 401 }
      );
    }

    // Successful authentication: clear rate limiter
    recordAttempt(rateLimitKey, true);

    // Record login timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Issue cryptographic signed session cookie
    await setSessionCookie({
      userId: user.id,
      name: user.name,
      role: user.role,
    });

    const redirectUrl = user.role === 'GUARDIAN' ? '/admin' : '/';

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        grade: user.grade,
      },
      redirectUrl,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during login. Please try again.' },
      { status: 500 }
    );
  }
}
