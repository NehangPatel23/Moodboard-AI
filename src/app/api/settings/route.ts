import { NextResponse } from 'next/server';
import { rowToSettings, settingsToRow } from '@/lib/db/settings-mappers';
import { getAuthenticatedUser } from '@/lib/db/auth';
import { DEFAULT_APP_SETTINGS, type AppSettings } from '@/lib/settings-defaults';

export async function GET() {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({
      settings: DEFAULT_APP_SETTINGS,
      updatedAt: null,
    });
  }

  return NextResponse.json({
    settings: rowToSettings(data),
    updatedAt: data.updated_at,
  });
}

export async function PUT(request: Request) {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { settings?: AppSettings };
  try {
    body = (await request.json()) as { settings?: AppSettings };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.settings) {
    return NextResponse.json({ error: 'settings is required' }, { status: 400 });
  }

  const row = {
    ...settingsToRow(body.settings, user.id),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('user_settings')
    .upsert(row, { onConflict: 'user_id' })
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    settings: rowToSettings(data),
    updatedAt: data.updated_at,
  });
}
