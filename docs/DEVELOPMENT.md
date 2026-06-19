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

- Full landing redesign remains **deferred** — incremental token and section refinement only
- Board editor cluster uses semantic tokens ([`board-editor-styles.ts`](../src/components/board/board-editor-styles.ts)); app shells use [`app-surface-styles.ts`](../src/components/shared/app-surface-styles.ts)

---

## Current known problems

Sprint V and W resolved the main landing, dashboard, templates, and settings hierarchy issues. Remaining gaps are minor:

- Full landing redesign is still deferred (current layout preferred)

### Theme tokens

Landing, dashboard, templates, settings, and discover share semantic tokens via [`app-surface-styles.ts`](../src/components/shared/app-surface-styles.ts) and CSS variables. Sprints V–W tuned backgrounds, Card shadows, preview panels, and settings active states. The board editor cluster remains in [`board-editor-styles.ts`](../src/components/board/board-editor-styles.ts).

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
