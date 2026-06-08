import type { Board } from '@/types/board';

const MAX_PAYLOAD_BYTES = 500_000;

export function validateBoardPayload(value: unknown): { board: Board } | { error: string } {
  if (!value || typeof value !== 'object') {
    return { error: 'Invalid board payload' };
  }

  const payload = JSON.stringify(value);
  if (payload.length > MAX_PAYLOAD_BYTES) {
    return { error: 'Board payload is too large' };
  }

  const board = value as Board;

  if (typeof board.id !== 'string' || !board.id.trim()) {
    return { error: 'Board id is required' };
  }

  if (typeof board.title !== 'string') {
    return { error: 'Board title is required' };
  }

  if (!Array.isArray(board.references)) {
    return { error: 'Board references must be an array' };
  }

  return { board };
}
