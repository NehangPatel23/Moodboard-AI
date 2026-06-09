'use client';

import { cn } from '@/lib/utils';
import { getWorkspaceAvatarEmoji, getWorkspaceInitials } from '@/lib/settings-store';
import type { PublicProfile } from '@/types/profile';

type PublicProfileAvatarProps = {
  profile: Pick<PublicProfile, 'workspaceName' | 'avatarId' | 'avatarAccent'>;
  className?: string;
  emojiClassName?: string;
  initialsClassName?: string;
};

export function PublicProfileAvatar({
  profile,
  className,
  emojiClassName,
  initialsClassName,
}: PublicProfileAvatarProps) {
  const emoji = getWorkspaceAvatarEmoji(profile.avatarId);

  return (
    <div
      aria-hidden="true"
      className={cn(
        'flex items-center justify-center rounded-full border border-black/10 text-slate-900 shadow-sm dark:border-white/20',
        className,
      )}
      style={{ backgroundColor: profile.avatarAccent }}
    >
      {emoji ? (
        <span className={cn('leading-none', emojiClassName)}>{emoji}</span>
      ) : (
        <span className={cn('font-semibold leading-none', initialsClassName)}>
          {getWorkspaceInitials(profile.workspaceName)}
        </span>
      )}
    </div>
  );
}
