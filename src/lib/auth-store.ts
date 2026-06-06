'use client';

import { createId } from './utils';

/**
 * Lightweight, client-side (mock) authentication.
 *
 * This is a demo-grade auth layer that mirrors the app's other localStorage +
 * useSyncExternalStore stores. It is NOT cryptographically secure: user records
 * (including a lightly obfuscated password) live in localStorage and all gating
 * happens on the client. It exists to model the auth UX until real, server-backed
 * authentication and a database are introduced.
 */

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

type StoredUser = AuthUser & {
  /** Obfuscated password — see file header. Not a real hash, not secure. */
  passwordHash: string;
  createdAt: string;
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

const USERS_STORAGE_KEY = 'moodboard-auth-users-v1';
const SESSION_STORAGE_KEY = 'moodboard-auth-session-v1';

const PASSWORD_MIN_LENGTH = 6;

/** Sessions expire 7 days after sign in. */
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Built-in demo/admin account, seeded on hydration so the app can be tested
 * without registering first. Surfaced on the sign-in screen. Not secure.
 */
export const DEMO_CREDENTIALS = {
  email: 'admin@moodboard.ai',
  password: 'moodboard123',
} as const;

const DEMO_USER: StoredUser = {
  id: 'user_demo_admin',
  name: 'Demo Admin',
  email: DEMO_CREDENTIALS.email,
  passwordHash: '',
  createdAt: '2026-01-01T00:00:00.000Z',
};

const LOADING_STATE: AuthState = { status: 'loading', user: null };
const UNAUTHENTICATED_STATE: AuthState = { status: 'unauthenticated', user: null };

const listeners = new Set<Listener>();
let storageListenerAttached = false;
let hydrated = false;
let cachedState: AuthState | null = null;

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function emit(): void {
  listeners.forEach((listener) => listener());
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/**
 * Deliberately weak obfuscation. This only keeps the stored value from being a
 * plaintext password at a glance — it provides no real security.
 */
function obfuscatePassword(password: string): string {
  try {
    return btoa(`mb:${encodeURIComponent(password)}`);
  } catch {
    return `mb:${password}`;
  }
}

function readUsers(): StoredUser[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (entry): entry is StoredUser =>
        !!entry &&
        typeof entry === 'object' &&
        typeof (entry as StoredUser).id === 'string' &&
        typeof (entry as StoredUser).email === 'string' &&
        typeof (entry as StoredUser).passwordHash === 'string',
    );
  } catch {
    return [];
  }
}

function writeUsers(users: StoredUser[]): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

type StoredSession = {
  userId: string;
  expiresAt: number;
};

function readSessionUserId(): string | null {
  if (!canUseStorage()) return null;

  const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw || !raw.trim()) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Legacy format: a bare user-id string. Treat as a valid session; it gets
    // upgraded to the expiring format on the next write (sign in / sign out).
    return raw;
  }

  if (
    parsed &&
    typeof parsed === 'object' &&
    typeof (parsed as StoredSession).userId === 'string' &&
    typeof (parsed as StoredSession).expiresAt === 'number'
  ) {
    const session = parsed as StoredSession;
    if (session.expiresAt <= Date.now()) {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
    return session.userId;
  }

  return null;
}

function writeSession(userId: string | null): void {
  if (!canUseStorage()) return;
  if (userId) {
    const session: StoredSession = { userId, expiresAt: Date.now() + SESSION_TTL_MS };
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } else {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  }
}

function toAuthUser(user: StoredUser): AuthUser {
  return { id: user.id, name: user.name, email: user.email };
}

/** Seeds the built-in demo account if it isn't already present. */
function ensureSeedUser(): void {
  if (!canUseStorage()) return;

  const users = readUsers();
  if (users.some((entry) => entry.email === DEMO_USER.email)) return;

  writeUsers([
    ...users,
    { ...DEMO_USER, passwordHash: obfuscatePassword(DEMO_CREDENTIALS.password) },
  ]);
}

function computeState(): AuthState {
  const sessionUserId = readSessionUserId();
  if (!sessionUserId) return UNAUTHENTICATED_STATE;

  const user = readUsers().find((entry) => entry.id === sessionUserId);
  if (!user) return UNAUTHENTICATED_STATE;

  return { status: 'authenticated', user: toAuthUser(user) };
}

function invalidate(): void {
  cachedState = null;
  emit();
}

function handleStorageEvent(event: StorageEvent): void {
  if (event.key === SESSION_STORAGE_KEY || event.key === USERS_STORAGE_KEY) {
    invalidate();
  }
}

function ensureStorageListener(): void {
  if (storageListenerAttached || typeof window === 'undefined') return;
  window.addEventListener('storage', handleStorageEvent);
  storageListenerAttached = true;
}

export function subscribeAuth(listener: Listener): () => void {
  listeners.add(listener);
  ensureStorageListener();

  return () => {
    listeners.delete(listener);
  };
}

export function readAuthState(): AuthState {
  if (!hydrated) return LOADING_STATE;
  if (cachedState) return cachedState;

  cachedState = computeState();
  return cachedState;
}

export function getServerAuthSnapshot(): AuthState {
  return LOADING_STATE;
}

/**
 * Flips the store from its initial `loading` state to the resolved state read
 * from localStorage. Safe to call repeatedly. Mirrors `hydrateBoardStore`.
 */
export function hydrateAuthStore(): void {
  if (hydrated) return;
  ensureSeedUser();
  hydrated = true;
  cachedState = null;
  emit();
}

export function signUp({ name, email, password }: SignUpInput): AuthResult {
  const trimmedName = name.trim();
  const normalizedEmail = normalizeEmail(email);

  if (!trimmedName) {
    return { ok: false, error: 'Please enter your name.' };
  }

  if (!isValidEmail(normalizedEmail)) {
    return { ok: false, error: 'Please enter a valid email address.' };
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    return {
      ok: false,
      error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`,
    };
  }

  if (!canUseStorage()) {
    return { ok: false, error: 'Sign up is unavailable in this environment.' };
  }

  const users = readUsers();
  if (users.some((entry) => entry.email === normalizedEmail)) {
    return { ok: false, error: 'An account with this email already exists.' };
  }

  const newUser: StoredUser = {
    id: createId('user'),
    name: trimmedName,
    email: normalizedEmail,
    passwordHash: obfuscatePassword(password),
    createdAt: new Date().toISOString(),
  };

  writeUsers([...users, newUser]);
  writeSession(newUser.id);

  hydrated = true;
  invalidate();

  return { ok: true, user: toAuthUser(newUser) };
}

export function signIn({ email, password }: AuthCredentials): AuthResult {
  const normalizedEmail = normalizeEmail(email);

  if (!isValidEmail(normalizedEmail) || !password) {
    return { ok: false, error: 'Please enter your email and password.' };
  }

  if (!canUseStorage()) {
    return { ok: false, error: 'Sign in is unavailable in this environment.' };
  }

  const user = readUsers().find((entry) => entry.email === normalizedEmail);
  if (!user || user.passwordHash !== obfuscatePassword(password)) {
    return { ok: false, error: 'Incorrect email or password.' };
  }

  writeSession(user.id);

  hydrated = true;
  invalidate();

  return { ok: true, user: toAuthUser(user) };
}

export function signOut(): void {
  writeSession(null);
  hydrated = true;
  invalidate();
}

/** Signs in with the built-in demo account, seeding it first if needed. */
export function signInWithDemo(): AuthResult {
  ensureSeedUser();
  return signIn({ ...DEMO_CREDENTIALS });
}
