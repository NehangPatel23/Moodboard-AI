'use client';

import { apiFetch } from '@/lib/api-client';
import {
  DEFAULT_APP_SETTINGS,
  CUSTOM_AVATAR_ID,
  INITIALS_AVATAR_ID,
  WORKSPACE_AVATAR_ACCENTS,
  WORKSPACE_AVATARS,
  type AppSettings,
  type ResolvedTheme,
  type ThemeMode,
  type ThemeSnapshot,
  type WorkspaceAvatar,
  type WorkspaceAvatarGroup,
} from '@/lib/settings-defaults';
import { migrateLegacySettingsParsed } from '@/lib/db/settings-mappers';
import { normalizeRetentionDuration } from '@/lib/retention-duration';

export type {
  AppSettings,
  ResolvedTheme,
  ThemeMode,
  ThemeSnapshot,
  WorkspaceAvatar,
  WorkspaceAvatarGroup,
};

export {
  CUSTOM_AVATAR_ID,
  DEFAULT_APP_SETTINGS,
  INITIALS_AVATAR_ID,
  WORKSPACE_AVATAR_ACCENTS,
  WORKSPACE_AVATARS,
};

const THEME_COOKIE = 'moodboard-theme-mode';
const THEME_STORAGE_KEY = 'moodboard-settings-v1';
const THEME_MEDIA_QUERY = '(prefers-color-scheme: dark)';

const WORKSPACE_AVATAR_IDS = new Set<string>([
  INITIALS_AVATAR_ID,
  CUSTOM_AVATAR_ID,
  ...WORKSPACE_AVATARS.map((avatar) => avatar.id),
]);

const WORKSPACE_NAME_MAX = 40;
const WORKSPACE_TAGLINE_MAX = 60;

type Listener = () => void;

const listeners = new Set<Listener>();
let globalListenersAttached = false;
let mediaQueryList: MediaQueryList | null = null;

let activeUserId: string | null = null;
let cachedSettings: AppSettings | null = null;
let cachedLastSavedAt: string | null = null;
let cachedThemeSnapshot: ThemeSnapshot | null = null;

/** Bumped on each local save so stale API responses cannot overwrite newer edits. */
let persistVersion = 0;
let persistTimer: ReturnType<typeof setTimeout> | null = null;

const PERSIST_DEBOUNCE_MS = 400;

export function getWorkspaceAvatarEmoji(avatarId: string): string | null {
  const match = WORKSPACE_AVATARS.find((avatar) => avatar.id === avatarId);
  return match ? match.emoji : null;
}

function normalizeThemeMode(value: unknown): ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system' ? value : 'system';
}

function normalizeText(value: unknown, fallback: string, maxLength: number): string {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  return trimmed.slice(0, maxLength);
}

function normalizeAccent(value: unknown): string {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value)
    ? value
    : DEFAULT_APP_SETTINGS.avatarAccent;
}

function normalizeAvatarImageUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return null;
  }
  return trimmed.slice(0, 2048);
}

function normalizeAvatarId(value: unknown): string {
  return typeof value === 'string' && WORKSPACE_AVATAR_IDS.has(value)
    ? value
    : DEFAULT_APP_SETTINGS.avatarId;
}

export function getWorkspaceInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return 'MB';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}

function normalizeSettings(value: unknown): AppSettings {
  const parsed = (value ?? {}) as Partial<AppSettings> & Record<string, unknown>;
  const legacyRetention = migrateLegacySettingsParsed(parsed);

  return {
    workspaceName: normalizeText(
      parsed.workspaceName,
      DEFAULT_APP_SETTINGS.workspaceName,
      WORKSPACE_NAME_MAX,
    ),
    workspaceTagline: normalizeText(
      parsed.workspaceTagline,
      DEFAULT_APP_SETTINGS.workspaceTagline,
      WORKSPACE_TAGLINE_MAX,
    ),
    avatarAccent: normalizeAccent(parsed.avatarAccent),
    avatarId: normalizeAvatarId(parsed.avatarId),
    avatarImageUrl: normalizeAvatarImageUrl(parsed.avatarImageUrl),
    defaultVisibility: parsed.defaultVisibility === 'shared' ? 'shared' : 'private',
    presentationModeEnabled:
      typeof parsed.presentationModeEnabled === 'boolean'
        ? parsed.presentationModeEnabled
        : DEFAULT_APP_SETTINGS.presentationModeEnabled,
    keyboardShortcutsEnabled:
      typeof parsed.keyboardShortcutsEnabled === 'boolean'
        ? parsed.keyboardShortcutsEnabled
        : DEFAULT_APP_SETTINGS.keyboardShortcutsEnabled,
    reduceMotionEnabled:
      typeof parsed.reduceMotionEnabled === 'boolean'
        ? parsed.reduceMotionEnabled
        : DEFAULT_APP_SETTINGS.reduceMotionEnabled,
    focusRingsEnabled:
      typeof parsed.focusRingsEnabled === 'boolean'
        ? parsed.focusRingsEnabled
        : DEFAULT_APP_SETTINGS.focusRingsEnabled,
    themeMode: normalizeThemeMode(parsed.themeMode),
    commentsHideAfter:
      legacyRetention.commentsHideAfter ??
      normalizeRetentionDuration(parsed.commentsHideAfter),
    activityHideAfter:
      legacyRetention.activityHideAfter ??
      normalizeRetentionDuration(parsed.activityHideAfter),
    purgeCommentsAfter:
      legacyRetention.purgeCommentsAfter ??
      normalizeRetentionDuration(parsed.purgeCommentsAfter),
    purgeActivityAfter:
      legacyRetention.purgeActivityAfter ??
      normalizeRetentionDuration(parsed.purgeActivityAfter),
    snapshotMaxPerBoard:
      typeof parsed.snapshotMaxPerBoard === 'number' && parsed.snapshotMaxPerBoard >= 0
        ? parsed.snapshotMaxPerBoard
        : DEFAULT_APP_SETTINGS.snapshotMaxPerBoard,
    snapshotAutoPrune:
      typeof parsed.snapshotAutoPrune === 'boolean'
        ? parsed.snapshotAutoPrune
        : DEFAULT_APP_SETTINGS.snapshotAutoPrune,
  };
}

function readSystemPreference(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia(THEME_MEDIA_QUERY).matches ? 'dark' : 'light';
}

function readThemeModeFromCookie(): ThemeMode | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${THEME_COOKIE}=([^;]+)`));
  if (!match) return null;
  return normalizeThemeMode(decodeURIComponent(match[1]));
}

function readThemeModeFromLocalStorage(): ThemeMode | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { themeMode?: unknown };
    return normalizeThemeMode(parsed.themeMode);
  } catch {
    return null;
  }
}

function writeThemeCookie(themeMode: ThemeMode): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${THEME_COOKIE}=${encodeURIComponent(themeMode)};path=/;max-age=31536000;SameSite=Lax`;
}

function writeThemeLocalStorage(themeMode: ThemeMode): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    window.localStorage.setItem(
      THEME_STORAGE_KEY,
      JSON.stringify({ ...parsed, themeMode }),
    );
  } catch {
    // Ignore quota or privacy errors.
  }
}

/** Apply cookie/local theme before Supabase settings load (landing + hard refresh). */
export function bootstrapSettingsFromCookie(): void {
  const themeMode =
    readThemeModeFromCookie() ?? readThemeModeFromLocalStorage() ?? DEFAULT_APP_SETTINGS.themeMode;

  cachedSettings = {
    ...DEFAULT_APP_SETTINGS,
    themeMode,
  };
  cachedThemeSnapshot = null;
}

function emit(): void {
  cachedThemeSnapshot = null;
  listeners.forEach((listener) => listener());
}

function handleSystemThemeChange(): void {
  emit();
}

function ensureGlobalListeners(): void {
  if (globalListenersAttached || typeof window === 'undefined') return;

  mediaQueryList = window.matchMedia(THEME_MEDIA_QUERY);
  if (typeof mediaQueryList.addEventListener === 'function') {
    mediaQueryList.addEventListener('change', handleSystemThemeChange);
  } else {
    mediaQueryList.addListener(handleSystemThemeChange);
  }

  globalListenersAttached = true;
}

export function subscribeAppSettings(listener: Listener): () => void {
  listeners.add(listener);
  ensureGlobalListeners();

  return () => {
    listeners.delete(listener);
  };
}

export function readAppSettings(): AppSettings {
  if (!cachedSettings) {
    bootstrapSettingsFromCookie();
  }
  return cachedSettings!;
}

async function persistSettings(snapshot: AppSettings, version: number): Promise<void> {
  try {
    const data = await apiFetch<{ settings: AppSettings; updatedAt: string }>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify({ settings: snapshot }),
    });

    if (version !== persistVersion) return;

    cachedLastSavedAt = data.updatedAt;
    emit();
  } catch {
    if (version !== persistVersion) return;

    const { showToast } = await import('@/components/shared/toast-store');
    showToast('Failed to save settings.', 'destructive');
    emit();
  }
}

function schedulePersist(): void {
  if (!activeUserId) return;

  const version = ++persistVersion;

  if (persistTimer) clearTimeout(persistTimer);

  persistTimer = setTimeout(() => {
    persistTimer = null;
    const snapshot = readAppSettings();
    void persistSettings(snapshot, version);
  }, PERSIST_DEBOUNCE_MS);
}

export function applyServerSettings(settings: AppSettings, updatedAt: string | null): void {
  cachedSettings = settings;
  cachedLastSavedAt = updatedAt;
  persistVersion += 1;

  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }

  writeThemeCookie(settings.themeMode);
  writeThemeLocalStorage(settings.themeMode);
  emit();
}

export function saveAppSettings(next: AppSettings): void {
  cachedSettings = next;
  writeThemeCookie(next.themeMode);
  writeThemeLocalStorage(next.themeMode);
  emit();
  schedulePersist();
}

export function updateAppSettings(patch: Partial<AppSettings>): AppSettings {
  const next = {
    ...readAppSettings(),
    ...patch,
  };

  saveAppSettings(next);
  return next;
}

export function resolveThemeMode(mode: ThemeMode = readAppSettings().themeMode): ResolvedTheme {
  if (mode === 'light') return 'light';
  if (mode === 'dark') return 'dark';
  return readSystemPreference();
}

function buildThemeSnapshot(): ThemeSnapshot {
  const settings = readAppSettings();
  return {
    mode: settings.themeMode,
    resolvedTheme:
      settings.themeMode === 'system' ? readSystemPreference() : settings.themeMode,
  };
}

export function getThemeSnapshot(): ThemeSnapshot {
  if (cachedThemeSnapshot) return cachedThemeSnapshot;
  cachedThemeSnapshot = buildThemeSnapshot();
  return cachedThemeSnapshot;
}

export function readLastSavedAt(): string | null {
  return cachedLastSavedAt;
}

export function writeLastSavedAt(value: string): void {
  cachedLastSavedAt = value;
  emit();
}

export function clearLastSavedAt(): void {
  cachedLastSavedAt = null;
  emit();
}

export async function hydrateSettingsForUser(userId: string): Promise<void> {
  if (activeUserId === userId && cachedSettings) return;

  activeUserId = userId;

  if (!cachedSettings) {
    bootstrapSettingsFromCookie();
  }

  const cookieTheme = readThemeModeFromCookie() ?? readThemeModeFromLocalStorage();

  try {
    const data = await apiFetch<{ settings: AppSettings; updatedAt: string | null }>('/api/settings');
    const serverSettings = normalizeSettings(data.settings);

    if (cookieTheme && cookieTheme !== serverSettings.themeMode) {
      cachedSettings = { ...serverSettings, themeMode: cookieTheme };
      schedulePersist();
    } else {
      cachedSettings = serverSettings;
    }

    cachedLastSavedAt = data.updatedAt;
    writeThemeCookie(cachedSettings.themeMode);
    writeThemeLocalStorage(cachedSettings.themeMode);
  } catch {
    if (!cachedSettings) {
      bootstrapSettingsFromCookie();
    }
    cachedLastSavedAt = null;
  }

  emit();
}

export function resetSettingsStore(): void {
  activeUserId = null;
  cachedSettings = null;
  cachedLastSavedAt = null;
  cachedThemeSnapshot = null;
  persistVersion = 0;
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  bootstrapSettingsFromCookie();
  emit();
}
