import { AvatarEmoji } from '@/components/settings/AvatarEmoji';
import { CUSTOM_AVATAR_ID } from '@/lib/settings-defaults';
import { getWorkspaceAvatarEmoji, getWorkspaceInitials } from '@/lib/settings-store';
import { cn } from '@/lib/utils';

type UserAvatarContentProps = {
  avatarId: string;
  avatarImageUrl: string | null;
  avatarAccent: string;
  displayName: string;
  className?: string;
  emojiClassName?: string;
  initialsClassName?: string;
};

export function UserAvatarContent({
  avatarId,
  avatarImageUrl,
  avatarAccent,
  displayName,
  className,
  emojiClassName,
  initialsClassName,
}: UserAvatarContentProps) {
  const photoUrl =
    avatarId === CUSTOM_AVATAR_ID && avatarImageUrl?.trim() ? avatarImageUrl.trim() : null;
  const emoji = photoUrl ? null : getWorkspaceAvatarEmoji(avatarId);

  return (
    <div
      aria-hidden="true"
      className={cn(
        'flex items-center justify-center overflow-hidden border border-black/10 text-slate-900 shadow-sm dark:border-white/20',
        className,
      )}
      style={{ backgroundColor: photoUrl ? undefined : avatarAccent }}
    >
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- Supabase public URL; same pattern as reference uploads
        <img src={photoUrl} alt="" className="h-full w-full object-cover" />
      ) : emoji ? (
        <AvatarEmoji
          emoji={emoji}
          size="display"
          className={cn('h-auto w-auto text-[inherit]', emojiClassName)}
        />
      ) : (
        <span className={cn('font-semibold leading-none', initialsClassName)}>
          {getWorkspaceInitials(displayName)}
        </span>
      )}
    </div>
  );
}
