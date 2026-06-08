import { NextResponse } from 'next/server';
import { diffBoards, summarizeBoardChanges } from '@/lib/board-diff';
import { recordBoardActivity } from '@/lib/db/board-activity';
import { getBoardAccess } from '@/lib/db/board-access';
import { boardToRow, rowToBoard } from '@/lib/db/board-mappers';
import { getAuthenticatedUser } from '@/lib/db/auth';
import { isMissingColumnError } from '@/lib/db/schema-errors';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Board } from '@/types/board';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const { user, profile } = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { board?: Board };
  try {
    body = (await request.json()) as { board?: Board };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.board || body.board.id !== id) {
    return NextResponse.json({ error: 'board id mismatch' }, { status: 400 });
  }

  const access = await getBoardAccess(user.id, id);
  if (!access.canEdit || !access.ownerId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: existingRow } = await admin.from('boards').select('*').eq('id', id).maybeSingle();
  const previousBoard = existingRow ? rowToBoard(existingRow) : null;

  const row = boardToRow(body.board, access.ownerId);
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

  try {
    const changes = previousBoard ? diffBoards(previousBoard, body.board) : [];
    await recordBoardActivity(admin, {
      boardId: id,
      userId: user.id,
      actorName: savedByName,
      changes,
      summary: summarizeBoardChanges(changes),
    });
  } catch {
    // Activity logging is best-effort; board save already succeeded.
  }

  const role = access.role ?? 'owner';
  return NextResponse.json({ board: { ...rowToBoard(data), role } });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const { user } = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const access = await getBoardAccess(user.id, id);
  if (!access.canDelete) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from('boards').delete().eq('id', id).eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
