import { MetacognitiveRating, QuizAttempt } from '../domain/types';

export interface CalibrationAnalysis {
  category: 'CALIBRATED' | 'OVERCONFIDENT' | 'UNDERCONFIDENT';
  message: string;
}

export function analyzeMetacognitiveCalibration(
  selfRating?: MetacognitiveRating,
  scorePercent: number = 0
): CalibrationAnalysis {
  if (!selfRating) {
    return {
      category: 'CALIBRATED',
      message: 'Self-assessment not provided.',
    };
  }

  if (selfRating === 'EASY' && scorePercent < 65) {
    return {
      category: 'OVERCONFIDENT',
      message: 'Felt "Easy", but scored below 65%. Suggest reviewing core concepts!',
    };
  }

  if (selfRating === 'HARD' && scorePercent >= 80) {
    return {
      category: 'UNDERCONFIDENT',
      message: 'Felt "Hard", but scored 80%+! Great retention despite perceived difficulty.',
    };
  }

  return {
    category: 'CALIBRATED',
    message: 'Self-assessment matches quiz performance well.',
  };
}

export interface GuardianTelemetrySummary {
  studentName: string;
  totalActiveStudyMinutes: number;
  totalQuizzesTaken: number;
  averageScorePercent: number;
  recentAttempts: QuizAttempt[];
  subjectMastery: {
    subjectName: string;
    scoreAvg: number;
    quizzesCount: number;
    colorTheme: string;
  }[];
  activeStudyStreakDays: number;
}
