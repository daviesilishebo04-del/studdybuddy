import { prisma } from '../backend/lib/prisma';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

async function executeWithRetry(stmt: string, maxRetries = 4): Promise<'OK' | 'EXISTS'> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await prisma.$executeRawUnsafe(stmt);
      return 'OK';
    } catch (err: unknown) {
      const msg = ((err as Error)?.message || String(err)).toLowerCase();
      if (
        msg.includes('already exists') ||
        msg.includes('42p07') || // table exists
        msg.includes('42710') || // type exists
        msg.includes('42701') || // column exists
        msg.includes('42p16')    // index exists
      ) {
        return 'EXISTS';
      }

      if (
        (msg.includes('p1001') ||
          msg.includes("can't reach database") ||
          msg.includes('connection closed') ||
          msg.includes('timeout')) &&
        attempt < maxRetries
      ) {
        console.warn(`[RETRY] Network drop on attempt ${attempt}/${maxRetries}. Reconnecting in ${attempt * 2}s...`);
        await new Promise((res) => setTimeout(res, attempt * 2000));
        continue;
      }

      throw err;
    }
  }
  throw new Error('Exhausted retries');
}

async function deploy() {
  console.log(`[${new Date().toISOString()}] Connecting to Supabase PostgreSQL...`);

  const rawSql = fs.readFileSync(path.join(process.cwd(), 'full_schema.sql'), 'utf-8');

  // Strip comments then split into discrete statements
  const cleanedSql = rawSql.replace(/--.*$/gm, '');
  const statements = cleanedSql
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);

  console.log(`[${new Date().toISOString()}] Executing ${statements.length} schema DDL statements sequentially...`);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const preview = stmt.replace(/\s+/g, ' ').substring(0, 50);
    const result = await executeWithRetry(stmt);
    if (result === 'OK') {
      console.log(`[${i + 1}/${statements.length}] OK: ${preview}`);
    } else {
      console.log(`[${i + 1}/${statements.length}] SKIPPED (already exists): ${preview}`);
    }
  }

  console.log(`\n[${new Date().toISOString()}] Schema DDL applied successfully!`);

  console.log(`[${new Date().toISOString()}] Running seed script to populate users, curriculum, topics & questions...`);
  execSync('npx tsx backend/seed/seedRunner.ts', { stdio: 'inherit', env: process.env });

  console.log(`\n[${new Date().toISOString()}] Verifying Supabase database state...`);
  const [userCount, subjectCount, topicCount, questionCount, streakCount] = await Promise.all([
    prisma.user.count(),
    prisma.subject.count(),
    prisma.topic.count(),
    prisma.question.count(),
    prisma.streak.count(),
  ]);

  console.log(`\n========================================`);
  console.log(` SUPABASE CLOUD DEPLOYMENT COMPLETE!`);
  console.log(`========================================`);
  console.log(` Users in Cloud DB:     ${userCount}`);
  console.log(` Subjects in Cloud DB:  ${subjectCount}`);
  console.log(` Topics in Cloud DB:    ${topicCount}`);
  console.log(` Questions in Cloud DB: ${questionCount}`);
  console.log(` Streaks in Cloud DB:   ${streakCount}`);
  console.log(`========================================\n`);
}

deploy()
  .catch((e) => {
    console.error('Deployment error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
