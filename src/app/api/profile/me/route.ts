import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/db/auth';

const MAX_NAME_LENGTH = 40;

export async function PATCH(request: Request) {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { name?: string };
  try {
    body = (await request.json()) as { name?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const trimmedName = body.name?.trim();
  if (!trimmedName) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }

  const name = trimmedName.slice(0, MAX_NAME_LENGTH);

  const { data, error } = await supabase
    .from('profiles')
    .update({ name })
    .eq('id', user.id)
    .select('name')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.auth.updateUser({ data: { name } });

  return NextResponse.json({ name: data.name });
}
