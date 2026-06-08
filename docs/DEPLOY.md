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

## Step 5b — Run collaboration migration (production Supabase)

After deploying code that includes real-time co-editing and comments, run [`supabase/migrations/006_board_realtime_comments.sql`](../supabase/migrations/006_board_realtime_comments.sql) in the **production** Supabase SQL Editor.

This enables Realtime on `boards`, creates `board_comments`, and enables live comment sync. If collaboration was already live, also confirm migrations `004` and `005` are applied.

> `alter publication supabase_realtime add table` is not idempotent. If `006` was partially applied, check **Database → Publications → supabase_realtime** before re-running.

## Step 6 — Smoke test production

| Test | Expected |
|------|----------|
| Visit `/` | Landing page loads |
| Visit `/app` logged out | Redirect to `/sign-in` |
| Sign in | Dashboard loads |
| Create board from prompt | Board persists after refresh |
| Settings change | Persists after sign-out/in |
| Open board → **Comments** | Panel opens; post succeeds |
| Two browsers on same board (owner + invited editor) | Presence avatars appear for both |
| Save in browser A (B has no unsaved edits) | Browser B updates without refresh |
| Save in browser A while B has unsaved edits | B shows conflict banner (Reload / Keep editing) |
| `POST /api/boards/[id]/comments` without auth | 401 Unauthorized |

## Troubleshooting

**401 on API routes** — Env vars missing or not redeployed after adding them.

**Auth redirect loop** — Supabase Site URL / Redirect URLs don't match your Vercel domain.

**Demo generation only** — `GEMINI_API_KEY` not set in Vercel (mock fallback is intentional).
