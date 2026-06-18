/**
 * Seeds curated shared demo boards for the demo account (Discover / profile showcase).
 *
 * Usage:
 *   node --env-file=.env.local scripts/seed-demo-boards.mjs
 *
 * Requires demo user from: npm run db:seed-demo
 */

import { createClient } from '@supabase/supabase-js';
import { DEMO_BOARD_TEMPLATES } from './demo-board-templates.mjs';

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
const DEMO_TITLE_PREFIX = '[Demo] ';
const HOUR_MS = 60 * 60 * 1000;

function demoBoardId(templateId) {
  return `demo-${templateId}`;
}

function mapTemplateToRow(template, userId, index) {
  const updatedAt = new Date(Date.now() - index * HOUR_MS).toISOString();
  const createdAt = new Date(Date.now() - (index + 24) * HOUR_MS).toISOString();

  return {
    id: demoBoardId(template.id),
    user_id: userId,
    title: `${DEMO_TITLE_PREFIX}${template.name}`,
    prompt: template.prompt,
    summary: template.summary,
    mood: template.mood,
    tone: template.tone,
    tags: template.tags,
    palette: template.palette.map((item, itemIndex) => ({
      id: `${template.id}-palette-${itemIndex}`,
      ...item,
    })),
    typography: template.typography.map((item, itemIndex) => ({
      id: `${template.id}-type-${itemIndex}`,
      ...item,
    })),
    references: template.references.map((item, itemIndex) => ({
      id: `${template.id}-ref-${itemIndex}`,
      ...item,
    })),
    notes: template.notes.map((item, itemIndex) => ({
      id: `${template.id}-note-${itemIndex}`,
      ...item,
    })),
    is_favorite: false,
    visibility: 'shared',
    created_at: createdAt,
    updated_at: updatedAt,
    last_saved_by_name: 'Demo Admin',
  };
}

const { data: userList, error: listError } = await supabase.auth.admin.listUsers();
if (listError) {
  console.error('Failed to list users:', listError.message);
  process.exit(1);
}

const demoUser = userList?.users?.find((user) => user.email === DEMO_EMAIL);
if (!demoUser) {
  console.error(`Demo user not found (${DEMO_EMAIL}). Run: npm run db:seed-demo`);
  process.exit(1);
}

const { error: settingsError } = await supabase.from('user_settings').upsert(
  {
    user_id: demoUser.id,
    workspace_tagline: 'Curated creative direction for the community',
    updated_at: new Date().toISOString(),
  },
  { onConflict: 'user_id' },
);

if (settingsError) {
  console.error('Failed to update demo workspace settings:', settingsError.message);
  process.exit(1);
}

console.log('Updated demo workspace profile settings.');

const demoIds = DEMO_BOARD_TEMPLATES.map((template) => demoBoardId(template.id));
const { data: existingRows, error: existingError } = await supabase
  .from('boards')
  .select('id')
  .in('id', demoIds);

if (existingError) {
  console.error('Failed to check existing demo boards:', existingError.message);
  process.exit(1);
}

const existingIds = new Set((existingRows ?? []).map((row) => row.id));
let created = 0;
let skipped = 0;

for (const [index, template] of DEMO_BOARD_TEMPLATES.entries()) {
  const boardId = demoBoardId(template.id);
  if (existingIds.has(boardId)) {
    skipped += 1;
    continue;
  }

  const row = mapTemplateToRow(template, demoUser.id, index);
  const { error: insertError } = await supabase.from('boards').insert(row);

  if (insertError) {
    console.error(`Failed to insert ${boardId}:`, insertError.message);
    process.exit(1);
  }

  created += 1;
  console.log(`Created shared board: ${row.title} (${boardId})`);
}

console.log(`\nDemo boards seed complete — ${created} created, ${skipped} already existed.`);
console.log(`Demo user id: ${demoUser.id}`);
console.log('Featured row uses newest boards when FEATURED_BOARD_IDS is empty.');
