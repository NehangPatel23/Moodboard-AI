'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

let browserClient: SupabaseClient | undefined;

export function createClient() {
  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }

  return browserClient;
}

export async function ensureSupabaseRealtimeAuth(client: SupabaseClient = createClient()) {
  const {
    data: { session },
  } = await client.auth.getSession();

  if (session?.access_token) {
    await client.realtime.setAuth(session.access_token);
  }
}
