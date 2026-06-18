import { NextResponse } from 'next/server';
import { templateJsonFromBoard } from '@/lib/board-to-template';
import { curatedTemplates, rowToCommunityTemplate, type BoardTemplateRow } from '@/lib/db/template-mappers';
import { getAuthenticatedUser } from '@/lib/db/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { createId } from '@/lib/utils';
import type { Board } from '@/types/board';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get('scope') ?? 'all';

  const admin = createAdminClient();
  let communityQuery = admin
    .from('board_templates')
    .select('*')
    .order('updated_at', { ascending: false });

  if (scope === 'public') {
    communityQuery = communityQuery.eq('is_public', true);
  } else if (scope === 'mine') {
    const { user } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    communityQuery = communityQuery.eq('owner_user_id', user.id);
  } else {
    communityQuery = communityQuery.eq('is_public', true);
  }

  const { data, error } = await communityQuery;

  if (error) {
    if (error.message.includes('board_templates')) {
      return NextResponse.json({
        curated: curatedTemplates(),
        community: [],
      });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as BoardTemplateRow[];
  const ownerIds = [...new Set(rows.map((row) => row.owner_user_id))];
  const ownerNames = new Map<string, string>();

  if (ownerIds.length > 0) {
    const { data: profiles } = await admin.from('profiles').select('id, name').in('id', ownerIds);
    for (const profile of profiles ?? []) {
      if (profile.name) {
        ownerNames.set(profile.id as string, profile.name as string);
      }
    }
  }

  const community = rows.map((row) =>
    rowToCommunityTemplate(row, ownerNames.get(row.owner_user_id) ?? null),
  );

  return NextResponse.json({
    curated: scope === 'mine' ? [] : curatedTemplates(),
    community,
  });
}

export async function POST(request: Request) {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: {
    board?: Board;
    name?: string;
    description?: string;
    isPublic?: boolean;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.board) {
    return NextResponse.json({ error: 'board is required' }, { status: 400 });
  }

  const templateJson = templateJsonFromBoard(body.board, {
    name: body.name,
    description: body.description,
  });
  const id = createId('tmpl');
  const now = new Date().toISOString();

  const row = {
    id,
    owner_user_id: user.id,
    name: body.name?.trim() || templateJson.name,
    description: body.description?.trim() || templateJson.description,
    prompt: templateJson.prompt,
    tags: templateJson.tags,
    template_json: templateJson,
    is_public: Boolean(body.isPublic),
    use_count: 0,
    created_at: now,
    updated_at: now,
  };

  const { data, error } = await supabase.from('board_templates').insert(row).select('*').single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: profile } = await supabase.from('profiles').select('name').eq('id', user.id).maybeSingle();

  return NextResponse.json({
    template: rowToCommunityTemplate(data as BoardTemplateRow, profile?.name ?? null),
  });
}
