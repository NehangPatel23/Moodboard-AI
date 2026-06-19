import { NextResponse } from 'next/server';
import { getBoardAccess } from '@/lib/db/board-access';
import { getAuthenticatedUser } from '@/lib/db/auth';
import { DEFAULT_APP_SETTINGS } from '@/lib/settings-defaults';
import { createAdminClient } from '@/lib/supabase/admin';
import type { BoardMemberRole, BoardRole } from '@/types/board';

type RouteContext = {
  params: Promise<{ id: string; userId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id: boardId, userId: targetUserId } = await context.params;
  const { user } = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const access = await getBoardAccess(user.id, boardId);
  if (!access.role) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: board, error: boardError } = await admin
    .from('boards')
    .select('user_id, created_at')
    .eq('id', boardId)
    .maybeSingle();

  if (boardError) {
    return NextResponse.json({ error: boardError.message }, { status: 500 });
  }

  if (!board) {
    return NextResponse.json({ error: 'Board not found' }, { status: 404 });
  }

  let role: BoardRole;
  let joinedAt: string | null = null;

  if (board.user_id === targetUserId) {
    role = 'owner';
    joinedAt = board.created_at as string;
  } else {
    const { data: membership, error: membershipError } = await admin
      .from('board_members')
      .select('role, created_at')
      .eq('board_id', boardId)
      .eq('user_id', targetUserId)
      .maybeSingle();

    if (membershipError) {
      return NextResponse.json({ error: membershipError.message }, { status: 500 });
    }

    if (!membership) {
      return NextResponse.json({ error: 'Collaborator not found on this board' }, { status: 404 });
    }

    role = membership.role as BoardMemberRole;
    joinedAt = membership.created_at as string;
  }

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('id, name, email')
    .eq('id', targetUserId)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  const { data: settings } = await admin
    .from('user_settings')
    .select('workspace_name, workspace_tagline, avatar_accent, avatar_id, avatar_image_url')
    .eq('user_id', targetUserId)
    .maybeSingle();

  return NextResponse.json({
    collaborator: {
      userId: profile.id,
      name: profile.name as string,
      email: (profile.email as string | null) ?? '',
      role,
      joinedAt,
      workspaceName:
        (settings?.workspace_name as string | null)?.trim() || (profile.name as string),
      workspaceTagline:
        (settings?.workspace_tagline as string | null)?.trim() ||
        DEFAULT_APP_SETTINGS.workspaceTagline,
      avatarId: (settings?.avatar_id as string | null)?.trim() || DEFAULT_APP_SETTINGS.avatarId,
      avatarAccent:
        (settings?.avatar_accent as string | null)?.trim() || DEFAULT_APP_SETTINGS.avatarAccent,
      avatarImageUrl: (settings?.avatar_image_url as string | null)?.trim() || null,
    },
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id, userId } = await context.params;
  const { user } = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const access = await getBoardAccess(user.id, id);
  const isSelf = userId === user.id;

  if (!isSelf && !access.canManageMembers) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from('board_members')
    .delete()
    .eq('board_id', id)
    .eq('user_id', userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
