# MoodBoard AI

> **Status:** Active Development (MVP Foundation Complete)
> **Purpose:** GitHub README + internal handoff document for future development, AI agents, and new contributors
> **Next feature:** Database-backed, user-scoped persistence (replace local storage). Authentication and gated landing CTAs are now implemented (see [Authentication & Gated Landing CTAs (Implemented)](#authentication--gated-landing-ctas-implemented)).

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
- Local persistence and custom stores
- Authentication (local/mock) with gated app routes and landing CTAs
- Vercel Analytics

The app is not finished. The core UX and page structure exist, but several major product areas still need to be built or redesigned.

---

## Authentication & Gated Landing CTAs (Implemented)

User login / authentication and gated CTAs are now built as a **local/mock** auth layer that mirrors the app's existing `localStorage` + `useSyncExternalStore` store pattern. There is no backend yet, so all gating happens on the client.

> **Security note:** This is demo-grade auth. User records (including a lightly obfuscated password) live in `localStorage` and are **not secure**. It exists to model the auth UX until real, server-backed auth and a database are introduced.

**What was built:**

- **Auth store** — `src/lib/auth-store.ts`. Stores registered users under `moodboard-auth-users-v1` and the current session under `moodboard-auth-session-v1`. Exposes `subscribeAuth`, `readAuthState`, `getServerAuthSnapshot`, `hydrateAuthStore`, and the `signUp` / `signIn` / `signOut` actions. Initial state is `loading` until hydrated to avoid hydration mismatches. Seeds a built-in demo account (`admin@moodboard.ai` / `moodboard123`). Sessions carry a **7-day expiry** (`SESSION_TTL_MS`); expired sessions are cleared on read and the user is redirected to sign in.
- **Auth page** — a single consolidated page in the route group `src/app/(auth)/` at `/sign-in`, with an in-page **Sign in / Create account** toggle (the header's "Get started" deep-links via `/sign-in?mode=sign-up`). It reads a `?redirect=` target (sanitized to internal paths) via `useSearchParams` inside a `<Suspense>` boundary, has a password show/hide toggle, a one-click demo-account button, inline validation/errors, loading states, and toast feedback. A premium split-screen layout and a pre-login theme toggle live in `src/app/(auth)/layout.tsx`.
- **Route gating** — `src/components/auth/AuthGuard.tsx` wraps the `/app` and `/settings` layouts. It shows a loading state while the session resolves, and redirects unauthenticated users to `/sign-in?redirect=<intended path>`.
- **Gated landing CTAs** — `useGatedHref` (`src/components/auth/use-gated-href.ts`) makes the CTAs in `src/components/landing/Hero.tsx` ("Start a board" → `/app/new`, "View my boards" → `/app`) and `src/components/landing/CTASection.tsx` ("Begin your first board" → `/app/new`) route through `/sign-in` when unauthenticated, then bounce to the intended destination after signing in.
- **Per-user boards** — `src/lib/board-store.ts` scopes boards by the signed-in user's id (`moodboard-ai:boards:<userId>`), driven by `src/components/layout/BoardStoreBootstrap.tsx`. Each account gets its own seeded workspace; the demo account adopts any pre-auth (legacy) boards once.
- **Account menu** — `src/components/layout/AccountMenu.tsx` in the top bar shows a "Signed in as" identity plus a **Sign out** action. The landing header gains a **Sign in** / **Get started** / **Open app** entry point.

**Next:** replace local storage with database-backed persistence (see [Database](#database)), then move auth to a real provider.

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

- Local storage
- Custom stores (hand-rolled with React's `useSyncExternalStore` — see `src/lib/board-store.ts`, `src/lib/settings-store.ts`, `src/components/shared/toast-store.ts`, `src/components/shared/command-palette-store.ts`)

Planned:

- Database-backed persistence

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
│   ├── page.tsx
│   ├── layout.tsx
│   ├── globals.css
│   ├── app/
│   │   ├── page.tsx
│   │   ├── new/
│   │   ├── boards/
│   │   │   └── [id]/
│   │   │       ├── page.tsx       # editor
│   │   │       └── view/          # read-only / presentation
│   │   └── layout.tsx
│   ├── settings/
│   └── templates/
├── components/
│   ├── landing/
│   ├── layout/        # Sidebar, TopBar, AppShell, WorkspaceAvatar
│   ├── page-shells/   # DashboardShell, BoardEditorShell, BoardReadOnlyShell
│   ├── board/
│   ├── dashboard/
│   ├── creation/
│   ├── shared/
│   └── ui/
├── lib/
└── types/
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

- Enter a prompt
- Generate a board

Current generation is mock/demo content.

Planned:

- Real AI generation integration

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

Route:

```txt
/app/boards/[id]/view
```

Implemented:

#### Read-Only Board

Supports:

- Presentation mode
- Shareable viewing
- Non-editable consumption

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

Current template definitions are mock/demo data.

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
- Local storage usage indicator

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

### Current Situation

A theme system exists and supports:

- Light mode
- Dark mode
- System mode

### Important Note

The theme system is **not considered complete**.

The landing page in particular has gone through multiple iterations and still needs a proper visual refinement pass.

Current known issues:

- Light mode feels inconsistent
- Dark mode feels inconsistent
- The design language is not fully unified
- Premium visual identity has not yet been finalized

### Landing Page Status

The landing page is currently considered:

```txt
UNFINISHED
```

It needs a future redesign pass before it can be treated as final.

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

Currently mocked.

Need:

- OpenAI integration
- Prompt → creative direction
- Mood generation
- Palette generation
- Typography generation
- Reference generation

### Board Generation Pipeline

Desired flow:

```txt
Prompt
   ↓
Creative Direction
   ↓
Moodboard
   ↓
Editable Workspace
```

### Database

Current:

```txt
Local Storage
```

Target:

```txt
Database persistence
```

Possible options:

- Supabase
- PostgreSQL
- Neon

Store:

- Users
- Boards
- Templates
- Favorites
- Settings

### Authentication

> **Implemented as a local/mock layer.** See [Authentication & Gated Landing CTAs (Implemented)](#authentication--gated-landing-ctas-implemented).

Done (client-side, localStorage-backed):

- Sign up
- Sign in
- Sessions
- Sign out
- **Gated landing CTAs** — "Start a board" (`/app/new`) and "View my boards" (`/app`) require authentication; unauthenticated users are sent to sign in first and then redirected to their intended destination.
- **Gated app routes** — all `/app` and `/settings` routes require login.

Still needed (move off local/mock):

- Real, server-backed sessions and password hashing
- User-scoped data once the database lands

Potential solutions:

- Clerk
- Auth.js
- Supabase Auth

---

## Medium Priority

### User Profiles

Potential routes:

```txt
/profile
/profile/settings
```

### Team Collaboration

Need:

- Shared boards
- Roles
- Permissions
- Invites

### Comments

Board commenting system.

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

Browse public boards.

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

### 0. Authentication & Gated Landing CTAs — DONE (local/mock)

User accounts, sessions, gated `/app` + `/settings` routes, and gated landing CTAs with redirect-back are implemented as a client-side, localStorage-backed layer. See [Authentication & Gated Landing CTAs (Implemented)](#authentication--gated-landing-ctas-implemented).

### 1. Database Integration (next feature)

Replace local storage with database-backed, user-scoped persistence (and migrate auth off the local/mock layer onto a real provider).

### 3. Landing Page Redesign

Goals:

- Premium visual identity
- Consistent light mode
- Consistent dark mode
- Unified design language

### 4. Design System Audit

Create:

- Color tokens
- Typography tokens
- Shadow tokens
- Spacing tokens

### 5. AI Generation Pipeline

Integrate OpenAI.

Implement:

- Prompt → creative direction
- Prompt → moodboard

### 6. Real Data Layer

Replace mock content.

### 7. Discover Page

Public inspiration and boards.

### 8. Collaboration Features

Teams, comments, and sharing.

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

Authentication + gated landing CTAs are now implemented (local/mock). The largest remaining milestones are:

1. Database persistence (user-scoped) — next feature
2. Real, server-backed authentication (replace the local/mock layer)
3. Landing page refinement
4. Design system standardization
5. AI generation engine
6. Team collaboration
7. Public discovery features

---

## 14. AI Agent Handoff Notes

If you are an AI agent continuing development in Cursor, Claude, ChatGPT, Copilot, or another environment, treat this README as the project handoff document.

Important context:

- The current landing page design is **not final**
- Theme implementation is partially complete and still needs refinement
- AI generation is currently mocked
- Persistence currently relies heavily on local storage
- Accessibility, loading states, and keyboard support are mandatory requirements for future work
- **Authentication is implemented as a local/mock layer** (client-side, localStorage-backed) — it gates `/app` + `/settings` and the landing CTAs, and redirects to the intended page after sign-in. It is **not secure** and must be replaced with real, server-backed auth. See [Authentication & Gated Landing CTAs (Implemented)](#authentication--gated-landing-ctas-implemented)
- The **next feature to implement is database-backed, user-scoped persistence** (replacing local storage)
- Settings controls are all wired to real behavior (theme, app-wide reduce motion / focus rings, default visibility on new boards, presentation-mode gating, workspace identity & avatars)

When resuming work, start by implementing database-backed, user-scoped persistence, then migrate auth off the local/mock layer onto a real provider.

---

## 15. License

Private project. All rights reserved.

---

## 16. End of Handoff Document

This README should be treated as the primary project handoff reference until superseded by a future version.