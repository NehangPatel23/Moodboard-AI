import { NextResponse } from 'next/server';
import { diffBoards } from '@/lib/board-diff';
import { recordBoardActivity } from '@/lib/db/board-activity';
import { getBoardAccess } from '@/lib/db/board-access';
import { boardToRow, rowToBoard } from '@/lib/db/board-mappers';
import { getAuthenticatedUser } from '@/lib/db/auth';
import { isMissingColumnError, isMissingRelationError } from '@/lib/db/schema-errors';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Board, BoardSnapshot } from '@/types/board';

type RouteContext = {
  params: Promise<{ id: string; snapshotId: string }>;
};

type SnapshotRow = {
  id: string;
  board_id: string;
  board_data: Board;
  label: string | null;
  actor_name: string;
  created_at: string;
};

export async function POST(_request: Request, context: RouteContext) {
  const { id, snapshotId } = await context.params;
  const { user, profile } = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const access = await getBoardAccess(user.id, id);
  if (!access.canEdit || !access.ownerId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const admin = createAdminClient();

  const { data: snapshotRow, error: snapshotError } = await admin
    .from('board_snapshots')
    .select('id, board_id, board_data, label, actor_name, created_at')
    .eq('id', snapshotId)
    .eq('board_id', id)
    .maybeSingle();

  if (snapshotError) {
    if (isMissingRelationError(snapshotError, 'board_snapshots')) {
      return NextResponse.json(
        { error: 'Snapshots not available. Run migration 015_board_snapshots.sql.' },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: snapshotError.message }, { status: 500 });
  }

  if (!snapshotRow) {
    return NextResponse.json({ error: 'Snapshot not found' }, { status: 404 });
  }

  const snapshot = snapshotRow as SnapshotRow;
  const restoredBoard: Board = {
    ...snapshot.board_data,
    id,
    updatedAt: new Date().toISOString(),
  };

  const { data: existingRow } = await admin.from('boards').select('*').eq('id', id).maybeSingle();
  const previousBoard = existingRow ? rowToBoard(existingRow) : null;

  const row = boardToRow(restoredBoard, access.ownerId);
  const savedByName = profile?.name ?? 'Collaborator';

  let { data, error } = await admin
    .from('boards')
    .update({ ...row, last_saved_by_name: savedByName })
    .eq('id', id)
    .select('*')
    .maybeSingle();

  if (error && isMissingColumnError(error, 'last_saved_by_name')) {
    ({ data, error } = await admin.from('boards').update(row).eq('id', id).select('*').maybeSingle());
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Board not found' }, { status: 404 });
  }

  const snapshotLabel =
    snapshot.label?.trim() ||
    `Snapshot from ${new Date(snapshot.created_at).toLocaleString()}`;

  try {
    const changes = previousBoard ? diffBoards(previousBoard, restoredBoard) : [];
    await recordBoardActivity(admin, {
      boardId: id,
      userId: user.id,
      actorName: savedByName,
      changes,
      summary: `Switched to Snapshot ${snapshotLabel}`,
    });
  } catch {
    // Activity logging is best-effort.
  }

  const role = access.role ?? 'owner';
  return NextResponse.json({
    board: { ...rowToBoard(data), role },
    snapshot: {
      id: snapshot.id,
      label: snapshot.label,
      createdAt: snapshot.created_at,
    } satisfies Pick<BoardSnapshot, 'id' | 'label' | 'createdAt'>,
  });
}
