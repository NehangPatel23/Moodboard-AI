import type { BoardVisibility } from '@/types/board';

export type ThemeMode = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

export type ThemeSnapshot = {
  mode: ThemeMode;
  resolvedTheme: ResolvedTheme;
};

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
  '#cbd5e1',
  '#a5b4fc',
  '#c4b5fd',
  '#d8b4fe',
  '#f9a8d4',
  '#fda4af',
  '#fdba74',
  '#fcd34d',
  '#6ee7b7',
  '#5eead4',
  '#67e8f9',
  '#7dd3fc',
] as const;

export const INITIALS_AVATAR_ID = 'initials';

export type WorkspaceAvatarGroup = 'people' | 'symbols';

export type WorkspaceAvatar = {
  id: string;
  emoji: string;
  label: string;
  group: WorkspaceAvatarGroup;
};

export const WORKSPACE_AVATARS: WorkspaceAvatar[] = [
  { id: 'artist', emoji: '🧑‍🎨', label: 'Artist', group: 'people' },
  { id: 'painter', emoji: '👩‍🎨', label: 'Painter', group: 'people' },
  { id: 'designer', emoji: '🧑‍💻', label: 'Designer', group: 'people' },
  { id: 'creator', emoji: '🧑‍🎤', label: 'Creator', group: 'people' },
  { id: 'curator', emoji: '🧑‍🏫', label: 'Curator', group: 'people' },
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
