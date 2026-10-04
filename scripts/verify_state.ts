import { prisma } from '../backend/lib/prisma';

async function checkState() {
  const subjects = await prisma.subject.findMany({
    orderBy: { slug: 'asc' },
  });
  console.log(`[${new Date().toISOString()}] Subjects in Database (${subjects.length}):`, subjects.map(s => ({ id: s.id, slug: s.slug, name: s.name, isAvailable: s.isAvailable })));

  const user = await prisma.user.findUnique({
    where: { id: 'student-alex' },
  });
  console.log(`[${new Date().toISOString()}] User Record:`, user);

  const priorities = await prisma.subjectPriority.findMany({
    where: { userId: 'student-alex' },
    include: { subject: true },
  });
  console.log(`[${new Date().toISOString()}] Subject Priorities:`, priorities);

  const slots = await prisma.timetableSlot.findMany({
    where: { userId: 'student-alex' },
    include: { subject: true },
  });
  console.log(`[${new Date().toISOString()}] Timetable Slots:`, slots);
}

checkState()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
