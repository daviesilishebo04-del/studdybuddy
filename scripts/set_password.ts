import { prisma } from '../backend/lib/prisma';
import bcrypt from 'bcryptjs';
import readline from 'readline';

/**
 * CLI utility to securely set a user password in the database without committing it to git.
 * Usage: npx tsx scripts/set_password.ts <username-or-userId>
 */
async function main() {
  const target = process.argv[2];

  if (!target) {
    console.error('Usage: npx tsx scripts/set_password.ts <username-or-id>');
    console.error('Example: npx tsx scripts/set_password.ts Davie');
    process.exit(1);
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { id: target },
        { name: { equals: target, mode: 'insensitive' } },
      ],
    },
  });

  if (!user) {
    console.error(`User "${target}" not found in database.`);
    process.exit(1);
  }

  console.log(`Found user: ${user.name} (${user.id}, Role: ${user.role})`);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('Enter new password: ', async (newPassword) => {
    rl.close();
    const trimmed = newPassword.trim();
    if (trimmed.length < 6) {
      console.error('Password must be at least 6 characters long.');
      process.exit(1);
    }

    const saltRounds = 10;
    const hash = await bcrypt.hash(trimmed, saltRounds);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hash },
    });

    console.log(`[SUCCESS] Password updated securely for ${user.name}.`);
    process.exit(0);
  });
}

main().catch((err) => {
  console.error('Error running set_password script:', err);
  process.exit(1);
});
