import { prisma } from '../backend/lib/prisma';

async function main() {
  console.log('Resetting pupil testing data...');

  // 1. Delete all quiz attempts (cascades to QuizQuestionAnswer)
  const attempts = await prisma.quizAttempt.deleteMany({});
  console.log(`Cleared ${attempts.count} quiz attempts.`);

  // 2. Delete all test study sessions
  const sessions = await prisma.studySession.deleteMany({});
  console.log(`Cleared ${sessions.count} study sessions.`);

  // 3. Delete all curriculum submissions (class pages uploaded during testing)
  const submissions = await prisma.curriculumSubmission.deleteMany({});
  console.log(`Cleared ${submissions.count} curriculum submissions.`);

  // 4. Delete timetable slots
  const slots = await prisma.timetableSlot.deleteMany({});
  console.log(`Cleared ${slots.count} timetable slots.`);

  // 5. Reset Nisa Mubuwa Mboloma onboarding status so he gets the welcome guided onboarding
  await prisma.user.updateMany({
    where: {
      OR: [
        { id: 'student-nisa' },
        { name: { contains: 'Nisa', mode: 'insensitive' } },
      ],
    },
    data: {
      onboardingCompletedAt: null,
    },
  });
  console.log('Reset Nisa onboarding status (ready for fresh onboarding modal).');

  // 6. Reset streak to day 1 fresh
  await prisma.streak.upsert({
    where: { userId: 'student-nisa' },
    update: {
      currentStreak: 1,
      longestStreak: 1,
      lastActiveDate: null,
    },
    create: {
      userId: 'student-nisa',
      currentStreak: 1,
      longestStreak: 1,
    },
  });
  console.log('Reset Nisa streak to fresh start (Day 1).');

  console.log('SUCCESS: All pupil test data successfully cleared!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
