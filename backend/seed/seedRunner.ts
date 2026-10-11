import { prisma } from '../lib/prisma';
import { SEED_USERS, SEED_SUBJECTS, SEED_TOPICS, SEED_QUESTIONS } from './curriculumData';

import bcrypt from 'bcryptjs';

async function seed() {
  console.log(`[${new Date().toISOString()}] Starting database seed...`);

  const nisaHash = await bcrypt.hash('nisa123', 10);
  const mentorHash = await bcrypt.hash('mentor123', 10);
  const alexHash = await bcrypt.hash('alex123', 10);

  // 1. Seed Users
  for (const u of SEED_USERS) {
    const defaultHash = u.id === 'guardian-davie' ? mentorHash : u.id === 'student-alex' ? alexHash : nisaHash;
    const existing = await prisma.user.findUnique({ where: { id: u.id } });
    await prisma.user.upsert({
      where: { id: u.id },
      update: {
        name: u.name,
        role: u.role,
        grade: u.grade,
        passwordHash: existing?.passwordHash || defaultHash,
      },
      create: {
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        grade: u.grade,
        passwordHash: defaultHash,
      },
    });
  }

  // 2. Remove legacy non-conforming test subjects if any
  const allowedSlugs = SEED_SUBJECTS.map((s) => s.slug);
  await prisma.subject.deleteMany({
    where: {
      slug: { notIn: allowedSlugs },
    },
  });

  // 3. Upsert Exact 7 Subjects
  for (const s of SEED_SUBJECTS) {
    await prisma.subject.upsert({
      where: { id: s.id },
      update: {
        slug: s.slug,
        name: s.name,
        icon: s.icon,
        colorTheme: s.colorTheme,
        isAvailable: s.isAvailable,
      },
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

  // 4. Seed Topics & Questions
  for (const t of SEED_TOPICS) {
    await prisma.topic.upsert({
      where: { id: t.id },
      update: {
        notesMarkdown: t.notesMarkdown,
        title: t.title,
        summary: t.summary,
        videoUrl: t.videoUrl,
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
        videoUrl: t.videoUrl,
      },
    });
  }

  for (const q of SEED_QUESTIONS) {
    await prisma.question.upsert({
      where: { id: q.id },
      update: {
        prompt: q.prompt,
        options: q.options,
        correctOptionIndex: q.correctOptionIndex,
        acceptableAnswers: q.acceptableAnswers,
        explanation: q.explanation,
      },
      create: {
        id: q.id,
        topicId: q.topicId,
        prompt: q.prompt,
        type: q.type,
        options: q.options,
        correctOptionIndex: q.correctOptionIndex,
        acceptableAnswers: q.acceptableAnswers,
        explanation: q.explanation,
        order: q.order,
      },
    });
  }

  // 5. Initial Streak for real student (Starts at 0)
  await prisma.streak.upsert({
    where: { userId: 'student-nisa' },
    update: {
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,
    },
    create: {
      userId: 'student-nisa',
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,
    },
  });

  // 6. Clean up dummy alex user if present
  try {
    await prisma.user.delete({ where: { id: 'student-alex' } });
  } catch {
    // Ignore if already deleted
  }

  const subjectsInDb = await prisma.subject.findMany({
    orderBy: { name: 'asc' },
  });

  console.log(`[${new Date().toISOString()}] Database successfully seeded! Total Subjects: ${subjectsInDb.length}`);
  console.log(JSON.stringify(subjectsInDb, null, 2));
}

seed()
  .catch((err) => {
    console.error('Seed error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
