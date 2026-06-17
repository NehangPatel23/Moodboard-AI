# Features

Implemented product features by page and module.

Back to [README](../README.md) · Subsystems: [SYSTEMS](SYSTEMS.md) · Roadmap: [ROADMAP](ROADMAP.md)

User-facing flow diagrams: [README § App flow](../README.md#app-flow)

## Page flow

How users move between major surfaces. See [SYSTEMS](SYSTEMS.md) for API and persistence detail.

```mermaid
flowchart TB
  landing["Landing /"] --> signin["Sign in"]
  landing --> discover["Discover /discover"]

  signin --> dash["Dashboard /app"]
  dash --> new["New board /app/new"]
  dash --> tmpl["Templates /templates"]
  dash --> edit["Board editor /app/boards/id"]
  dash --> sett["Settings /settings"]

  new --> gen["AI generation + live preview"]
  tmpl --> gen
  gen --> edit

  edit --> share["View-only /share/id"]
  edit --> collab["Invite collaborators"]
  edit --> export["Export JSON PNG PDF design system"]
  edit --> snap["Snapshots"]

  discover --> share
  collab --> invite["Accept /invite/token"]
  invite --> edit
```

---

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
- [`CollaborateModal`](../src/components/shared/CollaborateModal.tsx) calls `reloadBoards()` after invite/member changes so filters stay fresh.

#### Empty States

Implemented.

#### Loading States

Implemented.

#### Accessibility

Implemented.

---

### App Shell

Implemented across authenticated routes (`/app`, `/settings`, `/templates`, board editor):

- **Sidebar** — navigation, workspace avatar, collapse state in `localStorage`; collapsed mode shows icon-only nav with tooltips and a bottom-aligned expand control
- **TopBar** — brand link, search / `⌘K` command palette trigger, **sun/moon theme toggle** ([`ThemeToggle`](../src/components/shared/ThemeToggle.tsx)), account menu
- **Tooltips** — frosted custom tooltips ([`tooltip.tsx`](../src/components/ui/tooltip.tsx)) on icon-only controls; supplementary hints use a longer delay when visible labels exist
- **Surface tokens** — shared shells, cards, buttons, and preview tiles via [`app-surface-styles.ts`](../src/components/shared/app-surface-styles.ts)
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
- Watch a **live progressive preview** ([`GenerationPreview`](../src/components/creation/GenerationPreview.tsx)) as the draft arrives and Pexels references fill in one-by-one
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

#### Tabbed sections

Overview, Palette, Typography, References, and Notes — jump via editor tabs or command palette (`⌘K`).

#### AI suggestions

- **Suggest palette** — `POST /api/generate/palette`
- **Suggest typography** — `POST /api/generate/typography`
- **Suggest brand** — `POST /api/generate/brand` on Overview; persisted on board as `brandStrategy` (migration `021`)

#### Actions

Implemented:

- Share / Collaborate (public link + people management — owner only)
- Export (JSON, PNG, PDF, design system — with live preview)
- Duplicate
- Snapshots (save, preview, restore, auto-backup before restore; cap + auto-prune via migration `020`)

#### Team collaboration

Routes & APIs:

```txt
/invite/[token]                    # Accept email invite (sign-in required)
POST /api/boards/[id]/members      # Invite by email (owner)
GET  /api/boards/[id]/members      # List collaborators
DELETE /api/boards/[id]/members/[userId]
GET  /api/boards/[id]/invites      # Pending invites
POST /api/invites/[token]/accept   # Accept invite
POST /api/boards/[id]/favorite     # Per-member favorite (migration 019)
```

- **Roles** — owner, editor (can edit), viewer (read-only)
- **Email invites** — existing users get access immediately; new users use `/invite/[token]`
- Requires migration `003_board_collaboration.sql`

**Real-time co-editing** (migration `006`):

- Supabase Realtime presence on `board:{id}` — avatars + online count in header
- **Section presence** — colored dots on section tabs match each collaborator’s avatar color ([`EditorTabPill`](../src/components/board/BoardEditorClient.tsx)); shared section metadata lives in [`editor-sections.ts`](../src/lib/editor-sections.ts)
- Switching tabs scrolls the tab bar below the app top bar so tabs stay visible
- Live board sync via `postgres_changes` on `boards` when local draft is clean
- Conflict banner on unsaved local edits when a collaborator saves — **Reload** or **Keep editing**

**Board comments** (migration `022` adds `section`):

```txt
GET    /api/boards/[id]/comments
POST   /api/boards/[id]/comments
PATCH  /api/boards/[id]/comments/[commentId]
DELETE /api/boards/[id]/comments/[commentId]
```

- Slide-over comments panel (owner, editor, viewer)
- Comments store the active editor section (`overview`, `palette`, `typography`, `references`, `notes`) with section badges in the thread
- **View in {section}** jumps the editor to that tab and briefly highlights the section content
- Composer shows which section you are commenting from
- Live sync via Realtime on `board_comments` (INSERT, UPDATE, DELETE)
- Authors edit own comments; owners edit or delete any comment

**Unread / unseen collaboration items:**

- Yellow dot + **Unseen** tooltip on unread comments, activity entries, and snapshots ([`CollaborationUnseenIndicator`](../src/components/board/CollaborationUnseenIndicator.tsx))
- Your own comments, activity, and snapshots never count as unread ([`collaboration-read-state.ts`](../src/lib/collaboration-read-state.ts))
- Items stay unseen until explicitly marked — eye/read button, **Preview**, **View in {section}**, **Show on board**, or **Mark all as seen** (panels do not auto-mark on open)
- Toolbar badges on Comments, Activity, and Snapshots buttons; tab title unread count when applicable

**Activity + replay** (migrations `008`–`013`):

- Activity panel with structured change replay, read/hide, owner-only delete
- Activity entries show section badge(s) for the editor tab(s) that changed; **Tags** popover in the panel header lists updated sections
- **Show on board** marks activity read and jumps to the relevant section
- Collaboration retention settings in Settings (migration `018`)
- Verify with `npm run verify:collaboration`

**Snapshots unread** (migration `023`):

- `snapshots_last_read_at` on `board_collaboration_state` per user
- New snapshots from collaborators show an unread dot until marked seen
- Snapshot count in the panel header updates immediately after delete

**Notifications:**

- Remote-save toast when local draft is clean
- Unread count in tab title + pulsing toolbar badges on Comments / Activity / Snapshots

Planned: live cursors and character-level sync in a single field.

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
- **Single section heading** per tab — outer section label + description only (no duplicate card titles inside content panels)

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
- **Creator attribution** — creator name on cards via `profiles` join; links to `/profile/[id]`
- Cards link to `/share/[id]` view-only presentation
- `GET /api/discover` — public list of shared boards (newest first, up to 48)

---

### Profile Page

Route:

```txt
/profile/[id]
```

Implemented:

- Public creator profile (no sign-in required)
- Workspace name, tagline, and avatar from `user_settings` (falls back to profile name + defaults)
- Grid of **shared** boards by that creator (reuses Discover card component)
- `GET /api/profile/[id]` — profile identity + shared boards (admin client; email not exposed)

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

**Use template** runs the same draft → enrich pipeline as prompt creation. Gemini receives full template context (palette, typography, notes, references) via `buildTemplateGenerationPrompt()` in [`src/lib/ai-generate.ts`](../src/lib/ai-generate.ts).

During creation:

- **Focused grid view** — only the active template card stays visible; others hide
- **Gemini gradient button** ([`TemplateUseTemplateButton`](../src/components/creation/TemplateUseTemplateButton.tsx)) while generating
- **Inline preview** below the active card ([`TemplateGenerationPanel`](../src/components/creation/TemplateGenerationPanel.tsx) + `GenerationPreview`); modal path shows the same preview inside the modal
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
- Migration `018_user_settings_retention_duration.sql`; legacy day-only values map on read via [`retention-duration.ts`](../src/lib/retention-duration.ts)

#### Data Tools

- Import boards (JSON)
- Export boards (JSON backup, PNG moodboard, PDF printable summary, or design system tokens)
- **Reset preferences** (restores settings to defaults, keeps boards)
- **Danger zone** reset (deletes all boards and restores defaults)
- Cloud sync status indicator

---

### Help Page

Route:

```txt
/help
```

Implemented:

- FAQ accordion with getting started, boards/AI, collaboration, export, discover, settings
- In-app deep links and GitHub issues support link
- Static content in [`help-sections.ts`](../src/lib/help-sections.ts)

---

### Changelog Page

Route:

```txt
/changelog
```

Implemented:

- Public product updates page with shipped sprint entries ([`changelog-entries.ts`](../src/lib/changelog-entries.ts))
- Linked from landing header alongside Discover and About
- Uses shared [`app-surface-styles.ts`](../src/components/shared/app-surface-styles.ts)

---

### Command Palette

Implemented.

Shortcut:

```txt
⌘ + K
```

Current capabilities:

- Fuzzy board search by title, summary, prompt, tags, and tone
- Navigation (dashboard, new board, templates, discover, help, settings)
- Board actions (duplicate, favorite toggle)
- **Editor context** (on `/app/boards/[id]`) — jump to Overview, Palette, Typography, References, Notes
- **Editor quick actions** — Export, Snapshots, Share/Collaborate
- **Template navigation** — search by template name, tag, or `template`; opens `/templates?focus=<id>` with scroll highlight
- **AI commands** (editor only) — suggest brand strategy, palette, typography via `dispatchEditorQuickAction`

---
