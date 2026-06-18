import type { BoardVisibility } from '@/types/board';
import { NEVER_RETENTION, type RetentionDuration } from '@/lib/retention-duration';

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
  avatarImageUrl: string | null;
  defaultVisibility: BoardVisibility;
  presentationModeEnabled: boolean;
  keyboardShortcutsEnabled: boolean;
  reduceMotionEnabled: boolean;
  focusRingsEnabled: boolean;
  themeMode: ThemeMode;
  commentsHideAfter: RetentionDuration;
  activityHideAfter: RetentionDuration;
  purgeCommentsAfter: RetentionDuration;
  purgeActivityAfter: RetentionDuration;
  snapshotMaxPerBoard: number;
  snapshotAutoPrune: boolean;
};

export const SNAPSHOT_LIMIT_OPTIONS = [
  { value: 10, label: '10 per board' },
  { value: 25, label: '25 per board' },
  { value: 50, label: '50 per board' },
  { value: 0, label: 'Unlimited' },
] as const;

export const WORKSPACE_AVATAR_ACCENTS = [
  { value: '#cbd5e1', label: 'Slate' },
  { value: '#a5b4fc', label: 'Indigo' },
  { value: '#c4b5fd', label: 'Violet' },
  { value: '#d8b4fe', label: 'Purple' },
  { value: '#f9a8d4', label: 'Pink' },
  { value: '#fda4af', label: 'Rose' },
  { value: '#fdba74', label: 'Peach' },
  { value: '#fcd34d', label: 'Gold' },
  { value: '#6ee7b7', label: 'Mint' },
  { value: '#5eead4', label: 'Teal' },
  { value: '#67e8f9', label: 'Sky' },
  { value: '#7dd3fc', label: 'Blue' },
] as const;

export const INITIALS_AVATAR_ID = 'initials';
export const CUSTOM_AVATAR_ID = 'custom';

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
  { id: 'explorer', emoji: '🧑‍🚀', label: 'Explorer', group: 'people' },
  { id: 'researcher', emoji: '🧑‍🔬', label: 'Researcher', group: 'people' },
  { id: 'strategist', emoji: '🧑‍💼', label: 'Strategist', group: 'people' },
  { id: 'wellness', emoji: '🧘', label: 'Wellness', group: 'people' },
  { id: 'social', emoji: '🤳', label: 'Social', group: 'people' },
  { id: 'palette', emoji: '🎨', label: 'Palette', group: 'symbols' },
  { id: 'brush', emoji: '🖌️', label: 'Brush', group: 'symbols' },
  { id: 'pencil', emoji: '✏️', label: 'Pencil', group: 'symbols' },
  { id: 'camera', emoji: '📷', label: 'Camera', group: 'symbols' },
  { id: 'film', emoji: '🎬', label: 'Film', group: 'symbols' },
  { id: 'sparkle', emoji: '✨', label: 'Sparkle', group: 'symbols' },
  { id: 'star', emoji: '⭐', label: 'Star', group: 'symbols' },
  { id: 'moon', emoji: '🌙', label: 'Moon', group: 'symbols' },
  { id: 'idea', emoji: '💡', label: 'Idea', group: 'symbols' },
  { id: 'target', emoji: '🎯', label: 'Target', group: 'symbols' },
  { id: 'crystal', emoji: '🔮', label: 'Crystal', group: 'symbols' },
  { id: 'blossom', emoji: '🌸', label: 'Blossom', group: 'symbols' },
  { id: 'magic', emoji: '🪄', label: 'Magic', group: 'symbols' },
  { id: 'layout', emoji: '📐', label: 'Layout', group: 'symbols' },
  { id: 'energy', emoji: '🔥', label: 'Energy', group: 'symbols' },
  { id: 'flow', emoji: '🌊', label: 'Flow', group: 'symbols' },
  { id: 'rhythm', emoji: '🎵', label: 'Rhythm', group: 'symbols' },
  { id: 'gem', emoji: '💎', label: 'Gem', group: 'symbols' },
  { id: 'spectrum', emoji: '🌈', label: 'Spectrum', group: 'symbols' },
  { id: 'compass', emoji: '🧭', label: 'Compass', group: 'symbols' },
  { id: 'leaf', emoji: '🌿', label: 'Leaf', group: 'symbols' },
  { id: 'bolt', emoji: '⚡', label: 'Bolt', group: 'symbols' },
  { id: 'heart', emoji: '❤️', label: 'Heart', group: 'symbols' },
];

export const DEFAULT_APP_SETTINGS: AppSettings = {
  workspaceName: 'MoodBoard AI',
  workspaceTagline: 'Creative direction workspace',
  avatarAccent: WORKSPACE_AVATAR_ACCENTS[0].value,
  avatarId: 'artist',
  avatarImageUrl: null,
  defaultVisibility: 'private',
  presentationModeEnabled: true,
  keyboardShortcutsEnabled: true,
  reduceMotionEnabled: false,
  focusRingsEnabled: true,
  themeMode: 'system',
  commentsHideAfter: NEVER_RETENTION,
  activityHideAfter: NEVER_RETENTION,
  purgeCommentsAfter: NEVER_RETENTION,
  purgeActivityAfter: NEVER_RETENTION,
  snapshotMaxPerBoard: 25,
  snapshotAutoPrune: true,
};
