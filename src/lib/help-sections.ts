export type HelpLink = {
  label: string;
  href: string;
  external?: boolean;
};

export type HelpSection = {
  id: string;
  title: string;
  summary: string;
  bullets: string[];
  links?: HelpLink[];
};

export const HELP_SECTIONS: HelpSection[] = [
  {
    id: 'getting-started',
    title: 'Getting started',
    summary: 'Create your first board and share it publicly.',
    bullets: [
      'Sign in and open the dashboard from the landing page.',
      'Use Create board or Templates to start from a prompt or preset direction.',
      'Save your board — drafts sync to Supabase when signed in.',
      'Set visibility to Shared to appear on Discover.',
    ],
    links: [
      { label: 'Create a board', href: '/app/new' },
      { label: 'Browse templates', href: '/templates' },
    ],
  },
  {
    id: 'boards-ai',
    title: 'Boards & AI',
    summary: 'Draft → enrich generation, brand strategy, and reference photos.',
    bullets: [
      'AI generation runs draft then enrich with progressive preview.',
      'Suggest palette, typography, and brand strategy from the board editor.',
      'Reference photos resolve via Pexels → Unsplash → placeholder; upload URLs or files.',
      'Export JSON, PNG, PDF, or a design-system handoff from the Export modal.',
    ],
    links: [
      { label: 'Open dashboard', href: '/app' },
      { label: 'Templates', href: '/templates' },
    ],
  },
  {
    id: 'collaboration',
    title: 'Collaboration',
    summary: 'Invites, comments, activity replay, snapshots, and real-time sync.',
    bullets: [
      'Invite collaborators by email with owner, editor, or viewer roles.',
      'Comments link to editor sections; use View in section to jump and mark read.',
      'Activity replay shows structured changes; snapshots save restore points.',
      'Yellow dots mark unseen collaborator updates until you mark them read.',
    ],
    links: [{ label: 'Settings — collaboration retention', href: '/settings' }],
  },
  {
    id: 'export',
    title: 'Export & handoff',
    summary: 'Visual exports and developer-ready design tokens.',
    bullets: [
      'PNG and PDF exports match the live preview in the Export modal.',
      'Design system tab outputs CSS, Tailwind, tokens JSON, and Markdown.',
      'Enhance with AI names tokens when Gemini is configured; deterministic fallback otherwise.',
    ],
  },
  {
    id: 'discover',
    title: 'Discover',
    summary: 'Public surface for browsing community boards.',
    bullets: [
      'Discover lists all public shared boards with search.',
      'Creator names link to public profiles at /profile/[id].',
    ],
    links: [{ label: 'Discover boards', href: '/discover' }],
  },
  {
    id: 'settings',
    title: 'Settings & accessibility',
    summary: 'Theme, motion, shortcuts, and workspace identity.',
    bullets: [
      'Theme: system, light, or dark — synced across landing and app.',
      'Reduce motion and strong focus rings apply app-wide.',
      'Keyboard shortcuts toggle gates the ⌘K command palette.',
      'Workspace name, tagline, and avatar appear in the sidebar and on public profiles.',
    ],
    links: [{ label: 'Open settings', href: '/settings' }],
  },
];

export const HELP_SUPPORT_LINK = {
  label: 'Report an issue on GitHub',
  href: 'https://github.com/NehangPatel23/Moodboard-AI/issues',
  external: true,
};
