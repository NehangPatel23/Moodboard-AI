import { NextResponse } from 'next/server';
import { getBoardAccess } from '@/lib/db/board-access';
import { getAuthenticatedUser } from '@/lib/db/auth';
import { createAdminClient } from '@/lib/supabase/admin';

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
  if (!access.canManageMembers) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('board_invites')
    .select('id, email, role, token, status, created_at, accepted_at, declined_at')
    .eq('board_id', id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    invites: (data ?? []).map((invite) => ({
      id: invite.id,
      email: invite.email,
      role: invite.role,
      status: invite.status,
      token: invite.token,
      createdAt: invite.created_at,
      acceptedAt: invite.accepted_at ?? undefined,
      declinedAt: invite.declined_at ?? undefined,
    })),
  });
}
