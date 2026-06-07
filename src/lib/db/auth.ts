import { createClient } from '@/lib/supabase/server';
import { ensureProfileForUser, profileFromAuthUser } from '@/lib/db/ensure-profile';
import type { User } from '@supabase/supabase-js';

function fallbackProfile(user: User) {
  if (!user.email) {
    return null;
  }
  return profileFromAuthUser(user);
}

export async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { supabase, user: null as null, profile: null as null };
  }

  try {
    const profile = await ensureProfileForUser(user);
    return { supabase, user, profile: profile ?? fallbackProfile(user) };
  } catch {
    return { supabase, user, profile: fallbackProfile(user) };
  }
}
