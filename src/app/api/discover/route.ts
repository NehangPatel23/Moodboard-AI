import { NextResponse } from 'next/server';
import { rowToBoard } from '@/lib/db/board-mappers';
import { createAdminClient } from '@/lib/supabase/admin';

const MAX_BOARDS = 48;

export async function GET() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('boards')
    .select('*')
    .eq('visibility', 'shared')
    .order('updated_at', { ascending: false })
    .limit(MAX_BOARDS);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ boards: (data ?? []).map(rowToBoard) });
}
