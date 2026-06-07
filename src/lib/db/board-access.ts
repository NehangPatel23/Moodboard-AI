import type { BoardMemberRole, BoardRole } from '@/types/board';
import { createAdminClient } from '@/lib/supabase/admin';

export type BoardAccess = {
  role: BoardRole | null;
  ownerId: string | null;
  canEdit: boolean;
  canManageMembers: boolean;
  canDelete: boolean;
};

export async function getBoardAccess(userId: string, boardId: string): Promise<BoardAccess> {
  const supabase = createAdminClient();

  const { data: board } = await supabase
    .from('boards')
    .select('user_id')
    .eq('id', boardId)
    .maybeSingle();

  if (!board) {
    return {
      role: null,
      ownerId: null,
      canEdit: false,
      canManageMembers: false,
      canDelete: false,
    };
  }

  if (board.user_id === userId) {
    return {
      role: 'owner',
      ownerId: board.user_id,
      canEdit: true,
      canManageMembers: true,
      canDelete: true,
    };
  }

  const { data: membership } = await supabase
    .from('board_members')
    .select('role')
    .eq('board_id', boardId)
    .eq('user_id', userId)
    .maybeSingle();

  const memberRole = membership?.role as BoardMemberRole | undefined;

  if (memberRole === 'editor') {
    return {
      role: 'editor',
      ownerId: board.user_id,
      canEdit: true,
      canManageMembers: false,
      canDelete: false,
    };
  }

  if (memberRole === 'viewer') {
    return {
      role: 'viewer',
      ownerId: board.user_id,
      canEdit: false,
      canManageMembers: false,
      canDelete: false,
    };
  }

  return {
    role: null,
    ownerId: board.user_id,
    canEdit: false,
    canManageMembers: false,
    canDelete: false,
  };
}
