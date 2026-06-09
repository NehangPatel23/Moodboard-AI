# Development

UX standards, accessibility, theme status, known issues, and contributor requirements.

Back to [README](../README.md) · Roadmap: [ROADMAP](ROADMAP.md)

## UX infrastructure

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

## Accessibility

Accessibility is a first-class requirement in this project.

Implemented:

- Keyboard navigation
- Focus management
- Accessible dialogs
- Accessible empty states
- Accessible loading states
- ARIA support
- Reduced-motion support
- Custom frosted tooltips on icon-only controls ([`tooltip.tsx`](../src/components/ui/tooltip.tsx)); use `triggerClassName="block w-full"` for full-width triggers in grids or vertical lists

Future work should continue to preserve and expand accessibility support across every page and interaction.

---

## Theme system

### Implemented

- Light / dark / system modes via settings, auth header, and **TopBar** sun/moon toggle (next to search)
- Class-based `dark:` utilities on `<html>`
- Flash-free first paint (`theme-init` script reads cookie before hydration)
- **Cross-route sync** — `SettingsBootstrap` + cookie/local cache keep landing and app on the same theme (no random flips on navigation)

### Remaining polish

- Visual refinement on landing (full redesign deferred — current design preferred)
- Incremental token standardization across landing and dashboard clusters
- Board editor cluster uses semantic tokens ([`board-editor-styles.ts`](../src/components/board/board-editor-styles.ts)); presence, read-only view, dashboard cards, and modal scrims migrated in Sprint C

---

## Current known problems

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

### Theme tokens

Landing, dashboard, and templates still mix hardcoded colors with CSS variables. The board editor cluster is largely tokenized via [`board-editor-styles.ts`](../src/components/board/board-editor-styles.ts).

Goal: extend semantic tokens to remaining surfaces for a consistent visual language.

---

## Development requirements

These rules should continue to be followed.

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
