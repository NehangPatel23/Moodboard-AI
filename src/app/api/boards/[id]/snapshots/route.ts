import { NextResponse } from 'next/server';
import { getBoardAccess } from '@/lib/db/board-access';
import { getAuthenticatedUser } from '@/lib/db/auth';
import { isMissingRelationError } from '@/lib/db/schema-errors';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Board, BoardSnapshot } from '@/types/board';

type RouteContext = {
  params: Promise<{ id: string }>;
};

type SnapshotRow = {
  id: string;
  board_id: string;
  user_id: string;
  actor_name: string;
  label: string | null;
  board_data: Board;
  created_at: string;
};

function rowToSnapshot(row: SnapshotRow): BoardSnapshot {
  return {
    id: row.id,
    boardId: row.board_id,
    userId: row.user_id,
    actorName: row.actor_name,
    label: row.label,
    boardData: row.board_data,
    createdAt: row.created_at,
  };
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const { user } = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const access = await getBoardAccess(user.id, id);
  if (!access.canComment) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('board_snapshots')
    .select('id, board_id, user_id, actor_name, label, board_data, created_at')
    .eq('board_id', id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    if (isMissingRelationError(error, 'board_snapshots')) {
      return NextResponse.json({ snapshots: [] });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const snapshots = ((data ?? []) as SnapshotRow[]).map(rowToSnapshot);
  return NextResponse.json({ snapshots });
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const { user, profile } = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const access = await getBoardAccess(user.id, id);
  if (!access.canEdit) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: { board?: Board; label?: string };
  try {
    body = (await request.json()) as { board?: Board; label?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.board || body.board.id !== id) {
    return NextResponse.json({ error: 'board is required and must match board id' }, { status: 400 });
  }

  const admin = createAdminClient();
  const actorName = profile?.name ?? 'Collaborator';
  const label = body.label?.trim() || null;

  const { data, error } = await admin
    .from('board_snapshots')
    .insert({
      board_id: id,
      user_id: user.id,
      actor_name: actorName,
      label,
      board_data: body.board,
    })
    .select('id, board_id, user_id, actor_name, label, board_data, created_at')
    .single();

  if (error) {
    if (isMissingRelationError(error, 'board_snapshots')) {
      return NextResponse.json(
        { error: 'Snapshots not available. Run migration 015_board_snapshots.sql.' },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { snapshot: rowToSnapshot(data as SnapshotRow) },
    { status: 201 },
  );
}
