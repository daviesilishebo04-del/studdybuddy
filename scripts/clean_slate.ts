import { prisma } from '../backend/lib/prisma';
import bcrypt from 'bcryptjs';

async function resetToCleanSlate() {
  console.log('Connecting to database for clean slate reset...');

  // 1. Delete dummy student-alex if exists
  try {
    const deletedAlex = await prisma.user.deleteMany({
      where: { id: 'student-alex' },
    });
    console.log(`[OK] Deleted dummy student-alex: ${deletedAlex.count} record(s) removed.`);
  } catch (e) {
    console.warn('[WARN] Could not delete student-alex:', e);
  }

  // 2. Wipe test activity records (quiz attempts, sessions, curriculum uploads)
  const deletedAttempts = await prisma.quizAttempt.deleteMany({});
  console.log(`[OK] Cleared quiz attempts: ${deletedAttempts.count} removed.`);

  const deletedSessions = await prisma.studySession.deleteMany({});
  console.log(`[OK] Cleared study sessions: ${deletedSessions.count} removed.`);

  const deletedSubmissions = await prisma.curriculumSubmission.deleteMany({});
  console.log(`[OK] Cleared curriculum submissions: ${deletedSubmissions.count} removed.`);

  // 3. Reset student-nisa to clean 0-state with pristine onboarding
  const nisaHash = await bcrypt.hash('nisa123', 10);
  const mentorHash = await bcrypt.hash('Hmnidsbig0399', 10);

  await prisma.user.upsert({
    where: { id: 'student-nisa' },
    update: {
      name: 'Nisa Mubuwa Mboloma',
      grade: 'Grade 8 / Form One',
      onboardingCompletedAt: null, // Fresh onboarding
      passwordHash: nisaHash,
    },
    create: {
      id: 'student-nisa',
      email: 'nisa@studybuddy.local',
      name: 'Nisa Mubuwa Mboloma',
      role: 'STUDENT',
      grade: 'Grade 8 / Form One',
      onboardingCompletedAt: null,
      passwordHash: nisaHash,
    },
  });
  console.log('[OK] Reset student-nisa to clean state (onboardingCompletedAt: null, password: nisa123)');

  // 4. Reset streak to 0
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
  console.log('[OK] Reset student-nisa streak to 0 days.');

  // 5. Ensure mentor account exists with mentor password
  await prisma.user.upsert({
    where: { id: 'guardian-davie' },
    update: {
      name: 'Mentor Davie',
      passwordHash: mentorHash,
    },
    create: {
      id: 'guardian-davie',
      email: 'guardian@studybuddy.local',
      name: 'Mentor Davie',
      role: 'GUARDIAN',
      passwordHash: mentorHash,
    },
  });
  console.log('[OK] Updated Mentor Davie password.');

  // 6. Verify state
  const users = await prisma.user.findMany({
    select: { id: true, name: true, role: true, onboardingCompletedAt: true },
  });
  const streaks = await prisma.streak.findMany();

  console.log('\n=============================================');
  console.log(' CLEAN SLATE STATE VERIFIED');
  console.log('=============================================');
  console.log('Active Users:', users);
  console.log('Active Streaks:', streaks);
  console.log('=============================================\n');
}

resetToCleanSlate()
  .catch((e) => {
    console.error('Clean slate error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
