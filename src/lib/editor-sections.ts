import {
  ImageIcon,
  Layers3,
  Palette,
  Sparkles,
  Type,
  type LucideIcon,
} from 'lucide-react';

export const EDITOR_SECTION_ORDER = [
  'overview',
  'palette',
  'typography',
  'references',
  'notes',
] as const;

export type EditorSectionName = (typeof EDITOR_SECTION_ORDER)[number];

export type EditorSectionMeta = {
  label: string;
  description: string;
  icon: LucideIcon;
  accentBar: string;
  badgeClass: string;
  ringClass: string;
  tabActiveRingClass: string;
};

export const EDITOR_SECTION_META: Record<EditorSectionName, EditorSectionMeta> = {
  overview: {
    label: 'Overview',
    description: 'Creative direction and summary.',
    icon: Sparkles,
    accentBar: 'bg-sky-400/70',
    badgeClass:
      'border-sky-200 bg-sky-50/90 text-sky-900 dark:border-sky-300/25 dark:bg-sky-300/10 dark:text-sky-100',
    ringClass: 'ring-sky-400/35',
    tabActiveRingClass: 'ring-sky-400/40',
  },
  palette: {
    label: 'Palette',
    description: 'Core color direction.',
    icon: Palette,
    accentBar: 'bg-emerald-400/70',
    badgeClass:
      'border-emerald-200 bg-emerald-50/90 text-emerald-900 dark:border-emerald-300/25 dark:bg-emerald-300/10 dark:text-emerald-100',
    ringClass: 'ring-emerald-400/35',
    tabActiveRingClass: 'ring-emerald-400/40',
  },
  typography: {
    label: 'Typography',
    description: 'Font choices and usage notes.',
    icon: Type,
    accentBar: 'bg-amber-400/80',
    badgeClass:
      'border-amber-200 bg-amber-50/90 text-amber-950 dark:border-amber-300/25 dark:bg-amber-300/10 dark:text-amber-50',
    ringClass: 'ring-amber-400/35',
    tabActiveRingClass: 'ring-amber-400/40',
  },
  references: {
    label: 'References',
    description: 'Inspiration grid and visual assets.',
    icon: ImageIcon,
    accentBar: 'bg-rose-400/70',
    badgeClass:
      'border-rose-200 bg-rose-50/90 text-rose-950 dark:border-rose-300/25 dark:bg-rose-300/10 dark:text-rose-50',
    ringClass: 'ring-rose-400/35',
    tabActiveRingClass: 'ring-rose-400/40',
  },
  notes: {
    label: 'Notes',
    description: 'Captured ideas and instructions.',
    icon: Layers3,
    accentBar: 'bg-violet-400/70',
    badgeClass:
      'border-violet-200 bg-violet-50/90 text-violet-950 dark:border-violet-300/25 dark:bg-violet-300/10 dark:text-violet-50',
    ringClass: 'ring-violet-400/35',
    tabActiveRingClass: 'ring-violet-400/40',
  },
};

export function getEditorSectionIndex(section: EditorSectionName): number {
  return EDITOR_SECTION_ORDER.indexOf(section);
}

export function normalizeEditorSection(
  section: string | null | undefined,
): EditorSectionName {
  if (section && EDITOR_SECTION_ORDER.includes(section as EditorSectionName)) {
    return section as EditorSectionName;
  }
  return 'overview';
}
