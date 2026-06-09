# Roadmap

Shipped work, next priorities, and future scope for MoodBoard AI.

Back to [README](../README.md) · Features: [FEATURES](FEATURES.md) · Deploy: [DEPLOY](DEPLOY.md)

## Current status

Waves 1–3 and Sprints A–F are **complete**, plus **collaboration polish** (Sprint G). The app is a deployed MVP with Supabase persistence, collaboration, AI generation, snapshots, visual export, developer handoff tokens, and public creator profiles. Next focus: optional landing/dashboard polish, then remaining Wave 4 growth items.

---

## Shipped

| # | Area | Outcome |
|---|------|---------|
| 0 | Authentication | Supabase Auth, proxy, gated CTAs, redirect-back — see [SYSTEMS](SYSTEMS.md#authentication--gated-landing-ctas) |
| 1 | Database | Supabase boards, settings, RLS — see [SYSTEMS](SYSTEMS.md#database--persistence) |
| 2 | Landing redesign | **Deferred** — incremental polish only |
| 3 | AI pipeline | Draft → enrich with progressive preview — see [SYSTEMS](SYSTEMS.md#ai-generation) |
| 4 | Design system | Semantic tokens via [`board-editor-styles.ts`](../src/components/board/board-editor-styles.ts) |
| 5 | Production deploy | Vercel + Supabase — [DEPLOY](DEPLOY.md) |
| 6 | Discover | Public browse at `/discover` |
| 7 | Collaboration MVP | Invites, owner/editor/viewer roles |
| 8 | Real-time + comments | Presence, live sync, conflict banner, comments panel |
| 9 | Activity + replay | Structured change replay, read/hide, retention |
| 10 | Reference photos | Pexels → Unsplash → placeholder; URL upload — [REFERENCE_PHOTOS](REFERENCE_PHOTOS.md) |
| 11 | Comment editing | Inline edit + Realtime UPDATE |
| 12 | Typography + export | Suggest typography/palette; JSON/PNG/PDF export — [SYSTEMS](SYSTEMS.md#visual-board-export) |
| 13 | Collaboration retention | Flexible hide/purge units (migration `018`) |
| 14 | Snapshots UX | Preview modal, auto-backup before restore |
| 15 | Collaborator cues | Section tab highlights, editing badges |
| 16 | Command palette v2 | Fuzzy search, section jump, export/share/snapshots |
| 17 | Discover polish | Featured row, creator names, share OG tags |
| 18 | Dashboard filters | With others, Public/Private, collaborator badge, favorites (`019`) |
| 19 | Collaboration notifications | Remote-save toast, unread tab title, toolbar pulse |
| 20 | Snapshot limits | Owner cap + auto-prune (migration `020`) |
| 21 | Design system pass | Presence, dashboard, modal scrims, read-only tokens |
| 22 | AI brand strategy | `POST /api/generate/brand`, persisted on board (migration `021`) |
| 23 | AI design system export | CSS, Tailwind, tokens JSON, Markdown + `POST /api/generate/design-system` — see [SYSTEMS](SYSTEMS.md#design-system-export) |
| 24 | User profiles | `/profile/[id]` public creator page + `GET /api/profile/[id]`; Discover creator links |
| 25 | Section-linked comments | `section` on `board_comments` (migration `022`); badges, **View in section**, composer context |
| 26 | Collaboration unseen UX | Yellow-dot unread on comments, activity, snapshots; own-content excluded; explicit mark-read only |
| 27 | Snapshots unread | `snapshots_last_read_at` on collaboration state (migration `023`); toolbar badge + realtime INSERT |
| 28 | Custom tooltips | Frosted [`tooltip.tsx`](../src/components/ui/tooltip.tsx) on icon-only controls; sidebar collapsed layout fix |
| 29 | View mode polish | Deduplicated section headings in read-only / presentation mode |

### Sprint summary (completed)

| Sprint | Scope | Outcome |
|--------|--------|---------|
| **A** | Collaboration notifications | Remote-save toast + unread tab/pulse |
| **B** | Snapshot limits | Migration `020`, cap + auto-prune |
| **C** | Design system pass | Tokens + presence/read-only/modals |
| **D** | AI brand strategy | API + Overview + migration `021` |
| **E** | AI design system export | ExportModal tab + deterministic + AI token naming |
| **F** | User profiles | Public profile page + Discover creator links |
| **G** | Collaboration polish | Section comments (`022`), unseen UX, snapshot unread (`023`), tooltips, view-mode headings |

---

## Next priorities

1. **Landing & dashboard visual polish** (optional) — hierarchy/contrast on light mode; full redesign remains deferred. See [DEVELOPMENT](DEVELOPMENT.md#current-known-problems).

---

## Wave 4 — Growth (defer until polish stable)

| Feature | Notes |
|---------|--------|
| Template marketplace | DB, payments, moderation |
| Advanced reference APIs | Behance, Dribbble (need legitimate APIs) |
| Pricing / billing | `/pricing` + Stripe |

---

## Planned pages (not built)

| Route | Purpose | Status |
|-------|---------|--------|
| `/discover` | Browse public boards | **Shipped** |
| `/explore` | Creative inspiration feed | Planned |
| `/marketplace` | Premium templates | Planned |
| `/pricing` | Subscription plans | Planned |
| `/help` | Documentation and support | Planned |
| `/changelog` | Product updates | Planned |
| `/profile` | User profiles | **Shipped** |

---

## Success checks

Use these for manual QA after changes:

- Dashboard: `?visibility=with-others` shows owned boards with collaborators; Public/Private unchanged; collaborator badge visible
- Favorites: collaborator can star a shared board; owner's favorite is independent
- Export: preview matches PNG/PDF; tags, notes, brand strategy included; PDF page breaks keep rows intact
- Settings: hide/purge retention respected after refresh; snapshot cap + auto-prune in Collaboration
- Snapshots: preview before restore; owner can delete; limit enforced; auto-prune removes oldest
- Notifications: remote save toast when draft clean; unread count in tab title + pulsing toolbar badges
- Brand: **Suggest brand** marks board dirty; Save persists; refresh shows Overview block
- Design system export: Export modal **Design system** tab shows CSS/Tailwind/JSON/Markdown preview; downloads match preview; **Enhance with AI** works without `GEMINI_API_KEY` (deterministic fallback)
- Profiles: Discover creator name links to `/profile/[id]`; profile shows workspace identity + shared boards only; private boards hidden
- Command palette: `⌘K` finds boards; editor actions open Export / Snapshots / Share
- Section comments: post from a tab → comment shows section badge; **View in section** switches tabs and highlights content (migration `022`)
- Unseen UX: yellow dot on collaborator comments/activity/snapshots; own posts never unread; mark via read button or **View in section** / **Show on board** / **Mark all as seen** (migration `023` for snapshots)
- View mode: one section heading per tab — no duplicate titles inside cards
- Collapsed sidebar: nav icons stack vertically; expand control centered at bottom

---

## Out of scope (near term)

- Full real-time co-editing (shared cursor + simultaneous typing in one field)
- Landing page full redesign
- Template marketplace / payments
