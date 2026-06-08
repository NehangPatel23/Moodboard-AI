import { NextResponse } from 'next/server';
import { getBoardAccess } from '@/lib/db/board-access';
import { getAuthenticatedUser } from '@/lib/db/auth';
import { isMissingRelationError } from '@/lib/db/schema-errors';
import { createAdminClient } from '@/lib/supabase/admin';

type RouteContext = {
  params: Promise<{ id: string; snapshotId: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const { id, snapshotId } = await context.params;
  const { user } = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const access = await getBoardAccess(user.id, id);
  if (access.role !== 'owner') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const admin = createAdminClient();

  const { data: snapshot } = await admin
    .from('board_snapshots')
    .select('id, board_id')
    .eq('id', snapshotId)
    .eq('board_id', id)
    .maybeSingle();

  if (!snapshot) {
    return NextResponse.json({ error: 'Snapshot not found' }, { status: 404 });
  }

  const { error } = await admin
    .from('board_snapshots')
    .delete()
    .eq('id', snapshotId)
    .eq('board_id', id);

  if (error) {
    if (isMissingRelationError(error, 'board_snapshots')) {
      return NextResponse.json(
        { error: 'Snapshots not available. Run migration 015_board_snapshots.sql.' },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
