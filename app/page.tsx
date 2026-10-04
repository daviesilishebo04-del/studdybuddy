import { prisma } from '@/backend/lib/prisma';
import { studyRepository } from '@/backend/repositories/studyRepository';
import { StudentDashboard } from '@/frontend/views/StudentDashboard';

export default async function HomePage() {
  const [streak, plan, topics, subjects, user] = await Promise.all([
    studyRepository.getStreak(),
    studyRepository.getTodayPlan(),
    studyRepository.getTopicsBySubject('subj-math'),
    studyRepository.getSubjects(),
    prisma.user.findUnique({ where: { id: 'student-alex' } }),
  ]);

  // Load all available questions for both math and literature topics
  const mathQuestions = await studyRepository.getQuestionsByTopic('topic-math-1');
  const litQuestions = await studyRepository.getQuestionsByTopic('topic-lit-1');
  const allQuestions = [...mathQuestions, ...litQuestions];

  const litTopic = await studyRepository.getTopicById('topic-lit-1');
  const allTopics = litTopic ? [...topics, litTopic] : topics;

  const initialOnboardingNeeded = !user || !user.onboardingCompletedAt;

  return (
    <StudentDashboard
      initialStreak={streak}
      initialPlan={plan}
      topics={allTopics}
      questions={allQuestions}
      initialOnboardingNeeded={initialOnboardingNeeded}
    />
  );
}
