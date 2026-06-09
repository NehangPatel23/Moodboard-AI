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
- **Real-time co-editing** — presence, section highlights, live board sync, conflict banner (migration `006`).
- **Board comments** — `GET/POST/PATCH/DELETE /api/boards/[id]/comments`.
- **Board activity + replay** — migrations `008`–`013`; verify with `npm run verify:collaboration`.
- **Collaboration retention** — migration `018`.
- **Reference photos** — [REFERENCE_PHOTOS](REFERENCE_PHOTOS.md).
- **AI suggestions** — typography, palette, brand (`021` for persisted brand strategy).
- **Collaboration notifications** — remote-save toast, unread tab title, toolbar pulse.
- **Snapshot limits** — migration `020`.
- **Visual export** — JSON / PNG / PDF with live preview; brand strategy in visual export. See [SYSTEMS](SYSTEMS.md#visual-board-export).
- **Design tokens** — [`board-editor-styles.ts`](../src/components/board/board-editor-styles.ts) (editor, presence, dashboard, modals).
- Board editor loads from Supabase after hydration (no false "not found").
- Settings controls are wired to real behavior (theme, reduce motion, focus rings, default visibility, presentation mode, workspace identity).

---

## When resuming work

Follow [ROADMAP](ROADMAP.md): optional landing/dashboard polish, then Wave 4 growth (design-system export, profiles, billing).

Run migrations through **`021`** in production if not applied — see [DEPLOY](DEPLOY.md#step-5c--apply-latest-migrations-020021).
