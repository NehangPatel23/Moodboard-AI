'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Sparkles } from 'lucide-react';
import { DiscoverBoardCard } from '@/components/discover/DiscoverBoardCard';
import { DiscoverMoodFilters } from '@/components/discover/DiscoverMoodFilters';
import { useGatedHref } from '@/components/auth/use-gated-href';
import { Input } from '@/components/ui/input';
import type { Board } from '@/types/board';
import { getRemainingDiscoverBoards, pickFeaturedBoards } from '@/lib/discover-featured';
import {
  boardMatchesMood,
  extractDiscoverMoods,
  findMoodBySlug,
  moodToSlug,
} from '@/lib/discover-moods';

const sectionLabelClass =
  'text-[10px] font-medium uppercase tracking-[0.28em] text-(--text-muted)';

const primaryButtonClass =
  'inline-flex h-11 items-center justify-center gap-2 rounded-full border border-transparent bg-[var(--text-strong)]! px-5 text-sm font-medium text-[var(--background)]! shadow-[0_12px_30px_rgba(15,23,42,0.14)] transition hover:-translate-y-0.5 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] dark:border-white/10 dark:bg-white! dark:text-slate-950!';

function normalizeText(value: string): string {
  return value.toLowerCase().trim();
}

function boardMatchesQuery(board: Board, query: string): boolean {
  if (!query) return true;

  const haystack = normalizeText(
    [board.title, board.summary, board.mood, board.prompt, ...board.tags, ...board.tone].join(' '),
  );

  return haystack.includes(query);
}

function boardCountLabel(count: number): string {
  return `${count} public ${count === 1 ? 'board' : 'boards'}`;
}

function DiscoverPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const startBoardHref = useGatedHref('/app/new');
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const moodSlug = searchParams.get('mood');
  const selectedMood = useMemo(() => {
    if (!moodSlug || boards.length === 0) {
      return null;
    }
    return findMoodBySlug(boards, moodSlug);
  }, [boards, moodSlug]);
  const invalidMoodSlug = Boolean(moodSlug && boards.length > 0 && !selectedMood);

  useEffect(() => {
    let cancelled = false;

    async function loadBoards() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/discover');
        if (!response.ok) {
          throw new Error('Failed to load public boards');
        }

        const data = (await response.json()) as { boards?: Board[] };
        if (!cancelled) {
          setBoards(data.boards ?? []);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load public boards');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadBoards();

    return () => {
      cancelled = true;
    };
  }, []);

  const moodOptions = useMemo(() => extractDiscoverMoods(boards), [boards]);

  const setMoodFilter = useCallback(
    (mood: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (mood) {
        params.set('mood', moodToSlug(mood));
      } else {
        params.delete('mood');
      }
      const query = params.toString();
      router.replace(query ? `/discover?${query}` : '/discover', { scroll: false });
    },
    [router, searchParams],
  );

  const normalizedQuery = normalizeText(search);
  const hasActiveFilters = Boolean(normalizedQuery || selectedMood);

  const filteredBoards = useMemo(() => {
    if (invalidMoodSlug) {
      return [];
    }

    return boards.filter(
      (board) => boardMatchesQuery(board, normalizedQuery) && boardMatchesMood(board, selectedMood),
    );
  }, [boards, invalidMoodSlug, normalizedQuery, selectedMood]);

  const featuredBoards = useMemo(
    () => (hasActiveFilters ? [] : pickFeaturedBoards(filteredBoards)),
    [filteredBoards, hasActiveFilters],
  );

  const remainingBoards = useMemo(
    () =>
      hasActiveFilters
        ? filteredBoards
        : getRemainingDiscoverBoards(filteredBoards, featuredBoards),
    [featuredBoards, filteredBoards, hasActiveFilters],
  );

  const showFeaturedSection = !hasActiveFilters && featuredBoards.length > 0;
  const showRemainingSection = remainingBoards.length > 0;
  const showMoodChips = !loading && !error && moodOptions.length > 0;

  const emptyTitle =
    boards.length === 0
      ? 'Be the first to share a board.'
      : invalidMoodSlug
        ? 'Unknown mood filter.'
        : selectedMood
          ? 'No boards in this mood.'
          : 'Try a different search term.';

  const emptyDescription =
    boards.length === 0
      ? 'Create a board, set visibility to Shared, save, and your work will appear here.'
      : invalidMoodSlug
        ? 'That mood link is no longer available. Browse all public boards instead.'
        : selectedMood
          ? 'Clear the mood filter or try another mood to browse more public boards.'
          : 'Search across titles, moods, tags, and summaries.';

  return (
    <div className="space-y-12 py-2 md:py-4">
      <section className="relative overflow-hidden rounded-[2.5rem] border border-(--border) bg-(--surface-elevated) p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)] md:p-10 dark:shadow-[0_24px_60px_rgba(0,0,0,0.22)]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_0%_0%,rgba(184,216,252,0.22),transparent_55%),radial-gradient(90%_70%_at_100%_0%,rgba(212,200,245,0.18),transparent_50%),radial-gradient(80%_60%_at_50%_100%,rgba(200,240,216,0.14),transparent_55%)]"
        />
        <div className="relative space-y-5">
          <p className={sectionLabelClass}>Discover</p>
          <h1 className="max-w-3xl [font-family:var(--font-display),serif] text-[clamp(2.4rem,5vw,3.75rem)] leading-[0.98] tracking-[-0.04em] text-(--text-strong)">
            Browse public creative direction boards.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-(--text-muted) md:text-lg">
            Explore shared moodboards from the community — palettes, typography, references, and
            notes in view-only presentation mode.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link href={startBoardHref} className={primaryButtonClass}>
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Start your own board
            </Link>
            {!loading && boards.length > 0 ? (
              <p className="text-sm text-(--text-muted)">{boardCountLabel(boards.length)} live now</p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="space-y-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
          <div className="relative min-w-0 flex-1 lg:max-w-md">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-(--text-muted)"
              aria-hidden="true"
            />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by title, mood, or tag…"
              className="h-12 rounded-full border-(--border) bg-(--surface-elevated) pl-11 shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
              aria-label="Search public boards"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:justify-between lg:shrink-0 lg:justify-end">
            {showMoodChips ? (
              <DiscoverMoodFilters
                moods={moodOptions}
                selectedMood={selectedMood}
                onSelectMood={setMoodFilter}
              />
            ) : null}

            {!loading && !error && filteredBoards.length > 0 ? (
              <p className="shrink-0 text-sm font-medium text-(--text-muted)">
                {hasActiveFilters
                  ? `${filteredBoards.length} ${filteredBoards.length === 1 ? 'match' : 'matches'}`
                  : boardCountLabel(filteredBoards.length)}
              </p>
            ) : null}
          </div>
        </div>

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-80 animate-pulse rounded-[1.75rem] border border-(--border) bg-(--surface-soft)"
              />
            ))}
          </div>
        ) : null}

        {!loading && error ? (
          <section className="rounded-[1.75rem] border border-(--border) bg-(--surface-soft) px-6 py-10 text-center">
            <p className="text-sm text-(--text-muted)">{error}</p>
          </section>
        ) : null}

        {!loading && !error && filteredBoards.length === 0 ? (
          <section className="rounded-[1.75rem] border border-dashed border-(--border) bg-(--surface-soft) px-6 py-12 text-center">
            <p className={sectionLabelClass}>
              {boards.length === 0 ? 'No public boards yet' : 'No matches'}
            </p>
            <h2 className="mt-3 [font-family:var(--font-display),serif] text-3xl tracking-tight text-(--text-strong)">
              {emptyTitle}
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-(--text-muted)">
              {emptyDescription}
            </p>
            {boards.length === 0 ? (
              <div className="mt-6">
                <Link href={startBoardHref} className={primaryButtonClass}>
                  Create a board
                </Link>
              </div>
            ) : selectedMood || invalidMoodSlug ? (
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => setMoodFilter(null)}
                  className={primaryButtonClass}
                >
                  Show all moods
                </button>
              </div>
            ) : null}
          </section>
        ) : null}

        {!loading && !error && filteredBoards.length > 0 ? (
          <div className="space-y-10">
            {showFeaturedSection ? (
              <div className="space-y-5 rounded-[2rem] border border-(--border) bg-(--surface-soft)/70 p-5 md:p-6">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className={sectionLabelClass}>Featured</p>
                    <h2 className="mt-2 [font-family:var(--font-display),serif] text-2xl tracking-tight text-(--text-strong) md:text-3xl">
                      Curated public boards
                    </h2>
                  </div>
                  <p className="text-xs uppercase tracking-[0.22em] text-(--text-muted)">
                    Editor&apos;s picks
                  </p>
                </div>
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {featuredBoards.map((board) => (
                    <DiscoverBoardCard key={`featured-${board.id}`} board={board} featured />
                  ))}
                </div>
              </div>
            ) : null}

            {showRemainingSection ? (
              <div className="space-y-5">
                {showFeaturedSection ? (
                  <div>
                    <p className={sectionLabelClass}>More to explore</p>
                    <h2 className="mt-2 [font-family:var(--font-display),serif] text-2xl tracking-tight text-(--text-strong)">
                      All other public boards
                    </h2>
                  </div>
                ) : hasActiveFilters ? (
                  <div>
                    <p className={sectionLabelClass}>Results</p>
                    <h2 className="mt-2 [font-family:var(--font-display),serif] text-2xl tracking-tight text-(--text-strong)">
                      {selectedMood ? `Boards in “${selectedMood}”` : 'Matching boards'}
                    </h2>
                  </div>
                ) : null}

                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {remainingBoards.map((board) => (
                    <DiscoverBoardCard key={board.id} board={board} />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>
    </div>
  );
}

export default function DiscoverPage() {
  return (
    <Suspense
      fallback={
        <div className="grid gap-5 py-8 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-80 animate-pulse rounded-[1.75rem] border border-(--border) bg-(--surface-soft)"
            />
          ))}
        </div>
      }
    >
      <DiscoverPageContent />
    </Suspense>
  );
}
