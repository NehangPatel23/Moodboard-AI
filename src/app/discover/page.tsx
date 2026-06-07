'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, Sparkles } from 'lucide-react';
import { DiscoverBoardCard } from '@/components/discover/DiscoverBoardCard';
import { useGatedHref } from '@/components/auth/use-gated-href';
import { Input } from '@/components/ui/input';
import type { Board } from '@/types/board';

const outerPanelClass =
  'rounded-[2.5rem] border border-(--border) bg-(--surface-elevated) shadow-[0_24px_60px_rgba(15,23,42,0.06)] dark:shadow-[0_24px_60px_rgba(0,0,0,0.22)]';

const softPanelClass = 'rounded-[1.75rem] border border-(--border) bg-(--surface-soft)';

const primaryButtonClass =
  'inline-flex h-11 items-center justify-center gap-2 rounded-full border border-transparent bg-[var(--text-strong)]! px-5 text-sm font-medium text-[var(--background)]! shadow-[0_12px_30px_rgba(15,23,42,0.14)] transition hover:-translate-y-0.5 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] dark:border-white/10 dark:bg-white! dark:text-slate-950!';

const sectionLabelClass =
  'text-[10px] font-medium uppercase tracking-[0.28em] text-(--text-muted)';

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

export default function DiscoverPage() {
  const startBoardHref = useGatedHref('/app/new');
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

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

  const normalizedQuery = normalizeText(search);
  const filteredBoards = useMemo(
    () => boards.filter((board) => boardMatchesQuery(board, normalizedQuery)),
    [boards, normalizedQuery],
  );

  return (
    <div className="space-y-10 py-4">
      <section className={`${outerPanelClass} p-6 md:p-8`}>
        <p className={sectionLabelClass}>Discover</p>
        <h1 className="mt-3 max-w-3xl [font-family:var(--font-display),serif] text-4xl tracking-[-0.04em] text-(--text-strong) md:text-5xl">
          Browse public creative direction boards.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-(--text-muted)">
          Explore shared moodboards from the community — palettes, typography, references, and
          notes in view-only presentation mode.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link href={startBoardHref} className={primaryButtonClass}>
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Start your own board
          </Link>
        </div>
      </section>

      <section className="space-y-6">
        <div className="relative max-w-md">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-(--text-muted)"
            aria-hidden="true"
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by title, mood, or tag…"
            className="h-11 rounded-full border-(--border) bg-(--surface) pl-11"
            aria-label="Search public boards"
          />
        </div>

        {loading ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-80 animate-pulse rounded-4xl border border-(--border) bg-(--surface-soft)"
              />
            ))}
          </div>
        ) : null}

        {!loading && error ? (
          <section className={`${softPanelClass} px-6 py-10 text-center`}>
            <p className="text-sm text-(--text-muted)">{error}</p>
          </section>
        ) : null}

        {!loading && !error && filteredBoards.length === 0 ? (
          <section className={`${softPanelClass} px-6 py-12 text-center`}>
            <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-(--text-muted)">
              {boards.length === 0 ? 'No public boards yet' : 'No matches'}
            </p>
            <h2 className="mt-3 [font-family:var(--font-display),serif] text-3xl tracking-tight text-(--text-strong)">
              {boards.length === 0
                ? 'Be the first to share a board.'
                : 'Try a different search term.'}
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-(--text-muted)">
              {boards.length === 0
                ? 'Create a board, set visibility to Shared, save, and your work will appear here.'
                : 'Search across titles, moods, tags, and summaries.'}
            </p>
            {boards.length === 0 ? (
              <div className="mt-6">
                <Link href={startBoardHref} className={primaryButtonClass}>
                  Create a board
                </Link>
              </div>
            ) : null}
          </section>
        ) : null}

        {!loading && !error && filteredBoards.length > 0 ? (
          <>
            <p className="text-sm text-(--text-muted)">
              {filteredBoards.length} public board{filteredBoards.length === 1 ? '' : 's'}
            </p>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredBoards.map((board) => (
                <DiscoverBoardCard key={board.id} board={board} />
              ))}
            </div>
          </>
        ) : null}
      </section>
    </div>
  );
}
