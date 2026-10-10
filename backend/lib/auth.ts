import crypto from 'crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { Role } from '@prisma/client';

const SESSION_COOKIE_NAME = 'studybuddy_session';
export function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE !== 'phase-production-build') {
      throw new Error('CRITICAL SECURITY ERROR: SESSION_SECRET environment variable is missing in production!');
    }
    return 'studybuddy-development-secret-key-32chars-minimum!';
  }
  if (secret.length < 32 && process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE !== 'phase-production-build') {
    throw new Error('CRITICAL SECURITY ERROR: SESSION_SECRET must be at least 32 characters long in production!');
  }
  return secret;
}
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export interface SessionUser {
  userId: string;
  name: string;
  role: Role;
}

interface TokenPayload extends SessionUser {
  exp: number;
  iat: number;
}

/**
 * Sign payload using HMAC-SHA256
 */
export function signSession(payload: SessionUser): string {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + SESSION_MAX_AGE_SECONDS;
  const tokenPayload: TokenPayload = { ...payload, iat, exp };

  const base64Data = Buffer.from(JSON.stringify(tokenPayload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', getSessionSecret())
    .update(base64Data)
    .digest('base64url');

  return `${base64Data}.${signature}`;
}

/**
 * Verify HMAC-SHA256 token and check expiry
 */
export function verifySession(token: string): SessionUser | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [base64Data, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', getSessionSecret())
      .update(base64Data)
      .digest('base64url');

    // Constant-time comparison to prevent timing attacks
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    const payload: TokenPayload = JSON.parse(
      Buffer.from(base64Data, 'base64url').toString('utf8')
    );

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return null; // Expired
    }

    return {
      userId: payload.userId,
      name: payload.name,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

/**
 * Sets secure HTTP-only signed session cookie
 */
export async function setSessionCookie(user: SessionUser) {
  const token = signSession(user);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

/**
 * Retrieve verified session from cookies
 */
export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    return verifySession(token);
  } catch {
    return null;
  }
}

/**
 * Clear session cookie
 */
export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Enforces session authentication and optional RBAC authorization in API routes.
 */
export async function requireSession(allowedRoles?: Role[]): Promise<
  | { user: SessionUser; error: null }
  | { user: null; error: NextResponse }
> {
  const user = await getSession();
  if (!user) {
    return {
      user: null,
      error: NextResponse.json(
        { error: 'Authentication required. Please log in.' },
        { status: 401 }
      ),
    };
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return {
      user: null,
      error: NextResponse.json(
        { error: 'Access denied: insufficient permissions for this action.' },
        { status: 403 }
      ),
    };
  }

  return { user, error: null };
}
