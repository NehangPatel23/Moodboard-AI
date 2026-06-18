/**
 * Verifies Supabase env vars, database tables, and optionally seeds the demo user.
 *
 * Usage:
 *   node --env-file=.env.local scripts/verify-supabase-setup.mjs
 *   node --env-file=.env.local scripts/verify-supabase-setup.mjs --seed
 */

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const shouldSeed = process.argv.includes('--seed');

const REQUIRED_TABLES = ['profiles', 'boards', 'user_settings'];

function fail(message) {
  console.error(`\n✗ ${message}`);
  process.exit(1);
}

function ok(message) {
  console.log(`✓ ${message}`);
}

if (!url || !url.startsWith('https://')) {
  fail('NEXT_PUBLIC_SUPABASE_URL is missing or invalid in .env.local');
}

if (!anonKey || anonKey.length < 20) {
  fail('NEXT_PUBLIC_SUPABASE_ANON_KEY is missing in .env.local');
}

if (!serviceRoleKey || serviceRoleKey.length < 20) {
  fail('SUPABASE_SERVICE_ROLE_KEY is missing in .env.local');
}

ok('Environment variables present');

const admin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

for (const table of REQUIRED_TABLES) {
  const { error } = await admin.from(table).select('*', { count: 'exact', head: true });

  if (error) {
    console.error(`\n✗ Table "${table}" is not accessible: ${error.message}`);
    console.error('\nRun the migration first:');
    console.error('  • Paste supabase/migrations/001_initial.sql into Supabase SQL Editor, or');
    console.error('  • npx supabase link --project-ref <ref> && npx supabase db push');
    console.error('\nSee docs/SUPABASE_SETUP.md for full instructions.');
    process.exit(1);
  }

  ok(`Table "${table}" exists`);
}

const { error: authError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 });
if (authError) {
  fail(`Supabase Auth API unreachable: ${authError.message}`);
}

ok('Supabase Auth API reachable');

const { error: avatarColumnError } = await admin
  .from('user_settings')
  .select('avatar_image_url')
  .limit(1);

if (avatarColumnError) {
  console.error(`\n✗ user_settings.avatar_image_url is missing: ${avatarColumnError.message}`);
  console.error('\nRun supabase/migrations/024_avatar_image.sql in the Supabase SQL Editor.');
  process.exit(1);
}

ok('user_settings.avatar_image_url column exists');

const { data: buckets, error: bucketsError } = await admin.storage.listBuckets();

if (bucketsError) {
  fail(`Storage API unreachable: ${bucketsError.message}`);
}

const avatarBucket = buckets?.find((bucket) => bucket.id === 'avatar-uploads');
if (!avatarBucket) {
  console.error('\n✗ Storage bucket "avatar-uploads" is missing.');
  console.error('\nRun supabase/migrations/024_avatar_image.sql in the Supabase SQL Editor.');
  process.exit(1);
}

ok('Storage bucket "avatar-uploads" exists');

if (shouldSeed) {
  const { execSync } = await import('node:child_process');
  const { dirname, join } = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  execSync('node --env-file=.env.local scripts/seed-demo-user.mjs', {
    stdio: 'inherit',
    cwd: root,
  });
  execSync('node --env-file=.env.local scripts/seed-demo-boards.mjs', {
    stdio: 'inherit',
    cwd: root,
  });
}

console.log('\nSupabase setup verified successfully.');
