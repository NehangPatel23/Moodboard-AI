# Supabase Backend Setup

The app code is ready. You only need to create a Supabase project once and connect it with environment variables.

## Quick Checklist

- [ ] **Step 1** — Create Supabase project at [supabase.com](https://supabase.com)
- [ ] **Step 2** — Run the SQL migration (dashboard or CLI)
- [ ] **Step 3** — Copy API keys into `.env.local`
- [ ] **Step 4** — Configure auth (email provider, redirect URLs including `/auth/callback`, password reset)
- [ ] **Step 5** — Run `npm run setup:supabase` (seeds demo user + verifies)
- [ ] **Step 6** — Run `npm run dev` and sign in with the demo account

---

## Step 1 — Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up or log in.
2. Click **New project**.
3. Fill in:
   - **Organization** — create one if prompted
   - **Project name** — e.g. `moodboard-ai`
   - **Database password** — choose a strong password and save it somewhere safe
   - **Region** — closest to you
4. Click **Create new project** and wait 1–2 minutes.

---

## Step 2 — Run the Database Migration

Creates `profiles`, `boards`, and `user_settings` tables with Row Level Security.

### Option A — SQL Editor (Recommended if New to Supabase)

1. In the dashboard, open **SQL Editor** → **New query**.
2. Copy the entire contents of [`supabase/migrations/001_initial.sql`](../supabase/migrations/001_initial.sql).
3. Paste into the editor and click **Run**.
4. Confirm success (no errors).
5. Open **Table Editor** — you should see `profiles`, `boards`, `user_settings`.

6. Run the sharing migration: copy [`supabase/migrations/002_shared_board_public_read.sql`](../supabase/migrations/002_shared_board_public_read.sql) into a new SQL Editor query and click **Run**. This enables public view-only links for boards set to **Shared**.

7. Run the collaboration migration: copy [`supabase/migrations/003_board_collaboration.sql`](../supabase/migrations/003_board_collaboration.sql) into the SQL Editor and click **Run**. This adds `board_members`, `board_invites`, and team access policies.

8. If boards fail to load after step 7 with an "infinite recursion" error, run [`supabase/migrations/004_fix_collaboration_rls.sql`](../supabase/migrations/004_fix_collaboration_rls.sql) (or re-run the updated `003` on a fresh project — it includes the fix).

9. Run [`supabase/migrations/005_backfill_profiles.sql`](../supabase/migrations/005_backfill_profiles.sql) to backfill missing `profiles` rows for existing auth users and enable email-based invite lookups. If invites show **Unauthorized** or stay **Pending** for users who already have accounts, run this migration.

10. Run [`supabase/migrations/006_board_realtime_comments.sql`](../supabase/migrations/006_board_realtime_comments.sql) to enable Realtime on `boards`, add `board_comments`, and enable live comment sync.

11. Run [`supabase/migrations/007_collaboration_polish.sql`](../supabase/migrations/007_collaboration_polish.sql) to add `last_saved_by_name` on boards and `author_name` on comments (required for conflict-banner attribution and live comment author names). **If board saves fail with a column error, run this migration.**

12. Run [`supabase/migrations/008_board_activity.sql`](../supabase/migrations/008_board_activity.sql) to add the `board_activity` log and Realtime feed for the **Activity** panel in the board editor.

13. Run [`supabase/migrations/009_board_activity_changes.sql`](../supabase/migrations/009_board_activity_changes.sql) to store structured change details and enable the activity replay UI.

14. Run [`supabase/migrations/010_collaboration_hygiene.sql`](../supabase/migrations/010_collaboration_hygiene.sql) to add per-user read state for comments/activity and allow activity deletion.

15. Run [`supabase/migrations/011_user_settings_retention.sql`](../supabase/migrations/011_user_settings_retention.sql) to add collaboration retention preferences (hide old items from your view, optional owner purge).

16. Run [`supabase/migrations/012_collaboration_item_state.sql`](../supabase/migrations/012_collaboration_item_state.sql) to add per-item read/hide overrides and restrict comment deletion to board owners.

17. Run [`supabase/migrations/013_activity_owner_delete.sql`](../supabase/migrations/013_activity_owner_delete.sql) to restrict activity deletion to board owners only (non-owners can hide items from their own view).

18. Run [`supabase/migrations/014_reference_uploads_storage.sql`](../supabase/migrations/014_reference_uploads_storage.sql) to enable the `reference-uploads` storage bucket for board reference images.

19. Run remaining migrations through [`supabase/migrations/032_board_view_counts.sql`](../supabase/migrations/032_board_view_counts.sql) for the latest features (profile photos `024`, auto-save `025`, notification prefs `026`, community templates `027`, field sync `028`, invite acceptance `029`–`031`, view counts `032`). **If profile photo upload fails**, run migration `024` — it adds `user_settings.avatar_image_url` and the `avatar-uploads` storage bucket.

### Option B — Supabase CLI

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

`YOUR_PROJECT_REF` is the subdomain in your project URL: `https://YOUR_PROJECT_REF.supabase.co`.

---

## Step 3 — Add Environment Variables

1. In Supabase: **Project Settings** (gear) → **API**.
2. Copy:

| Dashboard label | `.env.local` variable |
|-----------------|------------------------|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| `anon` `public` key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `service_role` `secret` key | `SUPABASE_SERVICE_ROLE_KEY` |

3. In the project root:

```bash
cp .env.local.example .env.local
```

4. Paste your three values into `.env.local`. Example:

```
NEXT_PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
```

Never commit `.env.local` or expose the `service_role` key in client code.

---

## Step 4 — Configure Auth for Local Development

### Email Sign-In

1. **Authentication** → **Providers** → **Email**.
2. Turn **off** “Confirm email” / “Enable email confirmations” for local dev (optional for production).
3. Save.

### URL Configuration (Required for Password Reset)

1. **Authentication** → **URL Configuration**.
2. Set **Site URL** to `http://localhost:3000` (production: your Vercel URL, e.g. `https://moodboard-ai-omega.vercel.app`).
3. Add these **Redirect URLs** (dev and production):

   | URL | Purpose |
   |-----|---------|
   | `http://localhost:3000/auth/callback` | Password-reset callback (local) |
   | `http://localhost:3000/**` | Wildcard for local deep links |
   | `https://your-app.vercel.app/auth/callback` | Password-reset callback (prod) |
   | `https://your-app.vercel.app/**` | Wildcard for prod deep links |

The app handles auth at [`/auth/callback`](../src/app/auth/callback/route.ts):

- PKCE **`code`** → session exchange → redirect to `/app` (or `next`)
- **`token_hash`** + **`type=recovery`** → verify OTP → `/sign-in?mode=update-password`
- **`token_hash`** + **`type=email`** → verify OTP → redirect to `/app` (or `next`)

Reset links must use the same browser when Supabase sends a PKCE `code`; `token_hash` links work across browsers when the email template includes them.

### Password Reset Emails

1. **Authentication** → **Email Templates** → confirm **Reset password** template exists.
2. Default Supabase mail works for testing (rate-limited). For production deliverability, configure **Custom SMTP** under Project Settings → Auth.
3. After sending a reset link, users land on `/sign-in?mode=update-password` to choose a new password.

---

## Step 5 — Verify and Seed

```bash
npm run setup:supabase
```

This checks your env vars, confirms tables exist, and creates the demo user:

- Email: `admin@moodboard.ai`
- Password: `moodboard123`

---

## Step 6 — Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000):

| Test | Expected |
|------|----------|
| Visit `/app` logged out | Redirect to sign-in |
| Demo sign-in | Dashboard loads (demo account may have existing boards) |
| Forgot password | Reset email sent; `/auth/callback` → update-password screen |
| Sign up (new account) | Empty workspace with "Create a board" prompt |
| Refresh | Boards persist |
| Settings change | Persists after sign-out/in |

---

## Troubleshooting

**Protected routes not redirecting** — Session refresh runs in `src/proxy.ts` (Next.js 16 proxy convention). Restart `npm run dev` after env changes.

**Failed to load boards / 401** — Wrong or missing `.env.local`; restart `npm run dev` after editing env.

**Demo sign-in fails** — Run `npm run db:seed-demo` or `npm run setup:supabase`.

**Sign-up asks for email confirmation** — Disable confirm email (Step 4).

**Password reset fails or link expired** — Confirm Site URL and `http://localhost:3000/auth/callback` (or production `/auth/callback`) are in Supabase redirect URLs. Use a fresh reset email. If the link was opened in a different browser than the one that requested reset, try again in the same browser or ensure the email template uses `token_hash` recovery links (handled by the callback). See [DEPLOY](DEPLOY.md) troubleshooting.

**SQL “relation already exists”** — Migration already ran; skip unless resetting the database.

---

## Deploying to Vercel

See the full guide in [`docs/DEPLOY.md`](DEPLOY.md). Short version:

1. Add env vars in Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and optionally `GEMINI_API_KEY` (see [`docs/GEMINI_SETUP.md`](GEMINI_SETUP.md)).
2. Update Supabase **Authentication → URL Configuration** with your production domain.
3. Deploy and smoke-test sign-in + board persistence.
