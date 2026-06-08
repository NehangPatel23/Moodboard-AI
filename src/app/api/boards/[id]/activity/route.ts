import { NextResponse } from 'next/server';
import { getBoardAccess } from '@/lib/db/board-access';
import { rowToActivity } from '@/lib/db/board-activity';
import {
  getHideCutoffIso,
  getItemOverrideKey,
  isCollaborationItemRead,
  prepareCollaborationFetch,
} from '@/lib/db/board-collaboration-state';
import { getAuthenticatedUser } from '@/lib/db/auth';
import { isMissingColumnError, isMissingRelationError } from '@/lib/db/schema-errors';
import { createAdminClient } from '@/lib/supabase/admin';
import type { BoardActivityEvent } from '@/types/board';

type RouteContext = {
  params: Promise<{ id: string }>;
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

  const admin = createAdminClient();
  const { readState, retention, purgeResult, itemOverrides } = await prepareCollaborationFetch(
    user.id,
    id,
    access.role === 'owner',
  );
  const hideCutoff = getHideCutoffIso(retention.activityHideAfterDays);

  let data: Record<string, unknown>[] | null = null;
  let error: { message?: string } | null = null;

  const buildQuery = (select: string) => {
    let query = admin
      .from('board_activity')
      .select(select)
      .eq('board_id', id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (hideCutoff) {
      query = query.gte('created_at', hideCutoff);
    }

    return query;
  };

  const fullResult = await buildQuery(
    'id, board_id, user_id, actor_name, action, summary, changes, created_at',
  );

  if (fullResult.error && isMissingColumnError(fullResult.error, 'changes')) {
    const legacyResult = await buildQuery(
      'id, board_id, user_id, actor_name, action, summary, created_at',
    );
    data = (legacyResult.data ?? null) as Record<string, unknown>[] | null;
    error = legacyResult.error;
  } else {
    data = (fullResult.data ?? null) as Record<string, unknown>[] | null;
    error = fullResult.error;
  }

  if (error) {
    if (isMissingRelationError(error, 'board_activity')) {
      return NextResponse.json({ activity: [] satisfies BoardActivityEvent[] });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const activity = (data ?? []).map((row) => {
    const event = rowToActivity(row as Parameters<typeof rowToActivity>[0]);
    const override = itemOverrides.get(getItemOverrideKey('activity', event.id));
    return {
      ...event,
      isRead: isCollaborationItemRead(event.createdAt, readState.activityLastReadAt, override?.isRead),
      isHidden: override?.isHidden ?? false,
    };
  });

  return NextResponse.json({
    activity,
    purgedComments: purgeResult?.purgedComments,
    purgedActivity: purgeResult?.purgedActivity,
  });
}
