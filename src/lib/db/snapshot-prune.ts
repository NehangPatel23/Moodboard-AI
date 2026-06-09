import { isMissingColumnError } from '@/lib/db/schema-errors';
import { DEFAULT_APP_SETTINGS } from '@/lib/settings-defaults';
import type { SupabaseClient } from '@supabase/supabase-js';

export type SnapshotLimitSettings = {
  maxPerBoard: number;
  autoPrune: boolean;
};

type AdminClient = SupabaseClient;

export async function getSnapshotLimitSettingsForOwner(
  admin: AdminClient,
  ownerId: string,
): Promise<SnapshotLimitSettings> {
  const { data, error } = await admin
    .from('user_settings')
    .select('snapshot_max_per_board, snapshot_auto_prune')
    .eq('user_id', ownerId)
    .maybeSingle();

  if (error) {
    if (isMissingColumnError(error, 'snapshot_max_per_board')) {
      return {
        maxPerBoard: DEFAULT_APP_SETTINGS.snapshotMaxPerBoard,
        autoPrune: DEFAULT_APP_SETTINGS.snapshotAutoPrune,
      };
    }
    throw new Error(error.message);
  }

  if (!data) {
    return {
      maxPerBoard: DEFAULT_APP_SETTINGS.snapshotMaxPerBoard,
      autoPrune: DEFAULT_APP_SETTINGS.snapshotAutoPrune,
    };
  }

  return {
    maxPerBoard:
      typeof data.snapshot_max_per_board === 'number'
        ? data.snapshot_max_per_board
        : DEFAULT_APP_SETTINGS.snapshotMaxPerBoard,
    autoPrune:
      typeof data.snapshot_auto_prune === 'boolean'
        ? data.snapshot_auto_prune
        : DEFAULT_APP_SETTINGS.snapshotAutoPrune,
  };
}

export async function countBoardSnapshots(admin: AdminClient, boardId: string): Promise<number> {
  const { count, error } = await admin
    .from('board_snapshots')
    .select('id', { count: 'exact', head: true })
    .eq('board_id', boardId);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

export async function pruneBoardSnapshots(
  admin: AdminClient,
  boardId: string,
  maxPerBoard: number,
  keepSnapshotId?: string,
): Promise<number> {
  if (maxPerBoard <= 0) {
    return 0;
  }

  const { data, error } = await admin
    .from('board_snapshots')
    .select('id, created_at')
    .eq('board_id', boardId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = data ?? [];
  if (rows.length <= maxPerBoard) {
    return 0;
  }

  const keepIds = new Set(rows.slice(0, maxPerBoard).map((row) => row.id as string));
  if (keepSnapshotId) {
    keepIds.add(keepSnapshotId);
  }

  const deleteIds = rows.filter((row) => !keepIds.has(row.id as string)).map((row) => row.id as string);
  if (!deleteIds.length) {
    return 0;
  }

  const { error: deleteError } = await admin.from('board_snapshots').delete().in('id', deleteIds);
  if (deleteError) {
    throw new Error(deleteError.message);
  }

  return deleteIds.length;
}
