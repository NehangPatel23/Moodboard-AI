import { NextResponse } from 'next/server';
import { getBoardAccess } from '@/lib/db/board-access';
import { getAuthenticatedUser } from '@/lib/db/auth';
import { isMissingColumnError } from '@/lib/db/schema-errors';
import { createAdminClient } from '@/lib/supabase/admin';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
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

  if (access.role === 'owner') {
    const { data: row, error: readError } = await admin
      .from('boards')
      .select('is_favorite')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (readError || !row) {
      return NextResponse.json({ error: readError?.message ?? 'Board not found' }, { status: 404 });
    }

    const isFavorite = !row.is_favorite;
    const { error: updateError } = await admin
      .from('boards')
      .update({ is_favorite: isFavorite })
      .eq('id', id)
      .eq('user_id', user.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ isFavorite });
  }

  const { data: memberRow, error: memberReadError } = await admin
    .from('board_members')
    .select('is_favorite')
    .eq('board_id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (memberReadError) {
    if (isMissingColumnError(memberReadError, 'is_favorite')) {
      return NextResponse.json(
        { error: 'Collaborator favorites require migration 019_board_member_favorites.sql' },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: memberReadError.message }, { status: 500 });
  }

  if (!memberRow) {
    return NextResponse.json({ error: 'Membership not found' }, { status: 404 });
  }

  const isFavorite = !memberRow.is_favorite;
  const { error: memberUpdateError } = await admin
    .from('board_members')
    .update({ is_favorite: isFavorite })
    .eq('board_id', id)
    .eq('user_id', user.id);

  if (memberUpdateError) {
    if (isMissingColumnError(memberUpdateError, 'is_favorite')) {
      return NextResponse.json(
        { error: 'Collaborator favorites require migration 019_board_member_favorites.sql' },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: memberUpdateError.message }, { status: 500 });
  }

  return NextResponse.json({ isFavorite });
}
