'use client';

import { UserAvatarContent } from '@/components/shared/UserAvatarContent';
import type { PublicProfile } from '@/types/profile';

type PublicProfileAvatarProps = {
  profile: Pick<PublicProfile, 'name' | 'avatarId' | 'avatarAccent' | 'avatarImageUrl'>;
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
  return (
    <UserAvatarContent
      avatarId={profile.avatarId}
      avatarImageUrl={profile.avatarImageUrl}
      avatarAccent={profile.avatarAccent}
      displayName={profile.name}
      className={className}
      emojiClassName={emojiClassName}
      initialsClassName={initialsClassName}
    />
  );
}
