import { redirect } from 'next/navigation';
import { getSession } from '@/backend/lib/auth';
import { prisma } from '@/backend/lib/prisma';
import { adminRepository } from '@/backend/repositories/adminRepository';
import { studyRepository } from '@/backend/repositories/studyRepository';
import { AdminDashboard } from '@/frontend/views/AdminDashboard';

export const metadata = {
  title: 'Mentor Studio | StudyBuddy Admin',
  description: 'Manage curriculum, author notes, upload NotebookLM videos, and track student progress.',
};

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  if (session.role !== 'GUARDIAN') {
    redirect('/');
  }

  await studyRepository.getSubjects(); // Ensure seeding

  // Fetch all registered students
  const students = await prisma.user.findMany({
    where: { role: 'STUDENT' },
    select: {
      id: true,
      name: true,
      grade: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const activeStudentId = students.length > 0 ? students[0].id : '';

  // Calculate current week's Monday
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  const weekStart = monday.toISOString().split('T')[0];

  const [overview, performance, topics, subjects] = await Promise.all([
    adminRepository.getStudentOverview(activeStudentId),
    adminRepository.getWeeklyPerformance(activeStudentId, weekStart),
    adminRepository.getTopicsWithCounts(),
    adminRepository.getSubjects(),
  ]);

  return (
    <AdminDashboard
      mentorName={session.name}
      initialStudents={students.map((s) => ({
        id: s.id,
        name: s.name,
        grade: s.grade || 'Grade 8 / Form One',
      }))}
      initialOverview={overview}
      initialPerformance={performance}
      initialTopics={topics}
      subjects={subjects}
    />
  );
}
