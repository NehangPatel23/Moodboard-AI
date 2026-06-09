# MoodBoard AI

> **Status:** Active Development (MVP + Production Deployed)
> **Purpose:** GitHub README + internal handoff document for future development, AI agents, and new contributors
> **Live:** Deployed on Vercel with Supabase + Gemini free tier
> **Next plan of action:** See [§ Next plan of action](#next-plan-of-action) — Sprints A–D complete; next: landing/dashboard polish and Wave 4 growth items.

**Setup guides:** [`docs/MANUAL_SETUP.md`](docs/MANUAL_SETUP.md) · [`docs/SUPABASE_SETUP.md`](docs/SUPABASE_SETUP.md) · [`docs/GEMINI_SETUP.md`](docs/GEMINI_SETUP.md) · [`docs/REFERENCE_PHOTOS.md`](docs/REFERENCE_PHOTOS.md) · [`docs/DEPLOY.md`](docs/DEPLOY.md)

MoodBoard AI is an AI-assisted creative direction and moodboarding platform built to help users turn vague ideas into structured visual direction.

It is currently a working product foundation with:

- Landing page
- Dashboard with visibility filters (All, With me, With others, Public, Private) and collaborator badges
- Board creation flow (applies the default-visibility preference)
- Board editor (tabbed sections)
- Board presentation/view mode (presentation mode is user-configurable)
- Templates page (grid + preview modal, live tag filtering, focused inline generation UX)
- Settings page (workspace identity & avatars, wired preferences, data tools)
- Theme system (light / dark / system, class-based) with **TopBar** sun/moon toggle next to search
- Command palette (board search, editor section jump, export/share/snapshot actions)
- Toasts, modals, loading states, and empty states
- Accessibility foundations (app-wide reduce motion + strong focus rings)
- Supabase-backed persistence (boards + per-user settings) with custom `useSyncExternalStore` stores
- Supabase Auth with gated app routes, proxy protection, and landing CTAs
- AI board generation via staged `POST /api/generate/draft` → `POST /api/generate/enrich` (Google Gemini free tier with model fallback; demo generation when all models fail)
- Unified theme sync across landing, auth, and app (cookie + `SettingsBootstrap`)
- View-only public sharing at `/share/[id]` and discovery at `/discover`
- Vercel Analytics

The app is not finished. Core UX, persistence, auth, AI text generation, reference photos (Pexels + Unsplash + manual import), public sharing, discovery (featured row + creator names), team collaboration (dashboard filters + per-member favorites), real-time co-editing, board comments (with editing), AI typography/palette/brand suggestions, board snapshots (limits + auto-prune + preview), activity replay, collaboration notifications (remote-save toast + unread tab/pulse), flexible collaboration retention, design-system tokens (editor/presence/dashboard/modals), and visual export (JSON / PNG / PDF with live preview) are in place. **Next:** see [Next plan of action](#next-plan-of-action).

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
2. Run migrations in [`supabase/migrations/`](supabase/migrations/) through `021` in the SQL Editor (or follow [`docs/SUPABASE_SETUP.md`](docs/SUPABASE_SETUP.md) / [`docs/DEPLOY.md`](docs/DEPLOY.md) for the full ordered list).
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
2. Optionally add `PEXELS_API_KEY` and `UNSPLASH_ACCESS_KEY` for stock reference photos ([`docs/REFERENCE_PHOTOS.md`](docs/REFERENCE_PHOTOS.md)).
3. Run `npm run verify:generate` to confirm Gemini connectivity or mock fallback.
4. Create a board at `/app/new` or from `/templates`.

**Model fallback chain** (free tier):

1. `gemini-2.5-flash` (primary)
2. `gemini-2.5-flash-lite` (if primary is busy / over quota)
3. Demo generation (if both fail — board still created)

> `gemini-2.0-flash` has **0 free-tier quota** — not used.

**What was built:**

- **Server** — [`src/lib/ai-generate.ts`](src/lib/ai-generate.ts) draft generation (Gemini JSON + demo fallback); template drafts use full template context via `buildTemplateGenerationPrompt()`; [`src/lib/enrich-board-references.ts`](src/lib/enrich-board-references.ts) sequential Pexels enrichment.
- **API** — [`src/app/api/generate/draft/route.ts`](src/app/api/generate/draft/route.ts) (rate-limited draft); [`src/app/api/generate/enrich/route.ts`](src/app/api/generate/enrich/route.ts) (NDJSON stream); enrich requires a draft permit from [`src/lib/generate-enrich-permit.ts`](src/lib/generate-enrich-permit.ts).
- **Client** — [`PromptComposer`](src/components/creation/PromptComposer.tsx) and [`templates/page.tsx`](src/app/templates/page.tsx) orchestrate draft → enrich via [`runProgressiveBoardGeneration`](src/lib/ai.ts); [`GenerationPreview`](src/components/creation/GenerationPreview.tsx) shows live draft + progressive reference fill; **Powered by Gemini** badge when configured.

**Production:** Add `GEMINI_API_KEY` and `PEXELS_API_KEY` to Vercel. See [`docs/DEPLOY.md`](docs/DEPLOY.md).

---

## Visual Board Export (Implemented)

The board editor **Export** action opens [`ExportModal`](src/components/shared/ExportModal.tsx) with a **live preview** before download.

**Formats:**

| Format | Contents |
|--------|----------|
| **JSON** | Full board object (metadata, notes, tags, prompt, etc.) |
| **PNG** | Single image moodboard summary |
| **PDF** | Printable moodboard with smart page breaks between sections |

**Visual export includes:** title, summary, mood, tone, tags, palette, typography, references, and notes (ideas / instructions / keywords).

**What was built:**

- **Layout** — [`BoardExportCapture`](src/components/board/BoardExportCapture.tsx) with inline styles for reliable `html-to-image` capture; `fixed` (1200px) for export, `fluid` for in-modal preview
- **Capture pipeline** — [`export-capture.ts`](src/lib/export-capture.ts): body-portal mount on export, CORS-safe image inlining, font/image readiness, blank-PNG validation
- **PDF assembly** — [`export-pdf.ts`](src/lib/export-pdf.ts): section blocks (`data-export-block`) captured separately; page breaks keep reference rows and note cards intact
- **Preview UX** — two-panel modal with **Visual / JSON** toggle; PNG/PDF buttons export independently (only the active button shows loading state)

**Touch:** [`ExportModal`](src/components/shared/ExportModal.tsx), [`BoardExportCapture`](src/components/board/BoardExportCapture.tsx), [`export-capture.ts`](src/lib/export-capture.ts), [`export-pdf.ts`](src/lib/export-pdf.ts).

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
│   ├── api/           # boards, comments, discover, generate/draft|enrich, migrate, settings, snapshots
│   ├── page.tsx       # landing
│   ├── layout.tsx     # ThemeSync + SettingsBootstrap
│   ├── (auth)/sign-in/
│   ├── app/           # dashboard, editor, new board
│   ├── discover/
│   ├── settings/
│   ├── share/[id]/    # public view + Open Graph meta
│   └── templates/
├── components/
│   ├── landing/
│   ├── layout/        # AppShell, Sidebar, TopBar, BoardStoreBootstrap
│   ├── board/         # BoardEditorClient, BoardExportCapture, BoardSnapshotsPanel, board-editor-styles.ts
│   ├── creation/      # PromptComposer, GenerationPreview, TemplateGenerationPanel
│   └── shared/        # ExportModal, CommandPalette, ThemeToggle, SettingsBootstrap, Toast
├── lib/
│   ├── ai-generate.ts
│   ├── ai.ts          # runProgressiveBoardGeneration, streamEnrichedBoard
│   ├── board-store.ts
│   ├── export-capture.ts
│   ├── export-pdf.ts
│   ├── retention-duration.ts
│   ├── settings-store.ts
│   └── supabase/
docs/                  # setup, deploy, Gemini, Pexels guides
scripts/               # setup:supabase, verify:generate, seed-demo
supabase/migrations/   # 001–021 (collaboration, snapshots, retention, brand strategy)
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
- Favorite state (owners and collaborators — per-member favorites via migration `019`)
- Metadata
- Visibility indicator (Private / Public) and **Collaborators** badge when shared outward
- Quick actions

#### Visibility & Filtering

Four independent dimensions — do not conflate collaborator access with Discover visibility:

| Filter | URL param | Meaning |
|--------|-----------|---------|
| **All boards** | _(none)_ | Everything you own or collaborate on |
| **With me** | `visibility=collaborating` | Incoming — boards where you are editor/viewer |
| **With others** | `visibility=with-others` | Outgoing — owned boards with members or pending invites |
| **Public** | `visibility=shared` | Your owned boards listed on Discover |
| **Private** | `visibility=private` | Your owned boards not on Discover |

- **`hasCollaborators`** on owned boards comes from `GET /api/boards` (batch `board_members` + pending `board_invites` counts).
- **With me** access sub-filter: Any / Can edit / View only.
- Sort by Recent or Favorites; filter state persists in the URL.
- [`CollaborateModal`](src/components/shared/CollaborateModal.tsx) calls `reloadBoards()` after invite/member changes so filters stay fresh.

#### Empty States

Implemented.

#### Loading States

Implemented.

#### Accessibility

Implemented.

---

### App Shell

Implemented across authenticated routes (`/app`, `/settings`, `/templates`, board editor):

- **Sidebar** — navigation, workspace avatar, collapse state in `localStorage`
- **TopBar** — brand link, search / `⌘K` command palette trigger, **sun/moon theme toggle** ([`ThemeToggle`](src/components/shared/ThemeToggle.tsx)), account menu
- Theme choice persists via settings cookie + `SettingsBootstrap`

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
- Watch a **live progressive preview** ([`GenerationPreview`](src/components/creation/GenerationPreview.tsx)) as the draft arrives and Pexels references fill in one-by-one
- See **Powered by Gemini** when `GEMINI_API_KEY` is configured
- Redirect to the board editor shortly after generation completes (~650ms)

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
- Export (JSON, PNG, PDF — with live preview)
- Duplicate
- Snapshots (save, preview, restore, auto-backup before restore)

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
- **Open Graph meta** on share links for richer social previews
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
- **Featured row** — curated highlight strip at the top (when not searching)
- **Creator attribution** — creator name on cards via `profiles` join
- Cards link to `/share/[id]` view-only presentation
- `GET /api/discover` — public list of shared boards (newest first, up to 48)

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
- Static template card imagery from Unsplash URLs (generated boards enrich references via Pexels)

#### Template generation UX

**Use template** runs the same draft → enrich pipeline as prompt creation. Gemini receives full template context (palette, typography, notes, references) via `buildTemplateGenerationPrompt()` in [`src/lib/ai-generate.ts`](src/lib/ai-generate.ts).

During creation:

- **Focused grid view** — only the active template card stays visible; others hide
- **Gemini gradient button** ([`TemplateUseTemplateButton`](src/components/creation/TemplateUseTemplateButton.tsx)) while generating
- **Inline preview** below the active card ([`TemplateGenerationPanel`](src/components/creation/TemplateGenerationPanel.tsx) + `GenerationPreview`); modal path shows the same preview inside the modal
- **~4s pause** on the completed preview before redirect to the editor

Template metadata is still curated in-app (not a marketplace yet).

Planned:

- Real template marketplace
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

#### Collaboration retention

- Hide comments / activity after a configurable **amount + unit** (minutes, hours, days, weeks, or never)
- Owner purge limits for permanently deleting old comments and activity on owned boards
- Migration `018_user_settings_retention_duration.sql`; legacy day-only values map on read via [`retention-duration.ts`](src/lib/retention-duration.ts)

#### Data Tools

- Import boards (JSON)
- Export boards (JSON backup, PNG moodboard, or PDF printable summary)
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

- Fuzzy board search by title, summary, prompt, tags, and tone
- Navigation (dashboard, new board, templates, settings)
- Board actions (duplicate, favorite toggle)
- **Editor context** (on `/app/boards/[id]`) — jump to Overview, Palette, Typography, References, Notes
- **Editor quick actions** — Export, Snapshots, Share/Collaborate

Planned capabilities:

- AI commands
- Template navigation from palette

---

## 5. UX Infrastructure Implemented

The project already includes a solid UX foundation.

### Implemented Globally

- Toast system
- Loading states
- Skeleton states
- Empty states
- Confirmation modals
- Export modal (live Visual / JSON preview before download)
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

- Light / dark / system modes via settings, auth header, and **TopBar** sun/moon toggle (next to search)
- Class-based `dark:` utilities on `<html>`
- Flash-free first paint (`theme-init` script reads cookie before hydration)
- **Cross-route sync** — `SettingsBootstrap` + cookie/local cache keep landing and app on the same theme (no random flips on navigation)

### Remaining polish

- Visual refinement on landing (full redesign deferred — current design preferred)
- Incremental token standardization (`--shadow-card`, `--shadow-elevated` added; more audit work possible)
- Board editor cluster migrated to semantic tokens (`board-editor-styles.ts`); remaining board subcomponents (palette, presence, read-only) still use some hardcoded colors

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

Remaining enhancements: expanded reference search APIs (Behance, Dribbble, etc.).

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
- **Dashboard filters** — **With me** (incoming), **With others** (outgoing), **Public** / **Private** (Discover visibility); collaborator badge on cards
- **Collaborator favorites** — editors/viewers can star boards on their dashboard (`POST /api/boards/[id]/favorite`, migration `019`)

Requires migration `003_board_collaboration.sql`.

**Real-time co-editing (implemented):**

- Supabase Realtime presence on `board:{id}` — stacked avatars + online count in the board editor header
- **Section presence** — editor tab pills highlight when collaborators are on the same section; [`BoardSectionPresenceBar`](src/components/board/BoardSectionPresenceBar.tsx) shows who is viewing/editing the active section
- Live board sync via `postgres_changes` on `boards` — remote saves apply when local draft is clean
- Conflict banner when you have unsaved edits and a collaborator saves — **Reload** or **Keep editing**

**Board comments (implemented):**

```txt
GET    /api/boards/[id]/comments
POST   /api/boards/[id]/comments
PATCH  /api/boards/[id]/comments/[commentId]
DELETE /api/boards/[id]/comments/[commentId]
```

- Slide-over comments panel in the board editor (owner, editor, viewer)
- Live comment sync via Realtime on `board_comments` (INSERT, UPDATE, DELETE)
- Authors can edit their own comments; owners can edit any comment
- Owners can delete comments

Requires migration `006_board_realtime_comments.sql`.

Planned:

- Live cursors and character-level sync
- In-app collaboration notifications (remote save signal, unread comment pulse)

### Version History

Track changes over time.

### Board Snapshots — DONE

Manual save/restore with owner delete (migrations `015`/`017`).

Implemented in [`BoardSnapshotsPanel`](src/components/board/BoardSnapshotsPanel.tsx):

- Save labeled snapshots; list, restore, and owner-only delete
- **Preview snapshot** — read-only modal ([`SnapshotPreviewModal`](src/components/board/SnapshotPreviewModal.tsx)) using the same export layout before restore
- **Auto-backup before restore** — optional safety snapshot when restoring

Planned:

- Snapshot retention/limit (e.g. max snapshots per board)

---

## Future Features

### Reference Search — DONE (Pexels + Unsplash + manual import)

Implemented: Pexels → Unsplash → demo placeholder chain during enrich and **Find photo**; **Apply URL** and **Upload file** in the reference editor. See [`docs/REFERENCE_PHOTOS.md`](docs/REFERENCE_PHOTOS.md).

Planned additions:

- Behance, Dribbble, Pinterest-like sources (requires legitimate APIs)

### AI Typography Suggestions — DONE

**Suggest typography** in the board editor calls `POST /api/generate/typography` (Gemini JSON + demo fallback).

### Visual Board Export — DONE

Export modal with **live preview** and **JSON**, **PNG**, and **PDF** downloads. Visual export includes tags and notes; PDF uses block-based page breaks. See [Visual Board Export (Implemented)](#visual-board-export-implemented).

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

Google Gemini free-tier integration via staged `POST /api/generate/draft` → `POST /api/generate/enrich`, with live progressive preview on `/app/new` and `/templates`. See [AI Generation (Implemented)](#ai-generation-implemented).

### 4. Design System Audit — DONE (Phase 2)

Shadow tokens (`--shadow-card`, `--shadow-elevated`) added. Board editor, collaboration panels, creation flow, and settings cards use semantic tokens via [`board-editor-styles.ts`](src/components/board/board-editor-styles.ts). Landing polish remains deferred.

### 5. Deploy to Production — DONE

Vercel + Supabase + `GEMINI_API_KEY`. See [`docs/DEPLOY.md`](docs/DEPLOY.md).

### 6. Discover Page — DONE

Public browse at `/discover` with search; cards link to `/share/[id]`.

### 7. Collaboration Features — DONE (MVP)

Invites, roles (owner/editor/viewer), and permission-gated editing.

### 8. Real-Time Co-Editing + Comments — DONE

Supabase Realtime presence, live board sync on save, conflict banner, and board comments panel. See [Team Collaboration (Implemented)](#team-collaboration-implemented). Migration `006_board_realtime_comments.sql`.

### 9. Board Activity + Replay — DONE

Activity feed with structured change replay, per-item read/hide, owner-only delete, and collaboration retention settings. Migrations `008`–`013`. Verify with `npm run verify:collaboration`.

### 10. Reference Photos — DONE

Pexels → Unsplash → demo placeholder during enrich and **Find photo**; manual **Apply URL** / **Upload file** in the reference editor. See [`docs/REFERENCE_PHOTOS.md`](docs/REFERENCE_PHOTOS.md).

### 11. Comment Editing — DONE

`PATCH /api/boards/[id]/comments/[commentId]` with inline edit UI and Realtime UPDATE sync.

### 12. AI Typography + Visual Export — DONE

**Suggest typography** (`POST /api/generate/typography`) and export modal with JSON / PNG / PDF + live preview. See [Visual Board Export (Implemented)](#visual-board-export-implemented).

### 13. Flexible Collaboration Retention — DONE

Settings support minutes/hours/days/weeks for hide and purge limits. Migration `018_user_settings_retention_duration.sql`; [`retention-duration.ts`](src/lib/retention-duration.ts).

### 14. Board Snapshots UX — DONE

Snapshot preview modal and optional auto-backup before restore. [`SnapshotPreviewModal`](src/components/board/SnapshotPreviewModal.tsx), [`BoardSnapshotsPanel`](src/components/board/BoardSnapshotsPanel.tsx).

### 15. Live Collaborator Cues — DONE

Section tab highlights when others are on the same editor section; editing badges via presence status. [`BoardSectionPresenceBar`](src/components/board/BoardSectionPresenceBar.tsx).

### 16. Command Palette v2 — DONE

Fuzzy board search, editor section jump, and Export / Snapshots / Share actions. [`CommandPalette`](src/components/shared/CommandPalette.tsx), [`editor-quick-actions.ts`](src/lib/editor-quick-actions.ts).

### 17. Discover & Sharing Polish — DONE

Featured row on `/discover`, creator names on cards, Open Graph meta on `/share/[id]`.

### 18. Dashboard Sharing Filters — DONE

**With others** filter (`?visibility=with-others`), Public/Private relabel, `hasCollaborators` on `GET /api/boards`, collaborator badge on [`BoardCard`](src/components/dashboard/BoardCard.tsx), dashboard reload after collaborate actions. Per-member favorites for collaborators (migration `019`, [`POST /api/boards/[id]/favorite`](src/app/api/boards/[id]/favorite/route.ts)).

### 19. Collaboration Notifications — DONE

Remote-save toast when draft is clean ([`BoardEditorClient`](src/components/board/BoardEditorClient.tsx)); unread tab title via [`use-document-title.ts`](src/lib/use-document-title.ts); pulsing toolbar badges on Comments/Activity when panels closed ([`BoardEditorToolbar`](src/components/board/BoardEditorToolbar.tsx)).

### 20. Snapshot Limits — DONE

Owner cap + auto-prune (migration `020`, Settings → Collaboration → Snapshots); enforce on save via [`snapshot-prune.ts`](src/lib/db/snapshot-prune.ts); count/limit UI in [`BoardSnapshotsPanel`](src/components/board/BoardSnapshotsPanel.tsx).

### 21. Design System Pass (Sprint C) — DONE

Semantic tokens in [`board-editor-styles.ts`](src/components/board/board-editor-styles.ts) for presence, dashboard cards, modal scrims, note tones; migrated [`BoardPresenceStrip`](src/components/board/BoardPresenceStrip.tsx), [`BoardReadOnlyClient`](src/components/board/BoardReadOnlyClient.tsx), shared modals.

### 22. AI Brand Strategy — DONE

`POST /api/generate/brand`, **Suggest brand** on Overview, persisted on board as `brandStrategy` (migration `021`); included in visual export.

---

## Next plan of action

Four-wave roadmap. **Waves 1–3 and Sprints A–D are complete** (collaboration notifications, snapshot limits, design-system pass, AI brand strategy).

### Recently completed

| Wave | Item | Shipped |
|------|------|---------|
| 1 | Flexible collaboration retention (amount + unit) | Migration `018`, settings UI, [`retention-duration.ts`](src/lib/retention-duration.ts) |
| 1 | PNG/PDF export fix + tags/notes in visual export | [`export-capture.ts`](src/lib/export-capture.ts), [`export-pdf.ts`](src/lib/export-pdf.ts), [`ExportModal`](src/components/shared/ExportModal.tsx) |
| 1 | Export live preview (Visual / JSON toggle) | [`ExportModal`](src/components/shared/ExportModal.tsx) |
| 1 | Production hygiene — migrations `017`–`021` in [`docs/DEPLOY.md`](docs/DEPLOY.md) | Done |
| 2 | Snapshot preview + auto-backup before restore | [`SnapshotPreviewModal`](src/components/board/SnapshotPreviewModal.tsx) |
| 2 | Section presence highlights + editing badges | [`BoardSectionPresenceBar`](src/components/board/BoardSectionPresenceBar.tsx), editor tab pills |
| 2 | **Dashboard sharing filters** — With others, Public relabel, collaborator badge | [`BoardFilterBar`](src/components/dashboard/BoardFilterBar.tsx), [`GET /api/boards`](src/app/api/boards/route.ts) |
| 2 | **Collaborator favorites** on dashboard | Migration `019`, [`POST /api/boards/[id]/favorite`](src/app/api/boards/[id]/favorite/route.ts) |
| 2 | **Collaboration notifications** — remote-save toast, unread tab + toolbar pulse | [`use-document-title.ts`](src/lib/use-document-title.ts), [`BoardEditorToolbar`](src/components/board/BoardEditorToolbar.tsx) |
| 2 | **Snapshot limits** — owner cap, auto-prune, panel count UI | Migration `020`, [`snapshot-prune.ts`](src/lib/db/snapshot-prune.ts) |
| 3 | Command palette v2 (search, section jump, export/share/snapshots) | [`CommandPalette`](src/components/shared/CommandPalette.tsx) |
| 3 | Discover featured row + creator names + share OG tags | [`discover/page.tsx`](src/app/discover/page.tsx), [`share/[id]/page.tsx`](src/app/share/[id]/page.tsx) |
| 3 | **Design system pass** — presence, dashboard, modal scrims | [`board-editor-styles.ts`](src/components/board/board-editor-styles.ts) |
| 4 | **AI brand strategy spike** — suggest + persist on board | Migration `021`, [`POST /api/generate/brand`](src/app/api/generate/brand/route.ts) |

---

### Next priorities (recommended order)

#### 1. Landing & dashboard visual polish (optional)

Incremental hierarchy/contrast pass on light mode (called out in [§ 8](#8-current-known-problems)); defer full redesign.

#### 2. AI design system export (Wave 4)

Downloadable color + type spec from board (extends existing visual export).

---

### Wave 4 — Growth (defer until polish stable)

| Feature | Notes |
|---------|--------|
| AI design system export | Downloadable color + type spec from board |
| Template marketplace | DB, payments, moderation — deferred |
| Advanced reference APIs | Behance, Dribbble (need legitimate APIs) |
| User profiles (`/profile`) | Public creator pages linked from discover |
| Pricing / billing | `/pricing` + Stripe when ready |

---

### Suggested sprints (completed)

| Sprint | Scope | Outcome |
|--------|--------|---------|
| **A** | Collaboration notifications | **Done** — remote-save toast + unread tab/pulse |
| **B** | Snapshot retention/limit | **Done** — migration `020`, cap + auto-prune |
| **C** | Design system pass | **Done** — tokens + presence/read-only/modals |
| **D** | AI brand strategy | **Done** — API + Overview + migration `021` |

### Success checks

- Dashboard: `?visibility=with-others` shows owned boards with members or pending invites; Public/Private unchanged; collaborator badge visible
- Favorites: collaborator can star a shared board; owner's favorite unchanged on same board
- Export: preview matches downloaded PNG/PDF; tags + notes + brand strategy included; PDF page breaks keep rows intact
- Settings: “hide comments after 6 hours” respected after refresh; snapshot cap + auto-prune in Collaboration
- Snapshots: preview before restore; owner can delete; limit enforced; auto-prune removes oldest
- Notifications: remote save surfaces without conflict; unread count in tab title + pulsing toolbar badges when panels closed
- Brand: **Suggest brand** marks board dirty; Save persists strategy; refresh shows Overview block
- Command palette: `⌘K` finds boards by partial title; editor actions open Export / Snapshots / Share

### Out of scope (near term)

- Full real-time co-editing (shared cursor + simultaneous typing in one field)
- Landing page full redesign
- Template marketplace / payments

---

## 13. Current Reality

The project is no longer a starter application.

Implemented:

- Landing page
- Dashboard
- Board creation flow
- Board editor
- Board viewer
- Templates page (focused inline generation UX)
- Settings page
- Theme system (TopBar toggle + settings)
- Analytics
- Accessibility foundation
- Command palette (search, editor actions)
- Toast system
- Modal system (export with live preview)
- Loading states
- Empty states
- Public sharing (`/share/[id]`) and discovery (`/discover`)

Database persistence, Supabase Auth, **progressive AI text generation** (draft → enrich + live preview), **reference photos** (Pexels + Unsplash + manual import), **AI typography, palette & brand suggestions**, **board snapshots** (limits + auto-prune + preview), **collaboration notifications**, **flexible collaboration retention**, **design-system tokens**, **visual export** (JSON / PNG / PDF with live preview), theme sync (including TopBar toggle), production deploy, view-only public sharing, discover (featured + creator names), **team collaboration** (With me / With others filters, collaborator favorites), **real-time co-editing** (section presence cues), **board comments with editing**, **activity replay**, and **command palette v2** are implemented.

**Up next:** [Next plan of action](#next-plan-of-action) — landing/dashboard polish and Wave 4 growth items.

Deferred unless requested:

- Landing page full redesign
- Advanced reference APIs (Behance, Dribbble, etc.)

---

## 14. AI Agent Handoff Notes

If you are an AI agent continuing development in Cursor, Claude, ChatGPT, Copilot, or another environment, treat this README as the project handoff document.

Important context:

- Landing page full redesign was **deferred** (current design preferred)
- Theme **sync** across landing ↔ app is fixed; incremental visual polish remains
- AI generation uses **Gemini free tier** (`gemini-2.5-flash` → `gemini-2.5-flash-lite` → demo fallback) via staged **`POST /api/generate/draft` → `POST /api/generate/enrich`**. Set `GEMINI_API_KEY`, `PEXELS_API_KEY`, and `UNSPLASH_ACCESS_KEY` locally and on Vercel.
- **Progressive preview** — [`GenerationPreview`](src/components/creation/GenerationPreview.tsx) on `/app/new` and `/templates`; templates linger ~4s on completed preview before editor redirect
- **Template-aware Gemini** — `buildTemplateGenerationPrompt()` sends full template context; no post-generation template overlay on the Gemini path
- **TopBar theme toggle** — sun/moon control next to search; persists across navigation
- Boards and settings persist in **Supabase** (per-user, RLS-protected). Sidebar collapse stays in localStorage.
- **Production is deployed** on Vercel — push to `main` triggers redeploy. See [`docs/DEPLOY.md`](docs/DEPLOY.md).
- **Authentication uses Supabase Auth** with proxy protection. See [Database & Persistence (Implemented)](#database--persistence-implemented)
- **View-only sharing** at `/share/[id]` for boards saved with visibility **Shared** (migration `002_shared_board_public_read.sql` applied)
- **Discover** at `/discover` — browse and search public shared boards; featured row + creator names on cards
- **Collaboration** — invite by email with editor/viewer roles; accept at `/invite/[token]`; dashboard **With me** / **With others** / **Public** / **Private** filters; per-member favorites (migration `019`)
- **Real-time co-editing** — presence avatars, section tab highlights, editing badges, live board sync on collaborator save, conflict banner for unsaved local edits (migration `006_board_realtime_comments.sql`)
- **Board comments** — slide-over panel with live sync; `GET/POST/PATCH/DELETE /api/boards/[id]/comments`
- **Board activity + replay** — Activity panel, structured change replay, read/hide, owner-only delete (migrations `008`–`013`; verify with `npm run verify:collaboration`)
- **Collaboration retention** — flexible hide/purge units in Settings (migration `018`)
- **Reference photos** — Pexels → Unsplash → placeholder during enrich + **Find photo**; **Apply URL** / **Upload file** in reference editor. See [`docs/REFERENCE_PHOTOS.md`](docs/REFERENCE_PHOTOS.md)
- **AI typography & palette** — **Suggest typography/palette** via generate APIs
- **AI brand strategy** — **Suggest brand** on Overview; persisted on board (migration `021`)
- **Collaboration notifications** — remote-save toast, unread tab title, toolbar pulse
- **Snapshot limits** — owner cap + auto-prune (migration `020`)
- **Visual export** — JSON / PNG / PDF with live Visual + JSON preview; tags, notes, and brand strategy in visual export; block-based PDF page breaks. See [Visual Board Export (Implemented)](#visual-board-export-implemented)
- **Board snapshots** — save/restore, preview modal, auto-backup before restore, count/limit UI (migrations `015`/`017`/`020`)
- **Command palette v2** — fuzzy board search, editor section jump, Export / Snapshots / Share actions
- **Share OG tags** — Open Graph meta on `/share/[id]`
- **Design system Phase 1–3:** board editor + collaboration/creation + presence/dashboard/modal tokens in [`board-editor-styles.ts`](src/components/board/board-editor-styles.ts)
- **Next plan of action:** [§ Next plan of action](#next-plan-of-action) — landing polish and Wave 4 growth
- Board editor handles refresh correctly (loads from Supabase after hydration; no false "not found")
- Settings controls are all wired to real behavior (theme, reduce motion / focus rings, default visibility, presentation mode, workspace identity)

When resuming work, follow [Next plan of action](#next-plan-of-action): optional landing/dashboard polish, then Wave 4 growth (design-system export, profiles, billing).

---

## 15. License

Private project. All rights reserved.

---

## 16. End of Handoff Document

This README should be treated as the primary project handoff reference until superseded by a future version.