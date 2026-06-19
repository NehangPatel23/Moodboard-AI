import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/db/auth';
import { createAdminClient } from '@/lib/supabase/admin';

type RouteContext = {
  params: Promise<{ token: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const { token } = await context.params;
  const { user, profile } = await getAuthenticatedUser();

  if (!user || !profile?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: invite, error } = await admin
    .from('board_invites')
    .select('id, email, status')
    .eq('token', token)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!invite || invite.status !== 'pending') {
    return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
  }

  if (invite.email.toLowerCase() !== profile.email.toLowerCase()) {
    return NextResponse.json({ error: 'This invite was sent to a different email address' }, { status: 403 });
  }

  const { error: inviteUpdateError } = await admin
    .from('board_invites')
    .update({ status: 'declined', declined_at: new Date().toISOString() })
    .eq('id', invite.id);

  if (inviteUpdateError) {
    return NextResponse.json({ error: inviteUpdateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
