import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/backend/lib/prisma';
import { requireSession } from '@/backend/lib/auth';
import { z } from 'zod';
import { computeUnlockedItems } from '@/frontend/lib/unlocks';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

const updateProfileSchema = z.object({
  dailyGoalMinutes: z.number().int().min(10).max(180).optional(),
  preferredStudyTime: z.enum(['MORNING', 'AFTERNOON', 'EVENING']).nullable().optional(),
  textSize: z.enum(['SMALL', 'NORMAL', 'LARGE']).optional(),
  soundEnabled: z.boolean().optional(),
  reducedMotion: z.boolean().optional(),
  avatarConfig: z.record(z.string(), z.any()).nullable().optional(),
});

export async function GET() {
  try {
    const auth = await requireSession(['STUDENT', 'GUARDIAN']);
    if (auth.error) return auth.error;

    const userId = auth.user.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        streak: true,
        quizAttempts: {
          select: { scorePercent: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get or initialize profile
    let profile = user.profile;
    if (!profile) {
      profile = await prisma.studentProfile.create({
        data: {
          userId: user.id,
          dailyGoalMinutes: 30,
          textSize: 'NORMAL',
          soundEnabled: false,
          reducedMotion: false,
        },
      });
    }

    // Compute achievements for unlocks
    const attempts = user.quizAttempts;
    const highestScore = attempts.length > 0 ? Math.max(...attempts.map((a) => a.scorePercent)) : 0;
    const unlockedItems = computeUnlockedItems({
      hasCompletedOnboarding: !!user.onboardingCompletedAt,
      totalQuizzesCompleted: attempts.length,
      currentStreak: user.streak?.currentStreak || 0,
      highestScorePercent: highestScore,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        grade: user.grade || 'Grade 8 / Form One',
        role: user.role,
        memberSince: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      },
      profile,
      streak: user.streak || { currentStreak: 0, longestStreak: 0 },
      unlockedItems,
    });
  } catch (error) {
    console.error('Profile GET error:', error);
    return NextResponse.json({ error: 'Failed to retrieve profile' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireSession(['STUDENT', 'GUARDIAN']);
    if (auth.error) return auth.error;

    const rawBody = await request.json();
    const parseResult = updateProfileSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid profile data', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const data = parseResult.data;
    const userId = auth.user.userId;

    const avatarJson = data.avatarConfig !== undefined
      ? (data.avatarConfig === null ? Prisma.JsonNull : (data.avatarConfig as Prisma.InputJsonValue))
      : undefined;

    const updated = await prisma.studentProfile.upsert({
      where: { userId },
      update: {
        ...(data.dailyGoalMinutes !== undefined ? { dailyGoalMinutes: data.dailyGoalMinutes } : {}),
        ...(data.preferredStudyTime !== undefined ? { preferredStudyTime: data.preferredStudyTime } : {}),
        ...(data.textSize !== undefined ? { textSize: data.textSize } : {}),
        ...(data.soundEnabled !== undefined ? { soundEnabled: data.soundEnabled } : {}),
        ...(data.reducedMotion !== undefined ? { reducedMotion: data.reducedMotion } : {}),
        ...(avatarJson !== undefined ? { avatarConfig: avatarJson } : {}),
      },
      create: {
        userId,
        dailyGoalMinutes: data.dailyGoalMinutes ?? 30,
        preferredStudyTime: data.preferredStudyTime ?? null,
        textSize: data.textSize ?? 'NORMAL',
        soundEnabled: data.soundEnabled ?? false,
        reducedMotion: data.reducedMotion ?? false,
        ...(avatarJson !== undefined ? { avatarConfig: avatarJson } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      profile: updated,
    });
  } catch (error) {
    console.error('Profile PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
