import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/backend/lib/prisma';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identifier, password, userId } = body;

    let targetUser: { id: string; name: string; role: string; email: string } | null = null;

    // 1. Direct userId login (for quick player select / dev testing)
    if (userId) {
      targetUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, role: true, email: true },
      });
    }

    // 2. Identifier lookup (email or student username)
    if (!targetUser && identifier) {
      const trimmed = identifier.trim().toLowerCase();

      // Check by exact email or friendly aliases
      if (trimmed === 'alex' || trimmed === 'student' || trimmed === 'champ') {
        targetUser = await prisma.user.findUnique({
          where: { id: 'student-alex' },
          select: { id: true, name: true, role: true, email: true },
        });
      } else if (trimmed === 'davie' || trimmed === 'guardian' || trimmed === 'mentor' || trimmed === 'admin') {
        targetUser = await prisma.user.findUnique({
          where: { id: 'guardian-davie' },
          select: { id: true, name: true, role: true, email: true },
        });
      } else {
        targetUser = await prisma.user.findFirst({
          where: {
            OR: [
              { email: { equals: trimmed, mode: 'insensitive' } },
              { name: { contains: trimmed, mode: 'insensitive' } },
            ],
          },
          select: { id: true, name: true, role: true, email: true },
        });
      }
    }

    // Default fallback to student-alex if no user found during initial dev phase
    if (!targetUser) {
      targetUser = await prisma.user.findUnique({
        where: { id: 'student-alex' },
        select: { id: true, name: true, role: true, email: true },
      });
    }

    if (!targetUser) {
      return NextResponse.json(
        { error: 'Invalid credentials. Please check your username or email.' },
        { status: 401 }
      );
    }

    // Determine redirect destination based on role
    const redirectUrl = targetUser.role === 'GUARDIAN' ? '/admin' : '/';

    // Set secure HTTP-only session cookie
    const cookieStore = await cookies();
    cookieStore.set('studybuddy_session', JSON.stringify({
      userId: targetUser.id,
      name: targetUser.name,
      role: targetUser.role,
      email: targetUser.email,
    }), {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return NextResponse.json({
      success: true,
      user: targetUser,
      redirectUrl,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Authentication failed. Please try again.' },
      { status: 500 }
    );
  }
}
