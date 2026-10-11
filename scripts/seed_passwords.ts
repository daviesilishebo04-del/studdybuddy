import { prisma } from '../backend/lib/prisma';
import bcrypt from 'bcryptjs';

async function updatePasswords() {
  console.log('Generating bcrypt hashes for default users...');
  const nisaHash = await bcrypt.hash('nisa123', 10);
  const mentorHash = await bcrypt.hash('mentor123', 10);
  const alexHash = await bcrypt.hash('alex123', 10);

  console.log('Updating password hashes in Supabase Cloud DB...');

  await prisma.user.updateMany({
    where: { id: 'student-nisa' },
    data: { passwordHash: nisaHash },
  });
  console.log('[OK] Updated student-nisa password to nisa123');

  await prisma.user.updateMany({
    where: { id: 'guardian-davie' },
    data: { passwordHash: mentorHash },
  });
  console.log('[OK] Updated guardian-davie password to mentor123');

  await prisma.user.updateMany({
    where: { id: 'student-alex' },
    data: { passwordHash: alexHash },
  });
  console.log('[OK] Updated student-alex password to alex123');

  const users = await prisma.user.findMany({
    select: { id: true, name: true, role: true, passwordHash: true },
  });

  console.log('\nVerified Users in Supabase:');
  for (const u of users) {
    console.log(`- ${u.name} (${u.role}) -> Has Password: ${Boolean(u.passwordHash)}`);
  }
}

updatePasswords()
  .catch((e) => {
    console.error('Failed to update passwords:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
