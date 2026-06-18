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
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const next = sanitizeNext(searchParams.get('next'));

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(`${origin}/sign-in?error=auth_callback`);
    }
    return NextResponse.redirect(`${origin}${next}`);
  }

  if (tokenHash && type === 'recovery') {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: 'recovery',
    });
    if (error) {
      return NextResponse.redirect(`${origin}/sign-in?error=auth_callback`);
    }
    return NextResponse.redirect(`${origin}/sign-in?mode=update-password`);
  }

  if (tokenHash && type === 'email') {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: 'email',
    });
    if (error) {
      return NextResponse.redirect(`${origin}/sign-in?error=auth_callback`);
    }
    return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/sign-in?error=auth_callback`);
}
