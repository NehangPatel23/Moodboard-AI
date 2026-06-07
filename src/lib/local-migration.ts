'use client';

import { apiFetch } from '@/lib/api-client';
import { safeParse } from '@/lib/utils';
import type { AppSettings } from '@/lib/settings-defaults';
import type { Board } from '@/types/board';

const MIGRATION_DONE_KEY = 'moodboard-migration-v1-done';
const LEGACY_BOARDS_KEY = 'moodboard-ai:boards';
const BOARDS_KEY_PREFIX = 'moodboard-ai:boards:';
const LEGACY_SETTINGS_KEY = 'moodboard-settings-v1';
const LEGACY_AUTH_USERS_KEY = 'moodboard-auth-users-v1';
const LEGACY_AUTH_SESSION_KEY = 'moodboard-auth-session-v1';

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function collectLegacyBoards(): Board[] {
  if (!canUseStorage()) return [];

  const merged = new Map<string, Board>();

  function addFromKey(key: string) {
    const raw = window.localStorage.getItem(key);
    if (!raw) return;
    const parsed = safeParse<Board[]>(raw, []);
    parsed.forEach((board) => {
      if (board?.id) merged.set(board.id, board);
    });
  }

  addFromKey(LEGACY_BOARDS_KEY);

  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (!key || !key.startsWith(BOARDS_KEY_PREFIX)) continue;
    addFromKey(key);
  }

  return Array.from(merged.values());
}

function collectLegacySettings(): AppSettings | null {
  if (!canUseStorage()) return null;
  const raw = window.localStorage.getItem(LEGACY_SETTINGS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AppSettings;
  } catch {
    return null;
  }
}

function clearLegacyKeys(): void {
  if (!canUseStorage()) return;

  const keysToRemove: string[] = [];

  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (!key) continue;
    if (
      key.startsWith('moodboard-ai:boards') ||
      key === LEGACY_SETTINGS_KEY ||
      key === 'moodboard-settings-meta-v1' ||
      key === LEGACY_AUTH_USERS_KEY ||
      key === LEGACY_AUTH_SESSION_KEY
    ) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => window.localStorage.removeItem(key));
  window.localStorage.setItem(MIGRATION_DONE_KEY, 'true');
}

export async function runLocalStorageMigrationIfNeeded(): Promise<void> {
  if (!canUseStorage()) return;
  if (window.localStorage.getItem(MIGRATION_DONE_KEY) === 'true') return;

  const boards = collectLegacyBoards();
  const settings = collectLegacySettings();

  if (boards.length === 0 && !settings) {
    window.localStorage.setItem(MIGRATION_DONE_KEY, 'true');
    return;
  }

  try {
    await apiFetch<{ boardsImported: number; settingsImported: boolean }>('/api/migrate', {
      method: 'POST',
      body: JSON.stringify({ boards, settings: settings ?? undefined }),
    });
    clearLegacyKeys();
  } catch {
    // Leave legacy data in place so migration can retry on next load.
  }
}
