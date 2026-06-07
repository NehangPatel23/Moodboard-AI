/**
 * End-to-end local Supabase setup helper.
 * Verifies .env.local, checks tables, seeds demo user, prints remaining manual steps.
 *
 * Usage:
 *   node scripts/setup-supabase.mjs
 */

import { existsSync, copyFileSync, readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = join(root, '.env.local');
const envExamplePath = join(root, '.env.local.example');

function hasValue(key) {
  const match = readFileSync(envPath, 'utf8').match(new RegExp(`^${key}=(.+)$`, 'm'));
  return match && match[1].trim().length > 0;
}

console.log('MoodBoard AI — Supabase setup\n');

if (!existsSync(envPath)) {
  if (existsSync(envExamplePath)) {
    copyFileSync(envExamplePath, envPath);
    console.log('Created .env.local from .env.local.example');
  } else {
    console.error('Missing .env.local.example');
    process.exit(1);
  }
}

const missing = [];
if (!hasValue('NEXT_PUBLIC_SUPABASE_URL')) missing.push('NEXT_PUBLIC_SUPABASE_URL');
if (!hasValue('NEXT_PUBLIC_SUPABASE_ANON_KEY')) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
if (!hasValue('SUPABASE_SERVICE_ROLE_KEY')) missing.push('SUPABASE_SERVICE_ROLE_KEY');

if (missing.length > 0) {
  console.log('\n.env.local exists but these values are still empty:\n');
  missing.forEach((key) => console.log(`  • ${key}`));
  console.log('\nComplete these steps first:\n');
  console.log('  1. Create a project at https://supabase.com');
  console.log('  2. Run supabase/migrations/001_initial.sql in SQL Editor');
  console.log('  3. Project Settings → API → copy URL, anon key, service_role key into .env.local');
  console.log('\nFull guide: docs/SUPABASE_SETUP.md\n');
  process.exit(1);
}

try {
  execSync('node --env-file=.env.local scripts/verify-supabase-setup.mjs --seed', {
    cwd: root,
    stdio: 'inherit',
  });
} catch {
  process.exit(1);
}

console.log('\n--- Manual dashboard steps (if not done yet) ---\n');
console.log('  • Authentication → Providers → Email → disable "Confirm email"');
console.log('  • Authentication → URL Configuration → Site URL: http://localhost:3000');
console.log('\nThen run: npm run dev');
console.log('Demo login: admin@moodboard.ai / moodboard123\n');
