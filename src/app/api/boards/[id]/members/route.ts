import { NextResponse } from 'next/server';
import { getBoardAccess } from '@/lib/db/board-access';
import { getAuthenticatedUser } from '@/lib/db/auth';
import { resolveUserByEmail } from '@/lib/db/ensure-profile';
import { isMissingColumnError } from '@/lib/db/schema-errors';
import { sendBoardInviteEmail } from '@/lib/send-invite-email';
import { absoluteUrl } from '@/lib/site-metadata';
import { createAdminClient } from '@/lib/supabase/admin';
import type { BoardInvite, BoardMember, BoardMemberRole } from '@/types/board';

type RouteContext = {
  params: Promise<{ id: string }>;
};

function mapInviteRow(invite: {
  id: string;
  email: string;
  role: string;
  token: string;
  status: string;
  created_at: string;
  declined_at?: string | null;
}): BoardInvite {
  return {
    id: invite.id,
    email: invite.email,
    role: invite.role as BoardMemberRole,
    status: invite.status as BoardInvite['status'],
    token: invite.token,
    createdAt: invite.created_at,
    declinedAt: invite.declined_at ?? undefined,
  };
}

async function findExistingInviteForRecipient(
  admin: ReturnType<typeof createAdminClient>,
  boardId: string,
  inviteEmail: string,
  inviteeUserId: string | null,
) {
  if (inviteeUserId) {
    const { data: byUser, error: byUserError } = await admin
      .from('board_invites')
      .select('id, email, role, token, status, created_at, declined_at')
      .eq('board_id', boardId)
      .eq('invitee_user_id', inviteeUserId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (byUserError && !isMissingColumnError(byUserError, 'invitee_user_id')) {
      throw byUserError;
    }

    if (byUser) {
      return byUser;
    }
  }

  const { data: byEmail } = await admin
    .from('board_invites')
    .select('id, email, role, token, status, created_at, declined_at')
    .eq('board_id', boardId)
    .ilike('email', inviteEmail)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return byEmail;
}

function buildInviteWritePayload(
  inviteEmail: string,
  inviteeUserId: string | null,
  role: BoardMemberRole,
  invitedBy: string,
  includeInviteeUserId: boolean,
) {
  const payload: Record<string, unknown> = {
    email: inviteEmail,
    role,
    invited_by: invitedBy,
  };

  if (includeInviteeUserId && inviteeUserId) {
    payload.invitee_user_id = inviteeUserId;
  }

  return payload;
}

async function writeInviteRecord(
  admin: ReturnType<typeof createAdminClient>,
  mode: 'insert' | 'update',
  boardId: string,
  inviteId: string | null,
  inviteEmail: string,
  inviteeUserId: string | null,
  role: BoardMemberRole,
  invitedBy: string,
  extraFields?: Record<string, unknown>,
) {
  const select = 'id, email, role, token, status, created_at, declined_at';
  let includeInviteeUserId = true;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const payload = {
      ...buildInviteWritePayload(inviteEmail, inviteeUserId, role, invitedBy, includeInviteeUserId),
      ...extraFields,
    };

    const result =
      mode === 'insert'
        ? await admin
            .from('board_invites')
            .insert({ board_id: boardId, ...payload })
            .select(select)
            .single()
        : await admin
            .from('board_invites')
            .update(payload)
            .eq('id', inviteId!)
            .select(select)
            .single();

    if (!result.error) {
      return result.data;
    }

    if (includeInviteeUserId && isMissingColumnError(result.error, 'invitee_user_id')) {
      includeInviteeUserId = false;
      continue;
    }

    throw result.error;
  }

  throw new Error('Failed to write invite record');
}

async function buildInviteCreatedResponse(
  invite: {
    id: string;
    email: string;
    role: string;
    token: string;
    status: string;
    created_at: string;
    declined_at?: string | null;
  },
  boardTitle: string,
  inviterName: string,
) {
  const mappedInvite = mapInviteRow(invite);
  const emailResult = await sendBoardInviteEmail({
    to: mappedInvite.email,
    boardTitle,
    inviterName,
    role: mappedInvite.role,
    inviteUrl: absoluteUrl(`/invite/${mappedInvite.token}`),
  });

  return NextResponse.json({
    type: 'invite_created' as const,
    invite: mappedInvite,
    invitePath: `/invite/${mappedInvite.token}`,
    emailSent: emailResult.sent,
  });
}

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

  const { data: boardRow } = await admin.from('boards').select('user_id, title').eq('id', id).maybeSingle();
  if (!boardRow) {
    return NextResponse.json({ error: 'Board not found' }, { status: 404 });
  }

  const boardTitle = typeof boardRow.title === 'string' && boardRow.title.trim() ? boardRow.title.trim() : 'Untitled board';
  const inviterName = profile?.name?.trim() || profile?.email?.split('@')[0] || 'A collaborator';

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

  const inviteEmail = existingProfile?.email.toLowerCase() ?? email;
  const inviteeUserId = existingProfile?.id ?? null;

  if (existingProfile) {
    const { data: existingMember } = await admin
      .from('board_members')
      .select('role')
      .eq('board_id', id)
      .eq('user_id', existingProfile.id)
      .maybeSingle();

    if (existingMember) {
      const { error: memberError } = await admin
        .from('board_members')
        .update({ role })
        .eq('board_id', id)
        .eq('user_id', existingProfile.id);

      if (memberError) {
        return NextResponse.json({ error: memberError.message }, { status: 500 });
      }

      return NextResponse.json({
        type: 'member_updated',
        member: {
          userId: existingProfile.id,
          name: existingProfile.name,
          email: existingProfile.email,
          role,
          createdAt: new Date().toISOString(),
        } satisfies BoardMember,
      });
    }
  }

  const existingInvite = await findExistingInviteForRecipient(admin, id, inviteEmail, inviteeUserId);

  if (existingInvite?.status === 'pending') {
    try {
      const updatedInvite = await writeInviteRecord(
        admin,
        'update',
        id,
        existingInvite.id,
        inviteEmail,
        inviteeUserId,
        role,
        user.id,
      );

      return buildInviteCreatedResponse(updatedInvite, boardTitle, inviterName);
    } catch (updateError) {
      return NextResponse.json(
        { error: updateError instanceof Error ? updateError.message : 'Failed to update invite' },
        { status: 500 },
      );
    }
  }

  if (existingInvite?.status === 'declined') {
    try {
      const reactivatedInvite = await writeInviteRecord(
        admin,
        'update',
        id,
        existingInvite.id,
        inviteEmail,
        inviteeUserId,
        role,
        user.id,
        {
          status: 'pending',
          declined_at: null,
          accepted_at: null,
        },
      );

      return buildInviteCreatedResponse(reactivatedInvite, boardTitle, inviterName);
    } catch (reactivateError) {
      return NextResponse.json(
        {
          error:
            reactivateError instanceof Error ? reactivateError.message : 'Failed to reactivate invite',
        },
        { status: 500 },
      );
    }
  }

  try {
    const invite = await writeInviteRecord(
      admin,
      'insert',
      id,
      null,
      inviteEmail,
      inviteeUserId,
      role,
      user.id,
    );

    return buildInviteCreatedResponse(invite, boardTitle, inviterName);
  } catch (inviteError) {
    return NextResponse.json(
      { error: inviteError instanceof Error ? inviteError.message : 'Failed to create invite' },
      { status: 500 },
    );
  }
}
