import { prisma } from '../backend/lib/prisma';

async function main() {
  console.log('Running ALTER TABLE "Subject" ADD COLUMN IF NOT EXISTS "teachingProfile" TEXT...');
  await prisma.$executeRawUnsafe(`ALTER TABLE "Subject" ADD COLUMN IF NOT EXISTS "teachingProfile" TEXT;`);
  console.log('Migration successful: teachingProfile added to Subject table.');
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
