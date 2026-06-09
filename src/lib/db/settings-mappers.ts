import {
  DEFAULT_APP_SETTINGS,
  type AppSettings,
  type ThemeMode,
} from '@/lib/settings-defaults';
import {
  collaborationRetentionToJson,
  NEVER_RETENTION,
  parseCollaborationRetentionJson,
  retentionFromLegacyDays,
} from '@/lib/retention-duration';
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
  collaboration_retention?: unknown;
  updated_at: string;
};

function legacyDaysFromRetention(duration: AppSettings['commentsHideAfter']): number {
  if (!duration || duration.amount <= 0) return 0;
  if (duration.unit === 'days') return duration.amount;
  if (duration.unit === 'weeks') return duration.amount * 7;
  return 0;
}

export function rowToSettings(row: UserSettingsRow): AppSettings {
  const legacy = {
    commentsHideAfterDays: row.comments_hide_after_days,
    activityHideAfterDays: row.activity_hide_after_days,
    purgeCommentsAfterDays: row.purge_comments_after_days,
    purgeActivityAfterDays: row.purge_activity_after_days,
  };
  const retention = parseCollaborationRetentionJson(row.collaboration_retention, legacy);

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
    commentsHideAfter: retention.commentsHide ?? NEVER_RETENTION,
    activityHideAfter: retention.activityHide ?? NEVER_RETENTION,
    purgeCommentsAfter: retention.purgeComments ?? NEVER_RETENTION,
    purgeActivityAfter: retention.purgeActivity ?? NEVER_RETENTION,
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
    comments_hide_after_days: legacyDaysFromRetention(settings.commentsHideAfter),
    activity_hide_after_days: legacyDaysFromRetention(settings.activityHideAfter),
    purge_comments_after_days: legacyDaysFromRetention(settings.purgeCommentsAfter),
    purge_activity_after_days: legacyDaysFromRetention(settings.purgeActivityAfter),
    collaboration_retention: collaborationRetentionToJson(settings),
  };
}

export function defaultSettingsRow(userId: string): Omit<UserSettingsRow, 'updated_at'> {
  return settingsToRow(DEFAULT_APP_SETTINGS, userId);
}

export function migrateLegacySettingsParsed(parsed: Record<string, unknown>): Partial<AppSettings> {
  const commentsHideAfterDays =
    typeof parsed.commentsHideAfterDays === 'number' ? parsed.commentsHideAfterDays : undefined;
  const activityHideAfterDays =
    typeof parsed.activityHideAfterDays === 'number' ? parsed.activityHideAfterDays : undefined;
  const purgeCommentsAfterDays =
    typeof parsed.purgeCommentsAfterDays === 'number' ? parsed.purgeCommentsAfterDays : undefined;
  const purgeActivityAfterDays =
    typeof parsed.purgeActivityAfterDays === 'number' ? parsed.purgeActivityAfterDays : undefined;

  const hasLegacy =
    commentsHideAfterDays !== undefined ||
    activityHideAfterDays !== undefined ||
    purgeCommentsAfterDays !== undefined ||
    purgeActivityAfterDays !== undefined;

  if (!hasLegacy) return {};

  const retention = parseCollaborationRetentionJson(parsed.collaborationRetention, {
    commentsHideAfterDays,
    activityHideAfterDays,
    purgeCommentsAfterDays,
    purgeActivityAfterDays,
  });

  return {
    commentsHideAfter: retention.commentsHide ?? retentionFromLegacyDays(commentsHideAfterDays ?? 0),
    activityHideAfter: retention.activityHide ?? retentionFromLegacyDays(activityHideAfterDays ?? 0),
    purgeCommentsAfter: retention.purgeComments ?? retentionFromLegacyDays(purgeCommentsAfterDays ?? 0),
    purgeActivityAfter: retention.purgeActivity ?? retentionFromLegacyDays(purgeActivityAfterDays ?? 0),
  };
}
