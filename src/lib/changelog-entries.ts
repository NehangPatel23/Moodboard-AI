export type ChangelogEntry = {
  date: string;
  sprint?: string;
  title: string;
  bullets: string[];
};

/** Product updates — newest first. Derived from shipped sprints in ROADMAP. */
export const CHANGELOG_ENTRIES: ChangelogEntry[] = [
  {
    date: '2026-06',
    sprint: 'X',
    title: 'Editor token pass',
    bullets: [
      'Shared editorLargeModalClass and editorPresentationSectionClass use --shadow-elevated and --shadow-card',
      'Save template, snapshot preview, and restore modals aligned with semantic shadow tokens',
      'Read-only presentation tabs and tag pills use surface-soft/muted instead of hardcoded rgba',
    ],
  },
  {
    date: '2026-06',
    sprint: 'W',
    title: 'Templates & settings polish',
    bullets: [
      'Shared Card component uses --shadow-card token for consistent dark-mode elevation',
      'Templates preview modal and tag filter dropdown use elevated surface panels',
      'Settings hero, sidebar, and active toggles use stronger surface contrast in dark mode',
    ],
  },
  {
    date: '2026-06',
    sprint: 'V',
    title: 'Portfolio polish',
    bullets: [
      'Light and dark CSS token tuning for clearer surface hierarchy and muted text contrast',
      'Landing capabilities band uses elevated surface-soft panel with card shadow',
      'Dashboard display headings and pending invite section aligned with board card styling',
      'README screenshots refreshed; dashboard capture added to capture:screenshots script',
    ],
  },
  {
    date: '2026-06',
    title: 'Pending invite visibility',
    bullets: [
      'Pending invitations render as board-style cards in a dedicated dashboard section',
      'Invite matching uses invitee_user_id plus profile/auth email (migration 030)',
      'Empty studio state hidden while pending invites exist; TopBar Invites bell with label',
    ],
  },
  {
    date: '2026-06',
    sprint: 'U',
    title: 'Invite acceptance wall',
    bullets: [
      'All collaborators must accept board access before joining — no instant access for existing users',
      'Dashboard pending section and TopBar Invites show Accept access and Decline',
      'Collaborate modal lists Pending invites and Declined sections; owners can Invite again or Dismiss',
      'Migration 029 adds declined invite status and declined_at timestamp',
    ],
  },
  {
    date: '2026-06',
    title: 'Collaboration polish + dashboard fixes',
    bullets: [
      'Dashboard filter reset, clear, and toggle-off no longer get stuck on With me / With others',
      'Presentation mode section pills vertically center labels with icons',
      'Presence strip shows connecting, live, and offline states; reconnect with grace period reduces flicker',
      'Toolbar and command palette use Collaborate label for invite/sharing',
      'Migration 028 adds RLS for private Realtime field-sync broadcast channels',
    ],
  },
  {
    date: '2026-06',
    sprint: 'T',
    title: 'Verification + docs',
    bullets: [
      'Collaboration verify script checks migration 026 notification columns',
      'Prod smoke test includes Templates Community tab check',
      'Roadmap, features, changelog, and agent handoff updated for Sprints Q–T',
    ],
  },
  {
    date: '2026-06',
    sprint: 'S',
    title: 'Notifications + presentation polish',
    bullets: [
      'Settings Notifications section: toggle auto-save and remote-save toasts (migration 026)',
      'Presentation mode shows section progress dots and n / 5 counter',
      'Discover Remix redirects unauthenticated users to sign-in',
    ],
  },
  {
    date: '2026-06',
    sprint: 'R',
    title: 'Community templates',
    bullets: [
      'Save as template from board editor (private or publish to Community)',
      'Templates page Community tab loads public templates from /api/templates',
      'Community templates use templateToBoard + enrich pipeline instead of AI draft regeneration',
    ],
  },
  {
    date: '2026-06',
    sprint: 'Q',
    title: 'Live field sync',
    bullets: [
      'Debounced field patches broadcast summary and note text to collaborators',
      'CollaboratorFieldHighlight shows who is editing each field',
      'Active field id included in realtime presence',
    ],
  },
  {
    date: '2026-06',
    sprint: 'P',
    title: 'Landing polish + password reset hardening',
    bullets: [
      'Softer landing hero gradients and elevated feature cards for clearer light-mode hierarchy',
      'Password reset callback supports token_hash recovery links in addition to PKCE code exchange',
      'Clearer auth callback error copy for expired or cross-browser reset links',
    ],
  },
  {
    date: '2026-06',
    sprint: 'O+',
    title: 'Auto-save preferences',
    bullets: [
      'Settings Editor section: auto-save interval Off / 5s / 8s / 10s (migration 025)',
      'Auto-save skips Activity panel noise; manual saves still record full activity',
    ],
  },
  {
    date: '2026-06',
    sprint: 'O',
    title: 'Board auto-save',
    bullets: [
      'Debounced auto-save in the board editor while manual Save changes + confirmation modal remain',
      'Saving… status in toolbar; auto-save pauses during collaboration conflicts',
      'Auto-save success and error toasts after the server confirms the save',
    ],
  },
  {
    date: '2026-06',
    sprint: 'M',
    title: 'Auth + portfolio surface',
    bullets: [
      'Forgot password email flow and update-password screen on /sign-in',
      'Favicon, default OG image, and route metadata for Discover, share, and profile pages',
      'Remove profile photo via X on avatar tile; public profiles use shared landing header',
      'Comments panel scrim uses shared overlay token',
    ],
  },
  {
    date: '2026-06',
    sprint: 'L',
    title: 'Discover + identity polish',
    bullets: [
      'Mood filter dropdown on Discover with shareable ?mood= deep links',
      'Creator display name on profiles; editable Your name in Settings',
      'Custom profile photo upload with crop; avatar accent inside avatar panel',
      'Demo public boards seed script; share/remix UX with creator attribution',
    ],
  },
  {
    date: '2026-06',
    sprint: 'J',
    title: 'Product surfaces + polish',
    bullets: [
      'Per-snapshot mark-seen on preview and eye button in snapshots panel',
      'Help hub at /help with FAQ sections and in-app deep links',
      'Command palette AI commands for brand, palette, and typography suggestions',
      'Editor modal/panel scrims aligned to shared overlay token',
    ],
  },
  {
    date: '2026-06',
    sprint: 'I',
    title: 'Changelog + palette templates',
    bullets: [
      'Public /changelog page with shipped sprint entries',
      'Command palette template search navigates to /templates?focus=id',
    ],
  },
  {
    date: '2026-06',
    sprint: 'H',
    title: 'Visual polish pass',
    bullets: [
      'Shared app surface tokens across landing, dashboard, discover, templates, and settings',
      'Improved light-mode card hierarchy and consistent shadows via CSS variables',
      'Unified preview tiles on dashboard and Discover cards',
    ],
  },
  {
    date: '2026-06',
    sprint: 'G',
    title: 'Collaboration polish',
    bullets: [
      'Section-linked comments with badges and View in section',
      'Yellow-dot unseen indicators on comments, activity, and snapshots',
      'Custom frosted tooltips and view-mode heading cleanup',
    ],
  },
  {
    date: '2026-06',
    sprint: 'F',
    title: 'Public creator profiles',
    bullets: [
      'Profile pages at /profile/[id] with workspace identity and shared boards',
      'Discover cards link to creator profiles',
    ],
  },
  {
    date: '2026-06',
    sprint: 'E',
    title: 'AI design system export',
    bullets: [
      'Export CSS variables, Tailwind config, tokens JSON, and Markdown from the Export modal',
      'Optional AI-enhanced semantic token naming',
    ],
  },
  {
    date: '2026-06',
    sprint: 'D',
    title: 'AI brand strategy',
    bullets: [
      'Suggest brand on Overview with persisted brandStrategy on boards',
    ],
  },
  {
    date: '2026-05',
    sprint: 'C',
    title: 'Design system pass',
    bullets: [
      'Semantic tokens for editor, presence, dashboard cards, and modal scrims',
    ],
  },
  {
    date: '2026-05',
    sprint: 'B',
    title: 'Snapshot limits',
    bullets: [
      'Owner-configurable snapshot cap with auto-prune of oldest saves',
    ],
  },
  {
    date: '2026-05',
    sprint: 'A',
    title: 'Collaboration notifications',
    bullets: [
      'Remote-save toast when your draft is clean',
      'Unread counts in tab title and pulsing toolbar badges',
    ],
  },
  {
    date: '2026-05',
    title: 'Collaboration MVP',
    bullets: [
      'Real-time presence, live board sync, and conflict banner',
      'Comments panel with activity replay and retention settings',
      'Email invites with owner, editor, and viewer roles',
    ],
  },
  {
    date: '2026-04',
    title: 'Core product',
    bullets: [
      'AI draft → enrich pipeline with progressive preview',
      'Board editor with palette, typography, references, and notes',
      'JSON, PNG, and PDF export with live preview',
      'Discover public browse and view-only share links',
    ],
  },
];
