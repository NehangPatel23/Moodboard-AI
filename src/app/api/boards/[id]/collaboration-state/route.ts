import { NextResponse } from 'next/server';
import { getBoardAccess } from '@/lib/db/board-access';
import {
  getBoardCollaborationState,
  markBoardCollaborationRead,
  upsertItemState,
} from '@/lib/db/board-collaboration-state';
import { getAuthenticatedUser } from '@/lib/db/auth';
import { isMissingRelationError } from '@/lib/db/schema-errors';
import { createAdminClient } from '@/lib/supabase/admin';
import type { BoardCollaborationStateResponse, CollaborationItemStateInput } from '@/types/board';

type RouteContext = {
  params: Promise<{ id: string }>;
};

type PatchBody = {
  markCommentsRead?: boolean;
  markActivityRead?: boolean;
  item?: CollaborationItemStateInput;
};

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
    const state = await getBoardCollaborationState(user.id, id);
    const admin = createAdminClient();

    const [{ count: unreadComments }, { count: unreadActivity }] = await Promise.all([
      admin
        .from('board_comments')
        .select('id', { count: 'exact', head: true })
        .eq('board_id', id)
        .gt('created_at', state.commentsLastReadAt ?? '1970-01-01T00:00:00.000Z'),
      admin
        .from('board_activity')
        .select('id', { count: 'exact', head: true })
        .eq('board_id', id)
        .gt('created_at', state.activityLastReadAt ?? '1970-01-01T00:00:00.000Z'),
    ]);

    const response: BoardCollaborationStateResponse = {
      commentsLastReadAt: state.commentsLastReadAt,
      activityLastReadAt: state.activityLastReadAt,
      unreadComments: unreadComments ?? 0,
      unreadActivity: unreadActivity ?? 0,
    };

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load collaboration state';
    if (isMissingRelationError({ message }, 'board_collaboration_state')) {
      return NextResponse.json({
        commentsLastReadAt: null,
        activityLastReadAt: null,
        unreadComments: 0,
        unreadActivity: 0,
      } satisfies BoardCollaborationStateResponse);
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const { user } = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const access = await getBoardAccess(user.id, id);
  if (!access.canComment) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const hasBulkRead = Boolean(body.markCommentsRead || body.markActivityRead);
  const hasItemUpdate = Boolean(body.item);

  if (!hasBulkRead && !hasItemUpdate) {
    return NextResponse.json({ error: 'No collaboration action requested' }, { status: 400 });
  }

  try {
    let state = await getBoardCollaborationState(user.id, id);

    if (hasBulkRead) {
      state = await markBoardCollaborationRead(user.id, id, {
        markCommentsRead: body.markCommentsRead,
        markActivityRead: body.markActivityRead,
      });
    }

    if (body.item) {
      await upsertItemState(user.id, id, body.item);
    }

    const admin = createAdminClient();

    const [{ count: unreadComments }, { count: unreadActivity }] = await Promise.all([
      admin
        .from('board_comments')
        .select('id', { count: 'exact', head: true })
        .eq('board_id', id)
        .gt('created_at', state.commentsLastReadAt ?? '1970-01-01T00:00:00.000Z'),
      admin
        .from('board_activity')
        .select('id', { count: 'exact', head: true })
        .eq('board_id', id)
        .gt('created_at', state.activityLastReadAt ?? '1970-01-01T00:00:00.000Z'),
    ]);

    const response: BoardCollaborationStateResponse = {
      commentsLastReadAt: state.commentsLastReadAt,
      activityLastReadAt: state.activityLastReadAt,
      unreadComments: unreadComments ?? 0,
      unreadActivity: unreadActivity ?? 0,
    };

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update collaboration state';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
