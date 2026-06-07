import { NextResponse } from 'next/server';
import { rowToBoard } from '@/lib/db/board-mappers';
import { getAuthenticatedUser } from '@/lib/db/auth';
import { createAdminClient } from '@/lib/supabase/admin';

type RouteContext = {
  params: Promise<{ token: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { token } = await context.params;
  const { user, profile } = await getAuthenticatedUser();

  if (!user || !profile?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: invite, error } = await admin
    .from('board_invites')
    .select('id, board_id, email, role, status')
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

  const { data: boardRow } = await admin
    .from('boards')
    .select('title')
    .eq('id', invite.board_id)
    .maybeSingle();

  return NextResponse.json({
    invite: {
      id: invite.id,
      boardId: invite.board_id,
      boardTitle: boardRow?.title ?? 'Board',
      role: invite.role,
      email: invite.email,
    },
  });
}

export async function POST(_request: Request, context: RouteContext) {
  const { token } = await context.params;
  const { user, profile } = await getAuthenticatedUser();

  if (!user || !profile?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: invite, error } = await admin
    .from('board_invites')
    .select('id, board_id, email, role, status')
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

  const { error: memberError } = await admin.from('board_members').upsert(
    {
      board_id: invite.board_id,
      user_id: user.id,
      role: invite.role,
      invited_by: user.id,
    },
    { onConflict: 'board_id,user_id' },
  );

  if (memberError) {
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }

  const { error: inviteUpdateError } = await admin
    .from('board_invites')
    .update({ status: 'accepted', accepted_at: new Date().toISOString() })
    .eq('id', invite.id);

  if (inviteUpdateError) {
    return NextResponse.json({ error: inviteUpdateError.message }, { status: 500 });
  }

  const { data: boardRow } = await admin.from('boards').select('*').eq('id', invite.board_id).maybeSingle();

  return NextResponse.json({
    boardId: invite.board_id,
    role: invite.role,
    board: boardRow ? { ...rowToBoard(boardRow), role: invite.role } : null,
  });
}
