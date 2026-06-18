import { NextResponse } from 'next/server';
import { rowToCommunityTemplate, type BoardTemplateRow } from '@/lib/db/template-mappers';
import { getAuthenticatedUser } from '@/lib/db/auth';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;

  let body: { name?: string; description?: string; isPublic?: boolean };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (typeof body.name === 'string') updates.name = body.name.trim();
  if (typeof body.description === 'string') updates.description = body.description.trim();
  if (typeof body.isPublic === 'boolean') updates.is_public = body.isPublic;

  const { data, error } = await supabase
    .from('board_templates')
    .update(updates)
    .eq('id', id)
    .eq('owner_user_id', user.id)
    .select('*')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  return NextResponse.json({ template: rowToCommunityTemplate(data as BoardTemplateRow) });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;

  const { error, count } = await supabase
    .from('board_templates')
    .delete({ count: 'exact' })
    .eq('id', id)
    .eq('owner_user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!count) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
