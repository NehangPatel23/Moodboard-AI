import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function sanitizeNext(value: string | null): string {
  if (!value) return '/app';
  if (!value.startsWith('/') || value.startsWith('//')) return '/app';
  return value;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = sanitizeNext(searchParams.get('next'));

  if (!code) {
    return NextResponse.redirect(`${origin}/sign-in?error=auth_callback`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/sign-in?error=auth_callback`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
