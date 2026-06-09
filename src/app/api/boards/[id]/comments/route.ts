import { NextResponse } from 'next/server';
import { getBoardAccess } from '@/lib/db/board-access';
import {
  getItemOverrideKey,
  isCollaborationItemReadForViewer,
  prepareCollaborationFetch,
  type CollaborationItemOverride,
} from '@/lib/db/board-collaboration-state';
import { normalizeEditorSection, type EditorSectionName } from '@/lib/editor-sections';
import { getCutoffIso } from '@/lib/retention-duration';
import { getAuthenticatedUser } from '@/lib/db/auth';
import { isMissingColumnError } from '@/lib/db/schema-errors';
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
  author_name?: string | null;
  section?: string | null;
  created_at: string;
  updated_at: string;
};

function resolveAuthorName(row: CommentRow, profileMap: Map<string, string>): string {
  if (row.author_name?.trim()) {
    return row.author_name.trim();
  }
  return profileMap.get(row.user_id) ?? 'Collaborator';
}

function rowToComment(
  row: CommentRow,
  authorName: string,
  viewerUserId: string,
  commentsLastReadAt: string | null,
  override?: CollaborationItemOverride,
): BoardComment {
  return {
    id: row.id,
    boardId: row.board_id,
    userId: row.user_id,
    authorName,
    body: row.body,
    section: normalizeEditorSection(row.section),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isRead: isCollaborationItemReadForViewer(
      viewerUserId,
      row.user_id,
      row.updated_at,
      commentsLastReadAt,
      override?.isRead,
    ),
    isHidden: override?.isHidden ?? false,
  };
}

async function fetchCommentsForBoard(
  boardId: string,
  userId: string,
  isOwner: boolean,
): Promise<{ comments: BoardComment[]; purgedComments?: number; purgedActivity?: number }> {
  const { readState, retention, purgeResult, itemOverrides } = await prepareCollaborationFetch(
    userId,
    boardId,
    isOwner,
  );

  const admin = createAdminClient();
  const hideCutoff = getCutoffIso(retention.commentsHideAfter);

  const buildQuery = (select: string) => {
    let query = admin
      .from('board_comments')
      .select(select)
      .eq('board_id', boardId)
      .order('created_at', { ascending: true });

    if (hideCutoff) {
      query = query.gte('created_at', hideCutoff);
    }

    return query;
  };

  const { data, error } = await buildQuery(
    'id, board_id, user_id, body, author_name, section, created_at, updated_at',
  );

  if (error && (isMissingColumnError(error, 'author_name') || isMissingColumnError(error, 'section'))) {
    const fallback = await buildQuery('id, board_id, user_id, body, created_at, updated_at');

    if (fallback.error) {
      throw new Error(fallback.error.message);
    }

    const rows = (fallback.data ?? []) as unknown as CommentRow[];
    const userIds = Array.from(new Set(rows.map((row) => row.user_id)));
    let profileMap = new Map<string, string>();

    if (userIds.length > 0) {
      const { data: profiles } = await admin
        .from('profiles')
        .select('id, name')
        .in('id', userIds);

      profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile.name]));
    }

    const comments = rows.map((row) =>
      rowToComment(
        row,
        profileMap.get(row.user_id) ?? 'Collaborator',
        userId,
        readState.commentsLastReadAt,
        itemOverrides.get(getItemOverrideKey('comment', row.id)),
      ),
    );

    return {
      comments,
      purgedComments: purgeResult?.purgedComments,
      purgedActivity: purgeResult?.purgedActivity,
    };
  }

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as unknown as CommentRow[];
  const userIds = Array.from(new Set(rows.map((row) => row.user_id)));
  let profileMap = new Map<string, string>();

  if (userIds.length > 0) {
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, name')
      .in('id', userIds);

    profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile.name]));
  }

  const comments = rows.map((row) =>
    rowToComment(
      row,
      resolveAuthorName(row, profileMap),
      userId,
      readState.commentsLastReadAt,
      itemOverrides.get(getItemOverrideKey('comment', row.id)),
    ),
  );

  return {
    comments,
    purgedComments: purgeResult?.purgedComments,
    purgedActivity: purgeResult?.purgedActivity,
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

  try {
    const result = await fetchCommentsForBoard(id, user.id, access.role === 'owner');
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load comments';
    return NextResponse.json({ error: message }, { status: 500 });
  }
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

  let body: { body?: string; section?: EditorSectionName };
  try {
    body = (await request.json()) as { body?: string; section?: EditorSectionName };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const text = body.body?.trim() ?? '';
  if (!text) {
    return NextResponse.json({ error: 'Comment body is required' }, { status: 400 });
  }

  const section = normalizeEditorSection(body.section);

  const authorName = profile?.name ?? 'You';
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const insertWithAuthor = {
    board_id: id,
    user_id: user.id,
    body: text,
    author_name: authorName,
    section,
    created_at: now,
    updated_at: now,
  };

  let { data, error } = await admin
    .from('board_comments')
    .insert(insertWithAuthor)
    .select('id, board_id, user_id, body, author_name, section, created_at, updated_at')
    .single();

  if (error && isMissingColumnError(error, 'section')) {
    ({ data, error } = await admin
      .from('board_comments')
      .insert({
        board_id: id,
        user_id: user.id,
        body: text,
        author_name: authorName,
        created_at: now,
        updated_at: now,
      })
      .select('id, board_id, user_id, body, author_name, created_at, updated_at')
      .single());
  }

  if (error && isMissingColumnError(error, 'author_name')) {
    ({ data, error } = await admin
      .from('board_comments')
      .insert({
        board_id: id,
        user_id: user.id,
        body: text,
        created_at: now,
        updated_at: now,
      })
      .select('id, board_id, user_id, body, created_at, updated_at')
      .single());
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const comment = rowToComment(
    data as CommentRow,
    (data as CommentRow).author_name?.trim() || authorName,
    user.id,
    null,
  );

  return NextResponse.json({ comment: { ...comment, isRead: true, isHidden: false } }, { status: 201 });
}
