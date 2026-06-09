import { NextResponse } from 'next/server';
import { rowToBoard } from '@/lib/db/board-mappers';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Board } from '@/types/board';

const MAX_BOARDS = 48;

type BoardRow = {
  user_id: string;
};

export async function GET() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('boards')
    .select('*')
    .eq('visibility', 'shared')
    .order('updated_at', { ascending: false })
    .limit(MAX_BOARDS);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = data ?? [];
  const userIds = [...new Set(rows.map((row) => (row as BoardRow).user_id))];
  let profileMap = new Map<string, string>();

  if (userIds.length > 0) {
    const { data: profiles } = await admin.from('profiles').select('id, name').in('id', userIds);
    profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile.name]));
  }

  const boards: Board[] = rows.map((row) => {
    const board = rowToBoard(row);
    const creatorName = profileMap.get((row as BoardRow).user_id);
    return creatorName ? { ...board, creatorName } : board;
  });

  return NextResponse.json({ boards });
}
