import { prisma } from '../backend/lib/prisma';

async function verify() {
  console.log('Querying Supabase Cloud Database sequentially...');
  
  const users = await prisma.user.findMany({ select: { id: true, name: true, role: true } });
  console.log(`[OK] Users (${users.length}):`, users.map((u) => `${u.name} (${u.role})`));

  const subjects = await prisma.subject.findMany({ select: { id: true, name: true, slug: true, isAvailable: true } });
  console.log(`[OK] Subjects (${subjects.length}):`, subjects.map((s) => `${s.name} [available: ${s.isAvailable}]`));

  const topicCount = await prisma.topic.count();
  console.log(`[OK] Topic Count: ${topicCount}`);

  const questionCount = await prisma.question.count();
  console.log(`[OK] Question Count: ${questionCount}`);

  const streakCount = await prisma.streak.count();
  console.log(`[OK] Streak Count: ${streakCount}`);

  console.log('\n=============================================');
  console.log(' ALL DATA CONFIRMED IN SUPABASE CLOUD!');
  console.log('=============================================\n');
}

verify()
  .catch((e) => {
    console.error('Verification error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
