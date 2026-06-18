'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { DiscoverBoardCard } from '@/components/discover/DiscoverBoardCard';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import type { PublicProfileResponse } from '@/types/profile';

const sectionLabelClass =
  'text-[10px] font-medium uppercase tracking-[0.28em] text-(--text-muted)';

export default function ProfilePage() {
  const params = useParams<{ id: string }>();
  const profileId = params.id;
  const [data, setData] = useState<PublicProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/profile/${profileId}`);
        if (response.status === 404) {
          if (!cancelled) {
            setData(null);
            setError('Profile not found');
          }
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to load profile');
        }

        const payload = (await response.json()) as PublicProfileResponse;
        if (!cancelled) {
          setData(payload);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load profile');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [profileId]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="h-48 animate-pulse rounded-[2.5rem] border border-(--border) bg-(--surface-subtle)" />
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-80 animate-pulse rounded-4xl border border-(--border) bg-(--surface-subtle)"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-[2rem] border border-dashed border-(--border) bg-(--surface-subtle) px-6 py-16 text-center">
        <h1 className="[font-family:var(--font-display),serif] text-3xl text-(--text-strong)">
          {error ?? 'Profile unavailable'}
        </h1>
        <p className="mt-3 text-sm leading-6 text-(--text-muted)">
          This creator profile could not be loaded.
        </p>
        <Link
          href="/discover"
          className="mt-6 inline-flex h-10 items-center justify-center rounded-full bg-(--text-strong) px-5 text-sm font-medium text-(--background) transition hover:opacity-90"
        >
          Back to Discover
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <ProfileHeader profile={data.profile} boardCount={data.boards.length} />

      <section className="space-y-5">
        <div className="space-y-2">
          <p className={sectionLabelClass}>Public boards</p>
          <h2 className="[font-family:var(--font-display),serif] text-3xl tracking-tight text-(--text-strong)">
            Shared on Discover
          </h2>
        </div>

        {data.boards.length ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {data.boards.map((board) => (
              <DiscoverBoardCard key={board.id} board={board} />
            ))}
          </div>
        ) : (
          <div className="rounded-[1.75rem] border border-dashed border-(--border) bg-(--surface-subtle) px-6 py-12 text-center">
            <p className="text-sm leading-6 text-(--text-muted)">
              {data.profile.name} has not shared any boards yet.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
