export type UserRole = 'STUDENT' | 'GUARDIAN';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  grade?: string;
  createdAt: string;
}

export interface Subject {
  id: string;
  slug: string;
  name: string;
  icon: string;
  colorTheme: 'blue' | 'emerald' | 'amber' | 'purple' | 'indigo' | 'teal' | 'rose';
  isAvailable: boolean;
}

export interface Topic {
  id: string;
  subjectId: string;
  title: string;
  slug: string;
  summary: string;
  order: number;
  weekNumber: number;
  notesMarkdown: string;
  videoUrl?: string;
}

export type QuestionType = 'MCQ' | 'SHORT_ANSWER';

export interface Question {
  id: string;
  topicId: string;
  prompt: string;
  type: QuestionType;
  options?: string[];
  correctOptionIndex?: number;
  acceptableAnswers?: string[]; // Normalized array for typed answers
  explanation: string;
  order: number;
}

export type MetacognitiveRating = 'EASY' | 'FAIR' | 'HARD';

export interface QuizQuestionAnswer {
  questionId: string;
  userResponse: string;
  isCorrect: boolean;
  timeTakenSec: number;
}

export interface QuizAttempt {
  id: string;
  userId: string;
  topicId: string;
  scorePercent: number;
  totalQuestions: number;
  correctCount: number;
  durationSeconds: number;
  selfRating?: MetacognitiveRating;
  isWeekendReview: boolean;
  completedAt: string;
  answers: QuizQuestionAnswer[];
}

export interface StudyHeartbeatPayload {
  userId: string;
  topicId?: string;
  activeSeconds: number; // Duration accumulated since last ping
  timestamp: string;
}

export interface StudyTelemetrySession {
  id: string;
  userId: string;
  topicId?: string;
  activeDurationSeconds: number;
  lastHeartbeat: string;
  date: string;
}

export type StreakDayStatus = 'DONE' | 'TODAY' | 'UPCOMING' | 'MISSED';

export interface StreakDay {
  dayLabel: string; // 'M' | 'T' | 'W' | 'T' | 'F' | 'S' | 'S'
  dateStr: string;
  status: StreakDayStatus;
}

export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  days: StreakDay[];
}

export interface TodayPlanSession {
  id: string;
  subjectSlug: string;
  subjectName: string;
  subjectTheme: 'blue' | 'emerald' | 'amber' | 'purple';
  badgeLabel: string;
  topicTitle: string;
  topicSlug: string;
  topicId: string;
  status: 'PENDING' | 'COMPLETED';
}

export type SubmissionStatus = 'PENDING' | 'REVIEWED' | 'ARCHIVED';

export interface CurriculumSubmission {
  id: string;
  userId: string;
  subjectId?: string;
  subjectName?: string;
  subjectTheme?: string;
  chapterTitle?: string;
  notes?: string;
  imageUrls: string[];
  status: SubmissionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubmissionInput {
  userId: string;
  subjectId?: string;
  subjectName?: string;
  chapterTitle?: string;
  notes?: string;
  imageUrls: string[];
}
