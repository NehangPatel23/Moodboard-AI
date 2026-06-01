import type { Board, BoardTemplate } from '@/types/board';
import { createBoardFromPrompt, getTemplates } from './board-store';

export type GeneratedBoardDraft = {
  board: Board;
  followUpPrompt: string;
};

const FALLBACK_REFERENCE_IMAGES = [
  'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1200&q=80',
];

const DEFAULT_TEMPLATES: BoardTemplate[] = [
  {
    id: 'luxury-wellness',
    name: 'Luxury Wellness',
    description: 'Soft, elevated, and calm.',
    prompt: 'luxury wellness brand for women aged 25-40',
    tags: ['wellness', 'premium', 'minimal'],
    mood: 'calm luxury',
    summary: 'A calm, elevated identity built around restraint, warmth, and trust.',
    tone: ['clean', 'credible', 'modern'],
    palette: [
      { label: 'Ivory', hex: '#fbf6ef', usage: 'Background and base surfaces' },
      { label: 'Sage', hex: '#b7c2ae', usage: 'Secondary accent and calm balance' },
      { label: 'Muted Gold', hex: '#c4a46a', usage: 'Warm metallic accent' },
      { label: 'Charcoal', hex: '#2d2926', usage: 'Primary text and contrast' },
    ],
    typography: [
      { role: 'heading', fontName: 'Cormorant Garamond', note: 'Elegant editorial headlines' },
      { role: 'body', fontName: 'Inter', note: 'Clean, highly readable body copy' },
      { role: 'accent', fontName: 'IBM Plex Mono', note: 'Data, labels, and system notes' },
    ],
    references: [
      { title: 'Minimal spa interior', category: 'Interior', source: 'Unsplash' },
      { title: 'Soft product still life', category: 'Product', source: 'Unsplash' },
      { title: 'Warm editorial portrait', category: 'Portrait', source: 'Unsplash' },
    ],
    notes: [
      { text: 'Prioritize restraint over ornament.', type: 'instruction' },
      { text: 'Keep spacing generous and breathable.', type: 'idea' },
      { text: 'Use warm neutrals with one refined accent.', type: 'keyword' },
    ],
  },
  {
    id: 'fashion-editorial',
    name: 'Fashion Editorial',
    description: 'Moody, sharp, and expressive.',
    prompt: 'editorial campaign for a fashion drop',
    tags: ['fashion', 'editorial', 'bold'],
    mood: 'dramatic contrast',
    summary:
      'An expressive, high-fashion direction with sharp type, dramatic imagery, and confident spacing.',
    tone: ['refined', 'confident', 'graphic'],
    palette: [
      { label: 'Bone', hex: '#f2ede4', usage: 'Editorial background and gallery surfaces' },
      { label: 'Ink', hex: '#111827', usage: 'Text and deep contrast' },
      { label: 'Plum', hex: '#8b5cf6', usage: 'Fashion accent and highlight' },
      { label: 'Silver', hex: '#d5d8df', usage: 'Soft neutral support' },
    ],
    typography: [
      { role: 'heading', fontName: 'Playfair Display', note: 'High-contrast magazine headlines' },
      { role: 'body', fontName: 'DM Sans', note: 'Neutral copy with a modern feel' },
      { role: 'accent', fontName: 'IBM Plex Mono', note: 'Campaign details and labels' },
    ],
    references: [
      { title: 'Runway silhouette', category: 'Fashion', source: 'Unsplash' },
      { title: 'Studio lighting setup', category: 'Editorial', source: 'Unsplash' },
      { title: 'Texture and fabric close-up', category: 'Material', source: 'Unsplash' },
    ],
    notes: [
      { text: 'Let negative space do more of the work.', type: 'instruction' },
      { text: 'Use a confident type scale with tight hierarchy.', type: 'idea' },
      { text: 'Balance grit with polish.', type: 'keyword' },
    ],
  },
  {
    id: 'fintech-product',
    name: 'Fintech Product',
    description: 'Trustworthy, clean, and modern.',
    prompt: 'landing page vibe for a fintech app',
    tags: ['fintech', 'product', 'trust'],
    mood: 'confident clarity',
    summary:
      'A trustworthy product direction with clear hierarchy, modern blues, and crisp data-led visuals.',
    tone: ['clean', 'credible', 'structured'],
    palette: [
      { label: 'Slate', hex: '#2d3d62', usage: 'Primary brand color and headers' },
      { label: 'Mist', hex: '#d9e0ea', usage: 'Soft support surfaces and panels' },
      { label: 'Blue', hex: '#4f8cff', usage: 'Primary action and links' },
      { label: 'Mint', hex: '#9bf5d8', usage: 'Positive state and highlights' },
    ],
    typography: [
      { role: 'heading', fontName: 'Sora', note: 'Modern structured headlines' },
      { role: 'body', fontName: 'Inter', note: 'Clear product copy and UI text' },
      { role: 'accent', fontName: 'IBM Plex Mono', note: 'Data, metrics, and labels' },
    ],
    references: [
      { title: 'Product dashboard', category: 'UI', source: 'Unsplash' },
      { title: 'Financial data detail', category: 'Data', source: 'Unsplash' },
    ],
    notes: [
      { text: 'Make trust visible in every component.', type: 'instruction' },
      { text: 'Use structured spacing and calm contrast.', type: 'idea' },
      { text: 'Keep actions crisp and obvious.', type: 'keyword' },
    ],
  },
];

function normalizeTemplateKey(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function matchesTemplate(a: BoardTemplate, b: BoardTemplate): boolean {
  const haystack = normalizeTemplateKey(`${a.id} ${a.name} ${a.description} ${a.prompt}`);
  const needles = [b.id, b.name, b.description, b.prompt].map(normalizeTemplateKey);

  return needles.some((needle) => needle.length > 0 && haystack.includes(needle));
}

function enrichTemplate(template: BoardTemplate): BoardTemplate {
  const preset = DEFAULT_TEMPLATES.find((candidate) => matchesTemplate(candidate, template));

  if (!preset) {
    return template;
  }

  return {
    ...preset,
    ...template,
    tags: template.tags.length ? template.tags : preset.tags,
    mood: template.mood ?? preset.mood,
    summary: template.summary ?? preset.summary,
    tone: template.tone?.length ? template.tone : preset.tone,
    palette: template.palette?.length ? template.palette : preset.palette,
    typography: template.typography?.length ? template.typography : preset.typography,
    references: template.references?.length ? template.references : preset.references,
    notes: template.notes?.length ? template.notes : preset.notes,
  };
}

function buildFollowUpPrompt(board: Board): string {
  return `Refine the direction for ${board.title.toLowerCase()} with a ${board.mood} mood, ${board.tone.join(
    ', ',
  )} tone, and a palette centered on ${board.palette
    .map((item) => item.label.toLowerCase())
    .slice(0, 3)
    .join(', ')}.`;
}

function buildFollowUpPromptFromTemplate(template: BoardTemplate, board: Board): string {
  const tone = board.tone.length ? board.tone.join(', ') : 'balanced';
  const palette = board.palette.length
    ? board.palette
        .map((item) => item.label.toLowerCase())
        .slice(0, 3)
        .join(', ')
    : 'a refined neutral palette';

  return `Refine the ${template.name.toLowerCase()} direction with a ${board.mood} mood, ${tone} tone, and a palette centered on ${palette}.`;
}

function buildReferenceImageUrl(templateId: string, index: number): string {
  const seed = `${templateId}-${index}`.toLowerCase();
  const fallback = FALLBACK_REFERENCE_IMAGES[index % FALLBACK_REFERENCE_IMAGES.length];

  return `${fallback}&sig=${encodeURIComponent(seed)}`;
}

export function getBoardTemplates(): BoardTemplate[] {
  const storedTemplates = getTemplates();

  if (!storedTemplates.length) {
    return DEFAULT_TEMPLATES;
  }

  return storedTemplates.map(enrichTemplate);
}

export function getTemplateById(templateId: string): BoardTemplate | undefined {
  const key = normalizeTemplateKey(templateId);

  return getBoardTemplates().find((template) => {
    const candidateKey = normalizeTemplateKey(`${template.id} ${template.name} ${template.prompt}`);
    return candidateKey.includes(key) || key.includes(normalizeTemplateKey(template.name));
  });
}

export function getQuickPromptSuggestions(): string[] {
  return [
    'soft, modern brand for a skincare startup',
    'moody bedroom inspiration',
    'editorial campaign for a fashion drop',
    'landing page vibe for a fintech app',
    'luxury wellness brand for women aged 25-40',
  ];
}

export function generateBoardDraft(prompt: string): GeneratedBoardDraft {
  const board = createBoardFromPrompt({ prompt });
  const followUpPrompt = buildFollowUpPrompt(board);
  return { board, followUpPrompt };
}

export function generateBoardDraftFromTemplate(templateId: string): GeneratedBoardDraft | null {
  const template = getTemplateById(templateId);

  if (!template) {
    return null;
  }

  const base = createBoardFromPrompt({ prompt: template.prompt });

  const board: Board = {
    ...base,
    title: template.name,
    prompt: template.prompt,
    summary: template.summary ?? base.summary,
    mood: template.mood ?? base.mood,
    tone: template.tone?.length ? template.tone : base.tone,
    tags: template.tags.length ? Array.from(new Set([...template.tags, ...base.tags])) : base.tags,
    palette: template.palette?.length
      ? template.palette.map((item, index) => ({
          id: `${base.id}-template-palette-${index}`,
          label: item.label,
          hex: item.hex,
          usage: item.usage,
        }))
      : base.palette,
    typography: template.typography?.length
      ? template.typography.map((item, index) => ({
          id: `${base.id}-template-typography-${index}`,
          role: item.role,
          fontName: item.fontName,
          note: item.note,
        }))
      : base.typography,
    notes: template.notes?.length
      ? template.notes.map((item, index) => ({
          id: `${base.id}-template-note-${index}`,
          text: item.text,
          type: item.type,
          position: { x: 0, y: 0 },
        }))
      : base.notes,
    references: template.references?.length
      ? template.references.map((item, index) => ({
          id: `${base.id}-template-reference-${index}`,
          title: item.title,
          imageUrl: item.imageUrl ?? buildReferenceImageUrl(template.id, index),
          category: item.category,
          source: item.source,
        }))
      : base.references,
  };

  return {
    board,
    followUpPrompt: buildFollowUpPromptFromTemplate(template, board),
  };
}