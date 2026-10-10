import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/backend/lib/prisma';
import { getSession } from '@/backend/lib/auth';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/students
 * Lists all registered students
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'GUARDIAN') {
      return NextResponse.json({ error: 'Unauthorized access.' }, { status: 403 });
    }

    const students = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: {
        id: true,
        name: true,
        grade: true,
        onboardingCompletedAt: true,
        createdAt: true,
        streak: {
          select: {
            currentStreak: true,
            longestStreak: true,
            lastActiveDate: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ students });
  } catch (error) {
    console.error('Failed to list students:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve students' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/students
 * Registers a new student with Name and simple Password
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'GUARDIAN') {
      return NextResponse.json({ error: 'Unauthorized access. Only mentors can register students.' }, { status: 403 });
    }

    const body = await request.json();
    const name = (body.name || '').trim();
    const password = (body.password || '').trim();
    const grade = (body.grade || 'Grade 8 / Form One').trim();

    if (!name) {
      return NextResponse.json({ error: 'Student name is required.' }, { status: 400 });
    }

    if (!password || password.length < 4) {
      return NextResponse.json(
        { error: 'Password must be at least 4 characters.' },
        { status: 400 }
      );
    }

    // Check if name is already taken
    const existing = await prisma.user.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });

    if (existing) {
      return NextResponse.json(
        { error: `A student named "${name}" is already registered. Please use a unique name or nickname.` },
        { status: 409 }
      );
    }

    // Hash the simple password securely
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user and initial streak
    const student = await prisma.user.create({
      data: {
        name,
        passwordHash,
        role: 'STUDENT',
        grade,
        streak: {
          create: {
            currentStreak: 0,
            longestStreak: 0,
          },
        },
      },
      select: {
        id: true,
        name: true,
        grade: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      { success: true, message: `Student "${name}" registered successfully!`, student },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to register student:', error);
    return NextResponse.json(
      { error: 'Internal server error registering student.' },
      { status: 500 }
    );
  }
}
