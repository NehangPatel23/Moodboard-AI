import {
  DEFAULT_APP_SETTINGS,
  type AppSettings,
  type ThemeMode,
} from '@/lib/settings-defaults';
import type { BoardVisibility } from '@/types/board';

export type UserSettingsRow = {
  user_id: string;
  workspace_name: string;
  workspace_tagline: string;
  avatar_accent: string;
  avatar_id: string;
  default_visibility: BoardVisibility;
  presentation_mode_enabled: boolean;
  keyboard_shortcuts_enabled: boolean;
  reduce_motion_enabled: boolean;
  focus_rings_enabled: boolean;
  theme_mode: ThemeMode;
  comments_hide_after_days?: number;
  activity_hide_after_days?: number;
  purge_comments_after_days?: number;
  purge_activity_after_days?: number;
  updated_at: string;
};

export function rowToSettings(row: UserSettingsRow): AppSettings {
  return {
    workspaceName: row.workspace_name,
    workspaceTagline: row.workspace_tagline,
    avatarAccent: row.avatar_accent,
    avatarId: row.avatar_id,
    defaultVisibility: row.default_visibility,
    presentationModeEnabled: row.presentation_mode_enabled,
    keyboardShortcutsEnabled: row.keyboard_shortcuts_enabled,
    reduceMotionEnabled: row.reduce_motion_enabled,
    focusRingsEnabled: row.focus_rings_enabled,
    themeMode: row.theme_mode,
    commentsHideAfterDays: row.comments_hide_after_days ?? 0,
    activityHideAfterDays: row.activity_hide_after_days ?? 0,
    purgeCommentsAfterDays: row.purge_comments_after_days ?? 0,
    purgeActivityAfterDays: row.purge_activity_after_days ?? 0,
  };
}

export function settingsToRow(settings: AppSettings, userId: string): Omit<UserSettingsRow, 'updated_at'> {
  return {
    user_id: userId,
    workspace_name: settings.workspaceName,
    workspace_tagline: settings.workspaceTagline,
    avatar_accent: settings.avatarAccent,
    avatar_id: settings.avatarId,
    default_visibility: settings.defaultVisibility,
    presentation_mode_enabled: settings.presentationModeEnabled,
    keyboard_shortcuts_enabled: settings.keyboardShortcutsEnabled,
    reduce_motion_enabled: settings.reduceMotionEnabled,
    focus_rings_enabled: settings.focusRingsEnabled,
    theme_mode: settings.themeMode,
    comments_hide_after_days: settings.commentsHideAfterDays,
    activity_hide_after_days: settings.activityHideAfterDays,
    purge_comments_after_days: settings.purgeCommentsAfterDays,
    purge_activity_after_days: settings.purgeActivityAfterDays,
  };
}

export function defaultSettingsRow(userId: string): Omit<UserSettingsRow, 'updated_at'> {
  return settingsToRow(DEFAULT_APP_SETTINGS, userId);
}
