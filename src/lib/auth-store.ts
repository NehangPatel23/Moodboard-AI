'use client';

import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { isValidEmail, passwordRequirementsMet } from '@/lib/auth-validation';

export { isValidEmail } from '@/lib/auth-validation';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
};

export type AuthState = {
  status: AuthStatus;
  user: AuthUser | null;
};

export type AuthCredentials = {
  email: string;
  password: string;
};

export type SignUpInput = AuthCredentials & {
  name: string;
};

export type AuthResult =
  | { ok: true; user: AuthUser }
  | { ok: false; error: string };

type Listener = () => void;

export const DEMO_CREDENTIALS = {
  email: 'admin@moodboard.ai',
  password: 'moodboard123',
} as const;

const LOADING_STATE: AuthState = { status: 'loading', user: null };
const UNAUTHENTICATED_STATE: AuthState = { status: 'unauthenticated', user: null };

const listeners = new Set<Listener>();
let hydrated = false;
let authSubscriptionAttached = false;
let cachedState: AuthState | null = null;

function emit(): void {
  listeners.forEach((listener) => listener());
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

async function mapSupabaseUser(
  supabaseUser: { id: string; email?: string | null; user_metadata?: Record<string, unknown> },
): Promise<AuthUser> {
  const supabase = createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, email')
    .eq('id', supabaseUser.id)
    .maybeSingle();

  const metadataName =
    typeof supabaseUser.user_metadata?.name === 'string'
      ? supabaseUser.user_metadata.name
      : null;

  return {
    id: supabaseUser.id,
    name: profile?.name ?? metadataName ?? 'User',
    email: profile?.email ?? supabaseUser.email ?? '',
  };
}

async function resolveAuthState(): Promise<AuthState> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return UNAUTHENTICATED_STATE;

  return {
    status: 'authenticated',
    user: await mapSupabaseUser(user),
  };
}

export function subscribeAuth(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function readAuthState(): AuthState {
  if (!hydrated) return LOADING_STATE;
  return cachedState ?? UNAUTHENTICATED_STATE;
}

export function getServerAuthSnapshot(): AuthState {
  return LOADING_STATE;
}

export function hydrateAuthStore(): void {
  if (hydrated && authSubscriptionAttached) return;

  const supabase = createClient();

  if (!authSubscriptionAttached) {
    supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      if (session?.user) {
        void mapSupabaseUser(session.user).then((user) => {
          cachedState = { status: 'authenticated', user };
          emit();
        });
      } else {
        cachedState = UNAUTHENTICATED_STATE;
        emit();
      }
    });

    authSubscriptionAttached = true;
  }

  void resolveAuthState()
    .then((state) => {
      hydrated = true;
      cachedState = state;
      emit();
    })
    .catch(() => {
      hydrated = true;
      cachedState = UNAUTHENTICATED_STATE;
      emit();
    });
}

function mapAuthError(message: string): string {
  const normalized = message.toLowerCase();
  if (normalized.includes('invalid login credentials')) {
    return 'Incorrect email or password.';
  }
  if (normalized.includes('user already registered')) {
    return 'An account with this email already exists.';
  }
  if (normalized.includes('email not confirmed')) {
    return 'Please confirm your email before signing in.';
  }
  if (normalized.includes('provider is not enabled') || normalized.includes('unsupported provider')) {
    return 'This sign-in provider is not enabled yet. Use email or ask the project owner to enable it in Supabase.';
  }
  if (normalized.includes('redirect') && normalized.includes('url')) {
    return 'Sign-in redirect URL is not allowed. Add /auth/callback to Supabase redirect URLs (see docs/SUPABASE_SETUP.md).';
  }
  if (normalized.includes('rate limit') || normalized.includes('too many requests')) {
    return 'Too many attempts. Please wait a few minutes and try again.';
  }
  return message;
}

export async function signUp({ name, email, password }: SignUpInput): Promise<AuthResult> {
  const trimmedName = name.trim();
  const normalizedEmail = normalizeEmail(email);

  if (!trimmedName) {
    return { ok: false, error: 'Please enter your name.' };
  }

  if (!isValidEmail(normalizedEmail)) {
    return { ok: false, error: 'Please enter a valid email address.' };
  }

  if (!passwordRequirementsMet(password)) {
    return { ok: false, error: 'Password does not meet all requirements.' };
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      data: { name: trimmedName },
    },
  });

  if (error) {
    return { ok: false, error: mapAuthError(error.message) };
  }

  if (!data.user) {
    return { ok: false, error: 'Sign up failed. Please try again.' };
  }

  if (!data.session) {
    return {
      ok: false,
      error: 'Account created. Check your email to confirm, then sign in.',
    };
  }

  const user = await mapSupabaseUser(data.user);
  cachedState = { status: 'authenticated', user };
  hydrated = true;
  emit();

  return { ok: true, user };
}

export async function signIn({ email, password }: AuthCredentials): Promise<AuthResult> {
  const normalizedEmail = normalizeEmail(email);

  if (!isValidEmail(normalizedEmail) || !password) {
    return { ok: false, error: 'Please enter your email and password.' };
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  if (error) {
    return { ok: false, error: mapAuthError(error.message) };
  }

  if (!data.user) {
    return { ok: false, error: 'Sign in failed. Please try again.' };
  }

  const user = await mapSupabaseUser(data.user);
  cachedState = { status: 'authenticated', user };
  hydrated = true;
  emit();

  return { ok: true, user };
}

export function updateAuthUserName(name: string): void {
  const trimmed = name.trim();
  if (!trimmed || cachedState?.status !== 'authenticated' || !cachedState.user) {
    return;
  }

  cachedState = {
    status: 'authenticated',
    user: { ...cachedState.user, name: trimmed },
  };
  emit();
}

export async function signOut(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
  cachedState = UNAUTHENTICATED_STATE;
  hydrated = true;
  emit();
}

export async function signInWithDemo(): Promise<AuthResult> {
  return signIn({ ...DEMO_CREDENTIALS });
}

export async function requestPasswordReset(email: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const normalizedEmail = normalizeEmail(email);

  if (!isValidEmail(normalizedEmail)) {
    return { ok: false, error: 'Please enter a valid email address.' };
  }

  const supabase = createClient();
  const origin = window.location.origin;
  const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent('/sign-in?mode=update-password')}`;

  const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, { redirectTo });

  if (error) {
    return { ok: false, error: mapAuthError(error.message) };
  }

  return { ok: true };
}

export async function updatePassword(password: string): Promise<AuthResult> {
  if (!passwordRequirementsMet(password)) {
    return { ok: false, error: 'Password does not meet all requirements.' };
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { ok: false, error: mapAuthError(error.message) };
  }

  if (!data.user) {
    return { ok: false, error: 'Could not update password. Please try again.' };
  }

  const user = await mapSupabaseUser(data.user);
  cachedState = { status: 'authenticated', user };
  hydrated = true;
  emit();

  return { ok: true, user };
}
