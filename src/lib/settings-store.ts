'use client';

import type { BoardVisibility } from '@/types/board';

export type ThemeMode = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

export type AppSettings = {
  workspaceName: string;
  workspaceTagline: string;
  avatarAccent: string;
  avatarId: string;
  defaultVisibility: BoardVisibility;
  presentationModeEnabled: boolean;
  keyboardShortcutsEnabled: boolean;
  reduceMotionEnabled: boolean;
  focusRingsEnabled: boolean;
  themeMode: ThemeMode;
};

export const WORKSPACE_AVATAR_ACCENTS = [
  '#cbd5e1', // slate
  '#a5b4fc', // indigo
  '#c4b5fd', // violet
  '#d8b4fe', // purple
  '#f9a8d4', // pink
  '#fda4af', // rose
  '#fdba74', // orange
  '#fcd34d', // amber
  '#6ee7b7', // emerald
  '#5eead4', // teal
  '#67e8f9', // cyan
  '#7dd3fc', // sky
] as const;

/** Sentinel avatar id that renders the workspace initials instead of an emoji. */
export const INITIALS_AVATAR_ID = 'initials';

export type WorkspaceAvatarGroup = 'people' | 'symbols';

export type WorkspaceAvatar = {
  id: string;
  emoji: string;
  label: string;
  group: WorkspaceAvatarGroup;
};

export const WORKSPACE_AVATARS: WorkspaceAvatar[] = [
  // Creative people
  { id: 'artist', emoji: '🧑‍🎨', label: 'Artist', group: 'people' },
  { id: 'painter', emoji: '👩‍🎨', label: 'Painter', group: 'people' },
  { id: 'designer', emoji: '🧑‍💻', label: 'Designer', group: 'people' },
  { id: 'creator', emoji: '🧑‍🎤', label: 'Creator', group: 'people' },
  { id: 'curator', emoji: '🧑‍🏫', label: 'Curator', group: 'people' },
  // Creative symbols
  { id: 'palette', emoji: '🎨', label: 'Palette', group: 'symbols' },
  { id: 'brush', emoji: '🖌️', label: 'Brush', group: 'symbols' },
  { id: 'pencil', emoji: '✏️', label: 'Pencil', group: 'symbols' },
  { id: 'camera', emoji: '📷', label: 'Camera', group: 'symbols' },
  { id: 'film', emoji: '🎬', label: 'Film', group: 'symbols' },
  { id: 'sparkle', emoji: '✨', label: 'Sparkle', group: 'symbols' },
  { id: 'star', emoji: '⭐', label: 'Star', group: 'symbols' },
  { id: 'moon', emoji: '🌙', label: 'Moon', group: 'symbols' },
  { id: 'idea', emoji: '💡', label: 'Idea', group: 'symbols' },
];

const WORKSPACE_AVATAR_IDS = new Set<string>([
  INITIALS_AVATAR_ID,
  ...WORKSPACE_AVATARS.map((avatar) => avatar.id),
]);

export function getWorkspaceAvatarEmoji(avatarId: string): string | null {
  const match = WORKSPACE_AVATARS.find((avatar) => avatar.id === avatarId);
  return match ? match.emoji : null;
}

const WORKSPACE_NAME_MAX = 40;
const WORKSPACE_TAGLINE_MAX = 60;

type Listener = () => void;

const SETTINGS_STORAGE_KEY = 'moodboard-settings-v1';
const SETTINGS_META_STORAGE_KEY = 'moodboard-settings-meta-v1';
const THEME_MEDIA_QUERY = '(prefers-color-scheme: dark)';

export const DEFAULT_APP_SETTINGS: AppSettings = {
  workspaceName: 'MoodBoard AI',
  workspaceTagline: 'Creative direction workspace',
  avatarAccent: WORKSPACE_AVATAR_ACCENTS[0],
  avatarId: 'artist',
  defaultVisibility: 'private',
  presentationModeEnabled: true,
  keyboardShortcutsEnabled: true,
  reduceMotionEnabled: false,
  focusRingsEnabled: true,
  themeMode: 'system',
};

const listeners = new Set<Listener>();
let globalListenersAttached = false;
let mediaQueryList: MediaQueryList | null = null;

let cachedSettings: AppSettings | null = null;
let cachedThemeSnapshot: ThemeSnapshot | null = null;

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
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
  const parsed = (value ?? {}) as Partial<AppSettings>;

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
  };
}

function readSystemPreference(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia(THEME_MEDIA_QUERY).matches ? 'dark' : 'light';
}

function buildThemeSnapshot(): ThemeSnapshot {
  const settings = readAppSettings();
  return {
    mode: settings.themeMode,
    resolvedTheme:
      settings.themeMode === 'system' ? readSystemPreference() : settings.themeMode,
  };
}

function emit(): void {
  cachedThemeSnapshot = null;
  listeners.forEach((listener) => listener());
}

function handleStorageEvent(event: StorageEvent): void {
  if (event.key === SETTINGS_STORAGE_KEY) {
    cachedSettings = null;
    emit();
  }
}

function handleSystemThemeChange(): void {
  emit();
}

function ensureGlobalListeners(): void {
  if (globalListenersAttached || typeof window === 'undefined') return;

  window.addEventListener('storage', handleStorageEvent);

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
  if (cachedSettings) return cachedSettings;
  if (!canUseStorage()) {
    cachedSettings = DEFAULT_APP_SETTINGS;
    return cachedSettings;
  }

  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    cachedSettings = raw ? normalizeSettings(JSON.parse(raw) as unknown) : DEFAULT_APP_SETTINGS;
    return cachedSettings;
  } catch {
    cachedSettings = DEFAULT_APP_SETTINGS;
    return cachedSettings;
  }
}

export function saveAppSettings(next: AppSettings): void {
  cachedSettings = next;

  if (canUseStorage()) {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
  }

  emit();
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

export type ThemeSnapshot = {
  mode: ThemeMode;
  resolvedTheme: ResolvedTheme;
};

export function getThemeSnapshot(): ThemeSnapshot {
  if (cachedThemeSnapshot) return cachedThemeSnapshot;
  cachedThemeSnapshot = buildThemeSnapshot();
  return cachedThemeSnapshot;
}

export function readLastSavedAt(): string | null {
  if (!canUseStorage()) return null;
  const value = window.localStorage.getItem(SETTINGS_META_STORAGE_KEY);
  return value && value.trim() ? value : null;
}

export function writeLastSavedAt(value: string): void {
  if (canUseStorage()) {
    window.localStorage.setItem(SETTINGS_META_STORAGE_KEY, value);
  }

  emit();
}

export function clearLastSavedAt(): void {
  if (canUseStorage()) {
    window.localStorage.removeItem(SETTINGS_META_STORAGE_KEY);
  }

  emit();
}