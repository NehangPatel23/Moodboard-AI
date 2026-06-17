import { createAdminClient } from '@/lib/supabase/admin';
import { isMissingColumnError, isMissingRelationError } from '@/lib/db/schema-errors';
import {
  getCutoffIso,
  isRetentionNever,
  NEVER_RETENTION,
  parseCollaborationRetentionJson,
} from '@/lib/retention-duration';
import type { AppSettings } from '@/lib/settings-defaults';
import type { CollaborationItemType } from '@/types/board';

export type BoardCollaborationState = {
  commentsLastReadAt: string | null;
  activityLastReadAt: string | null;
  snapshotsLastReadAt: string | null;
};

export type CollaborationRetentionSettings = Pick<
  AppSettings,
  'commentsHideAfter' | 'activityHideAfter' | 'purgeCommentsAfter' | 'purgeActivityAfter'
>;

type CollaborationStateRow = {
  comments_last_read_at: string | null;
  activity_last_read_at: string | null;
  snapshots_last_read_at: string | null;
};

export {
  isCollaborationItemRead,
  isCollaborationItemReadForViewer,
} from '@/lib/collaboration-read-state';

export async function clearCommentItemStateOverrides(commentId: string): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from('board_collaboration_item_state')
    .delete()
    .eq('item_type', 'comment')
    .eq('item_id', commentId);

  if (error && !isMissingRelationError(error, 'board_collaboration_item_state')) {
    throw error;
  }
}

export type CollaborationItemOverride = {
  itemId: string;
  itemType: CollaborationItemType;
  isRead: boolean | null;
  isHidden: boolean;
};

type ItemStateRow = {
  item_id: string;
  item_type: CollaborationItemType;
  is_read: boolean | null;
  is_hidden: boolean;
};

export async function getItemOverrides(
  userId: string,
  boardId: string,
): Promise<Map<string, CollaborationItemOverride>> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('board_collaboration_item_state')
    .select('item_id, item_type, is_read, is_hidden')
    .eq('user_id', userId)
    .eq('board_id', boardId);

  if (error) {
    if (isMissingRelationError(error, 'board_collaboration_item_state')) {
      return new Map();
    }
    throw error;
  }

  const map = new Map<string, CollaborationItemOverride>();
  (data as ItemStateRow[] | null)?.forEach((row) => {
    map.set(`${row.item_type}:${row.item_id}`, {
      itemId: row.item_id,
      itemType: row.item_type,
      isRead: row.is_read,
      isHidden: row.is_hidden,
    });
  });
  return map;
}

export function getItemOverrideKey(type: CollaborationItemType, itemId: string): string {
  return `${type}:${itemId}`;
}

export async function upsertItemState(
  userId: string,
  boardId: string,
  input: {
    type: CollaborationItemType;
    id: string;
    isRead?: boolean;
    isHidden?: boolean;
  },
): Promise<CollaborationItemOverride> {
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const existing = (await getItemOverrides(userId, boardId)).get(
    getItemOverrideKey(input.type, input.id),
  );

  const next: CollaborationItemOverride = {
    itemId: input.id,
    itemType: input.type,
    isRead: input.isRead ?? existing?.isRead ?? null,
    isHidden: input.isHidden ?? existing?.isHidden ?? false,
  };

  const { error } = await admin.from('board_collaboration_item_state').upsert(
    {
      user_id: userId,
      board_id: boardId,
      item_type: input.type,
      item_id: input.id,
      is_read: next.isRead,
      is_hidden: next.isHidden,
      updated_at: now,
    },
    { onConflict: 'user_id,board_id,item_type,item_id' },
  );

  if (error) {
    if (isMissingRelationError(error, 'board_collaboration_item_state')) {
      return next;
    }
    throw error;
  }

  return next;
}

export async function getUserRetentionSettings(
  userId: string,
): Promise<CollaborationRetentionSettings> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('user_settings')
    .select(
      'comments_hide_after_days, activity_hide_after_days, purge_comments_after_days, purge_activity_after_days, collaboration_retention',
    )
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) {
    return {
      commentsHideAfter: NEVER_RETENTION,
      activityHideAfter: NEVER_RETENTION,
      purgeCommentsAfter: NEVER_RETENTION,
      purgeActivityAfter: NEVER_RETENTION,
    };
  }

  const row = data as {
    comments_hide_after_days?: number;
    activity_hide_after_days?: number;
    purge_comments_after_days?: number;
    purge_activity_after_days?: number;
    collaboration_retention?: unknown;
  };

  const retention = parseCollaborationRetentionJson(row.collaboration_retention, {
    commentsHideAfterDays: row.comments_hide_after_days,
    activityHideAfterDays: row.activity_hide_after_days,
    purgeCommentsAfterDays: row.purge_comments_after_days,
    purgeActivityAfterDays: row.purge_activity_after_days,
  });

  return {
    commentsHideAfter: retention.commentsHide ?? NEVER_RETENTION,
    activityHideAfter: retention.activityHide ?? NEVER_RETENTION,
    purgeCommentsAfter: retention.purgeComments ?? NEVER_RETENTION,
    purgeActivityAfter: retention.purgeActivity ?? NEVER_RETENTION,
  };
}

export async function getBoardCollaborationState(
  userId: string,
  boardId: string,
): Promise<BoardCollaborationState> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('board_collaboration_state')
    .select('comments_last_read_at, activity_last_read_at, snapshots_last_read_at')
    .eq('user_id', userId)
    .eq('board_id', boardId)
    .maybeSingle();

  if (error) {
    if (isMissingRelationError(error, 'board_collaboration_state')) {
      return { commentsLastReadAt: null, activityLastReadAt: null, snapshotsLastReadAt: null };
    }
    if (isMissingColumnError(error, 'snapshots_last_read_at')) {
      const legacy = await admin
        .from('board_collaboration_state')
        .select('comments_last_read_at, activity_last_read_at')
        .eq('user_id', userId)
        .eq('board_id', boardId)
        .maybeSingle();
      const row = legacy.data as Omit<CollaborationStateRow, 'snapshots_last_read_at'> | null;
      return {
        commentsLastReadAt: row?.comments_last_read_at ?? null,
        activityLastReadAt: row?.activity_last_read_at ?? null,
        snapshotsLastReadAt: null,
      };
    }
    throw error;
  }

  const row = data as CollaborationStateRow | null;
  return {
    commentsLastReadAt: row?.comments_last_read_at ?? null,
    activityLastReadAt: row?.activity_last_read_at ?? null,
    snapshotsLastReadAt: row?.snapshots_last_read_at ?? null,
  };
}

export async function markBoardCollaborationRead(
  userId: string,
  boardId: string,
  input: { markCommentsRead?: boolean; markActivityRead?: boolean; markSnapshotsRead?: boolean },
): Promise<BoardCollaborationState> {
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const existing = await getBoardCollaborationState(userId, boardId);

  const nextState: BoardCollaborationState = {
    commentsLastReadAt: input.markCommentsRead ? now : existing.commentsLastReadAt,
    activityLastReadAt: input.markActivityRead ? now : existing.activityLastReadAt,
    snapshotsLastReadAt: input.markSnapshotsRead ? now : existing.snapshotsLastReadAt,
  };

  const upsertPayload = {
    user_id: userId,
    board_id: boardId,
    comments_last_read_at: nextState.commentsLastReadAt,
    activity_last_read_at: nextState.activityLastReadAt,
    snapshots_last_read_at: nextState.snapshotsLastReadAt,
    updated_at: now,
  };

  const { error } = await admin.from('board_collaboration_state').upsert(upsertPayload, {
    onConflict: 'user_id,board_id',
  });

  if (error) {
    if (isMissingColumnError(error, 'snapshots_last_read_at')) {
      const { error: legacyError } = await admin.from('board_collaboration_state').upsert(
        {
          user_id: userId,
          board_id: boardId,
          comments_last_read_at: nextState.commentsLastReadAt,
          activity_last_read_at: nextState.activityLastReadAt,
          updated_at: now,
        },
        { onConflict: 'user_id,board_id' },
      );
      if (legacyError && !isMissingRelationError(legacyError, 'board_collaboration_state')) {
        throw legacyError;
      }
      return { ...nextState, snapshotsLastReadAt: null };
    }
    if (isMissingRelationError(error, 'board_collaboration_state')) {
      return nextState;
    }
    throw error;
  }

  return nextState;
}

export async function markSnapshotReadById(
  userId: string,
  boardId: string,
  snapshotId: string,
): Promise<BoardCollaborationState> {
  const admin = createAdminClient();
  const { data: snapshot, error: snapshotError } = await admin
    .from('board_snapshots')
    .select('created_at')
    .eq('id', snapshotId)
    .eq('board_id', boardId)
    .maybeSingle();

  if (snapshotError) {
    if (isMissingRelationError(snapshotError, 'board_snapshots')) {
      throw new Error('Snapshot not found');
    }
    throw snapshotError;
  }

  if (!snapshot?.created_at) {
    throw new Error('Snapshot not found');
  }

  const existing = await getBoardCollaborationState(userId, boardId);
  const snapshotAt = snapshot.created_at as string;
  const existingAt = existing.snapshotsLastReadAt;
  const nextSnapshotsLastReadAt =
    !existingAt || new Date(snapshotAt).getTime() > new Date(existingAt).getTime()
      ? snapshotAt
      : existingAt;

  if (nextSnapshotsLastReadAt === existing.snapshotsLastReadAt) {
    return existing;
  }

  const now = new Date().toISOString();
  const nextState: BoardCollaborationState = {
    ...existing,
    snapshotsLastReadAt: nextSnapshotsLastReadAt,
  };

  const upsertPayload = {
    user_id: userId,
    board_id: boardId,
    comments_last_read_at: nextState.commentsLastReadAt,
    activity_last_read_at: nextState.activityLastReadAt,
    snapshots_last_read_at: nextState.snapshotsLastReadAt,
    updated_at: now,
  };

  const { error } = await admin.from('board_collaboration_state').upsert(upsertPayload, {
    onConflict: 'user_id,board_id',
  });

  if (error) {
    if (isMissingColumnError(error, 'snapshots_last_read_at')) {
      return { ...nextState, snapshotsLastReadAt: null };
    }
    if (isMissingRelationError(error, 'board_collaboration_state')) {
      return nextState;
    }
    throw error;
  }

  return nextState;
}

export async function countUnreadBoardSnapshots(
  admin: ReturnType<typeof createAdminClient>,
  boardId: string,
  snapshotsLastReadAt: string | null,
  viewerUserId: string,
): Promise<number> {
  const { count, error } = await admin
    .from('board_snapshots')
    .select('id', { count: 'exact', head: true })
    .eq('board_id', boardId)
    .neq('user_id', viewerUserId)
    .gt('created_at', snapshotsLastReadAt ?? '1970-01-01T00:00:00.000Z');

  if (error) {
    if (isMissingRelationError(error, 'board_snapshots')) {
      return 0;
    }
    throw error;
  }

  return count ?? 0;
}

export type PurgeResult = {
  purgedComments: number;
  purgedActivity: number;
};

export type CollaborationFetchContext = {
  readState: BoardCollaborationState;
  retention: CollaborationRetentionSettings;
  purgeResult: PurgeResult | null;
  itemOverrides: Map<string, CollaborationItemOverride>;
};

export async function prepareCollaborationFetch(
  userId: string,
  boardId: string,
  isOwner: boolean,
): Promise<CollaborationFetchContext> {
  const [readState, retention, itemOverrides] = await Promise.all([
    getBoardCollaborationState(userId, boardId),
    getUserRetentionSettings(userId),
    getItemOverrides(userId, boardId),
  ]);

  let purgeResult: PurgeResult | null = null;
  if (
    isOwner &&
    (!isRetentionNever(retention.purgeCommentsAfter) ||
      !isRetentionNever(retention.purgeActivityAfter))
  ) {
    purgeResult = await purgeBoardCollaborationHistory(boardId, retention);
  }

  return { readState, retention, purgeResult, itemOverrides };
}

export async function purgeBoardCollaborationHistory(
  boardId: string,
  retention: CollaborationRetentionSettings,
): Promise<PurgeResult> {
  const admin = createAdminClient();
  let purgedComments = 0;
  let purgedActivity = 0;

  const commentsCutoff = getCutoffIso(retention.purgeCommentsAfter);
  if (commentsCutoff) {
    const { data, error } = await admin
      .from('board_comments')
      .delete()
      .eq('board_id', boardId)
      .lt('created_at', commentsCutoff)
      .select('id');

    if (!error) {
      purgedComments = data?.length ?? 0;
    }
  }

  const activityCutoff = getCutoffIso(retention.purgeActivityAfter);
  if (activityCutoff) {
    const { data, error } = await admin
      .from('board_activity')
      .delete()
      .eq('board_id', boardId)
      .lt('created_at', activityCutoff)
      .select('id');

    if (!error) {
      purgedActivity = data?.length ?? 0;
    }
  }

  return { purgedComments, purgedActivity };
}
