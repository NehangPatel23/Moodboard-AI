/**
 * Verifies collaboration migrations 006–013 and polish migrations 022–023.
 *
 * Usage:
 *   node --env-file=.env.local scripts/verify-collaboration-migrations.mjs
 */

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function fail(message) {
  console.error(`\n✗ ${message}`);
  process.exit(1);
}

function ok(message) {
  console.log(`✓ ${message}`);
}

function warn(message) {
  console.warn(`⚠ ${message}`);
}

if (!url || !serviceRoleKey) {
  fail('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
}

const admin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function tableAccessible(name) {
  const { error } = await admin.from(name).select('*', { count: 'exact', head: true });
  return !error;
}

async function columnAccessible(table, column) {
  const { error } = await admin.from(table).select(column, { head: true, count: 'exact' });
  return !error;
}

console.log('MoodBoard AI — collaboration migration check\n');

const requiredTables = [
  'board_comments',
  'board_activity',
  'board_collaboration_state',
  'board_collaboration_item_state',
];

const missingTables = [];
for (const table of requiredTables) {
  if (await tableAccessible(table)) {
    ok(`Table "${table}" exists`);
  } else {
    missingTables.push(table);
    console.error(`✗ Table "${table}" is missing or inaccessible`);
  }
}

if (missingTables.length > 0) {
  console.error('\nApply pending migrations in order (see docs/SUPABASE_SETUP.md steps 10–17):');
  console.error('  npx supabase link --project-ref <ref> && npx supabase db push');
  console.error('  — or paste supabase/migrations/006–013 into the Supabase SQL Editor.');
  process.exit(1);
}

const columnChecks = [
  ['boards', 'last_saved_by_name'],
  ['board_comments', 'author_name'],
  ['board_comments', 'section'],
  ['board_activity', 'changes'],
  ['board_collaboration_state', 'snapshots_last_read_at'],
  ['user_settings', 'comments_hide_after_days'],
  ['user_settings', 'activity_hide_after_days'],
];

const missingColumns = [];
for (const [table, column] of columnChecks) {
  if (await columnAccessible(table, column)) {
    ok(`Column "${table}.${column}" exists`);
  } else {
    missingColumns.push(`${table}.${column}`);
    console.error(`✗ Column "${table}.${column}" is missing`);
  }
}

if (missingColumns.length > 0) {
  console.error('\nSome migration columns are missing. Run migrations 007–011 in docs/SUPABASE_SETUP.md.');
  process.exit(1);
}

// Smoke-test activity insert + read (service role bypasses RLS)
const { data: usersData, error: usersError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 });

if (usersError || !usersData.users[0]) {
  warn(`Activity smoke test skipped (no auth users): ${usersError?.message ?? 'empty project'}`);
} else {
  const testUserId = usersData.users[0].id;
  const testBoardId = `migration-smoke-${Date.now()}`;
  const now = new Date().toISOString();

  const { error: boardError } = await admin.from('boards').insert({
    id: testBoardId,
    user_id: testUserId,
    title: 'Migration smoke test',
    created_at: now,
    updated_at: now,
  });

  if (boardError) {
    warn(`Activity smoke test skipped (could not seed test board): ${boardError.message}`);
  } else {
    const { data: activityRow, error: activityError } = await admin
      .from('board_activity')
      .insert({
        board_id: testBoardId,
        user_id: testUserId,
        actor_name: 'Migration Check',
        action: 'saved',
        summary: 'Smoke test save',
        changes: [{ section: 'references', action: 'updated', label: 'Test' }],
      })
      .select('id, changes')
      .single();

    if (activityError) {
      fail(`Activity insert failed: ${activityError.message}`);
    }

    ok(`Activity insert + changes JSON works (id: ${activityRow.id})`);

    await admin.from('board_activity').delete().eq('id', activityRow.id);
    await admin.from('boards').delete().eq('id', testBoardId);
    ok('Activity smoke test cleaned up');
  }
}

console.log('\nCollaboration migrations verified successfully.');
