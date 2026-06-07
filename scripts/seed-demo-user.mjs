/**
 * Creates the demo account (admin@moodboard.ai / moodboard123) in Supabase Auth.
 *
 * Usage:
 *   node --env-file=.env.local scripts/seed-demo-user.mjs
 */

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO_EMAIL = 'admin@moodboard.ai';
const DEMO_PASSWORD = 'moodboard123';
const DEMO_NAME = 'Demo Admin';

const { data: existing } = await supabase.auth.admin.listUsers();
const alreadyExists = existing?.users?.some((user) => user.email === DEMO_EMAIL);

if (alreadyExists) {
  console.log(`Demo user already exists: ${DEMO_EMAIL}`);
  process.exit(0);
}

const { data, error } = await supabase.auth.admin.createUser({
  email: DEMO_EMAIL,
  password: DEMO_PASSWORD,
  email_confirm: true,
  user_metadata: { name: DEMO_NAME },
});

if (error) {
  console.error('Failed to create demo user:', error.message);
  process.exit(1);
}

console.log(`Created demo user: ${DEMO_EMAIL} (id: ${data.user.id})`);
