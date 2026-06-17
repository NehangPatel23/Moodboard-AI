import { rowToBoard } from '@/lib/db/board-mappers';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Board } from '@/types/board';

const MAX_BOARDS = 48;

type BoardRow = {
  user_id: string;
};

export async function fetchPublicBoards(): Promise<Board[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('boards')
    .select('*')
    .eq('visibility', 'shared')
    .order('updated_at', { ascending: false })
    .limit(MAX_BOARDS);

  if (error) {
    throw new Error(error.message);
  }

  const rows = data ?? [];
  const userIds = [...new Set(rows.map((row) => (row as BoardRow).user_id))];
  let profileMap = new Map<string, string>();

  if (userIds.length > 0) {
    const { data: profiles } = await admin.from('profiles').select('id, name').in('id', userIds);
    profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile.name]));
  }

  return rows.map((row) => {
    const board = rowToBoard(row);
    const userId = (row as BoardRow).user_id;
    const creatorName = profileMap.get(userId);
    return creatorName
      ? { ...board, creatorId: userId, creatorName }
      : { ...board, creatorId: userId };
  });
}
