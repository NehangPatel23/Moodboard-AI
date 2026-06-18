'use client';

import { useSyncExternalStore } from 'react';
import { UserAvatarContent } from '@/components/shared/UserAvatarContent';
import {
  getServerAuthSnapshot,
  readAuthState,
  subscribeAuth,
} from '@/lib/auth-store';
import {
  DEFAULT_APP_SETTINGS,
  readAppSettings,
  subscribeAppSettings,
} from '@/lib/settings-store';

type WorkspaceAvatarProps = {
  className?: string;
  emojiClassName?: string;
  initialsClassName?: string;
};

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
  const auth = useSyncExternalStore(subscribeAuth, readAuthState, getServerAuthSnapshot);

  const displayName =
    auth.status === 'authenticated' && auth.user?.name
      ? auth.user.name
      : settings.workspaceName;

  return (
    <UserAvatarContent
      avatarId={settings.avatarId}
      avatarImageUrl={settings.avatarImageUrl}
      avatarAccent={settings.avatarAccent}
      displayName={displayName}
      className={className}
      emojiClassName={emojiClassName}
      initialsClassName={initialsClassName}
    />
  );
}
