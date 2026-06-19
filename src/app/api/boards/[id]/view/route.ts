import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  if (!id?.trim()) {
    return NextResponse.json({ error: 'Board id is required' }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data, error } = await admin
    .from('boards')
    .select('view_count')
    .eq('id', id)
    .eq('visibility', 'shared')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Public board not found' }, { status: 404 });
  }

  const currentCount = typeof data.view_count === 'number' ? data.view_count : 0;

  const { data: updated, error: updateError } = await admin
    .from('boards')
    .update({ view_count: currentCount + 1 })
    .eq('id', id)
    .eq('visibility', 'shared')
    .select('view_count')
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    viewCount: typeof updated.view_count === 'number' ? updated.view_count : currentCount + 1,
  });
}
