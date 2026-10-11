import { execSync } from 'child_process';

const envVars = [
  {
    name: 'DATABASE_URL',
    value: 'postgresql://postgres.plwflwvzhweabzlbijgo:Hmnidsbig0399@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
  },
  {
    name: 'DIRECT_URL',
    value: 'postgresql://postgres.plwflwvzhweabzlbijgo:Hmnidsbig0399@aws-0-eu-west-1.pooler.supabase.com:5432/postgres',
  },
  {
    name: 'SESSION_SECRET',
    value: 'e9a8f27c4b1d6e3f8a0b5c2d4e6f8a0b1c3d5e7f9a1b3c5d7e9f1a3b5c7d9e1f',
  },
];

const environments = ['production', 'preview', 'development'];

for (const env of environments) {
  for (const { name, value } of envVars) {
    console.log(`Setting ${name} for ${env}...`);
    try {
      execSync(`npx vercel env add ${name} ${env} --force`, {
        input: value,
        encoding: 'utf-8',
        stdio: ['pipe', 'inherit', 'inherit'],
      });
      console.log(`[OK] Added ${name} to ${env}`);
    } catch (e) {
      console.warn(`[WARN] Failed or already set for ${name} (${env})`);
    }
  }
}

console.log('Finished setting Vercel environment variables!');
