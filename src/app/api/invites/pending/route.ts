import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/db/auth';
import { isMissingColumnError } from '@/lib/db/schema-errors';
import { createAdminClient } from '@/lib/supabase/admin';
import type { BoardMemberRole, PendingBoardInvite } from '@/types/board';

type InviteRow = {
  id: string;
  board_id: string;
  email: string;
  role: string;
  token: string;
  status: string;
  created_at: string;
  invited_by: string | null;
};

const INVITE_SELECT = 'id, board_id, email, role, token, status, created_at, invited_by';

function dedupeInviteRows(rows: InviteRow[]): InviteRow[] {
  const byId = new Map<string, InviteRow>();
  for (const row of rows) {
    byId.set(row.id, row);
  }
  return [...byId.values()].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

async function fetchPendingInviteRows(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  emails: string[],
) {
  const collected: InviteRow[] = [];

  const { data: byUserId, error: byUserIdError } = await admin
    .from('board_invites')
    .select(INVITE_SELECT)
    .eq('status', 'pending')
    .eq('invitee_user_id', userId);

  if (byUserIdError) {
    if (!isMissingColumnError(byUserIdError, 'invitee_user_id')) {
      throw byUserIdError;
    }
  } else if (byUserId) {
    collected.push(...(byUserId as InviteRow[]));
  }

  for (const email of emails) {
    const { data: byEmail, error: byEmailError } = await admin
      .from('board_invites')
      .select(INVITE_SELECT)
      .eq('status', 'pending')
      .ilike('email', email);

    if (byEmailError) {
      throw byEmailError;
    }

    if (byEmail) {
      collected.push(...(byEmail as InviteRow[]));
    }
  }

  return dedupeInviteRows(collected);
}

export async function GET() {
  const { user, profile } = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const emails = [...new Set([profile?.email, user.email].filter((email): email is string => Boolean(email)))].map(
    (email) => email.toLowerCase(),
  );

  if (emails.length === 0) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let inviteRows: InviteRow[];

  try {
    inviteRows = await fetchPendingInviteRows(admin, user.id, emails);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load pending invitations';
    return NextResponse.json({ error: message }, { status: 500 });
  }

  if (!inviteRows.length) {
    return NextResponse.json({ invites: [] satisfies PendingBoardInvite[] });
  }

  const boardIds = [...new Set(inviteRows.map((row) => row.board_id))];
  const inviterIds = [...new Set(inviteRows.map((row) => row.invited_by).filter(Boolean))] as string[];

  const [{ data: boardRows }, { data: inviterProfiles }] = await Promise.all([
    admin.from('boards').select('id, title, summary, mood, palette, references').in('id', boardIds),
    inviterIds.length > 0
      ? admin.from('profiles').select('id, name').in('id', inviterIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ]);

  const boardMap = new Map(
    (boardRows ?? []).map((row) => [
      row.id,
      {
        title: row.title as string,
        summary: (row.summary as string | null) ?? '',
        mood: (row.mood as string | null) ?? '',
        palette: (row.palette as PendingBoardInvite['palette']) ?? [],
        references: (row.references as PendingBoardInvite['references']) ?? [],
      },
    ]),
  );
  const inviterNameMap = new Map(
    (inviterProfiles ?? []).map((row) => [row.id, row.name as string]),
  );

  const invites: PendingBoardInvite[] = inviteRows.map((row) => {
    const board = boardMap.get(row.board_id);
    return {
      id: row.id,
      token: row.token,
      boardId: row.board_id,
      boardTitle: board?.title ?? 'Board',
      boardSummary: board?.summary,
      boardMood: board?.mood,
      palette: board?.palette,
      references: board?.references,
      role: row.role as BoardMemberRole,
      inviterName: row.invited_by ? inviterNameMap.get(row.invited_by) ?? 'A collaborator' : 'A collaborator',
      createdAt: row.created_at,
    };
  });

  return NextResponse.json({ invites });
}
