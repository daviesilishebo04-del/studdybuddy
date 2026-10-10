import { prisma } from '../lib/prisma';
import {
  Subject,
  Topic,
  Question,
  QuizAttempt,
  MetacognitiveRating,
} from '../domain/types';

export type { Subject, Topic, Question, QuizAttempt };


// ─── Types for admin operations ───────────────────────────────────────

export interface StudentOverview {
  id: string;
  name: string;
  grade: string;
  currentStreak: number;
  longestStreak: number;
  totalStudyMinutes: number;
  averageScore: number;
  totalQuizzes: number;
  recentAttempts: QuizAttempt[];
}

export interface WeeklyDayEntry {
  date: string;
  dayLabel: string;
  subjects: {
    subjectId: string;
    subjectName: string;
    colorTheme: string;
    status: 'DONE' | 'MISSED' | 'UPCOMING';
    scorePercent?: number;
  }[];
}

export interface WeeklyPerformance {
  weekStart: string;
  weekEnd: string;
  days: WeeklyDayEntry[];
  subjectSummaries: {
    subjectId: string;
    subjectName: string;
    colorTheme: string;
    averageScore: number;
    quizCount: number;
    totalStudyMinutes: number;
  }[];
}

export interface TopicWithCounts {
  id: string;
  subjectId: string;
  subjectName: string;
  subjectColorTheme: string;
  title: string;
  slug: string;
  summary: string;
  order: number;
  weekNumber: number;
  hasVideo: boolean;
  videoUrl: string | null;
  mcqCount: number;
  shortAnswerCount: number;
}

export interface CreateTopicInput {
  subjectId: string;
  title: string;
  slug: string;
  summary: string;
  order: number;
  weekNumber: number;
  notesMarkdown: string;
  videoUrl?: string;
}

export interface UpdateTopicInput {
  title?: string;
  summary?: string;
  order?: number;
  weekNumber?: number;
  notesMarkdown?: string;
  videoUrl?: string | null;
}

export interface CreateQuestionInput {
  topicId: string;
  prompt: string;
  type: 'MCQ' | 'SHORT_ANSWER';
  options?: string[];
  correctOptionIndex?: number;
  acceptableAnswers?: string[];
  explanation: string;
  order: number;
}

export interface UpdateQuestionInput {
  prompt?: string;
  options?: string[];
  correctOptionIndex?: number;
  acceptableAnswers?: string[];
  explanation?: string;
  order?: number;
}

// ─── Admin Repository ─────────────────────────────────────────────────

class AdminRepository {
  /**
   * Get overview stats for a student (used for the single-pupil admin home).
   */
  async getStudentOverview(userId: string): Promise<StudentOverview> {
    const [user, streak, sessions, attempts] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.streak.findUnique({ where: { userId } }),
      prisma.studySession.findMany({ where: { userId } }),
      prisma.quizAttempt.findMany({
        where: { userId },
        include: { answers: true },
        orderBy: { completedAt: 'desc' },
        take: 10,
      }),
    ]);

    const totalStudySeconds = sessions.reduce((sum, s) => sum + s.activeDurationSeconds, 0);
    const totalStudyMinutes = Math.round(totalStudySeconds / 60);

    const averageScore =
      attempts.length > 0
        ? Math.round(attempts.reduce((sum, a) => sum + a.scorePercent, 0) / attempts.length)
        : 0;

    return {
      id: userId,
      name: user?.name ?? 'Student',
      grade: user?.grade ?? 'Unknown',
      currentStreak: streak?.currentStreak ?? 0,
      longestStreak: streak?.longestStreak ?? 0,
      totalStudyMinutes,
      averageScore,
      totalQuizzes: attempts.length,
      recentAttempts: attempts.map((a) => ({
        id: a.id,
        userId: a.userId,
        topicId: a.topicId,
        scorePercent: a.scorePercent,
        totalQuestions: a.totalQuestions,
        correctCount: a.correctCount,
        durationSeconds: a.durationSeconds,
        selfRating: a.selfRating ? (a.selfRating as MetacognitiveRating) : undefined,
        isWeekendReview: a.isWeekendReview,
        completedAt: a.completedAt.toISOString(),
        answers: a.answers.map((ans) => ({
          questionId: ans.questionId,
          userResponse: ans.userResponse,
          isCorrect: ans.isCorrect,
          timeTakenSec: ans.timeTakenSec,
        })),
      })),
    };
  }

  /**
   * Get weekly performance heatmap data.
   */
  async getWeeklyPerformance(userId: string, weekStartStr: string): Promise<WeeklyPerformance> {
    const weekStart = new Date(weekStartStr);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all quiz attempts for this week
    const attempts = await prisma.quizAttempt.findMany({
      where: {
        userId,
        completedAt: { gte: weekStart, lt: weekEnd },
      },
      include: { topic: { include: { subject: true } } },
    });

    // Get all available subjects
    const subjects = await prisma.subject.findMany({
      where: { isAvailable: true },
    });

    // Get study sessions for the week
    const sessions = await prisma.studySession.findMany({
      where: {
        userId,
        startedAt: { gte: weekStart, lt: weekEnd },
      },
    });

    // Build day entries (Mon-Sun)
    const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const days: WeeklyDayEntry[] = [];

    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(weekStart);
      dayDate.setDate(dayDate.getDate() + i);
      const dayStr = dayDate.toISOString().split('T')[0];

      const daySubjects = subjects.map((subj) => {
        const dayAttempts = attempts.filter((a) => {
          const attemptDate = a.completedAt.toISOString().split('T')[0];
          return attemptDate === dayStr && a.topic.subjectId === subj.id;
        });

        let status: 'DONE' | 'MISSED' | 'UPCOMING';
        let scorePercent: number | undefined;

        if (dayDate > today) {
          status = 'UPCOMING';
        } else if (dayAttempts.length > 0) {
          status = 'DONE';
          scorePercent = Math.round(
            dayAttempts.reduce((s, a) => s + a.scorePercent, 0) / dayAttempts.length
          );
        } else {
          status = 'MISSED';
        }

        return {
          subjectId: subj.id,
          subjectName: subj.name,
          colorTheme: subj.colorTheme,
          status,
          scorePercent,
        };
      });

      days.push({
        date: dayStr,
        dayLabel: dayLabels[i],
        subjects: daySubjects,
      });
    }

    // Subject summaries
    const subjectSummaries = subjects.map((subj) => {
      const subjAttempts = attempts.filter((a) => a.topic.subjectId === subj.id);
      const subjSessions = sessions.filter((s) => {
        // Study sessions don't have subjectId directly, so we approximate
        return true;
      });

      return {
        subjectId: subj.id,
        subjectName: subj.name,
        colorTheme: subj.colorTheme,
        averageScore:
          subjAttempts.length > 0
            ? Math.round(subjAttempts.reduce((s, a) => s + a.scorePercent, 0) / subjAttempts.length)
            : 0,
        quizCount: subjAttempts.length,
        totalStudyMinutes: Math.round(
          subjSessions.reduce((s, sess) => s + sess.activeDurationSeconds, 0) / 60
        ),
      };
    });

    return {
      weekStart: weekStart.toISOString().split('T')[0],
      weekEnd: weekEnd.toISOString().split('T')[0],
      days,
      subjectSummaries,
    };
  }

  /**
   * Get all topics with question counts, grouped info for content management.
   */
  async getTopicsWithCounts(): Promise<TopicWithCounts[]> {
    const topics = await prisma.topic.findMany({
      include: {
        subject: true,
        questions: { select: { type: true } },
      },
      orderBy: [{ subject: { name: 'asc' } }, { order: 'asc' }],
    });

    return topics.map((t) => ({
      id: t.id,
      subjectId: t.subjectId,
      subjectName: t.subject.name,
      subjectColorTheme: t.subject.colorTheme,
      title: t.title,
      slug: t.slug,
      summary: t.summary,
      order: t.order,
      weekNumber: t.weekNumber,
      hasVideo: !!t.videoUrl,
      videoUrl: t.videoUrl,
      mcqCount: t.questions.filter((q) => q.type === 'MCQ').length,
      shortAnswerCount: t.questions.filter((q) => q.type === 'SHORT_ANSWER').length,
    }));
  }

  /**
   * Get all subjects (for dropdowns).
   */
  async getSubjects(): Promise<Subject[]> {
    const subjects = await prisma.subject.findMany({ orderBy: { name: 'asc' } });
    return subjects.map((s) => ({
      id: s.id,
      slug: s.slug,
      name: s.name,
      icon: s.icon,
      colorTheme: s.colorTheme as Subject['colorTheme'],
      isAvailable: s.isAvailable,
    }));
  }

  // ─── Topic CRUD ───────────────────────────────────────────────────

  async createTopic(input: CreateTopicInput): Promise<Topic> {
    const t = await prisma.topic.create({
      data: {
        subjectId: input.subjectId,
        title: input.title,
        slug: input.slug,
        summary: input.summary,
        order: input.order,
        weekNumber: input.weekNumber,
        notesMarkdown: input.notesMarkdown,
        videoUrl: input.videoUrl ?? null,
      },
    });

    return {
      id: t.id,
      subjectId: t.subjectId,
      title: t.title,
      slug: t.slug,
      summary: t.summary,
      order: t.order,
      weekNumber: t.weekNumber,
      notesMarkdown: t.notesMarkdown,
      videoUrl: t.videoUrl ?? undefined,
    };
  }

  async updateTopic(id: string, input: UpdateTopicInput): Promise<Topic> {
    const t = await prisma.topic.update({
      where: { id },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.summary !== undefined && { summary: input.summary }),
        ...(input.order !== undefined && { order: input.order }),
        ...(input.weekNumber !== undefined && { weekNumber: input.weekNumber }),
        ...(input.notesMarkdown !== undefined && { notesMarkdown: input.notesMarkdown }),
        ...(input.videoUrl !== undefined && { videoUrl: input.videoUrl }),
      },
    });

    return {
      id: t.id,
      subjectId: t.subjectId,
      title: t.title,
      slug: t.slug,
      summary: t.summary,
      order: t.order,
      weekNumber: t.weekNumber,
      notesMarkdown: t.notesMarkdown,
      videoUrl: t.videoUrl ?? undefined,
    };
  }

  async deleteTopic(id: string): Promise<void> {
    await prisma.topic.delete({ where: { id } });
  }

  async getTopicById(id: string): Promise<Topic | null> {
    const t = await prisma.topic.findUnique({ where: { id } });
    if (!t) return null;
    return {
      id: t.id,
      subjectId: t.subjectId,
      title: t.title,
      slug: t.slug,
      summary: t.summary,
      order: t.order,
      weekNumber: t.weekNumber,
      notesMarkdown: t.notesMarkdown,
      videoUrl: t.videoUrl ?? undefined,
    };
  }

  // ─── Question CRUD ────────────────────────────────────────────────

  async getQuestionsByTopic(topicId: string, type?: 'MCQ' | 'SHORT_ANSWER'): Promise<Question[]> {
    const questions = await prisma.question.findMany({
      where: {
        topicId,
        ...(type && { type }),
      },
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

  async createQuestion(input: CreateQuestionInput): Promise<Question> {
    const q = await prisma.question.create({
      data: {
        topicId: input.topicId,
        prompt: input.prompt,
        type: input.type,
        options: input.options ?? [],
        correctOptionIndex: input.correctOptionIndex ?? null,
        acceptableAnswers: input.acceptableAnswers ?? [],
        explanation: input.explanation,
        order: input.order,
      },
    });

    return {
      id: q.id,
      topicId: q.topicId,
      prompt: q.prompt,
      type: q.type as 'MCQ' | 'SHORT_ANSWER',
      options: q.options,
      correctOptionIndex: q.correctOptionIndex ?? undefined,
      acceptableAnswers: q.acceptableAnswers,
      explanation: q.explanation,
      order: q.order,
    };
  }

  async updateQuestion(id: string, input: UpdateQuestionInput): Promise<Question> {
    const q = await prisma.question.update({
      where: { id },
      data: {
        ...(input.prompt !== undefined && { prompt: input.prompt }),
        ...(input.options !== undefined && { options: input.options }),
        ...(input.correctOptionIndex !== undefined && { correctOptionIndex: input.correctOptionIndex }),
        ...(input.acceptableAnswers !== undefined && { acceptableAnswers: input.acceptableAnswers }),
        ...(input.explanation !== undefined && { explanation: input.explanation }),
        ...(input.order !== undefined && { order: input.order }),
      },
    });

    return {
      id: q.id,
      topicId: q.topicId,
      prompt: q.prompt,
      type: q.type as 'MCQ' | 'SHORT_ANSWER',
      options: q.options,
      correctOptionIndex: q.correctOptionIndex ?? undefined,
      acceptableAnswers: q.acceptableAnswers,
      explanation: q.explanation,
      order: q.order,
    };
  }

  async deleteQuestion(id: string): Promise<void> {
    await prisma.question.delete({ where: { id } });
  }
}

export const adminRepository = new AdminRepository();
