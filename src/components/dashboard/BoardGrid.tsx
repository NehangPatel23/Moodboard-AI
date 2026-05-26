'use client';

import Link from 'next/link';
import { useSyncExternalStore } from 'react';
import { filterBoards, loadBoards, sortBoards, subscribeBoards } from '@/lib/board-store';
import { BoardCard } from './BoardCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';

type BoardGridProps = {
  query: string;
  sort: 'recent' | 'favorite';
  onClearFilters: () => void;
};

export function BoardGrid({ query, sort, onClearFilters }: BoardGridProps) {
  const boards = useSyncExternalStore(subscribeBoards, loadBoards, loadBoards);

  if (!boards.length) {
    return (
      <EmptyState
        title="No boards yet"
        description="Create your first board from a prompt and it will appear here."
        actionLabel="Create a board"
        actionHref="/app/new"
      />
    );
  }

  const filteredBoards = filterBoards(boards, query);
  const visibleBoards =
    sort === 'favorite'
      ? sortBoards(filteredBoards.filter((board) => board.isFavorite), 'favorite')
      : sortBoards(filteredBoards, 'recent');

  if (!visibleBoards.length) {
    const hasQuery = query.trim().length > 0;
    const title = hasQuery
      ? `No boards match "${query.trim()}"`
      : 'No favorite boards yet';
    const description = hasQuery
      ? 'Try a different keyword, or clear the filters to browse every board.'
      : 'Favorite a board from the dashboard to show it here.';

    return (
      <div className="rounded-4xl border border-dashed border-slate-300 bg-white/70 p-10 text-center">
        <h3 className="text-2xl font-semibold tracking-tight text-slate-950">{title}</h3>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">{description}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button type="button" variant="outline" onClick={onClearFilters}>
            Clear filters
          </Button>
          <Link
            href="/app/new"
            className="inline-flex h-11 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-medium text-white! shadow-sm transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
          >
            Create a board
          </Link>
        </div>
      </div>
    );
  }

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {visibleBoards.map((board) => (
        <BoardCard key={board.id} board={board} />
      ))}
    </section>
  );
}