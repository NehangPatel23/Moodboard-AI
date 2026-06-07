import { NextResponse } from 'next/server';
import { boardToRow } from '@/lib/db/board-mappers';
import { getAuthenticatedUser } from '@/lib/db/auth';
import { settingsToRow } from '@/lib/db/settings-mappers';
import type { AppSettings } from '@/lib/settings-defaults';
import type { Board } from '@/types/board';

export async function POST(request: Request) {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { boards?: Board[]; settings?: AppSettings };
  try {
    body = (await request.json()) as { boards?: Board[]; settings?: AppSettings };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const result: { boardsImported: number; settingsImported: boolean } = {
    boardsImported: 0,
    settingsImported: false,
  };

  if (Array.isArray(body.boards) && body.boards.length > 0) {
    const { count, error: countError } = await supabase
      .from('boards')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    if ((count ?? 0) === 0) {
      const rows = body.boards.map((board) => boardToRow(board, user.id));
      const { error: insertError } = await supabase.from('boards').insert(rows);
      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
      result.boardsImported = body.boards.length;
    }
  }

  if (body.settings) {
    const row = {
      ...settingsToRow(body.settings, user.id),
      updated_at: new Date().toISOString(),
    };
    const { error: settingsError } = await supabase
      .from('user_settings')
      .upsert(row, { onConflict: 'user_id' });

    if (settingsError) {
      return NextResponse.json({ error: settingsError.message }, { status: 500 });
    }
    result.settingsImported = true;
  }

  return NextResponse.json(result);
}
