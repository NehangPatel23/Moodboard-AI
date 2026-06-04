'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { loadBoards, subscribeBoards } from '@/lib/board-store';
import { BoardCard } from './BoardCard';
import type { BoardSort, VisibilityFilter } from './BoardFilterBar';

type BoardGridProps = {
  sort: BoardSort;
  visibility: VisibilityFilter;
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
      <div className="w-full max-w-3xl rounded-[2.5rem] border border-(--border) bg-(--surface) p-8 text-center shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur md:p-12">
        <div className="mx-auto mb-8 grid max-w-2xl grid-cols-3 gap-3">
          <div className="h-28 rounded-3xl bg-(--surface-subtle)" />
          <div className="h-28 rounded-3xl bg-(--surface-muted)" />
          <div className="h-28 rounded-3xl bg-(--surface-subtle)" />
        </div>

        <p className="text-[10px] font-medium uppercase tracking-[0.32em] text-(--text-muted)">
          Studio
        </p>
        <h3 className="mt-4 text-3xl leading-tight text-(--text-strong)">
          {title}
        </h3>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-(--text-muted)">
          {description}
        </p>

        <div className="mt-7 flex justify-center">
          <Link
            href={actionHref}
            className="inline-flex h-11 items-center justify-center rounded-full bg-(--text-strong) px-5 text-sm font-medium text-(--background)! shadow-sm transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--ring) focus-visible:ring-offset-2 focus-visible:ring-offset-(--background)"
          >
            {actionLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}

export function BoardGrid({ sort, visibility }: BoardGridProps) {
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

  const visibleBoards = boards
    .filter((board) => (visibility === 'all' ? true : board.visibility === visibility))
    .filter((board) => (sort === 'favorite' ? board.isFavorite : true))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  if (!visibleBoards.length) {
    const visibilityLabel = visibility === 'shared' ? 'shared' : 'private';

    if (sort === 'favorite' && visibility !== 'all') {
      return (
        <EmptyGallery
          title={`No favorite ${visibilityLabel} boards yet.`}
          description={`You have no favorite ${visibilityLabel} boards. Adjust the filters or favorite a board to see it here.`}
          actionHref="/app"
          actionLabel="Clear filters"
        />
      );
    }

    if (sort === 'favorite') {
      return (
        <EmptyGallery
          title="No favorite boards yet."
          description="Favorite a board to keep it easy to return to while shaping the studio."
          actionHref="/app?sort=recent"
          actionLabel="Browse boards"
        />
      );
    }

    return (
      <EmptyGallery
        title={`No ${visibilityLabel} boards yet.`}
        description={`You don't have any ${visibilityLabel} boards. Change a board's visibility in the editor or adjust the filters.`}
        actionHref="/app"
        actionLabel="Clear filters"
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