import type { SupabaseClient } from '@supabase/supabase-js';
import type { BoardActivityChange, BoardActivityEvent } from '@/types/board';
import { isMissingColumnError, isMissingRelationError } from '@/lib/db/schema-errors';

type ActivityRow = {
  id: string;
  board_id: string;
  user_id: string;
  actor_name: string;
  action: 'saved';
  summary: string | null;
  changes?: BoardActivityChange[] | unknown;
  created_at: string;
};

function parseChanges(raw: unknown): BoardActivityChange[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (item): item is BoardActivityChange =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as BoardActivityChange).summary === 'string',
  );
}

export function rowToActivity(row: ActivityRow): BoardActivityEvent {
  return {
    id: row.id,
    boardId: row.board_id,
    userId: row.user_id,
    actorName: row.actor_name,
    action: row.action,
    summary: row.summary,
    changes: parseChanges(row.changes),
    createdAt: row.created_at,
  };
}

export async function recordBoardActivity(
  admin: SupabaseClient,
  input: {
    boardId: string;
    userId: string;
    actorName: string;
    summary?: string | null;
    changes?: BoardActivityChange[];
  },
): Promise<BoardActivityEvent | null> {
  const payload = {
    board_id: input.boardId,
    user_id: input.userId,
    actor_name: input.actorName,
    action: 'saved' as const,
    summary: input.summary ?? 'Saved board changes',
    changes: input.changes ?? [],
  };

  let { data, error } = await admin
    .from('board_activity')
    .insert(payload)
    .select('id, board_id, user_id, actor_name, action, summary, changes, created_at')
    .single();

  if (error && isMissingColumnError(error, 'changes')) {
    ({ data, error } = await admin
      .from('board_activity')
      .insert({
        board_id: input.boardId,
        user_id: input.userId,
        actor_name: input.actorName,
        action: 'saved',
        summary: input.summary ?? 'Saved board changes',
      })
      .select('id, board_id, user_id, actor_name, action, summary, created_at')
      .single());
  }

  if (error) {
    if (isMissingRelationError(error, 'board_activity')) {
      return null;
    }
    throw error;
  }

  return rowToActivity(data as ActivityRow);
}
