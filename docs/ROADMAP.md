# Roadmap

Shipped work, next priorities, and future scope for MoodBoard AI.

Back to [README](../README.md) · Features: [FEATURES](FEATURES.md) · Deploy: [DEPLOY](DEPLOY.md)

## Current status

Waves 1–3 and Sprints A–P are **complete**. The app is a **portfolio-grade MVP** — feature-complete for demo and job-search use. Supabase persistence, collaboration (presence, sync-on-save, conflict banner), AI generation, snapshots, visual export, developer handoff tokens, public creator profiles, inspiration/help surfaces, command palette AI actions, Discover browsing, email auth with forgot password, board auto-save, and share/profile OG metadata are all shipped. Monetization (marketplace, pricing, Stripe) is **not planned near term**.

**Ops:** Migrations through **`026`** should be applied on production Supabase — verify with `npm run verify:collaboration`.

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
| 30 | Visual polish pass | Shared [`app-surface-styles.ts`](../src/components/shared/app-surface-styles.ts); tokenized landing, dashboard, discover, templates, settings; light-mode hierarchy improvements |
| 31 | Changelog page | Public `/changelog` with shipped sprint entries |
| 32 | Command palette templates | `⌘K` template search navigates to `/templates?focus=<id>` with scroll highlight |
| 33 | Snapshot mark-seen | Preview + per-row eye mark advances `snapshots_last_read_at` watermark |
| 34 | Help hub | `/help` FAQ accordion + in-app deep links |
| 35 | Palette AI commands | `⌘K` suggest brand, palette, typography from editor |
| 36 | Editor scrim tokens | Modal/panel scrims use `--overlay-scrim` |
| 37 | Discover mood browse | Mood filter **dropdown** on `/discover` with `?mood=` deep links |
| 38 | Demo public boards | `db:seed-demo-boards` seeds shared showcase boards for Discover |
| 39 | Creator identity | Display name (`profiles.name`) on profiles + Settings; workspace name stays separate |
| 40 | Profile photos | Custom avatar upload + crop; migration `024`; remove photo via X on avatar tile in Settings |
| 41 | Share / remix polish | Creator attribution, Discover nav on share/profile, prompt pre-fill from share |
| 42 | Auth completeness | Forgot password on `/sign-in`; `/auth/callback` code exchange for reset links |
| 43 | Portfolio metadata | Favicon, default OG image, per-route meta for Discover, share, profile |
| 44 | Comments scrim | Comments panel uses `--overlay-scrim` like other modals |
| 45 | Profile shell | Public `/profile/[id]` uses shared landing header via `profile/layout.tsx` |
| 46 | Board auto-save | Debounced editor auto-save alongside manual Save changes + confirmation modal |
| 47 | Auto-save settings | Configurable interval Off / 5s / 8s / 10s in Settings (migration `025`) |
| 48 | Landing polish | Softer hero gradients; elevated feature cards for light-mode hierarchy |
| 49 | Password reset hardening | `/auth/callback` handles `token_hash` recovery links + clearer error copy |
| 50 | Live field sync | Debounced field patches for summary + notes; collaborator field highlights; active field presence |
| 51 | Community templates | Save board as template; Community tab on `/templates`; enrich pipeline from saved templates |
| 52 | Notification toast prefs | Settings toggles for auto-save and remote-save toasts (migration `026`) |
| 53 | Presentation progress | Section dots + `n / 5` indicator in presentation mode; simplified read-only chrome |
| 54 | Discover remix auth | Remix button redirects unauthenticated users to sign-in via auth store |

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
| **H** | Visual polish | App-wide surface tokens, shadow/CSS var cleanup, light-mode contrast |
| **I** | Changelog + palette templates | `/changelog` page; command palette template navigation |
| **J** | Product surfaces + polish | Snapshot mark-seen; `/help`; palette AI; editor scrim tokens |
| **L** | Discover + identity polish | Demo shared boards seed; mood dropdown; display name; avatar photo + crop (`024`); share/remix UX |
| **M** | Auth + portfolio surface | Forgot password; favicon/OG meta; remove avatar photo; comments scrim |
| **N** | Portfolio capture | README screenshots + prod smoke scripts |
| **O** | Board auto-save | Debounced save + manual Save unchanged |
| **O+** | Auto-save follow-ups | Settings interval; auto-save skips Activity noise |
| **P** | Landing + auth reliability | Landing hierarchy polish; password reset callback hardening |
| **Q** | Live field sync | Field-level broadcast for summary + notes; collaborator highlights; active field in presence |
| **R** | Community templates | Save as template modal; Community tab; `templateToBoard` + enrich for community templates |
| **S** | Notifications + presentation | Toast preference toggles (`026`); presentation section progress; Discover remix auth fix |
| **T** | Verification + docs | Migration verify script; prod smoke Community tab check; roadmap/features/changelog updates |

---

## Next priorities

**Portfolio MVP:** no required features remain. Optional follow-ups only.

| Priority | Sprint | Scope | When |
|----------|--------|-------|------|
| 1 (optional) | — | Behance / Dribbble reference APIs | When legitimate API keys are available |
| 2 (optional) | — | Incremental landing / dashboard visual polish | Portfolio refresh |
| 3 (long-term) | — | Live cursors / character-level co-editing | Upgrade on top of existing field sync + sync-on-save collaboration |

**Deferred / parked:** OAuth, marketplace, pricing/Stripe, full landing redesign.

**Prod verification:** `npm run verify:prod-smoke` · `npm run verify:collaboration` · refresh README screenshots via `npm run capture:screenshots`

---

## Wave 4 — Growth (future / not planned now)

| Feature | Notes |
|---------|--------|
| Template marketplace | DB, payments, moderation — **parked** |
| Advanced reference APIs | Behance, Dribbble (need legitimate APIs) |
| Pricing / billing | `/pricing` + Stripe — **parked** |

---

## Planned pages (not built)

| Route | Purpose | Status |
|-------|---------|--------|
| `/discover` | Browse public boards | **Shipped** |
| `/marketplace` | Premium templates | Future / not planned |
| `/pricing` | Subscription plans | Future / not planned |
| `/help` | Documentation and support | **Shipped** |
| `/changelog` | Product updates | **Shipped** |
| `/profile` | User profiles | **Shipped** |

`/explore` was removed as a duplicate of Discover (same public boards); `/explore` permanently redirects to `/discover` for bookmarks.

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
- Unseen UX: yellow dot on collaborator comments/activity/snapshots; own posts never unread; mark via read button, **Preview**, **View in section** / **Show on board** / **Mark all as seen** (migration `023` for snapshots)
- View mode: one section heading per tab — no duplicate titles inside cards
- Collapsed sidebar: nav icons stack vertically; expand control centered at bottom
- Visual polish: landing, dashboard, discover, templates, and settings use shared surface tokens; light mode has clearer card hierarchy (`--surface-elevated` on white cards)
- Changelog: `/changelog` lists shipped sprints; linked from landing header
- Discover: `/discover` lists public boards with search; mood filter **dropdown** + `?mood=` deep links; landing nav active pill on discover, share, and profile routes
- Demo boards: `npm run db:seed-demo-boards` after `db:seed-demo` populates shared showcase boards on the demo account
- Profiles: creator **display name** from `profiles.name` (not workspace name); Settings edits name via `PATCH /api/profile/me`
- Avatars: custom photo upload + crop in Settings; X on avatar tile removes photo and reverts to emoji/initials; migration `024`
- Auth: forgot password email flow → `/auth/callback` → update-password screen; email/password + demo only (no OAuth); callback supports PKCE `code` and `token_hash` recovery links
- Board auto-save: edits auto-save after idle debounce (default 8s); **Changes auto-saved.** toast after server confirms; manual Save changes + confirmation modal unchanged; Settings → Editor interval Off / 5s / 8s / 10s (migration `025`)
- Landing: softer hero gradients and elevated feature cards for light-mode hierarchy
- Profile pages: `/profile/[id]` uses landing header shell; creator display name + shared boards grid
- OG meta: default favicon + opengraph image; Discover, share, and profile routes set title/description (share uses board cover when available)
- `/explore` redirects permanently to `/discover`
- Command palette templates: `⌘K` → template name → opens `/templates?focus=<id>` with scroll highlight
- Help: `/help` FAQ sections + deep links; GitHub support link
- Command palette AI: `⌘K` on editor board → suggest brand, palette, typography
- Field sync: collaborator highlights on summary + note fields; debounced live patches while editing
- Community templates: owners save boards as templates; Community tab lists public templates from `/api/templates`
- Notification toasts: Settings → Notifications toggles for auto-save and remote-save toasts (migration `026`)
- Presentation mode: section progress dots and `n / 5` counter; simplified header chrome
- Discover remix: unauthenticated users redirect to sign-in before remix API call

---

## Out of scope (near term)

- Google / GitHub OAuth sign-in — **deferred**
- Full real-time co-editing (shared cursor + simultaneous typing in one field)
- Landing page full redesign
- Template marketplace / payments — **not planned near term**
