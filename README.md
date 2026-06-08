# MoodBoard AI

> **Status:** Active Development (MVP + Production Deployed)
> **Purpose:** GitHub README + internal handoff document for future development, AI agents, and new contributors
> **Live:** Deployed on Vercel with Supabase + Gemini free tier
> **Next feature:** Design system audit (incremental) and AI image generation

**Setup guides:** [`docs/MANUAL_SETUP.md`](docs/MANUAL_SETUP.md) · [`docs/SUPABASE_SETUP.md`](docs/SUPABASE_SETUP.md) · [`docs/GEMINI_SETUP.md`](docs/GEMINI_SETUP.md) · [`docs/DEPLOY.md`](docs/DEPLOY.md)

MoodBoard AI is an AI-assisted creative direction and moodboarding platform built to help users turn vague ideas into structured visual direction.

It is currently a working product foundation with:

- Landing page
- Dashboard with board visibility (private/shared) and filtering
- Board creation flow (applies the default-visibility preference)
- Board editor (tabbed sections)
- Board presentation/view mode (presentation mode is user-configurable)
- Templates page (grid + preview modal, live tag filtering, real reference imagery)
- Settings page (workspace identity & avatars, wired preferences, data tools)
- Theme system (light / dark / system, class-based)
- Command palette
- Toasts, modals, loading states, and empty states
- Accessibility foundations (app-wide reduce motion + strong focus rings)
- Supabase-backed persistence (boards + per-user settings) with custom `useSyncExternalStore` stores
- Supabase Auth with gated app routes, proxy protection, and landing CTAs
- AI board generation via staged `POST /api/generate/draft` → `POST /api/generate/enrich` (Google Gemini free tier with model fallback; demo generation when all models fail)
- Unified theme sync across landing, auth, and app (cookie + `SettingsBootstrap`)
- View-only public sharing at `/share/[id]` and discovery at `/discover`
- Vercel Analytics

The app is not finished. Core UX, persistence, auth, AI generation, public sharing, discovery, team collaboration, real-time co-editing, and board comments are in place; incremental design polish and AI enhancements are next.

---

## Quick Start (Local)

```bash
cp .env.local.example .env.local   # add Supabase + optional GEMINI_API_KEY
npm install
npm run setup:supabase
npm run verify:generate
npm run dev
```

Sign in: `admin@moodboard.ai` / `moodboard123`

---

## Authentication & Gated Landing CTAs (Implemented)

User login / authentication and gated CTAs use **Supabase Auth** with cookie-based sessions. The auth store (`src/lib/auth-store.ts`) still exposes `subscribeAuth`, `readAuthState`, `hydrateAuthStore`, and `signUp` / `signIn` / `signOut` for UI components.

**What was built:**

- **Auth store** — `src/lib/auth-store.ts`. Subscribes to `supabase.auth.onAuthStateChange`, maps sessions to `AuthUser`, and wraps Supabase sign-up/sign-in/sign-out. Demo account: `admin@moodboard.ai` / `moodboard123` (seed via `npm run db:seed-demo`).
- **Auth page** — a single consolidated page in the route group `src/app/(auth)/` at `/sign-in`, with an in-page **Sign in / Create account** toggle (the header's "Get started" deep-links via `/sign-in?mode=sign-up`). It reads a `?redirect=` target (sanitized to internal paths) via `useSearchParams` inside a `<Suspense>` boundary, has a password show/hide toggle, a one-click demo-account button, inline validation/errors, loading states, and toast feedback. A premium split-screen layout and a pre-login theme toggle live in `src/app/(auth)/layout.tsx`.
- **Route gating** — `src/components/auth/AuthGuard.tsx` wraps the `/app` and `/settings` layouts. It shows a loading state while the session resolves, and redirects unauthenticated users to `/sign-in?redirect=<intended path>`.
- **Gated landing CTAs** — `useGatedHref` (`src/components/auth/use-gated-href.ts`) makes the CTAs in `src/components/landing/Hero.tsx` ("Start a board" → `/app/new`, "View my boards" → `/app`) and `src/components/landing/CTASection.tsx` ("Begin your first board" → `/app/new`) route through `/sign-in` when unauthenticated, then bounce to the intended destination after signing in.
- **Per-user boards** — `src/lib/board-store.ts` loads boards from `/api/boards` for the signed-in user, driven by `src/components/layout/BoardStoreBootstrap.tsx`. New accounts start with an empty workspace; legacy localStorage data is imported once via `/api/migrate`.
- **Account menu** — `src/components/layout/AccountMenu.tsx` in the top bar shows a "Signed in as" identity plus a **Sign out** action. The landing header gains a **Sign in** / **Get started** / **Open app** entry point.

Auth is now backed by **Supabase Auth** (see [Database & Persistence (Implemented)](#database--persistence-implemented)). The auth store API (`signUp`, `signIn`, `signOut`, `subscribeAuth`) is unchanged for UI components.

---

## Database & Persistence (Implemented)

User-scoped data is stored in **Supabase (Postgres + Auth)** with Row Level Security. Client stores keep the same `useSyncExternalStore` API; persistence is handled via API routes.

**Setup:** Follow the full guide in [`docs/SUPABASE_SETUP.md`](docs/SUPABASE_SETUP.md). Short version:

1. Create a Supabase project at [supabase.com](https://supabase.com).
2. Run [`supabase/migrations/001_initial.sql`](supabase/migrations/001_initial.sql) in the SQL Editor.
3. Copy API keys into `.env.local` (see [`.env.local.example`](.env.local.example)).
4. Disable **Confirm email** under Authentication → Providers → Email.
5. Run `npm run setup:supabase` (verifies tables + seeds demo user).
6. Run `npm run dev` and sign in with `admin@moodboard.ai` / `moodboard123`.

**What was built:**

- **Schema** — `profiles`, `boards`, `user_settings` tables with RLS (`supabase/migrations/001_initial.sql`). Profile + default settings are created automatically on sign-up via trigger.
- **API routes** — `src/app/api/boards/`, `src/app/api/settings/`, `src/app/api/migrate/` (one-time localStorage import).
- **Board store** — `src/lib/board-store.ts` fetches and mutates via API with optimistic updates. New users start with an empty workspace.
- **Settings store** — `src/lib/settings-store.ts` is per-user; theme is mirrored to a cookie + local cache. `SettingsBootstrap` (root layout) keeps theme consistent across landing and app.
- **Proxy** — `src/proxy.ts` protects `/app` and `/settings`, refreshing the Supabase session on each request.
- **Migration** — `src/lib/local-migration.ts` imports legacy `localStorage` boards/settings on first authenticated load, then clears old keys.
- **Sidebar collapse** remains in `localStorage` (device UI preference, not account data).

---

## AI Generation (Implemented)

Prompt and template board creation use a **staged progressive pipeline** with authenticated sessions:

1. **`POST /api/generate/draft`** — Gemini (or demo) returns creative direction with SVG placeholder references.
2. **`POST /api/generate/enrich`** — streams NDJSON events as Pexels photos resolve one-by-one.
3. **`GET /api/generate`** — returns configured provider (`gemini` vs `mock`).

The client shows a live preview as the draft arrives, then fills reference slots progressively ([`GenerationPreview`](src/components/creation/GenerationPreview.tsx)).

**Setup:**

1. Optionally add `GEMINI_API_KEY` to `.env.local` (see [`.env.local.example`](.env.local.example) and [`docs/GEMINI_SETUP.md`](docs/GEMINI_SETUP.md)).
2. Optionally add `PEXELS_API_KEY` for real reference photos ([`docs/PEXELS_SETUP.md`](docs/PEXELS_SETUP.md)).
3. Run `npm run verify:generate` to confirm Gemini connectivity or mock fallback.
4. Create a board at `/app/new` or from `/templates`.

**Model fallback chain** (free tier):

1. `gemini-2.5-flash` (primary)
2. `gemini-2.5-flash-lite` (if primary is busy / over quota)
3. Demo generation (if both fail — board still created)

> `gemini-2.0-flash` has **0 free-tier quota** — not used.

**What was built:**

- **Server** — [`src/lib/ai-generate.ts`](src/lib/ai-generate.ts) draft generation (Gemini JSON + demo fallback); [`src/lib/enrich-board-references.ts`](src/lib/enrich-board-references.ts) sequential Pexels enrichment.
- **API** — [`src/app/api/generate/draft/route.ts`](src/app/api/generate/draft/route.ts) (rate-limited draft); [`src/app/api/generate/enrich/route.ts`](src/app/api/generate/enrich/route.ts) (NDJSON stream); enrich requires a draft permit issued per generation.
- **Client** — [`PromptComposer`](src/components/creation/PromptComposer.tsx) and [`templates/page.tsx`](src/app/templates/page.tsx) orchestrate draft → enrich via [`runProgressiveBoardGeneration`](src/lib/ai.ts); **Powered by Gemini** badge when configured.

**Production:** Add `GEMINI_API_KEY` and `PEXELS_API_KEY` to Vercel. See [`docs/DEPLOY.md`](docs/DEPLOY.md).

---

## 1. Project Overview

MoodBoard AI helps:

- Designers
- Founders
- Brand strategists
- Creative directors
- Marketing teams
- Content creators

turn rough ideas into structured creative direction.

Instead of manually assembling Pinterest boards, color palettes, references, fonts, and brand systems, users provide a prompt and MoodBoard AI generates:

- Creative direction
- Moodboards
- Color systems
- Typography pairings
- References
- Brand positioning
- Design guidance

The long-term vision is to become:

> **“The Figma + Pinterest + Creative Director powered by AI.”**

The product is meant to feel polished, premium, and app-like, while remaining practical and highly usable.

---

## 2. Current Tech Stack

### Framework

- Next.js 16 (App Router)
- React
- TypeScript

### Styling

- Tailwind CSS v4
- CSS Variables
- Theme tokens
- Light / dark / system theme support

### UI

- Custom component architecture
- Lucide icons
- Framer Motion (landing-page animations; respects the reduce-motion preference)

### State Management

Current:

- Supabase (boards + per-user settings via API routes)
- Custom stores (hand-rolled with React's `useSyncExternalStore` — see `src/lib/board-store.ts`, `src/lib/settings-store.ts`, `src/components/shared/toast-store.ts`, `src/components/shared/command-palette-store.ts`)
- Device-only UI prefs in localStorage (sidebar collapse)

> Note: `zustand` and `radix-ui` are listed in `package.json` but are currently **unused** (no imports). The app relies on the custom `useSyncExternalStore` stores above rather than a state-management library.

### Deployment

- Vercel

### Analytics

Implemented:

- Vercel Analytics

---

## 3. Current Project Structure

```txt
src/
├── app/
│   ├── api/           # boards, settings, generate, migrate
│   ├── page.tsx       # landing
│   ├── layout.tsx     # ThemeSync + SettingsBootstrap
│   ├── (auth)/sign-in/
│   ├── app/           # dashboard, editor, new board
│   ├── settings/
│   └── templates/
├── components/
│   ├── landing/
│   ├── layout/        # AppShell, Sidebar, BoardStoreBootstrap
│   ├── board/
│   ├── creation/      # PromptComposer, GenerationSourceBadge
│   └── shared/        # ThemeToggle, SettingsBootstrap, Toast
├── lib/
│   ├── ai-generate.ts
│   ├── board-store.ts
│   ├── settings-store.ts
│   └── supabase/
docs/                  # setup, deploy, Gemini guides
scripts/               # setup:supabase, verify:generate, seed-demo
supabase/migrations/   # 001–006 (realtime + comments in 006)
```

---

## 4. Current Implemented Features

### Landing Page

The landing page is implemented and includes:

#### Hero Section

- Product headline
- AI creative workspace positioning
- CTA buttons
- Example creative direction preview

#### Feature Grid

Feature highlights include:

- AI Creative Direction
- Curated Palettes
- Typography Pairing
- Composable Boards

#### Example Board Preview

Displays:

- Tags
- Palette
- Typography
- Direction

#### CTA Section

A conversion-focused call to action.

---

### Dashboard

Route:

```txt
/app
```

Implemented:

#### Board Grid

Displays saved boards.

#### Board Cards

Includes:

- Board title
- Favorite state
- Metadata
- Visibility indicator (private/shared)
- Quick actions

#### Visibility & Filtering

- Boards can be marked **private** or **shared**.
- The dashboard supports filtering by visibility and sorting, with state reflected in the URL.

#### Empty States

Implemented.

#### Loading States

Implemented.

#### Accessibility

Implemented.

---

### Board Creation Flow

Route:

```txt
/app/new
```

Implemented:

#### Prompt Composer

Users can:

- Enter a prompt (or pick a suggestion)
- Generate a board via staged `POST /api/generate/draft` → `POST /api/generate/enrich` (Gemini or demo fallback)
- See **Powered by Gemini** when `GEMINI_API_KEY` is configured
- Land directly in the board editor after generation

---

### Board Editor

Route:

```txt
/app/boards/[id]
```

Implemented:

#### Editable Board

Supports:

- Notes
- References
- Board sections

#### Card Components

Implemented:

- Sticky notes
- Reference cards
- Text/content blocks

#### Actions

Implemented:

- Share
- Export
- Duplicate

---

### Board View Mode

Routes:

```txt
/app/boards/[id]/view   # Owner preview (authenticated)
/share/[id]             # Public view-only link (no sign-in required)
```

Implemented:

#### Read-Only Board

Supports:

- Presentation mode
- Public view-only sharing at `/share/[id]` when board visibility is **Shared** (migration `002_shared_board_public_read.sql`)
- Owner preview at `/app/boards/[id]/view`
- Non-editable consumption

---

### Discover Page

Route:

```txt
/discover
```

Implemented:

- Browse all **shared** boards without sign-in
- Search by title, mood, tags, tone, and summary
- Cards link to `/share/[id]` view-only presentation
- `GET /api/discover` — public list of shared boards (newest first)

Planned:

- Featured boards and curated collections
- Creator attribution

---

### Templates Page

Route:

```txt
/templates
```

Implemented:

#### Template Library

Current functionality:

- Responsive template grid with softened, palette-tinted cards
- Detailed **preview modal** (palette, typography rendered in the actual typefaces, references)
- **Tag filter dropdown** with selected tags shown as removable pills, an "All" option, and a reset action
- **Live tags** — tags added while creating/editing boards automatically appear as filter options
- Real reference imagery wired up via Unsplash URLs

**Use template** creates a board via the same draft → enrich pipeline as prompt creation (`POST /api/generate/draft` then `POST /api/generate/enrich`).

Template metadata is still curated in-app (not a marketplace yet).

Planned:

- Real template marketplace
- AI-assisted templates
- Community templates

---

### Settings Page

Route:

```txt
/settings
```

Implemented (all controls are wired to real behavior — no decorative toggles):

#### Profile / Workspace Identity

- Editable workspace **name** and **tagline**
- **Avatar** picker with curated emoji avatars grouped into **People** (Artist, Painter, Designer, Creator, Curator) and **Symbols** (Palette, Brush, Pencil, Camera, Film, Sparkle, Star, Moon, Idea), plus a "use initials" option
- **Avatar accent** picker (pastel palette)
- The chosen identity renders consistently in the **sidebar** and the **top-right avatar** via a shared `WorkspaceAvatar` component

#### Theme Preferences

- System
- Light
- Dark

#### Accessibility

- Keyboard shortcuts (gates the `⌘/Ctrl + K` command palette)
- Reduce motion (applied **app-wide** via a root class)
- Strong focus rings (applied **app-wide** via a root class)
- Keyboard shortcuts reference card (dimmed when shortcuts are disabled)

#### Visibility Defaults

- Private / Shared — actually applied to newly created boards

#### Presentation Mode

User-configurable toggle that gates the keyboard-driven slideshow on the share/view page.

#### Data Tools

- Import boards (JSON)
- Export boards (JSON backup)
- **Reset preferences** (restores settings to defaults, keeps boards)
- **Danger zone** reset (deletes all boards and restores defaults)
- Cloud sync status indicator

---

### Command Palette

Implemented.

Shortcut:

```txt
⌘ + K
```

Current capabilities:

- Navigation
- Quick actions
- Board actions

Planned capabilities:

- AI commands
- Search
- Board management
- Template navigation

---

## 5. UX Infrastructure Implemented

The project already includes a solid UX foundation.

### Implemented Globally

- Toast system
- Loading states
- Skeleton states
- Empty states
- Confirmation modals
- Export modals
- Share modals
- Keyboard shortcuts
- URL persistence where relevant
- State persistence where relevant

This means the application is already structured like a real product, not just a demo shell.

---

## 6. Accessibility Status

Accessibility is a first-class requirement in this project.

Implemented:

- Keyboard navigation
- Focus management
- Accessible dialogs
- Accessible empty states
- Accessible loading states
- ARIA support
- Reduced-motion support

Future work should continue to preserve and expand accessibility support across every page and interaction.

---

## 7. Theme System Status

### Implemented

- Light / dark / system modes via settings and header toggle
- Class-based `dark:` utilities on `<html>`
- Flash-free first paint (`theme-init` script reads cookie before hydration)
- **Cross-route sync** — `SettingsBootstrap` + cookie/local cache keep landing and app on the same theme (no random flips on navigation)

### Remaining polish

- Visual refinement on landing (full redesign deferred — current design preferred)
- Incremental token standardization (`--shadow-card`, `--shadow-elevated` added; more audit work possible)
- Some board editor panels still use hardcoded slate colors

---

## 8. Current Known Problems

### Landing Page

Needs a complete visual refinement pass.

#### Light Mode

Problems:

- Lacks premium feel
- Visual hierarchy needs improvement
- Some sections feel too dark for a light theme

#### Dark Mode

Problems:

- Overly dark in some areas
- Contrast inconsistencies
- Background treatments need refinement

### Design Consistency

Needs an audit across:

- Landing
- Dashboard
- Templates
- Settings
- Board editor

### Theme Tokens

Need standardization.

Some components still use:

- Hardcoded colors
- Mixed token usage

Goal:

- Single design token source
- Consistent component theming
- Predictable visual language across the app

---

## 9. What Still Needs To Be Built

## High Priority

### AI Generation Engine

Implemented — see [AI Generation (Implemented)](#ai-generation-implemented). Optional `GEMINI_API_KEY` enables free-tier Gemini generation; otherwise demo/mock fallback.

Remaining enhancements: AI image generation and expanded reference search APIs.

### Database

Implemented (Supabase Postgres):

- `profiles` — user identity
- `boards` — per-user boards (JSONB for nested content)
- `user_settings` — per-user workspace preferences
- Public read of **shared** boards via RLS policy (`002_shared_board_public_read.sql`)

Deferred: template metadata tables (marketplace).

### Authentication

Implemented (Supabase Auth):

- Sign up / sign in / sign out with server-backed sessions
- Middleware + `AuthGuard` route protection
- Gated landing CTAs and redirect-back after sign-in
- Demo account via `npm run db:seed-demo`

---

## Medium Priority

### User Profiles

Potential routes:

```txt
/profile
/profile/settings
```

### Team Collaboration (Implemented)

Routes & APIs:

```txt
/invite/[token]                    # Accept email invite (sign-in required)
POST /api/boards/[id]/members      # Invite by email (owner)
GET  /api/boards/[id]/members      # List collaborators
DELETE /api/boards/[id]/members/[userId]
GET  /api/boards/[id]/invites      # Pending invites
POST /api/invites/[token]/accept   # Accept invite
```

Supports:

- **Roles** — owner (board creator), editor (can edit content), viewer (read-only)
- **Email invites** — existing users get access immediately; new users receive `/invite/[token]` link
- **Collaborate modal** — public link + people management in board editor (owner only)
- **Dashboard filter** — "With me" shows boards shared with you

Requires migration `003_board_collaboration.sql`.

**Real-time co-editing (implemented):**

- Supabase Realtime presence on `board:{id}` — stacked avatars + online count in the board editor header
- Live board sync via `postgres_changes` on `boards` — remote saves apply when local draft is clean
- Conflict banner when you have unsaved edits and a collaborator saves — **Reload** or **Keep editing**

**Board comments (implemented):**

```txt
GET    /api/boards/[id]/comments
POST   /api/boards/[id]/comments
DELETE /api/boards/[id]/comments/[commentId]
```

- Slide-over comments panel in the board editor (owner, editor, viewer)
- Live comment sync via Realtime on `board_comments`
- Authors and owners can delete comments

Requires migration `006_board_realtime_comments.sql`.

Planned:

- Live cursors and character-level sync
- Comment editing

### Version History

Track changes over time.

### Board Snapshots

Restore previous versions.

---

## Future Features

### AI Image Generation

Generate:

- Moodboard imagery
- Brand concepts
- Inspiration visuals

### AI Reference Search

Search and collect references from:

- Behance
- Dribbble
- Pinterest-like sources

### AI Typography Suggestions

Generate:

- Font pairings
- Hierarchies
- Usage recommendations

### AI Brand Strategy

Generate:

- Positioning
- Voice
- Messaging

### AI Design System Generator

Generate:

- Colors
- Typography
- Components
- Design rules

---

## 10. Planned Future Pages

### Discover

```txt
/discover
```

Browse public shared boards — **implemented**.

### Explore

```txt
/explore
```

Creative inspiration feed.

### Marketplace

```txt
/marketplace
```

Premium templates.

### Pricing

```txt
/pricing
```

Subscription plans.

### Help Center

```txt
/help
```

Documentation and support.

### Changelog

```txt
/changelog
```

Product updates.

---

## 11. Development Requirements

These rules were established during development and should continue to be followed.

### Every Feature Should Include

- Accessibility
- Keyboard support
- Loading states
- Empty states
- Toast feedback
- Proper modal flows
- State persistence where relevant

### Code Change Requirements

When making updates:

- Provide complete updated files
- Avoid partial snippets
- Avoid hallucinated files
- Maintain accessibility support

### When Requirements Are Unclear

Clarify before implementing.

---

## 12. Immediate Next Development Order

### 0. Authentication & Gated Landing CTAs — DONE

Supabase Auth, proxy protection, gated `/app` + `/settings` routes, and gated landing CTAs with redirect-back. See [Authentication & Gated Landing CTAs (Implemented)](#authentication--gated-landing-ctas-implemented).

### 1. Database Integration — DONE

Supabase-backed boards, settings, and auth. See [Database & Persistence (Implemented)](#database--persistence-implemented).

### 2. Landing Page Redesign — DEFERRED

Incremental polish only; full redesign was attempted and reverted. Current landing design is preferred.

### 3. AI Generation Pipeline — DONE

Google Gemini free-tier integration via staged `POST /api/generate/draft` → `POST /api/generate/enrich`. See [AI Generation (Implemented)](#ai-generation-implemented).

### 4. Design System Audit — IN PROGRESS

Shadow tokens (`--shadow-card`, `--shadow-elevated`) added. Remaining: broader color/spacing token audit.

### 5. Deploy to Production — DONE

Vercel + Supabase + `GEMINI_API_KEY`. See [`docs/DEPLOY.md`](docs/DEPLOY.md).

### 6. Discover Page — DONE

Public browse at `/discover` with search; cards link to `/share/[id]`.

### 7. Collaboration Features — DONE (MVP)

Invites, roles (owner/editor/viewer), and permission-gated editing.

### 8. Real-Time Co-Editing + Comments — DONE

Supabase Realtime presence, live board sync on save, conflict banner, and board comments panel. See [Team Collaboration (Implemented)](#team-collaboration-implemented). Migration `006_board_realtime_comments.sql`.

---

## 13. Current Reality

The project is no longer a starter application.

Implemented:

- Landing page
- Dashboard
- Board creation flow
- Board editor
- Board viewer
- Templates page
- Settings page
- Theme system
- Analytics
- Accessibility foundation
- Command palette
- Toast system
- Modal system
- Loading states
- Empty states
- Public sharing (`/share/[id]`) and discovery (`/discover`)

Database persistence, Supabase Auth, AI generation, theme sync, production deploy, view-only public sharing, discover, **team collaboration (MVP)**, **real-time co-editing**, and **board comments** are implemented.

1. Design system standardization (incremental)
2. AI image generation and expanded reference search
3. Landing page — deferred unless targeted polish is requested

---

## 14. AI Agent Handoff Notes

If you are an AI agent continuing development in Cursor, Claude, ChatGPT, Copilot, or another environment, treat this README as the project handoff document.

Important context:

- Landing page full redesign was **deferred** (current design preferred)
- Theme **sync** across landing ↔ app is fixed; incremental visual polish remains
- AI generation uses **Gemini free tier** (`gemini-2.5-flash` → `gemini-2.5-flash-lite` → demo fallback). Set `GEMINI_API_KEY` locally and on Vercel.
- Boards and settings persist in **Supabase** (per-user, RLS-protected). Sidebar collapse stays in localStorage.
- **Production is deployed** on Vercel — push to `main` triggers redeploy. See [`docs/DEPLOY.md`](docs/DEPLOY.md).
- **Authentication uses Supabase Auth** with proxy protection. See [Database & Persistence (Implemented)](#database--persistence-implemented)
- **View-only sharing** at `/share/[id]` for boards saved with visibility **Shared** (migration `002_shared_board_public_read.sql` applied)
- **Discover** at `/discover` — browse and search public shared boards
- **Collaboration** — invite by email with editor/viewer roles; accept at `/invite/[token]`; dashboard **With me** filter (migration `003_board_collaboration.sql`)
- **Real-time co-editing** — presence avatars, live board sync on collaborator save, conflict banner for unsaved local edits (migration `006_board_realtime_comments.sql`)
- **Board comments** — slide-over panel with live sync; `GET/POST/DELETE /api/boards/[id]/comments`
- **Next features:** design system audit, AI image generation
- Board editor handles refresh correctly (loads from Supabase after hydration; no false "not found")
- Settings controls are all wired to real behavior (theme, reduce motion / focus rings, default visibility, presentation mode, workspace identity)

When resuming work, focus on incremental design tokens and AI image generation.

---

## 15. License

Private project. All rights reserved.

---

## 16. End of Handoff Document

This README should be treated as the primary project handoff reference until superseded by a future version.