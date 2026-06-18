import type { Board, BoardDraftInput, BoardTemplate } from '@/types/board';
import { apiFetch } from '@/lib/api-client';
import {
  BOARD_REFERENCE_COUNT,
  REFERENCE_IMAGE_SOURCE,
  buildReferenceImageUrl,
  needsReferenceImageUpgrade,
  padReferencesToCount,
  sanitizeBoardReferences,
} from '@/lib/reference-images';
import { createId, slugify } from './utils';
import { boardTemplates } from './mock-data';

const BOARD_STORAGE_EVENT = 'moodboard-ai:boards-updated';

let cachedBoards: Board[] = [];
let boardsLoading = false;
let hydratedForUser = false;

let activeUserId: string | null = null;
const lastLocalSaveAtByBoard = new Map<string, string>();

const BOARD_FETCH_MAX_ATTEMPTS = 4;
const BOARD_FETCH_RETRY_MS = 350;

function nowIso(): string {
  return new Date().toISOString();
}

function canNotify(): boolean {
  return typeof window !== 'undefined';
}

function notifyBoardsChanged(): void {
  if (!canNotify()) return;
  window.dispatchEvent(new Event(BOARD_STORAGE_EVENT));
}

async function showPersistError(message: string): Promise<void> {
  const { showToast } = await import('@/components/shared/toast-store');
  showToast(message, 'destructive');
}

function cloneBoard(board: Board): Board {
  return JSON.parse(JSON.stringify(board)) as Board;
}

/**
 * Switches the active board workspace to the given user. Fetches boards from
 * the database (seeding sample boards for brand-new accounts on the server).
 */
function isUnauthorizedError(error: unknown): boolean {
  return error instanceof Error && error.message.toLowerCase().includes('unauthorized');
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function setActiveBoardUser(userId: string | null): Promise<void> {
  if (!userId) {
    resetBoardStore();
    return;
  }

  if (hydratedForUser && userId === activeUserId) return;
  if (boardsLoading && userId === activeUserId) return;

  activeUserId = userId;
  boardsLoading = true;
  notifyBoardsChanged();

  let lastError: unknown = null;

  for (let attempt = 0; attempt < BOARD_FETCH_MAX_ATTEMPTS; attempt += 1) {
    if (attempt > 0) {
      await wait(BOARD_FETCH_RETRY_MS * attempt);
    }

    try {
      const data = await apiFetch<{ boards: Board[] }>('/api/boards');
      const migratedBoards = await Promise.all(
        data.boards.map(async (board) => {
          const needsEnrichment = board.references.some((reference) =>
            needsReferenceImageUpgrade(reference),
          );
          if (!needsEnrichment) return board;

          try {
            const enriched = await apiFetch<{ board: Board }>('/api/reference-images/enrich', {
              method: 'POST',
              body: JSON.stringify({ board }),
            });
            return enriched.board;
          } catch {
            return sanitizeBoardReferences(board);
          }
        }),
      );

      cachedBoards = migratedBoards;
      hydratedForUser = true;
      boardsLoading = false;
      notifyBoardsChanged();

      const migrationNeeded = migratedBoards.some((board, index) => {
        const original = data.boards[index];
        return board.references.some(
          (reference, refIndex) =>
            reference.imageUrl !== original.references[refIndex]?.imageUrl ||
            reference.source !== original.references[refIndex]?.source,
        );
      });
      if (migrationNeeded && activeUserId) {
        const ownedOnly = migratedBoards.filter((board) => !board.role || board.role === 'owner');
        void apiFetch<{ boards: Board[] }>('/api/boards', {
          method: 'PUT',
          body: JSON.stringify({ boards: ownedOnly }),
        }).catch(() => {
          // Display migration still applies locally even if persist fails.
        });
      }

      return;
    } catch (error) {
      lastError = error;
      const canRetry = isUnauthorizedError(error) && attempt < BOARD_FETCH_MAX_ATTEMPTS - 1;
      if (!canRetry) break;
    }
  }

  cachedBoards = [];
  boardsLoading = false;
  hydratedForUser = true;
  notifyBoardsChanged();

  if (lastError) {
    void showPersistError('Failed to load boards.');
  }
}

export function resetBoardStore(): void {
  activeUserId = null;
  cachedBoards = [];
  boardsLoading = false;
  hydratedForUser = false;
  cachedBoardStoreSnapshot = SERVER_BOARD_STORE_SNAPSHOT;
  notifyBoardsChanged();
}

export function subscribeBoards(callback: () => void): () => void {
  if (!canNotify()) return () => undefined;

  const handler = () => callback();
  window.addEventListener(BOARD_STORAGE_EVENT, handler);

  return () => {
    window.removeEventListener(BOARD_STORAGE_EVENT, handler);
  };
}

export function getTemplates(): BoardTemplate[] {
  return boardTemplates.map((template) => ({ ...template }));
}

export function loadBoards(): Board[] {
  return cachedBoards;
}

export function isBoardsLoading(): boolean {
  return boardsLoading;
}

export function areBoardsHydrated(): boolean {
  return hydratedForUser;
}

export type BoardStoreSnapshot = {
  boards: Board[];
  loading: boolean;
  hydrated: boolean;
};

const SERVER_BOARD_STORE_SNAPSHOT: BoardStoreSnapshot = {
  boards: [],
  loading: true,
  hydrated: false,
};

let cachedBoardStoreSnapshot: BoardStoreSnapshot = SERVER_BOARD_STORE_SNAPSHOT;

export function getBoardStoreSnapshot(): BoardStoreSnapshot {
  if (
    cachedBoardStoreSnapshot.boards === cachedBoards &&
    cachedBoardStoreSnapshot.loading === boardsLoading &&
    cachedBoardStoreSnapshot.hydrated === hydratedForUser
  ) {
    return cachedBoardStoreSnapshot;
  }

  cachedBoardStoreSnapshot = {
    boards: cachedBoards,
    loading: boardsLoading,
    hydrated: hydratedForUser,
  };
  return cachedBoardStoreSnapshot;
}

export function getServerBoardStoreSnapshot(): BoardStoreSnapshot {
  return SERVER_BOARD_STORE_SNAPSHOT;
}

export function isBoardStoreResolving(authStatus: 'loading' | 'authenticated' | 'unauthenticated'): boolean {
  return (
    authStatus === 'loading' ||
    boardsLoading ||
    (authStatus === 'authenticated' && !hydratedForUser)
  );
}

export function getBoardById(boardId: string): Board | undefined {
  return cachedBoards.find((board) => board.id === boardId);
}

export function saveBoards(boards: Board[]): void {
  const previous = cachedBoards;
  const sanitizedBoards = boards.map(sanitizeBoardReferences);
  const ownedBoards = sanitizedBoards.filter((board) => !board.role || board.role === 'owner');
  cachedBoards = sanitizedBoards;
  notifyBoardsChanged();

  if (!activeUserId) return;

  void apiFetch<{ boards: Board[] }>('/api/boards', {
    method: 'PUT',
    body: JSON.stringify({ boards: ownedBoards }),
  }).catch(() => {
    cachedBoards = previous;
    notifyBoardsChanged();
    void showPersistError('Failed to save boards.');
  });
}

export function appendBoard(board: Board): Board {
  const previous = cachedBoards;
  const sanitizedBoard = sanitizeBoardReferences(board);
  cachedBoards = [sanitizedBoard, ...loadBoards()];
  notifyBoardsChanged();

  if (!activeUserId) return sanitizedBoard;

  void apiFetch('/api/boards', {
    method: 'POST',
    body: JSON.stringify({ board: sanitizedBoard }),
  }).catch(() => {
    cachedBoards = previous;
    notifyBoardsChanged();
    void showPersistError('Failed to save board.');
  });

  return sanitizedBoard;
}

export type BoardSaveSource = 'manual' | 'auto';

export type BoardUpdateOptions = {
  saveSource?: BoardSaveSource;
};

export function updateBoard(
  boardId: string,
  updater: (board: Board) => Board,
  options?: BoardUpdateOptions,
): Board | null {
  const boards = loadBoards();
  const index = boards.findIndex((board) => board.id === boardId);
  if (index === -1) return null;

  const previous = boards;
  const nextBoards = boards.slice();
  const updated = sanitizeBoardReferences(updater(cloneBoard(boards[index])));
  updated.updatedAt = nowIso();
  lastLocalSaveAtByBoard.set(boardId, updated.updatedAt);
  nextBoards[index] = updated;
  cachedBoards = nextBoards;
  notifyBoardsChanged();

  if (!activeUserId) return updated;

  void apiFetch<{ board: Board }>(`/api/boards/${boardId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      board: updated,
      saveSource: options?.saveSource ?? 'manual',
    }),
  })
    .then((data) => {
      if (!data?.board) return;
      const current = loadBoards();
      const idx = current.findIndex((board) => board.id === boardId);
      if (idx === -1) return;
      const nextBoards = current.slice();
      nextBoards[idx] = {
        ...sanitizeBoardReferences(data.board),
        role: current[idx].role,
      };
      cachedBoards = nextBoards;
      notifyBoardsChanged();
    })
    .catch(() => {
      cachedBoards = previous;
      notifyBoardsChanged();
      void showPersistError('Failed to update board.');
    });

  return updated;
}

export async function persistBoardRemote(
  boardId: string,
  board: Board,
  options?: BoardUpdateOptions,
): Promise<Board | null> {
  const boards = loadBoards();
  const index = boards.findIndex((item) => item.id === boardId);
  if (index === -1) return null;

  const previous = boards;
  const nextBoards = boards.slice();
  const updated = sanitizeBoardReferences(cloneBoard(board));
  updated.updatedAt = nowIso();
  lastLocalSaveAtByBoard.set(boardId, updated.updatedAt);
  nextBoards[index] = updated;
  cachedBoards = nextBoards;
  notifyBoardsChanged();

  if (!activeUserId) return updated;

  try {
    const data = await apiFetch<{ board: Board }>(`/api/boards/${boardId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        board: updated,
        saveSource: options?.saveSource ?? 'manual',
      }),
    });

    if (!data?.board) {
      cachedBoards = previous;
      notifyBoardsChanged();
      return null;
    }

    const current = loadBoards();
    const idx = current.findIndex((item) => item.id === boardId);
    if (idx === -1) return null;

    const merged: Board = {
      ...sanitizeBoardReferences(data.board),
      role: current[idx].role,
    };
    const mergedBoards = current.slice();
    mergedBoards[idx] = merged;
    cachedBoards = mergedBoards;
    notifyBoardsChanged();
    return merged;
  } catch {
    cachedBoards = previous;
    notifyBoardsChanged();
    return null;
  }
}

export function getLastLocalSaveAt(boardId: string): string | null {
  return lastLocalSaveAtByBoard.get(boardId) ?? null;
}

export function applyRemoteBoard(boardId: string, board: Board): boolean {
  const boards = loadBoards();
  const index = boards.findIndex((item) => item.id === boardId);
  if (index === -1) return false;

  const sanitized = sanitizeBoardReferences(board);
  const nextBoards = boards.slice();
  nextBoards[index] = {
    ...sanitized,
    role: boards[index].role,
  };
  cachedBoards = nextBoards;
  notifyBoardsChanged();
  return true;
}

export async function reloadBoards(): Promise<void> {
  if (!activeUserId) return;
  hydratedForUser = false;
  await setActiveBoardUser(activeUserId);
}

export function deleteBoardById(boardId: string): boolean {
  const boards = loadBoards();
  const target = boards.find((board) => board.id === boardId);
  if (!target || (target.role && target.role !== 'owner')) return false;

  const nextBoards = boards.filter((board) => board.id !== boardId);
  const previous = boards;
  cachedBoards = nextBoards;
  notifyBoardsChanged();

  if (!activeUserId) return true;

  void apiFetch(`/api/boards/${boardId}`, { method: 'DELETE' }).catch(() => {
    cachedBoards = previous;
    notifyBoardsChanged();
    void showPersistError('Failed to delete board.');
  });

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

  return appendBoard(copy);
}

export function toggleFavoriteById(boardId: string): Board | null {
  const boards = loadBoards();
  const index = boards.findIndex((board) => board.id === boardId);
  if (index === -1) return null;

  const current = boards[index];
  const isCollaborator = current.role === 'editor' || current.role === 'viewer';

  if (isCollaborator) {
    const previous = boards;
    const updated = { ...cloneBoard(current), isFavorite: !current.isFavorite };
    const nextBoards = boards.slice();
    nextBoards[index] = updated;
    cachedBoards = nextBoards;
    notifyBoardsChanged();

    if (activeUserId) {
      void apiFetch<{ isFavorite: boolean }>(`/api/boards/${boardId}/favorite`, { method: 'POST' })
        .then((data) => {
          const currentBoards = loadBoards();
          const currentIndex = currentBoards.findIndex((board) => board.id === boardId);
          if (currentIndex === -1) return;
          const synced = currentBoards.slice();
          synced[currentIndex] = { ...synced[currentIndex], isFavorite: data.isFavorite };
          cachedBoards = synced;
          notifyBoardsChanged();
        })
        .catch(() => {
          cachedBoards = previous;
          notifyBoardsChanged();
          void showPersistError('Failed to update favorite.');
        });
    }

    return updated;
  }

  return updateBoard(boardId, (board) => ({ ...board, isFavorite: !board.isFavorite }));
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
    references: padReferencesToCount(inferReferences(prompt), {
      prompt,
      mood: inferMood(prompt),
      palette: inferPalette(prompt),
    }),
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

function createInferredReference(
  prompt: string,
  title: string,
  category: string,
  index: number,
) {
  const mood = inferMood(prompt);
  const palette = inferPalette(prompt);

  return {
    id: createId('ref'),
    title,
    imageUrl: buildReferenceImageUrl({
      title,
      category,
      mood,
      prompt,
      palette,
      seed: `${prompt}-${index}`,
    }),
    category,
    source: REFERENCE_IMAGE_SOURCE,
  };
}

function inferReferences(prompt: string) {
  const normalized = prompt.toLowerCase();
  if (normalized.includes('wellness')) {
    return [
      createInferredReference(prompt, 'Minimal spa interior', 'Interior', 0),
      createInferredReference(prompt, 'Textural packaging detail', 'Product', 1),
      createInferredReference(prompt, 'Editorial product frame', 'Campaign', 2),
      createInferredReference(prompt, 'Soft linen texture', 'Detail', 3),
      createInferredReference(prompt, 'Warm lifestyle portrait', 'Portrait', 4),
      createInferredReference(prompt, 'Calm botanical still life', 'Editorial', 5),
    ];
  }
  if (normalized.includes('fintech')) {
    return [
      createInferredReference(prompt, 'App dashboard blur', 'Dashboard', 0),
      createInferredReference(prompt, 'Metric cards', 'UI', 1),
      createInferredReference(prompt, 'Mobile banking interface', 'Product', 2),
      createInferredReference(prompt, 'Modern office environment', 'Interior', 3),
      createInferredReference(prompt, 'Data visualization detail', 'Detail', 4),
      createInferredReference(prompt, 'Professional team portrait', 'Portrait', 5),
    ];
  }
  if (normalized.includes('fashion')) {
    return [
      createInferredReference(prompt, 'Runway silhouette', 'Editorial', 0),
      createInferredReference(prompt, 'Studio lighting setup', 'Campaign', 1),
      createInferredReference(prompt, 'Fabric texture close-up', 'Detail', 2),
      createInferredReference(prompt, 'Street style moment', 'Portrait', 3),
      createInferredReference(prompt, 'Lookbook composition', 'Product', 4),
      createInferredReference(prompt, 'Gallery interior backdrop', 'Interior', 5),
    ];
  }
  const title = inferTitle(prompt);
  return [
    createInferredReference(prompt, `${title} hero frame`, 'Campaign', 0),
    createInferredReference(prompt, 'Material texture study', 'Detail', 1),
    createInferredReference(prompt, 'Environmental context', 'Interior', 2),
    createInferredReference(prompt, 'Product or subject focus', 'Product', 3),
    createInferredReference(prompt, 'Editorial lighting reference', 'Editorial', 4),
    createInferredReference(prompt, 'Lifestyle atmosphere', 'Portrait', 5),
  ].slice(0, BOARD_REFERENCE_COUNT);
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