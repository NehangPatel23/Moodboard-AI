# Deploy MoodBoard AI to Vercel

## Prerequisites

- Local smoke test passed (`npm run setup:supabase`, `npm run verify:generate`)
- GitHub repo connected to Vercel (or use Vercel CLI)
- Supabase project running

## Step 1 — Push to GitHub

```bash
git push origin main
```

## Step 2 — Create Vercel project

1. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
2. Framework preset: **Next.js** (auto-detected).
3. Build command: `npm run build` (default).
4. Output directory: `.next` (default).

## Step 3 — Environment variables

In Vercel → **Settings** → **Environment Variables**, add:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | From Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase `anon` public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase `service_role` secret key |
| `GEMINI_API_KEY` | Optional — enables free-tier Gemini AI (see [`docs/GEMINI_SETUP.md`](GEMINI_SETUP.md)) |
| `PEXELS_API_KEY` | Optional — search-relevant reference photos (see [`docs/PEXELS_SETUP.md`](PEXELS_SETUP.md)) |

Apply to **Production**, **Preview**, and **Development**.

## Step 4 — Configure Supabase for production

In Supabase → **Authentication** → **URL Configuration**:

1. Set **Site URL** to your Vercel domain (e.g. `https://moodboard-ai.vercel.app`).
2. Add redirect URLs:
   - `https://your-domain.vercel.app/**`
   - `https://your-domain.vercel.app/sign-in`

## Step 5 — Deploy

Trigger a deploy from the Vercel dashboard or:

```bash
npx vercel --prod
```

## Step 5b — Run collaboration migrations (production Supabase)

After deploying collaboration features, run these in the **production** Supabase SQL Editor (in order):

1. [`supabase/migrations/006_board_realtime_comments.sql`](../supabase/migrations/006_board_realtime_comments.sql) — Realtime on `boards`, `board_comments` table, live comment sync
2. [`supabase/migrations/007_collaboration_polish.sql`](../supabase/migrations/007_collaboration_polish.sql) — `last_saved_by_name` on boards, `author_name` on comments (conflict banner + live comment attribution)
3. [`supabase/migrations/008_board_activity.sql`](../supabase/migrations/008_board_activity.sql) — `board_activity` table + Realtime for the Activity panel (live save history)
4. [`supabase/migrations/009_board_activity_changes.sql`](../supabase/migrations/009_board_activity_changes.sql) — structured `changes` JSON on activity rows (detailed summaries + replay)
5. [`supabase/migrations/010_collaboration_hygiene.sql`](../supabase/migrations/010_collaboration_hygiene.sql) — read/unread state + activity delete policy
6. [`supabase/migrations/011_user_settings_retention.sql`](../supabase/migrations/011_user_settings_retention.sql) — collaboration retention settings (hide + owner purge)
7. [`supabase/migrations/012_collaboration_item_state.sql`](../supabase/migrations/012_collaboration_item_state.sql) — per-item read/hide overrides + owner-only comment delete
8. [`supabase/migrations/013_activity_owner_delete.sql`](../supabase/migrations/013_activity_owner_delete.sql) — owner-only activity delete (non-owners use Hide)

If collaboration was already live, confirm migrations `004` and `005` are applied before `006`.

> `alter publication supabase_realtime add table` is not idempotent. If `006` was partially applied, check **Database → Publications → supabase_realtime** before re-running.

## Step 6 — Smoke test production

| Test | Expected |
|------|----------|
| Visit `/` | Landing page loads |
| Visit `/app` logged out | Redirect to `/sign-in` |
| Sign in | Dashboard loads |
| Create board from `/app/new` | Progressive preview visible during generation; board persists after refresh |
| Create board from `/templates` | Inline preview on active card; ~4s pause then redirect to editor |
| TopBar theme toggle | Sun/moon control next to search; theme persists across navigation |
| Settings change | Persists after sign-out/in |
| Open board → **Comments** | Panel opens; post succeeds |
| Open board → **Activity** | Panel opens; save events appear in real time |
| Board sidebar | Shows **Last saved by** after a save (requires migration 007) |
| Two browsers on same board (owner + invited editor) | Presence avatars appear for both |
| Save in browser A (B has no unsaved edits) | Browser B updates without refresh |
| Save in browser A while B has unsaved edits | B shows conflict banner with saver name (Reload / Keep editing) |
| Viewer opens shared board | Inputs read-only; comments still work |
| User A posts comment | User B sees A's name via realtime (not "Collaborator") |
| Comments / Activity unread badges | New items show unread styling; Eye/EyeOff toggles per item; opening panel marks all read |
| Per-item hide / Hidden filter | Hide removes item from your view only; restore from Hidden filter |
| Owner comment/activity delete | Trash visible only for owners; non-owners use Hide; app confirmation modal |
| Settings → Collaboration | Hide/purge retention controls persist |
| `POST /api/boards/[id]/comments` without auth | 401 Unauthorized |

## Troubleshooting

**401 on API routes** — Env vars missing or not redeployed after adding them.

**Auth redirect loop** — Supabase Site URL / Redirect URLs don't match your Vercel domain.

**Demo generation only** — `GEMINI_API_KEY` not set in Vercel (mock fallback is intentional).
