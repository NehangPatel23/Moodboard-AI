import { NextResponse } from 'next/server';
import { boardToRow, rowToBoard } from '@/lib/db/board-mappers';
import { getAuthenticatedUser } from '@/lib/db/auth';
import { isMissingColumnError } from '@/lib/db/schema-errors';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Board, BoardRole } from '@/types/board';

function withRole(board: ReturnType<typeof rowToBoard>, role: BoardRole): Board {
  return { ...board, role };
}

function buildCollaboratorCounts(
  memberRows: Array<{ board_id: string }> | null,
  inviteRows: Array<{ board_id: string }> | null,
): Map<string, number> {
  const counts = new Map<string, number>();

  for (const row of memberRows ?? []) {
    counts.set(row.board_id, (counts.get(row.board_id) ?? 0) + 1);
  }

  for (const row of inviteRows ?? []) {
    counts.set(row.board_id, (counts.get(row.board_id) ?? 0) + 1);
  }

  return counts;
}

type MembershipRow = {
  board_id: string;
  role: string;
  is_favorite?: boolean;
};

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

  let memberships: MembershipRow[] | null = null;
  let membershipError = null as { message: string } | null;

  const membershipsWithFavorite = await admin
    .from('board_members')
    .select('board_id, role, is_favorite')
    .eq('user_id', user.id);

  if (membershipsWithFavorite.error && isMissingColumnError(membershipsWithFavorite.error, 'is_favorite')) {
    const membershipsWithoutFavorite = await admin
      .from('board_members')
      .select('board_id, role')
      .eq('user_id', user.id);
    memberships = membershipsWithoutFavorite.data;
    membershipError = membershipsWithoutFavorite.error;
  } else {
    memberships = membershipsWithFavorite.data as MembershipRow[] | null;
    membershipError = membershipsWithFavorite.error;
  }

  if (membershipError) {
    return NextResponse.json({ error: membershipError.message }, { status: 500 });
  }

  const ownedIds = (ownedRows ?? []).map((row) => row.id as string);
  let collaboratorCounts = new Map<string, number>();

  if (ownedIds.length > 0) {
    const [{ data: memberRows, error: memberCountError }, { data: inviteRows, error: inviteCountError }] =
      await Promise.all([
        admin.from('board_members').select('board_id').in('board_id', ownedIds),
        admin.from('board_invites').select('board_id').eq('status', 'pending').in('board_id', ownedIds),
      ]);

    if (memberCountError) {
      return NextResponse.json({ error: memberCountError.message }, { status: 500 });
    }

    if (inviteCountError) {
      return NextResponse.json({ error: inviteCountError.message }, { status: 500 });
    }

    collaboratorCounts = buildCollaboratorCounts(memberRows, inviteRows);
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
      const membership = memberships.find((item) => item.board_id === row.id) as MembershipRow | undefined;
      const role = membership?.role === 'editor' || membership?.role === 'viewer'
        ? membership.role
        : 'viewer';
      const board = rowToBoard(row);
      const memberFavorite = membership && 'is_favorite' in membership ? membership.is_favorite === true : false;
      return withRole({ ...board, isFavorite: memberFavorite }, role);
    });
  }

  const ownedBoards = (ownedRows ?? []).map((row) => {
    const board = withRole(rowToBoard(row), 'owner');
    const collaboratorCount = collaboratorCounts.get(row.id as string) ?? 0;
    return collaboratorCount > 0 ? { ...board, hasCollaborators: true } : board;
  });

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
