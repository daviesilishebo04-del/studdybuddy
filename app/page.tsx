import { redirect } from 'next/navigation';
import { getSession } from '@/backend/lib/auth';
import { prisma } from '@/backend/lib/prisma';
import { studyRepository } from '@/backend/repositories/studyRepository';
import { StudentDashboard } from '@/frontend/views/StudentDashboard';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  if (session.role === 'GUARDIAN') {
    redirect('/admin');
  }

  const [streak, plan, topics, subjects, user] = await Promise.all([
    studyRepository.getStreak(session.userId),
    studyRepository.getTodayPlan(session.userId),
    studyRepository.getTopicsBySubject('subj-math'),
    studyRepository.getSubjects(),
    prisma.user.findUnique({ where: { id: session.userId } }),
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
      currentUser={{
        id: session.userId,
        name: user?.name || session.name,
        role: session.role,
        grade: user?.grade || 'Grade 8 / Form One',
      }}
      initialStreak={streak}
      initialPlan={plan}
      topics={allTopics}
      questions={allQuestions}
      initialOnboardingNeeded={initialOnboardingNeeded}
    />
  );
}
