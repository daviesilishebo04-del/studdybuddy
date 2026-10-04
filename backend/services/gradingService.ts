import { Question, QuizQuestionAnswer } from '../domain/types';

export interface GradeInput {
  question: Question;
  userResponse: string;
  timeTakenSec: number;
}

export interface GradedResult {
  answer: QuizQuestionAnswer;
  correctAnswerText: string;
  explanation: string;
}

export function normalizeAnswer(text: string): string {
  if (!text) return '';
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '') // remove inner whitespace: "x = 5" -> "x=5"
    .replace(/[.,;!]$/, ''); // strip trailing punctuation
}

export function checkAnswer(question: Question, response: string): boolean {
  if (question.type === 'MCQ') {
    const selectedIdx = parseInt(response, 10);
    return selectedIdx === question.correctOptionIndex;
  }

  if (question.type === 'SHORT_ANSWER') {
    const normalizedUser = normalizeAnswer(response);
    if (!question.acceptableAnswers || question.acceptableAnswers.length === 0) {
      return false;
    }

    // Direct match against any acceptable answers
    return question.acceptableAnswers.some((ans) => {
      const normalizedAcceptable = normalizeAnswer(ans);
      if (normalizedUser === normalizedAcceptable) return true;

      // Handle cases where acceptable has "x=5" and user wrote "5" or vice versa
      const strippedAcceptable = normalizedAcceptable.replace(/^[a-z]=/, '');
      const strippedUser = normalizedUser.replace(/^[a-z]=/, '');
      return strippedUser === strippedAcceptable;
    });
  }

  return false;
}

export function evaluateQuiz(inputs: GradeInput[]): {
  scorePercent: number;
  totalQuestions: number;
  correctCount: number;
  results: GradedResult[];
} {
  const results: GradedResult[] = inputs.map(({ question, userResponse, timeTakenSec }) => {
    const isCorrect = checkAnswer(question, userResponse);
    let correctAnswerText = '';

    if (question.type === 'MCQ' && question.options && question.correctOptionIndex !== undefined) {
      correctAnswerText = question.options[question.correctOptionIndex];
    } else if (question.acceptableAnswers && question.acceptableAnswers.length > 0) {
      correctAnswerText = question.acceptableAnswers[0];
    }

    return {
      answer: {
        questionId: question.id,
        userResponse,
        isCorrect,
        timeTakenSec,
      },
      correctAnswerText,
      explanation: question.explanation,
    };
  });

  const correctCount = results.filter((r) => r.answer.isCorrect).length;
  const totalQuestions = results.length;
  const scorePercent = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  return {
    scorePercent,
    totalQuestions,
    correctCount,
    results,
  };
}
