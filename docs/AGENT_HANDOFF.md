# Agent handoff

Notes for AI agents and contributors continuing development in Cursor or other environments.

Back to [README](../README.md) · Roadmap: [ROADMAP](ROADMAP.md) · Features: [FEATURES](FEATURES.md)

Also read [`AGENTS.md`](../AGENTS.md) for Next.js framework conventions (this project uses Next.js 16 with breaking API differences).

Flow diagrams: [README § App flow](../README.md#app-flow) · [ARCHITECTURE](ARCHITECTURE.md) · [SYSTEMS](SYSTEMS.md) · [FEATURES § Page flow](FEATURES.md#page-flow)

---

## Where to look

```mermaid
flowchart TD
  start(["New to the codebase?"]) --> readme["README — product + quick start"]
  readme --> task{"What do you need?"}

  task -->|Run locally| setup["MANUAL_SETUP + SUPABASE_SETUP"]
  task -->|Understand pages| features["FEATURES.md"]
  task -->|Auth / AI / DB / export| systems["SYSTEMS.md"]
  task -->|Stack + folders| arch["ARCHITECTURE.md"]
  task -->|What's done / next| roadmap["ROADMAP.md"]
  task -->|Deploy / migrations| deploy["DEPLOY.md"]
  task -->|A11y / theme / bugs| dev["DEVELOPMENT.md"]

  systems --> code["src/app/api, src/lib, src/components"]
  arch --> code
  features --> code
```

| Topic | Document |
|-------|----------|
| Quick start | [README](../README.md) |
| Stack & folders | [ARCHITECTURE](ARCHITECTURE.md) |
| Auth, DB, AI, export | [SYSTEMS](SYSTEMS.md) |
| Page-by-page features | [FEATURES](FEATURES.md) |
| A11y, theme, known issues | [DEVELOPMENT](DEVELOPMENT.md) |
| Shipped vs planned | [ROADMAP](ROADMAP.md) |
| Production deploy | [DEPLOY](DEPLOY.md) |

---

## Important context

- Landing page full redesign was **deferred** (current design preferred).
- Theme **sync** across landing ↔ app is fixed; incremental visual polish remains.
- AI generation uses **Gemini free tier** (`gemini-2.5-flash` → `gemini-2.5-flash-lite` → demo fallback) via **`POST /api/generate/draft` → `POST /api/generate/enrich`**. Set `GEMINI_API_KEY`, `PEXELS_API_KEY`, and `UNSPLASH_ACCESS_KEY` locally and on Vercel.
- **Progressive preview** — [`GenerationPreview`](../src/components/creation/GenerationPreview.tsx) on `/app/new` and `/templates`; templates linger ~4s on completed preview before editor redirect.
- **Template-aware Gemini** — `buildTemplateGenerationPrompt()` sends full template context; no post-generation template overlay on the Gemini path.
- **TopBar theme toggle** — sun/moon control next to search; persists across navigation.
- Boards and settings persist in **Supabase** (per-user, RLS-protected). Sidebar collapse stays in localStorage.
- **Production is deployed** on Vercel — push to `main` triggers redeploy. See [DEPLOY](DEPLOY.md).
- **Authentication** — Supabase Auth with proxy protection. See [SYSTEMS](SYSTEMS.md#database--persistence).
- **View-only sharing** at `/share/[id]` for boards with visibility **Shared** (migration `002`).
- **Discover** at `/discover` — featured row + creator names on cards.
- **Collaboration** — invite by email; dashboard **With me** / **With others** / **Public** / **Private** filters; per-member favorites (migration `019`).
- **Real-time co-editing** — presence dots on section tabs, live board sync, conflict banner (migration `006`). **Live field sync** for summary + notes (Sprint Q). Presence reconnect + grace period; migration `028` for private field-sync broadcast. Section metadata: [`editor-sections.ts`](../src/lib/editor-sections.ts).
- **Community templates** — save boards as templates; Community tab on `/templates`; `board_templates` table + `/api/templates` (Sprint R).
- **Board comments** — `GET/POST/PATCH/DELETE /api/boards/[id]/comments`; `section` column (migration `022`) links comments to editor tabs.
- **Collaboration unread** — yellow-dot unseen on comments, activity, snapshots; own content excluded ([`collaboration-read-state.ts`](../src/lib/collaboration-read-state.ts)). Snapshots last-read: migration `023`. Mark read explicitly — panels do not auto-clear on open.
- **Board activity + replay** — migrations `008`–`013`; verify with `npm run verify:collaboration`.
- **Collaboration retention** — migration `018`.
- **Reference photos** — [REFERENCE_PHOTOS](REFERENCE_PHOTOS.md).
- **AI suggestions** — typography, palette, brand (`021` for persisted brand strategy).
- **Collaboration notifications** — remote-save toast (toggle in Settings), unread tab title, toolbar pulse.
- **Notification toast prefs** — migration `026`; Settings → Notifications section.
- **Snapshot limits** — migration `020`.
- **Visual export** — JSON / PNG / PDF with live preview; brand strategy in visual export. See [SYSTEMS](SYSTEMS.md#visual-board-export).
- **Design system export** — CSS, Tailwind, tokens JSON, Markdown from Export modal; optional AI token naming via `POST /api/generate/design-system`.
- **User profiles** — `/profile/[id]` public creator page; `GET /api/profile/[id]`; Discover creator name links.
- **Design tokens** — [`board-editor-styles.ts`](../src/components/board/board-editor-styles.ts) (editor, presence, dashboard, modals); [`app-surface-styles.ts`](../src/components/shared/app-surface-styles.ts) (landing, discover, templates, settings shells).
- **Changelog** — `/changelog` public product updates; entries in [`changelog-entries.ts`](../src/lib/changelog-entries.ts).
- **Command palette templates** — `⌘K` template search → `/templates?focus=<id>` with scroll highlight.
- **Help** — `/help` docs hub in landing nav + palette.
- **Snapshot mark-seen** — preview or eye button advances `snapshots_last_read_at` via `markSnapshotId` PATCH.
- **Palette AI** — `⌘K` → suggest brand / palette / typography on editor boards.
- **Discover moods** — `/discover` mood filter **dropdown** + `?mood=` URL; logic in [`discover-moods.ts`](../src/lib/discover-moods.ts).
- **Creator display name** — public profiles use `profiles.name`; Settings **Your name** via `PATCH /api/profile/me`; workspace name stays separate.
- **Profile photos** — upload + crop in Settings; migration `024`; red **X** on the avatar tile calls `DELETE /api/profile/avatar/upload` to remove the photo.
- **Profile layout** — [`src/app/profile/layout.tsx`](../src/app/profile/layout.tsx) wraps public profiles with [`LandingHeader`](../src/components/landing/LandingHeader.tsx) (same shell as landing/discover).
- **Share / remix** — full-board remix on Discover and share pages via `POST /api/boards/[id]/remix` ([`RemixBoardButton`](../src/components/shared/RemixBoardButton.tsx)); creator link on share page; Discover nav active on `/share` and `/profile`.
- **Discover view counts** — `view_count` on shared boards (migration `032`); `POST /api/boards/[id]/view` on share page load; shown on Discover cards and share badge.
- **Snapshot diff** — [`SnapshotDiffModal`](../src/components/board/SnapshotDiffModal.tsx) compares a snapshot to the current board or another snapshot via `diffBoards`.
- **Mobile nav** — bottom tab bar includes Discover and Settings ([`MobileNav`](../src/components/layout/MobileNav.tsx)).
- **Auth** — email/password sign-in and sign-up, demo account, and **forgot password** (`requestPasswordReset` → email → [`/auth/callback`](../src/app/auth/callback/route.ts) → `/sign-in?mode=update-password`). Callback handles PKCE `code` and `token_hash` recovery links. OAuth (Google/GitHub) is **not implemented** — deferred.
- **Invite emails** — [`send-invite-email.ts`](../src/lib/send-invite-email.ts) sends Resend transactional mail on invite create/re-invite when `RESEND_API_KEY` + `RESEND_FROM_EMAIL` are set.
- **Board auto-save** — [`use-board-auto-save.ts`](../src/lib/use-board-auto-save.ts) debounces PATCH saves; manual Save + confirmation modal unchanged ([`BoardEditorClient.tsx`](../src/components/board/BoardEditorClient.tsx)). Interval in Settings (migration `025`); auto saves omit Activity noise via `saveSource: 'auto'`. Success toast **Changes auto-saved.** fires only when `autosaveToastEnabled` is on (migration `026`).
- **Landing polish** — softer hero gradients and `--surface-elevated` feature cards in [`app-surface-styles.ts`](../src/components/shared/app-surface-styles.ts).
- **Portfolio metadata** — favicon ([`public/icon.svg`](../public/icon.svg) via [`AppIcon`](../src/components/shared/AppIcon.tsx)), default OG image ([`opengraph-image.tsx`](../src/app/opengraph-image.tsx)), route meta for Discover/share/profile ([`site-metadata.ts`](../src/lib/site-metadata.ts)).
- **Comments scrim** — panel backdrop uses `--overlay-scrim` token.
- **Demo boards seed** — `npm run db:seed-demo-boards` (after `db:seed-demo`) populates shared showcase boards.
- **Tooltips** — [`tooltip.tsx`](../src/components/ui/tooltip.tsx) + `Button` `tooltip` prop. Use `triggerClassName="block w-full"` when wrapping full-width grid/card triggers; default wrapper is `inline-flex` (breaks vertical nav lists if parent is not `flex-col`).
- **View mode** — [`BoardReadOnlyClient.tsx`](../src/components/board/BoardReadOnlyClient.tsx): one section heading per tab; presentation mode shows section progress dots + `n / 5`.
- Board editor loads from Supabase after hydration (no false "not found").
- Settings controls are wired to real behavior (theme, reduce motion, focus rings, default visibility, presentation mode, workspace identity).

---

## Project status: complete

**The portfolio build is finished** (Sprints A–X + closure sprint + final wrap-up). The live demo, docs, CI, and smoke tests reflect a shippable product — not an active roadmap. Treat new work as optional enhancements only.

## When resuming work

**Portfolio MVP is complete** (Sprints A–X + closure sprint). Collaboration includes sync-on-save, field-level patches for summary/notes, conflict handling, and optional Resend invite emails — not full Google Docs–style simultaneous typing (long-term upgrade).

**Closure sprint:** GitHub Actions CI (`.github/workflows/ci.yml`) runs lint, typecheck, build, and smoke on `main`; `npm run test:smoke`, `/sitemap.xml`, `/robots.txt`, and [`send-invite-email.ts`](../src/lib/send-invite-email.ts) for collaboration invites.

If continuing development, recommended order:

1. **Live cursors / character-level co-editing** — build on existing field sync + presence layer
2. **Behance / Dribbble reference APIs** (only with legitimate API access)

Run migrations through **`032`** in production if not applied — see [DEPLOY](DEPLOY.md#step-5j--apply-view-counts-migration-032). Verify with `npm run verify:collaboration` and `npm run verify:prod-smoke`.
