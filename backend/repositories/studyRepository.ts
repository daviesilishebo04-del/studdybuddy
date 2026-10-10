import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import {
  Subject,
  Topic,
  Question,
  StreakState,
  User,
  QuizAttempt,
  StudyHeartbeatPayload,
  TodayPlanSession,
  CurriculumSubmission,
  CreateSubmissionInput,
  SubmissionStatus,
} from '../domain/types';
import {
  SEED_USERS,
  SEED_SUBJECTS,
  SEED_TOPICS,
  SEED_QUESTIONS,
  INITIAL_STREAK,
} from '../seed/curriculumData';
import { calculateUpdatedPriority, INITIAL_PRIORITY_HARD, INITIAL_PRIORITY_NORMAL } from '../services/prioritizationService';

class RealPrismaStudyRepository {
  private seeded = false;
  private seedPromise: Promise<void> | null = null;

  private async ensureSeeded() {
    if (this.seedPromise) return this.seedPromise;

    this.seedPromise = (async () => {
      try {
        const defaultMentorHash = await bcrypt.hash('mentor123', 10);
        const defaultNisaHash = await bcrypt.hash('nisa123', 10);

        for (const u of SEED_USERS) {
          const initialHash = u.role === 'GUARDIAN' ? defaultMentorHash : defaultNisaHash;
          await prisma.user.upsert({
            where: { id: u.id },
            update: {
              name: u.name,
              grade: u.grade,
              passwordHash: initialHash,
            },
            create: {
              id: u.id,
              email: u.email,
              name: u.name,
              role: u.role,
              grade: u.grade,
              passwordHash: initialHash,
            },
          });
        }

        for (const s of SEED_SUBJECTS) {
          await prisma.subject.upsert({
            where: { id: s.id },
            update: {},
            create: {
              id: s.id,
              slug: s.slug,
              name: s.name,
              icon: s.icon,
              colorTheme: s.colorTheme,
              isAvailable: s.isAvailable,
            },
          });
        }

        for (const t of SEED_TOPICS) {
          await prisma.topic.upsert({
            where: { id: t.id },
            update: {
              notesMarkdown: t.notesMarkdown,
              title: t.title,
              summary: t.summary,
            },
            create: {
              id: t.id,
              subjectId: t.subjectId,
              title: t.title,
              slug: t.slug,
              summary: t.summary,
              order: t.order,
              weekNumber: t.weekNumber,
              notesMarkdown: t.notesMarkdown,
            },
          });
        }

        for (const q of SEED_QUESTIONS) {
          await prisma.question.upsert({
            where: { id: q.id },
            update: {},
            create: {
              id: q.id,
              topicId: q.topicId,
              prompt: q.prompt,
              type: q.type,
              options: q.options || [],
              correctOptionIndex: q.correctOptionIndex,
              acceptableAnswers: q.acceptableAnswers || [],
              explanation: q.explanation,
              order: q.order,
            },
          });
        }

        for (const studentId of ['student-nisa', 'student-alex']) {
          await prisma.streak.upsert({
            where: { userId: studentId },
            update: {},
            create: {
              userId: studentId,
              currentStreak: INITIAL_STREAK.currentStreak,
              longestStreak: INITIAL_STREAK.longestStreak,
            },
          });

          await prisma.subjectPriority.upsert({
            where: { userId_subjectId: { userId: studentId, subjectId: 'subj-math' } },
            update: {},
            create: {
              userId: studentId,
              subjectId: 'subj-math',
              priority: INITIAL_PRIORITY_HARD,
              lastAccuracies: [],
            },
          });

          await prisma.subjectPriority.upsert({
            where: { userId_subjectId: { userId: studentId, subjectId: 'subj-lit' } },
            update: {},
            create: {
              userId: studentId,
              subjectId: 'subj-lit',
              priority: INITIAL_PRIORITY_NORMAL,
              lastAccuracies: [],
            },
          });
        }

        this.seeded = true;
      } catch (err) {
        console.error('Error ensuring PostgreSQL seed:', err);
      }
    })();

    await this.seedPromise;
  }

  async getUsers(): Promise<User[]> {
    await this.ensureSeeded();
    const users = await prisma.user.findMany();
    return users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role as 'STUDENT' | 'GUARDIAN',
      grade: u.grade || undefined,
      createdAt: u.createdAt.toISOString(),
    }));
  }

  async getUserById(id: string): Promise<User | undefined> {
    await this.ensureSeeded();
    const u = await prisma.user.findUnique({ where: { id } });
    if (!u) return undefined;
    return {
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role as 'STUDENT' | 'GUARDIAN',
      grade: u.grade || undefined,
      createdAt: u.createdAt.toISOString(),
    };
  }

  async getSubjects(): Promise<Subject[]> {
    await this.ensureSeeded();
    const subjects = await prisma.subject.findMany();
    return subjects.map((s) => ({
      id: s.id,
      slug: s.slug,
      name: s.name,
      icon: s.icon,
      colorTheme: s.colorTheme as 'blue' | 'emerald' | 'amber' | 'purple',
      isAvailable: s.isAvailable,
    }));
  }

  async getTopicsBySubject(subjectId: string): Promise<Topic[]> {
    await this.ensureSeeded();
    const topics = await prisma.topic.findMany({ where: { subjectId } });
    return topics.map((t) => ({
      id: t.id,
      subjectId: t.subjectId,
      title: t.title,
      slug: t.slug,
      summary: t.summary,
      order: t.order,
      weekNumber: t.weekNumber,
      notesMarkdown: t.notesMarkdown,
      videoUrl: t.videoUrl || undefined,
    }));
  }

  async getTopicById(id: string): Promise<Topic | undefined> {
    await this.ensureSeeded();
    const t = await prisma.topic.findUnique({ where: { id } });
    if (!t) return undefined;
    return {
      id: t.id,
      subjectId: t.subjectId,
      title: t.title,
      slug: t.slug,
      summary: t.summary,
      order: t.order,
      weekNumber: t.weekNumber,
      notesMarkdown: t.notesMarkdown,
      videoUrl: t.videoUrl || undefined,
    };
  }

  async getQuestionsByTopic(topicId: string): Promise<Question[]> {
    await this.ensureSeeded();
    const questions = await prisma.question.findMany({
      where: { topicId },
      orderBy: { order: 'asc' },
    });
    return questions.map((q) => ({
      id: q.id,
      topicId: q.topicId,
      prompt: q.prompt,
      type: q.type as 'MCQ' | 'SHORT_ANSWER',
      options: q.options,
      correctOptionIndex: q.correctOptionIndex ?? undefined,
      acceptableAnswers: q.acceptableAnswers,
      explanation: q.explanation,
      order: q.order,
    }));
  }

  async getStreak(userId?: string): Promise<StreakState> {
    await this.ensureSeeded();
    const targetUserId = userId || 'student-alex';
    const streak = await prisma.streak.findUnique({ where: { userId: targetUserId } });
    return {
      currentStreak: streak?.currentStreak ?? 0,
      longestStreak: streak?.longestStreak ?? 0,
      days: INITIAL_STREAK.days,
    };
  }

  async getTodayPlan(userId?: string): Promise<TodayPlanSession[]> {
    await this.ensureSeeded();
    const targetUserId = userId || 'student-alex';
    // Prioritization: check subject priorities in PostgreSQL to surface highest priority first
    const priorities = await prisma.subjectPriority.findMany({
      where: { userId: targetUserId },
      orderBy: { priority: 'desc' },
      include: { subject: true },
    });

    const defaultSessions: TodayPlanSession[] = [
      {
        id: 'plan-1',
        subjectSlug: 'math',
        subjectName: 'Mathematics',
        subjectTheme: 'blue',
        badgeLabel: 'MATH',
        topicTitle: 'Algebra: Linear Equations',
        topicSlug: 'algebra-linear-equations',
        topicId: 'topic-math-1',
        status: 'PENDING',
      },
      {
        id: 'plan-2',
        subjectSlug: 'literature',
        subjectName: 'Literature',
        subjectTheme: 'emerald',
        badgeLabel: 'LITERATURE',
        topicTitle: 'Poetry: Theme & Meaning',
        topicSlug: 'poetry-theme-and-meaning',
        topicId: 'topic-lit-1',
        status: 'PENDING',
      },
    ];

    // If priorities exist, order sessions by subject priority
    if (priorities.length > 0) {
      const priorityMap = new Map(priorities.map((p) => [p.subject.slug, p.priority]));
      defaultSessions.sort((a, b) => {
        const pA = priorityMap.get(a.subjectSlug) ?? 0.3;
        const pB = priorityMap.get(b.subjectSlug) ?? 0.3;
        return pB - pA; // highest priority first
      });
    }

    return defaultSessions;
  }

  async recordQuizAttempt(attempt: QuizAttempt): Promise<QuizAttempt> {
    await this.ensureSeeded();

    // 1. Create real database record in PostgreSQL via Prisma
    const created = await prisma.quizAttempt.create({
      data: {
        id: attempt.id,
        userId: attempt.userId,
        topicId: attempt.topicId,
        scorePercent: attempt.scorePercent,
        totalQuestions: attempt.totalQuestions,
        correctCount: attempt.correctCount,
        durationSeconds: attempt.durationSeconds,
        selfRating: attempt.selfRating ? (attempt.selfRating as 'EASY' | 'FAIR' | 'HARD') : null,
        isWeekendReview: attempt.isWeekendReview,
        answers: {
          create: attempt.answers.map((a) => ({
            questionId: a.questionId,
            userResponse: a.userResponse,
            isCorrect: a.isCorrect,
            timeTakenSec: a.timeTakenSec,
          })),
        },
      },
      include: { answers: true },
    });

    // 2. Hybrid Priority Update: recompute subject priority via EMA
    const topic = await prisma.topic.findUnique({ where: { id: attempt.topicId } });
    if (topic) {
      const accuracy = attempt.scorePercent / 100;
      const existing = await prisma.subjectPriority.findUnique({
        where: { userId_subjectId: { userId: attempt.userId, subjectId: topic.subjectId } },
      });

      const currentPriority = existing?.priority ?? 0.3;
      const { newPriority } = calculateUpdatedPriority(currentPriority, accuracy);

      const recentAcc = [...(existing?.lastAccuracies || []), accuracy].slice(-5);

      await prisma.subjectPriority.upsert({
        where: { userId_subjectId: { userId: attempt.userId, subjectId: topic.subjectId } },
        update: {
          priority: newPriority,
          lastAccuracies: recentAcc,
        },
        create: {
          userId: attempt.userId,
          subjectId: topic.subjectId,
          priority: newPriority,
          lastAccuracies: recentAcc,
        },
      });
    }

    return {
      id: created.id,
      userId: created.userId,
      topicId: created.topicId,
      scorePercent: created.scorePercent,
      totalQuestions: created.totalQuestions,
      correctCount: created.correctCount,
      durationSeconds: created.durationSeconds,
      selfRating: created.selfRating as any,
      isWeekendReview: created.isWeekendReview,
      completedAt: created.completedAt.toISOString(),
      answers: created.answers.map((ans) => ({
        questionId: ans.questionId,
        userResponse: ans.userResponse,
        isCorrect: ans.isCorrect,
        timeTakenSec: ans.timeTakenSec,
      })),
    };
  }

  async getQuizAttempts(userId: string): Promise<QuizAttempt[]> {
    await this.ensureSeeded();
    const attempts = await prisma.quizAttempt.findMany({
      where: { userId },
      include: { answers: true },
      orderBy: { completedAt: 'desc' },
    });

    return attempts.map((a) => ({
      id: a.id,
      userId: a.userId,
      topicId: a.topicId,
      scorePercent: a.scorePercent,
      totalQuestions: a.totalQuestions,
      correctCount: a.correctCount,
      durationSeconds: a.durationSeconds,
      selfRating: a.selfRating as any,
      isWeekendReview: a.isWeekendReview,
      completedAt: a.completedAt.toISOString(),
      answers: a.answers.map((ans) => ({
        questionId: ans.questionId,
        userResponse: ans.userResponse,
        isCorrect: ans.isCorrect,
        timeTakenSec: ans.timeTakenSec,
      })),
    }));
  }

  async recordHeartbeat(payload: StudyHeartbeatPayload): Promise<void> {
    await this.ensureSeeded();
    await prisma.studySession.create({
      data: {
        userId: payload.userId,
        topicId: payload.topicId,
        activeDurationSeconds: payload.activeSeconds,
      },
    });
  }

  async getTotalActiveStudySeconds(userId: string): Promise<number> {
    await this.ensureSeeded();
    const sessions = await prisma.studySession.findMany({ where: { userId } });
    return sessions.reduce((sum, s) => sum + s.activeDurationSeconds, 0);
  }

  async createCurriculumSubmission(data: CreateSubmissionInput): Promise<CurriculumSubmission> {
    await this.ensureSeeded();

    let matchedSubjectId = data.subjectId;
    let resolvedSubjectName = data.subjectName;

    // Try matching an existing subject if a name is provided
    if (!matchedSubjectId && data.subjectName) {
      const existing = await prisma.subject.findFirst({
        where: {
          OR: [
            { name: { equals: data.subjectName, mode: 'insensitive' } },
            { slug: { equals: data.subjectName.toLowerCase().replace(/\s+/g, '-'), mode: 'insensitive' } },
          ],
        },
      });
      if (existing) {
        matchedSubjectId = existing.id;
        resolvedSubjectName = existing.name;
      }
    }

    const created = await prisma.curriculumSubmission.create({
      data: {
        userId: data.userId,
        subjectId: matchedSubjectId || null,
        subjectName: resolvedSubjectName || data.subjectName || 'General',
        chapterTitle: data.chapterTitle,
        notes: data.notes,
        imageUrls: data.imageUrls,
      },
      include: {
        subject: true,
      },
    });

    return {
      id: created.id,
      userId: created.userId,
      subjectId: created.subjectId || undefined,
      subjectName: created.subject?.name || created.subjectName || 'General',
      subjectTheme: created.subject?.colorTheme || 'blue',
      chapterTitle: created.chapterTitle || undefined,
      notes: created.notes || undefined,
      imageUrls: created.imageUrls,
      status: created.status as SubmissionStatus,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  }

  async getCurriculumSubmissions(userId?: string): Promise<CurriculumSubmission[]> {
    await this.ensureSeeded();
    const submissions = await prisma.curriculumSubmission.findMany({
      where: userId ? { userId } : undefined,
      include: { subject: true },
      orderBy: { createdAt: 'desc' },
    });

    return submissions.map((s) => ({
      id: s.id,
      userId: s.userId,
      subjectId: s.subjectId || undefined,
      subjectName: s.subject?.name || s.subjectName || 'General',
      subjectTheme: s.subject?.colorTheme || 'blue',
      chapterTitle: s.chapterTitle || undefined,
      notes: s.notes || undefined,
      imageUrls: s.imageUrls,
      status: s.status as SubmissionStatus,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }));
  }

  async updateCurriculumSubmissionStatus(
    id: string,
    status: SubmissionStatus
  ): Promise<CurriculumSubmission> {
    await this.ensureSeeded();
    const updated = await prisma.curriculumSubmission.update({
      where: { id },
      data: { status },
      include: { subject: true },
    });

    return {
      id: updated.id,
      userId: updated.userId,
      subjectId: updated.subjectId || undefined,
      subjectName: updated.subject?.name || updated.subjectName || 'General',
      subjectTheme: updated.subject?.colorTheme || 'blue',
      chapterTitle: updated.chapterTitle || undefined,
      notes: updated.notes || undefined,
      imageUrls: updated.imageUrls,
      status: updated.status as SubmissionStatus,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }
}

export const studyRepository = new RealPrismaStudyRepository();
