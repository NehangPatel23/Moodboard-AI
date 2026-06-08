import { NextResponse } from 'next/server';
import { getBoardAccess } from '@/lib/db/board-access';
import { getAuthenticatedUser } from '@/lib/db/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import type { BoardComment } from '@/types/board';

type RouteContext = {
  params: Promise<{ id: string }>;
};

type CommentRow = {
  id: string;
  board_id: string;
  user_id: string;
  body: string;
  created_at: string;
  updated_at: string;
};

function rowToComment(row: CommentRow, authorName: string): BoardComment {
  return {
    id: row.id,
    boardId: row.board_id,
    userId: row.user_id,
    authorName,
    body: row.body,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
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
    .from('board_comments')
    .select('id, board_id, user_id, body, created_at, updated_at')
    .eq('board_id', id)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const userIds = Array.from(new Set((data ?? []).map((row) => row.user_id)));
  let profileMap = new Map<string, string>();

  if (userIds.length > 0) {
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, name')
      .in('id', userIds);

    profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile.name]));
  }

  const comments: BoardComment[] = (data ?? []).map((row) =>
    rowToComment(row as CommentRow, profileMap.get(row.user_id) ?? 'Collaborator'),
  );

  return NextResponse.json({ comments });
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const { user, profile } = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const access = await getBoardAccess(user.id, id);
  if (!access.canComment) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: { body?: string };
  try {
    body = (await request.json()) as { body?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const text = body.body?.trim() ?? '';
  if (!text) {
    return NextResponse.json({ error: 'Comment body is required' }, { status: 400 });
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data, error } = await admin
    .from('board_comments')
    .insert({
      board_id: id,
      user_id: user.id,
      body: text,
      created_at: now,
      updated_at: now,
    })
    .select('id, board_id, user_id, body, created_at, updated_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const comment = rowToComment(
    data as CommentRow,
    profile?.name ?? 'You',
  );

  return NextResponse.json({ comment }, { status: 201 });
}
