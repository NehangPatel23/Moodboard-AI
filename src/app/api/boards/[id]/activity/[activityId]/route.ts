import { NextResponse } from 'next/server';
import { getBoardAccess } from '@/lib/db/board-access';
import { getAuthenticatedUser } from '@/lib/db/auth';
import { createAdminClient } from '@/lib/supabase/admin';

type RouteContext = {
  params: Promise<{ id: string; activityId: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const { id, activityId } = await context.params;
  const { user } = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const access = await getBoardAccess(user.id, id);
  if (!access.canComment) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (access.role !== 'owner') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const admin = createAdminClient();

  const { data: event } = await admin
    .from('board_activity')
    .select('id, board_id')
    .eq('id', activityId)
    .eq('board_id', id)
    .maybeSingle();

  if (!event) {
    return NextResponse.json({ error: 'Activity event not found' }, { status: 404 });
  }

  const { error } = await admin
    .from('board_activity')
    .delete()
    .eq('id', activityId)
    .eq('board_id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
