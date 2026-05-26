import type {
  Board,
  BoardDraftInput,
  BoardTemplate,
  NoteItem,
  PaletteItem,
  ReferenceItem,
  TypographyItem,
} from '@/types/board';
import { createId, safeParse, slugify } from './utils';
import { mockBoards, boardTemplates } from './mock-data';

const STORAGE_KEY = 'moodboard-ai:boards';
const BOARD_STORAGE_EVENT = 'moodboard-ai:boards-updated';

let cachedBoards: Board[] = mockBoards.map((board) => ({
  ...board,
  palette: board.palette.map((item) => ({ ...item })),
  typography: board.typography.map((item) => ({ ...item })),
  references: board.references.map((item) => ({ ...item })),
  notes: board.notes.map((item) => ({ ...item })),
}));
let hydratedFromStorage = false;

function nowIso(): string {
  return new Date().toISOString();
}

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function notifyBoardsChanged(): void {
  if (!canUseStorage()) return;
  window.dispatchEvent(new Event(BOARD_STORAGE_EVENT));
}

function cloneBoard(board: Board): Board {
  return JSON.parse(JSON.stringify(board)) as Board;
}

function readBoardsFromStorage(): Board[] | null {
  if (!canUseStorage()) return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  const parsed = safeParse<Board[]>(raw, []);
  return parsed.length > 0 ? parsed : null;
}

export function hydrateBoardStore(): void {
  if (!canUseStorage() || hydratedFromStorage) return;

  hydratedFromStorage = true;
  const storedBoards = readBoardsFromStorage();
  if (storedBoards) {
    cachedBoards = storedBoards;
    notifyBoardsChanged();
  }
}

export function subscribeBoards(callback: () => void): () => void {
  if (!canUseStorage()) return () => undefined;

  const handler = () => callback();
  window.addEventListener(BOARD_STORAGE_EVENT, handler);

  return () => {
    window.removeEventListener(BOARD_STORAGE_EVENT, handler);
  };
}

export function getSeedBoards(): Board[] {
  return mockBoards.map((board) => ({
    ...board,
    palette: board.palette.map((item) => ({ ...item })),
    typography: board.typography.map((item) => ({ ...item })),
    references: board.references.map((item) => ({ ...item })),
    notes: board.notes.map((item) => ({ ...item })),
  }));
}

export function getTemplates(): BoardTemplate[] {
  return boardTemplates.map((template) => ({ ...template }));
}

export function loadBoards(): Board[] {
  return cachedBoards;
}

export function getBoardById(boardId: string): Board | undefined {
  return cachedBoards.find((board) => board.id === boardId);
}

export function saveBoards(boards: Board[]): void {
  cachedBoards = boards;
  if (canUseStorage()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(boards));
  }
  notifyBoardsChanged();
}

export function appendBoard(board: Board): Board {
  saveBoards([board, ...loadBoards()]);
  return board;
}

export function updateBoard(boardId: string, updater: (board: Board) => Board): Board | null {
  const boards = loadBoards();
  const index = boards.findIndex((board) => board.id === boardId);
  if (index === -1) return null;

  const nextBoards = boards.slice();
  const updated = updater(cloneBoard(boards[index]));
  updated.updatedAt = nowIso();
  nextBoards[index] = updated;
  saveBoards(nextBoards);
  return updated;
}

export function deleteBoardById(boardId: string): boolean {
  const boards = loadBoards();
  const nextBoards = boards.filter((board) => board.id !== boardId);
  if (nextBoards.length === boards.length) return false;
  saveBoards(nextBoards);
  return true;
}

export function duplicateBoardById(boardId: string): Board | null {
  const source = getBoardById(boardId);
  if (!source) return null;

  const copy = cloneBoard(source);
  copy.id = createId('board');
  copy.title = `${source.title} Copy`;
  copy.createdAt = nowIso();
  copy.updatedAt = nowIso();
  copy.isFavorite = false;

  saveBoards([copy, ...loadBoards()]);
  return copy;
}

export function toggleFavoriteById(boardId: string): Board | null {
  return updateBoard(boardId, (board) => ({ ...board, isFavorite: !board.isFavorite }));
}

export function updatePaletteItem(boardId: string, index: number, patch: Partial<PaletteItem>): Board | null {
  return updateBoard(boardId, (board) => ({
    ...board,
    palette: board.palette.map((item, currentIndex) => (currentIndex === index ? { ...item, ...patch } : item)),
  }));
}

export function addPaletteItem(boardId: string): Board | null {
  return updateBoard(boardId, (board) => ({
    ...board,
    palette: [
      { id: createId('palette'), label: 'New color', hex: '#CBD5E1', usage: 'Usage note' },
      ...board.palette,
    ],
  }));
}

export function removePaletteItem(boardId: string, index: number): Board | null {
  return updateBoard(boardId, (board) => ({
    ...board,
    palette: board.palette.filter((_, currentIndex) => currentIndex !== index),
  }));
}

export function updateTypographyItem(boardId: string, index: number, patch: Partial<TypographyItem>): Board | null {
  return updateBoard(boardId, (board) => ({
    ...board,
    typography: board.typography.map((item, currentIndex) => (currentIndex === index ? { ...item, ...patch } : item)),
  }));
}

export function addTypographyItem(boardId: string): Board | null {
  return updateBoard(boardId, (board) => ({
    ...board,
    typography: [
      { id: createId('typography'), role: 'accent', fontName: 'Inter', note: 'Usage note' },
      ...board.typography,
    ],
  }));
}

export function removeTypographyItem(boardId: string, index: number): Board | null {
  return updateBoard(boardId, (board) => ({
    ...board,
    typography: board.typography.filter((_, currentIndex) => currentIndex !== index),
  }));
}

export function updateReferenceItem(boardId: string, index: number, patch: Partial<ReferenceItem>): Board | null {
  return updateBoard(boardId, (board) => ({
    ...board,
    references: board.references.map((item, currentIndex) => (currentIndex === index ? { ...item, ...patch } : item)),
  }));
}

export function addReferenceItem(boardId: string): Board | null {
  return updateBoard(boardId, (board) => ({
    ...board,
    references: [
      {
        id: createId('ref'),
        title: 'New reference',
        imageUrl: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80',
        category: 'Interior',
        source: 'Unsplash',
      },
      ...board.references,
    ],
  }));
}

export function removeReferenceItem(boardId: string, index: number): Board | null {
  return updateBoard(boardId, (board) => ({
    ...board,
    references: board.references.filter((_, currentIndex) => currentIndex !== index),
  }));
}

export function updateNoteItem(boardId: string, index: number, patch: Partial<NoteItem>): Board | null {
  return updateBoard(boardId, (board) => ({
    ...board,
    notes: board.notes.map((item, currentIndex) => (currentIndex === index ? { ...item, ...patch } : item)),
  }));
}

export function addNoteItem(boardId: string): Board | null {
  return updateBoard(boardId, (board) => ({
    ...board,
    notes: [
      { id: createId('note'), text: 'New note', type: 'idea', position: { x: 0, y: 0 } },
      ...board.notes,
    ],
  }));
}

export function removeNoteItem(boardId: string, index: number): Board | null {
  return updateBoard(boardId, (board) => ({
    ...board,
    notes: board.notes.filter((_, currentIndex) => currentIndex !== index),
  }));
}

export function createBoardFromPrompt(input: BoardDraftInput): Board {
  const prompt = input.prompt.trim();
  const title = input.title?.trim() || inferTitle(prompt);
  const summary = inferSummary(prompt);
  const mood = inferMood(prompt);
  const tone = inferTone(prompt);
  const tags = Array.from(new Set([...(input.tags ?? []), ...inferTags(prompt)]));

  return {
    id: createId('board'),
    title,
    prompt,
    summary,
    mood,
    tone,
    tags,
    palette: inferPalette(prompt),
    typography: inferTypography(prompt),
    references: inferReferences(prompt),
    notes: inferNotes(prompt),
    createdAt: nowIso(),
    updatedAt: nowIso(),
    isFavorite: false,
    visibility: input.visibility ?? 'private',
  };
}

export function upsertBoard(boards: Board[], board: Board): Board[] {
  const existingIndex = boards.findIndex((item) => item.id === board.id);
  const nextBoard = { ...board, updatedAt: nowIso() };
  if (existingIndex === -1) return [nextBoard, ...boards];
  const next = boards.slice();
  next[existingIndex] = nextBoard;
  return next;
}

export function filterBoards(boards: Board[], query: string): Board[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return boards;
  return boards.filter((board) => {
    const haystack = [board.title, board.prompt, board.summary, board.mood, ...board.tags].join(' ').toLowerCase();
    return haystack.includes(normalized);
  });
}

export function sortBoards(boards: Board[], sort: 'recent' | 'favorite'): Board[] {
  const next = [...boards];
  if (sort === 'favorite') {
    return next.sort((a, b) => Number(b.isFavorite) - Number(a.isFavorite) || b.updatedAt.localeCompare(a.updatedAt));
  }
  return next.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function inferTitle(prompt: string): string {
  const cleaned = prompt.replace(/\s+/g, ' ').trim();
  if (!cleaned) return 'Untitled Board';
  const firstClause = cleaned.split(',')[0].split(' for ')[0].split(' with ')[0];
  return firstClause
    .split(' ')
    .slice(0, 5)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function inferSummary(prompt: string): string {
  const normalized = prompt.toLowerCase();
  if (normalized.includes('wellness')) return 'A calm, elevated identity built around restraint, warmth, and trust.';
  if (normalized.includes('fintech')) return 'A confident product direction that balances trust, clarity, and motion.';
  if (normalized.includes('fashion')) return 'A bold, editorial mood with sharp contrast and expressive composition.';
  return 'A clear creative direction translated into colors, type, references, and notes.';
}

function inferMood(prompt: string): string {
  const normalized = prompt.toLowerCase();
  if (normalized.includes('wellness')) return 'calm luxury';
  if (normalized.includes('fintech')) return 'confident clarity';
  if (normalized.includes('fashion')) return 'editorial tension';
  return 'focused concept';
}

function inferTone(prompt: string): string[] {
  const normalized = prompt.toLowerCase();
  if (normalized.includes('wellness')) return ['minimal', 'warm', 'premium'];
  if (normalized.includes('fintech')) return ['clean', 'credible', 'modern'];
  if (normalized.includes('fashion')) return ['sharp', 'dramatic', 'high-contrast'];
  return ['clear', 'calm', 'intentional'];
}

function inferTags(prompt: string): string[] {
  const normalized = prompt.toLowerCase();
  const tags: string[] = [];
  if (normalized.includes('brand')) tags.push('brand');
  if (normalized.includes('landing')) tags.push('landing page');
  if (normalized.includes('editorial')) tags.push('editorial');
  if (normalized.includes('wellness')) tags.push('wellness');
  if (normalized.includes('fintech')) tags.push('fintech');
  if (normalized.includes('fashion')) tags.push('fashion');
  return tags.length > 0 ? tags : [slugify(prompt || 'concept')];
}

function inferPalette(prompt: string) {
  const normalized = prompt.toLowerCase();
  if (normalized.includes('wellness')) {
    return [
      { id: createId('palette'), label: 'Ivory', hex: '#F7F2EB', usage: 'Background and base surfaces' },
      { id: createId('palette'), label: 'Sage', hex: '#A8B5A2', usage: 'Secondary accents and wellness cues' },
      { id: createId('palette'), label: 'Muted Gold', hex: '#B89A6A', usage: 'Premium highlights and calls to action' },
      { id: createId('palette'), label: 'Charcoal', hex: '#2D2A26', usage: 'Primary text and contrast' },
    ];
  }
  if (normalized.includes('fintech')) {
    return [
      { id: createId('palette'), label: 'Slate', hex: '#0F172A', usage: 'Primary text and header surfaces' },
      { id: createId('palette'), label: 'Mist', hex: '#E2E8F0', usage: 'Panels and borders' },
      { id: createId('palette'), label: 'Blue', hex: '#4F8CFF', usage: 'Primary actions and links' },
      { id: createId('palette'), label: 'Mint', hex: '#B9F5D8', usage: 'Positive states and highlights' },
    ];
  }
  return [
    { id: createId('palette'), label: 'Base', hex: '#F3F4F6', usage: 'Background' },
    { id: createId('palette'), label: 'Ink', hex: '#111827', usage: 'Text' },
    { id: createId('palette'), label: 'Accent', hex: '#8B5CF6', usage: 'Highlights' },
    { id: createId('palette'), label: 'Soft', hex: '#DDD6FE', usage: 'Muted surfaces' },
  ];
}

function inferTypography(prompt: string) {
  const normalized = prompt.toLowerCase();
  if (normalized.includes('wellness')) {
    return [
      { id: createId('typography'), role: 'heading' as const, fontName: 'Cormorant Garamond', note: 'Elegant, editorial, high-trust' },
      { id: createId('typography'), role: 'body' as const, fontName: 'Inter', note: 'Clean and highly readable' },
      { id: createId('typography'), role: 'accent' as const, fontName: 'Inter Tight', note: 'Labels, metadata, and UI details' },
    ];
  }
  if (normalized.includes('fintech')) {
    return [
      { id: createId('typography'), role: 'heading' as const, fontName: 'Sora', note: 'Modern and structured' },
      { id: createId('typography'), role: 'body' as const, fontName: 'Inter', note: 'Neutral product body copy' },
      { id: createId('typography'), role: 'accent' as const, fontName: 'IBM Plex Mono', note: 'Data, metrics, and labels' },
    ];
  }
  return [
    { id: createId('typography'), role: 'heading' as const, fontName: 'Inter Tight', note: 'Compact and intentional' },
    { id: createId('typography'), role: 'body' as const, fontName: 'Inter', note: 'Readable and flexible' },
    { id: createId('typography'), role: 'accent' as const, fontName: 'Space Mono', note: 'Small system accents' },
  ];
}

function inferReferences(prompt: string) {
  const normalized = prompt.toLowerCase();
  if (normalized.includes('wellness')) {
    return [
      {
        id: createId('ref'),
        title: 'Minimal spa interior',
        imageUrl:
          'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
        category: 'Interior',
        source: 'Unsplash',
      },
      {
        id: createId('ref'),
        title: 'Textural packaging detail',
        imageUrl:
          'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80',
        category: 'Packaging',
        source: 'Unsplash',
      },
      {
        id: createId('ref'),
        title: 'Editorial product frame',
        imageUrl:
          'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=80',
        category: 'Campaign',
        source: 'Unsplash',
      },
    ];
  }
  if (normalized.includes('fintech')) {
    return [
      {
        id: createId('ref'),
        title: 'App dashboard blur',
        imageUrl:
          'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
        category: 'Dashboard',
        source: 'Unsplash',
      },
      {
        id: createId('ref'),
        title: 'Metric cards',
        imageUrl:
          'https://images.unsplash.com/photo-1556742205-9f8b1a0f0ef9?auto=format&fit=crop&w=1200&q=80',
        category: 'UI',
        source: 'Unsplash',
      },
    ];
  }
  return [
    {
      id: createId('ref'),
      title: 'Neutral composition',
      imageUrl:
        'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80',
      category: 'Composition',
      source: 'Unsplash',
    },
  ];
}

function inferNotes(prompt: string) {
  const normalized = prompt.toLowerCase();
  if (normalized.includes('wellness')) {
    return [
      { id: createId('note'), text: 'Use whitespace as a luxury signal.', type: 'keyword' as const, position: { x: 120, y: 80 } },
      { id: createId('note'), text: 'Avoid harsh contrast; keep edges soft.', type: 'instruction' as const, position: { x: 360, y: 120 } },
      { id: createId('note'), text: 'Warm, grounded, and quietly confident.', type: 'idea' as const, position: { x: 220, y: 260 } },
    ];
  }
  if (normalized.includes('fintech')) {
    return [
      { id: createId('note'), text: 'Make trust visible in every card.', type: 'instruction' as const, position: { x: 180, y: 100 } },
      { id: createId('note'), text: 'Motion should feel precise, not playful.', type: 'idea' as const, position: { x: 420, y: 180 } },
    ];
  }
  return [
    { id: createId('note'), text: 'Lead with one clear mood.', type: 'keyword' as const, position: { x: 180, y: 100 } },
    { id: createId('note'), text: 'Keep composition flexible for later refinement.', type: 'instruction' as const, position: { x: 420, y: 180 } },
  ];
}