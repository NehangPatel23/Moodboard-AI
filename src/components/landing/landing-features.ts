import type { LucideIcon } from 'lucide-react';
import { Download, Sparkles, Type, Users } from 'lucide-react';

export const LANDING_FEATURE_CHIPS = [
  'Gemini board generation',
  'Pexels + Unsplash references',
  'Team comments & activity',
  'PNG & PDF export',
] as const;

type LandingFeature = {
  title: string;
  description: string;
  icon: LucideIcon;
  accent: string;
  iconTone: string;
};

export const landingFeatures: LandingFeature[] = [
  {
    title: 'AI creative direction',
    description:
      'Turn a prompt into mood, tone, palette, typography, and references with progressive preview.',
    icon: Sparkles,
    accent: 'bg-sky-400/70',
    iconTone: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
  },
  {
    title: 'Smart palette & type',
    description: 'Suggest palette and typography from board context with one-click Gemini refresh.',
    icon: Type,
    accent: 'bg-emerald-400/70',
    iconTone: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  },
  {
    title: 'Real-time collaboration',
    description: 'Invite editors and viewers, live sync, comments with edit, and activity replay.',
    icon: Users,
    accent: 'bg-amber-400/80',
    iconTone: 'bg-amber-500/10 text-amber-700 dark:text-amber-200',
  },
  {
    title: 'Export & share',
    description: 'Download JSON, PNG, or PDF moodboards and share boards on Discover.',
    icon: Download,
    accent: 'bg-violet-400/70',
    iconTone: 'bg-violet-500/10 text-violet-700 dark:text-violet-200',
  },
];
