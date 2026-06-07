import type { User } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';

export type ProfileSummary = {
  name: string;
  email: string;
};

export type ResolvedUser = ProfileSummary & {
  id: string;
};

export function profileFromAuthUser(user: User): ProfileSummary {
  const metadataName =
    typeof user.user_metadata?.name === 'string' ? user.user_metadata.name : null;
  const email = user.email ?? '';

  return {
    name: metadataName ?? (email.includes('@') ? email.split('@')[0] : 'User'),
    email,
  };
}

/** Creates a missing profiles row (and default settings) for an authenticated user. */
export async function ensureProfileForUser(user: User): Promise<ProfileSummary | null> {
  if (!user.email) {
    return null;
  }

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from('profiles')
    .select('name, email')
    .eq('id', user.id)
    .maybeSingle();

  if (existing?.email) {
    return existing;
  }

  const profile = profileFromAuthUser(user);

  const { error: profileError } = await admin.from('profiles').upsert({
    id: user.id,
    name: profile.name,
    email: profile.email,
  });

  if (profileError) {
    throw profileError;
  }

  await admin.from('user_settings').upsert({ user_id: user.id }, { onConflict: 'user_id' });

  return profile;
}

/** Finds a user by email in profiles, falling back to auth.users and backfilling profiles. */
export async function resolveUserByEmail(email: string): Promise<ResolvedUser | null> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from('profiles')
    .select('id, name, email')
    .ilike('email', normalized)
    .maybeSingle();

  if (profile) {
    return profile;
  }

  const { data: authRows, error: authError } = await admin.rpc('find_auth_user_by_email', {
    p_email: normalized,
  });

  let authUser: { id: string; email: string; name?: string | null } | null = null;

  if (!authError && authRows) {
    authUser = (Array.isArray(authRows) ? authRows[0] : authRows) ?? null;
  }

  if (!authUser?.id) {
    const { data: listData, error: listError } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (listError) {
      throw authError ?? listError;
    }

    const matched = listData.users.find((candidate) => candidate.email?.toLowerCase() === normalized);
    if (matched?.id && matched.email) {
      authUser = {
        id: matched.id,
        email: matched.email,
        name:
          typeof matched.user_metadata?.name === 'string' ? matched.user_metadata.name : undefined,
      };
    }
  }

  if (!authUser?.id || !authUser.email) {
    return null;
  }

  const name =
    typeof authUser.name === 'string' && authUser.name.length > 0
      ? authUser.name
      : authUser.email.split('@')[0] || 'User';

  const { error: profileError } = await admin.from('profiles').upsert({
    id: authUser.id,
    name,
    email: authUser.email,
  });

  if (profileError) {
    throw profileError;
  }

  await admin.from('user_settings').upsert({ user_id: authUser.id }, { onConflict: 'user_id' });

  return { id: authUser.id, name, email: authUser.email };
}
