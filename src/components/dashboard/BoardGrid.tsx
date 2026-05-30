'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { loadBoards, subscribeBoards } from '@/lib/board-store';
import { BoardCard } from './BoardCard';
import { Button } from '@/components/ui/button';

type BoardGridProps = {
  sort: 'recent' | 'favorite';
};

function EmptyGallery({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description: string;
  actionHref: string;
  actionLabel: string;
}) {
  return (
    <section
      aria-label="Empty board gallery"
      className="flex items-center justify-center py-8"
    >
      <div className="w-full max-w-3xl rounded-[2.5rem] border border-black/5 bg-white/80 p-8 text-center shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur md:p-12">
        <div className="mx-auto mb-8 grid max-w-2xl grid-cols-3 gap-3">
          <div className="h-28 rounded-3xl bg-slate-200/70" />
          <div className="h-28 rounded-3xl bg-slate-300/50" />
          <div className="h-28 rounded-3xl bg-slate-200/70" />
        </div>

        <p className="text-[10px] font-medium uppercase tracking-[0.32em] text-slate-400">
          Studio
        </p>
        <h3 className="mt-4 text-3xl leading-tight text-slate-900">
          {title}
        </h3>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
          {description}
        </p>

        <div className="mt-7 flex justify-center">
          <Link
            href={actionHref}
            className="inline-flex h-11 items-center justify-center rounded-full bg-slate-900 px-5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
          >
            {actionLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}

export function BoardGrid({ sort }: BoardGridProps) {
  const boards = useSyncExternalStore(subscribeBoards, loadBoards, loadBoards);

  if (!boards.length) {
    return (
      <EmptyGallery
        title="Your studio is empty."
        description="Create your first board to begin curating references, palettes, typography, and direction."
        actionHref="/app/new"
        actionLabel="Create a board"
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
      <EmptyGallery
        title="No favorite boards yet."
        description="Favorite a board to keep it easy to return to while shaping the studio."
        actionHref="/app"
        actionLabel="Browse boards"
      />
    );
  }

  return (
    <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3" aria-label="Board gallery">
      {visibleBoards.map((board) => (
        <BoardCard key={board.id} board={board} />
      ))}
    </section>
  );
}