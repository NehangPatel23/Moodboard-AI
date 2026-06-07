import { NextResponse } from 'next/server';
import { getBoardAccess } from '@/lib/db/board-access';
import { boardToRow, rowToBoard } from '@/lib/db/board-mappers';
import { getAuthenticatedUser } from '@/lib/db/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Board } from '@/types/board';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const { user } = await getAuthenticatedUser();

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
  const row = boardToRow(body.board, access.ownerId);
  const { data, error } = await admin.from('boards').update(row).eq('id', id).select('*').maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Board not found' }, { status: 404 });
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
