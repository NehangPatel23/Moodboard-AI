import type { Board, BoardTemplate } from '@/types/board';

export const boardTemplates: BoardTemplate[] = [
  {
    id: 'luxury-wellness',
    name: 'Luxury Wellness',
    description: 'Soft, elevated, and calm.',
    prompt: 'luxury wellness brand for women aged 25-40',
    tags: ['wellness', 'premium', 'minimal'],
  },
  {
    id: 'fashion-editorial',
    name: 'Fashion Editorial',
    description: 'Moody, sharp, and expressive.',
    prompt: 'editorial campaign for a fashion drop',
    tags: ['fashion', 'editorial', 'bold'],
  },
  {
    id: 'fintech-product',
    name: 'Fintech Product',
    description: 'Trustworthy, clean, and modern.',
    prompt: 'landing page vibe for a fintech app',
    tags: ['fintech', 'product', 'trust'],
  },
];

export const mockBoards: Board[] = [
  {
    id: 'board_seed_wellness',
    title: 'Soft Luxury Wellness',
    prompt: 'luxury wellness brand for women aged 25-40',
    summary: 'A calm, elevated identity built around restraint, warmth, and trust.',
    mood: 'calm luxury',
    tone: ['minimal', 'warm', 'premium'],
    tags: ['wellness', 'editorial', 'soft contrast'],
    palette: [
      { id: 'pal_seed_1', label: 'Ivory', hex: '#F7F2EB', usage: 'Background and base surfaces' },
      { id: 'pal_seed_2', label: 'Sage', hex: '#A8B5A2', usage: 'Secondary accents and wellness cues' },
      { id: 'pal_seed_3', label: 'Muted Gold', hex: '#B89A6A', usage: 'Premium highlights and calls to action' },
      { id: 'pal_seed_4', label: 'Charcoal', hex: '#2D2A26', usage: 'Primary text and contrast' },
    ],
    typography: [
      { id: 'typo_seed_1', role: 'heading', fontName: 'Cormorant Garamond', note: 'Elegant, editorial, high-trust' },
      { id: 'typo_seed_2', role: 'body', fontName: 'Inter', note: 'Clean and highly readable' },
      { id: 'typo_seed_3', role: 'accent', fontName: 'Inter Tight', note: 'Labels, metadata, and UI details' },
    ],
    references: [
      {
        id: 'ref_seed_1',
        title: 'Minimal spa interior',
        imageUrl:
          'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
        category: 'Interior',
        source: 'Unsplash',
      },
      {
        id: 'ref_seed_2',
        title: 'Textural packaging detail',
        imageUrl:
          'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80',
        category: 'Packaging',
        source: 'Unsplash',
      },
      {
        id: 'ref_seed_3',
        title: 'Editorial product frame',
        imageUrl:
          'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=80',
        category: 'Campaign',
        source: 'Unsplash',
      },
    ],
    notes: [
      { id: 'note_seed_1', text: 'Use whitespace as a luxury signal.', type: 'keyword', position: { x: 120, y: 80 } },
      { id: 'note_seed_2', text: 'Avoid harsh contrast; keep edges soft.', type: 'instruction', position: { x: 360, y: 120 } },
      { id: 'note_seed_3', text: 'Warm, grounded, and quietly confident.', type: 'idea', position: { x: 220, y: 260 } },
    ],
    createdAt: '2026-05-25T18:00:00.000Z',
    updatedAt: '2026-05-25T18:12:00.000Z',
    isFavorite: true,
    visibility: 'private',
  },
  {
    id: 'board_seed_fintech',
    title: 'Fintech Landing Direction',
    prompt: 'landing page vibe for a fintech app',
    summary: 'A confident product direction that balances trust, clarity, and motion.',
    mood: 'confident clarity',
    tone: ['clean', 'credible', 'modern'],
    tags: ['fintech', 'landing page', 'product design'],
    palette: [
      { id: 'pal_seed_5', label: 'Slate', hex: '#0F172A', usage: 'Primary text and header surfaces' },
      { id: 'pal_seed_6', label: 'Mist', hex: '#E2E8F0', usage: 'Panels and borders' },
      { id: 'pal_seed_7', label: 'Blue', hex: '#4F8CFF', usage: 'Primary actions and links' },
      { id: 'pal_seed_8', label: 'Mint', hex: '#B9F5D8', usage: 'Positive states and highlights' },
    ],
    typography: [
      { id: 'typo_seed_4', role: 'heading', fontName: 'Sora', note: 'Modern and structured' },
      { id: 'typo_seed_5', role: 'body', fontName: 'Inter', note: 'Neutral product body copy' },
      { id: 'typo_seed_6', role: 'accent', fontName: 'IBM Plex Mono', note: 'Data, metrics, and labels' },
    ],
    references: [
      {
        id: 'ref_seed_4',
        title: 'App dashboard blur',
        imageUrl:
          'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
        category: 'Dashboard',
        source: 'Unsplash',
      },
      {
        id: 'ref_seed_5',
        title: 'Metric cards',
        imageUrl:
          'https://images.unsplash.com/photo-1556742205-9f8b1a0f0ef9?auto=format&fit=crop&w=1200&q=80',
        category: 'UI',
        source: 'Unsplash',
      },
    ],
    notes: [
      { id: 'note_seed_4', text: 'Make trust visible in every card.', type: 'instruction', position: { x: 180, y: 100 } },
      { id: 'note_seed_5', text: 'Motion should feel precise, not playful.', type: 'idea', position: { x: 420, y: 180 } },
    ],
    createdAt: '2026-05-25T16:00:00.000Z',
    updatedAt: '2026-05-25T17:00:00.000Z',
    isFavorite: false,
    visibility: 'shared',
  },
];