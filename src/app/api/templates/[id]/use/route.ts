import { NextResponse } from 'next/server';
import { rowToCommunityTemplate, type BoardTemplateRow } from '@/lib/db/template-mappers';
import { createAdminClient } from '@/lib/supabase/admin';
import type { BoardTemplate } from '@/types/board';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('board_templates')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  const row = data as BoardTemplateRow;
  if (!row.is_public) {
    return NextResponse.json({ error: 'Template is not public' }, { status: 403 });
  }

  await admin
    .from('board_templates')
    .update({ use_count: row.use_count + 1, updated_at: new Date().toISOString() })
    .eq('id', id);

  const template = rowToCommunityTemplate(row);
  return NextResponse.json({
    template: template as BoardTemplate,
    communityTemplate: template,
  });
}
