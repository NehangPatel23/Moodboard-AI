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
