import { NextResponse } from 'next/server';
import { clearCommentItemStateOverrides } from '@/lib/db/board-collaboration-state';
import { getBoardAccess } from '@/lib/db/board-access';
import { getAuthenticatedUser } from '@/lib/db/auth';
import { isMissingColumnError } from '@/lib/db/schema-errors';
import { createAdminClient } from '@/lib/supabase/admin';
import { normalizeEditorSection } from '@/lib/editor-sections';
import type { BoardComment } from '@/types/board';

type RouteContext = {
  params: Promise<{ id: string; commentId: string }>;
};

type CommentRow = {
  id: string;
  board_id: string;
  user_id: string;
  body: string;
  author_name?: string | null;
  section?: string | null;
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
    section: normalizeEditorSection(row.section),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id, commentId } = await context.params;
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

  const { data: existing } = await admin
    .from('board_comments')
    .select('id, user_id, board_id, author_name, created_at')
    .eq('id', commentId)
    .eq('board_id', id)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
  }

  const isOwner = access.role === 'owner';
  const isAuthor = existing.user_id === user.id;

  if (!isOwner && !isAuthor) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const now = new Date().toISOString();
  const authorName =
    existing.author_name?.trim() ||
    (existing.user_id === user.id ? (profile?.name ?? 'You') : 'Collaborator');

  let { data, error } = await admin
    .from('board_comments')
    .update({ body: text, updated_at: now })
    .eq('id', commentId)
    .eq('board_id', id)
    .select('id, board_id, user_id, body, author_name, section, created_at, updated_at')
    .single();

  if (error && (isMissingColumnError(error, 'author_name') || isMissingColumnError(error, 'section'))) {
    ({ data, error } = await admin
      .from('board_comments')
      .update({ body: text, updated_at: now })
      .eq('id', commentId)
      .eq('board_id', id)
      .select('id, board_id, user_id, body, author_name, created_at, updated_at')
      .single());

    if (error && isMissingColumnError(error, 'author_name')) {
      ({ data, error } = await admin
        .from('board_comments')
        .update({ body: text, updated_at: now })
        .eq('id', commentId)
        .eq('board_id', id)
        .select('id, board_id, user_id, body, created_at, updated_at')
        .single());
    }
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await clearCommentItemStateOverrides(commentId);

  const comment = rowToComment(data as CommentRow, authorName);

  return NextResponse.json({ comment: { ...comment, isRead: true, isHidden: false } });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id, commentId } = await context.params;
  const { user } = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const access = await getBoardAccess(user.id, id);
  if (!access.canComment) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const admin = createAdminClient();

  const { data: comment } = await admin
    .from('board_comments')
    .select('id, user_id, board_id')
    .eq('id', commentId)
    .eq('board_id', id)
    .maybeSingle();

  if (!comment) {
    return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
  }

  const isOwner = access.role === 'owner';

  if (!isOwner) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { error } = await admin
    .from('board_comments')
    .delete()
    .eq('id', commentId)
    .eq('board_id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
