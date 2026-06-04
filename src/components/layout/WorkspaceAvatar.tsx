'use client';

import { useSyncExternalStore } from 'react';
import { cn } from '@/lib/utils';
import {
  DEFAULT_APP_SETTINGS,
  getWorkspaceAvatarEmoji,
  getWorkspaceInitials,
  readAppSettings,
  subscribeAppSettings,
} from '@/lib/settings-store';

type WorkspaceAvatarProps = {
  className?: string;
  emojiClassName?: string;
  initialsClassName?: string;
};

/**
 * Renders the current workspace avatar (a chosen emoji or the workspace
 * initials) on the selected accent background. Reads the settings store
 * directly so every placement stays in sync across the app.
 */
export function WorkspaceAvatar({
  className,
  emojiClassName,
  initialsClassName,
}: WorkspaceAvatarProps) {
  const settings = useSyncExternalStore(
    subscribeAppSettings,
    readAppSettings,
    () => DEFAULT_APP_SETTINGS,
  );

  const emoji = getWorkspaceAvatarEmoji(settings.avatarId);

  return (
    <div
      aria-hidden="true"
      className={cn(
        'flex items-center justify-center border border-black/10 text-slate-900 shadow-sm dark:border-white/20',
        className,
      )}
      style={{ backgroundColor: settings.avatarAccent }}
    >
      {emoji ? (
        <span className={cn('leading-none', emojiClassName)}>{emoji}</span>
      ) : (
        <span className={cn('font-semibold leading-none', initialsClassName)}>
          {getWorkspaceInitials(settings.workspaceName)}
        </span>
      )}
    </div>
  );
}
