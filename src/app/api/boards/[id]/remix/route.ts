import { NextResponse } from 'next/server';
import { boardToRow, rowToBoard } from '@/lib/db/board-mappers';
import { getAuthenticatedUser } from '@/lib/db/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { createId } from '@/lib/utils';
import type { Board } from '@/types/board';

type RouteContext = {
  params: Promise<{ id: string }>;
};

function clonePublicBoard(source: Board): Board {
  const now = new Date().toISOString();
  return {
    ...JSON.parse(JSON.stringify(source)) as Board,
    id: createId('board'),
    title: `${source.title} (Remix)`,
    createdAt: now,
    updatedAt: now,
    isFavorite: false,
    visibility: 'private',
    role: 'owner',
  };
}

export async function POST(_request: Request, context: RouteContext) {
  const { user } = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('boards')
    .select('*')
    .eq('id', id)
    .eq('visibility', 'shared')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Public board not found' }, { status: 404 });
  }

  const source = rowToBoard(data);
  const copy = clonePublicBoard(source);
  const row = boardToRow(copy, user.id);

  const { data: inserted, error: insertError } = await admin
    .from('boards')
    .insert(row)
    .select('*')
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ board: rowToBoard(inserted) });
}
