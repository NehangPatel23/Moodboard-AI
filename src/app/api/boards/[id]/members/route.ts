import { NextResponse } from 'next/server';
import { getBoardAccess } from '@/lib/db/board-access';
import { getAuthenticatedUser } from '@/lib/db/auth';
import { resolveUserByEmail } from '@/lib/db/ensure-profile';
import { createAdminClient } from '@/lib/supabase/admin';
import type { BoardMember, BoardMemberRole } from '@/types/board';

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
  if (!access.role) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('board_members')
    .select('user_id, role, created_at')
    .eq('board_id', id)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const userIds = (data ?? []).map((row) => row.user_id);
  let profileMap = new Map<string, { name: string; email: string }>();

  if (userIds.length > 0) {
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, name, email')
      .in('id', userIds);

    profileMap = new Map(
      (profiles ?? []).map((profile) => [profile.id, { name: profile.name, email: profile.email }]),
    );
  }

  const members: BoardMember[] = (data ?? []).map((row) => {
    const profile = profileMap.get(row.user_id);
    return {
      userId: row.user_id,
      name: profile?.name ?? 'Collaborator',
      email: profile?.email ?? '',
      role: row.role as BoardMemberRole,
      createdAt: row.created_at,
    };
  });

  return NextResponse.json({ members, access: { role: access.role, canManageMembers: access.canManageMembers } });
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const { user, profile } = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const access = await getBoardAccess(user.id, id);
  if (!access.canManageMembers) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: { email?: string; role?: BoardMemberRole };
  try {
    body = (await request.json()) as { email?: string; role?: BoardMemberRole };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase() ?? '';
  const role = body.role === 'viewer' ? 'viewer' : 'editor';

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
  }

  if (profile?.email?.toLowerCase() === email) {
    return NextResponse.json({ error: 'You cannot invite yourself' }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: boardRow } = await admin.from('boards').select('user_id').eq('id', id).maybeSingle();
  if (!boardRow) {
    return NextResponse.json({ error: 'Board not found' }, { status: 404 });
  }

  const { data: ownerProfile } = await admin
    .from('profiles')
    .select('email')
    .eq('id', boardRow.user_id)
    .maybeSingle();

  if (ownerProfile?.email?.toLowerCase() === email) {
    return NextResponse.json({ error: 'The board owner already has access' }, { status: 400 });
  }

  let existingProfile: Awaited<ReturnType<typeof resolveUserByEmail>> = null;

  try {
    existingProfile = await resolveUserByEmail(email);
  } catch (lookupError) {
    return NextResponse.json(
      { error: lookupError instanceof Error ? lookupError.message : 'Failed to look up user' },
      { status: 500 },
    );
  }

  if (existingProfile) {
    const { error: memberError } = await admin.from('board_members').upsert(
      {
        board_id: id,
        user_id: existingProfile.id,
        role,
        invited_by: user.id,
      },
      { onConflict: 'board_id,user_id' },
    );

    if (memberError) {
      return NextResponse.json({ error: memberError.message }, { status: 500 });
    }

    await admin
      .from('board_invites')
      .update({ status: 'revoked' })
      .eq('board_id', id)
      .ilike('email', email)
      .eq('status', 'pending');

    return NextResponse.json({
      type: 'member_added',
      member: {
        userId: existingProfile.id,
        name: existingProfile.name,
        email: existingProfile.email,
        role,
        createdAt: new Date().toISOString(),
      } satisfies BoardMember,
    });
  }

  const { data: invite, error: inviteError } = await admin
    .from('board_invites')
    .insert({
      board_id: id,
      email,
      role,
      invited_by: user.id,
    })
    .select('id, email, role, token, status, created_at')
    .single();

  if (inviteError) {
    return NextResponse.json({ error: inviteError.message }, { status: 500 });
  }

  return NextResponse.json({
    type: 'invite_created',
    invite: {
      id: invite.id,
      email: invite.email,
      role: invite.role,
      status: invite.status,
      token: invite.token,
      createdAt: invite.created_at,
    },
    invitePath: `/invite/${invite.token}`,
  });
}
