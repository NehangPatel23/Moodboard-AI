import { NextResponse } from 'next/server';
import { boardToRow, rowToBoard } from '@/lib/db/board-mappers';
import { getAuthenticatedUser } from '@/lib/db/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Board, BoardRole } from '@/types/board';

function withRole(board: ReturnType<typeof rowToBoard>, role: BoardRole): Board {
  return { ...board, role };
}

export async function GET() {
  const { user } = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: ownedRows, error: ownedError } = await admin
    .from('boards')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (ownedError) {
    return NextResponse.json({ error: ownedError.message }, { status: 500 });
  }

  const { data: memberships, error: membershipError } = await admin
    .from('board_members')
    .select('board_id, role')
    .eq('user_id', user.id);

  if (membershipError) {
    return NextResponse.json({ error: membershipError.message }, { status: 500 });
  }

  let memberBoards: Board[] = [];

  if (memberships?.length) {
    const memberIds = memberships.map((item) => item.board_id);
    const { data: memberRows, error: memberError } = await admin
      .from('boards')
      .select('*')
      .in('id', memberIds)
      .order('updated_at', { ascending: false });

    if (memberError) {
      return NextResponse.json({ error: memberError.message }, { status: 500 });
    }

    memberBoards = (memberRows ?? []).map((row) => {
      const membership = memberships.find((item) => item.board_id === row.id);
      const role = membership?.role === 'editor' || membership?.role === 'viewer'
        ? membership.role
        : 'viewer';
      return withRole(rowToBoard(row), role);
    });
  }

  const ownedBoards = (ownedRows ?? []).map((row) => withRole(rowToBoard(row), 'owner'));
  const merged = [...ownedBoards, ...memberBoards].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  return NextResponse.json({ boards: merged });
}

export async function PUT(request: Request) {
  const { user } = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { boards?: Board[] };
  try {
    body = (await request.json()) as { boards?: Board[] };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!Array.isArray(body.boards)) {
    return NextResponse.json({ error: 'boards array is required' }, { status: 400 });
  }

  const admin = createAdminClient();
  const ownedBoards = body.boards.filter((board) => !board.role || board.role === 'owner');

  const { error: deleteError } = await admin.from('boards').delete().eq('user_id', user.id);
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  if (ownedBoards.length > 0) {
    const rows = ownedBoards.map((board) => boardToRow(board, user.id));
    const { error: insertError } = await admin.from('boards').insert(rows);
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  const { data: memberships } = await admin
    .from('board_members')
    .select('board_id, role')
    .eq('user_id', user.id);

  let memberBoards: Board[] = [];
  if (memberships?.length) {
    const { data: memberRows } = await admin
      .from('boards')
      .select('*')
      .in(
        'id',
        memberships.map((item) => item.board_id),
      );

    memberBoards = (memberRows ?? []).map((row) => {
      const membership = memberships.find((item) => item.board_id === row.id);
      const role = membership?.role === 'editor' || membership?.role === 'viewer'
        ? membership.role
        : 'viewer';
      return withRole(rowToBoard(row), role);
    });
  }

  const responseBoards = [
    ...ownedBoards.map((board) => withRole(board, 'owner')),
    ...memberBoards,
  ].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return NextResponse.json({ boards: responseBoards });
}

export async function POST(request: Request) {
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

  if (!body.board || typeof body.board.id !== 'string') {
    return NextResponse.json({ error: 'board is required' }, { status: 400 });
  }

  const admin = createAdminClient();
  const row = boardToRow(body.board, user.id);
  const { error } = await admin.from('boards').insert(row);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ board: withRole(body.board, 'owner') }, { status: 201 });
}
