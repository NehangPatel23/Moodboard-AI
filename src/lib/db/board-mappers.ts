import type { Board, BoardVisibility } from '@/types/board';

export type BoardRow = {
  id: string;
  user_id: string;
  title: string;
  prompt: string;
  summary: string;
  mood: string;
  tone: string[];
  tags: string[];
  palette: Board['palette'];
  typography: Board['typography'];
  references: Board['references'];
  notes: Board['notes'];
  brand_strategy?: Board['brandStrategy'] | null;
  is_favorite: boolean;
  visibility: BoardVisibility;
  created_at: string;
  updated_at: string;
  last_saved_by_name?: string | null;
  view_count?: number | null;
};

export function rowToBoard(row: BoardRow): Board {
  return {
    id: row.id,
    title: row.title,
    prompt: row.prompt,
    summary: row.summary,
    mood: row.mood,
    tone: row.tone ?? [],
    tags: row.tags ?? [],
    palette: row.palette ?? [],
    typography: row.typography ?? [],
    references: row.references ?? [],
    notes: row.notes ?? [],
    brandStrategy: row.brand_strategy ?? null,
    isFavorite: row.is_favorite,
    visibility: row.visibility,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastSavedByName: row.last_saved_by_name ?? null,
    viewCount: typeof row.view_count === 'number' ? row.view_count : undefined,
  };
}

export function boardToRow(board: Board, userId: string): BoardRow {
  return {
    id: board.id,
    user_id: userId,
    title: board.title,
    prompt: board.prompt,
    summary: board.summary,
    mood: board.mood,
    tone: board.tone,
    tags: board.tags,
    palette: board.palette,
    typography: board.typography,
    references: board.references,
    notes: board.notes,
    brand_strategy: board.brandStrategy ?? null,
    is_favorite: board.isFavorite,
    visibility: board.visibility,
    created_at: board.createdAt,
    updated_at: board.updatedAt,
  };
}
