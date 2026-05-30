'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { loadBoards, subscribeBoards } from '@/lib/board-store';
import { BoardCard } from './BoardCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';

type BoardGridProps = {
  sort: 'recent' | 'favorite';
};

export function BoardGrid({ sort }: BoardGridProps) {
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

  const visibleBoards =
    sort === 'favorite'
      ? boards
          .filter((board) => board.isFavorite)
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      : boards
          .slice()
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  if (!visibleBoards.length) {
    return (
      <div className="rounded-4xl border border-dashed border-slate-300 bg-white/70 p-10 text-center">
        <h3 className="text-2xl font-semibold tracking-tight text-slate-950">
          No favorite boards yet
        </h3>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
          Favorite a board to bring it back here quickly.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button type="button" variant="outline" onClick={() => window.location.assign('/app')}>
            Show recent
          </Button>
          <Link
            href="/app/new"
            className="inline-flex h-11 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
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