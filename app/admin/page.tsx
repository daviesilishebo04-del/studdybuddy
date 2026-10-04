import { adminRepository } from '@/backend/repositories/adminRepository';
import { studyRepository } from '@/backend/repositories/studyRepository';
import { AdminDashboard } from '@/frontend/views/AdminDashboard';

export const metadata = {
  title: 'Mentor Studio | StudyBuddy Admin',
  description: 'Manage curriculum, author notes, upload NotebookLM videos, and track student progress.',
};

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  await studyRepository.getSubjects(); // Ensure seeding

  // Calculate current week's Monday
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  const weekStart = monday.toISOString().split('T')[0];

  const [overview, performance, topics, subjects] = await Promise.all([
    adminRepository.getStudentOverview('student-alex'),
    adminRepository.getWeeklyPerformance('student-alex', weekStart),
    adminRepository.getTopicsWithCounts(),
    adminRepository.getSubjects(),
  ]);

  return (
    <AdminDashboard
      initialOverview={overview}
      initialPerformance={performance}
      initialTopics={topics}
      subjects={subjects}
    />
  );
}
