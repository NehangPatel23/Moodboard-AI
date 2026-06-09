import Link from 'next/link';
import { PublicProfileAvatar } from '@/components/profile/PublicProfileAvatar';
import type { PublicProfile } from '@/types/profile';

type ProfileHeaderProps = {
  profile: PublicProfile;
  boardCount: number;
};

export function ProfileHeader({ profile, boardCount }: ProfileHeaderProps) {
  return (
    <header className={`rounded-[2.5rem] border border-(--border) bg-(--surface-elevated) p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)] md:p-8 dark:shadow-[0_24px_60px_rgba(0,0,0,0.22)]`}>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <PublicProfileAvatar
          profile={profile}
          className="h-20 w-20 shrink-0 text-3xl"
          emojiClassName="text-3xl"
          initialsClassName="text-xl"
        />

        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-(--text-muted)">
            Creator profile
          </p>
          <h1 className="[font-family:var(--font-display),serif] text-[clamp(2rem,4vw,3rem)] leading-tight tracking-tight text-(--text-strong)">
            {profile.workspaceName}
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-(--text-muted) md:text-base">
            {profile.workspaceTagline}
          </p>
          <p className="text-xs text-(--text-muted)">
            {boardCount} public {boardCount === 1 ? 'board' : 'boards'} on Discover
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/discover"
          className="inline-flex h-10 items-center justify-center rounded-full border border-(--border) bg-(--surface) px-4 text-sm font-medium text-(--text) transition hover:bg-(--surface-subtle) hover:text-(--text-strong)"
        >
          Browse Discover
        </Link>
      </div>
    </header>
  );
}
