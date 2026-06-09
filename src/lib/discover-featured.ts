import type { Board } from '@/types/board';

export const FEATURED_BOARD_IDS: string[] = [];

export function pickFeaturedBoards(boards: Board[]): Board[] {
  if (FEATURED_BOARD_IDS.length > 0) {
    const featured = FEATURED_BOARD_IDS.map((id) => boards.find((board) => board.id === id)).filter(
      (board): board is Board => Boolean(board),
    );
    if (featured.length > 0) return featured.slice(0, 6);
  }

  return boards.slice(0, 3);
}

export function getRemainingDiscoverBoards(boards: Board[], featured: Board[]): Board[] {
  const featuredIds = new Set(featured.map((board) => board.id));
  return boards.filter((board) => !featuredIds.has(board.id));
}
