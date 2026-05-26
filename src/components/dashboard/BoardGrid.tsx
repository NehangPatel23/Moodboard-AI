'use client';

import { useSyncExternalStore } from 'react';
import { filterBoards, loadBoards, sortBoards, subscribeBoards } from '@/lib/board-store';
import { BoardCard } from './BoardCard';
import { EmptyState } from '@/components/shared/EmptyState';

type BoardGridProps = {
  query: string;
  sort: 'recent' | 'favorite';
};

export function BoardGrid({ query, sort }: BoardGridProps) {
  const boards = useSyncExternalStore(subscribeBoards, loadBoards, loadBoards);
  const filtered = filterBoards(boards, query);
  const visibleBoards = sort === 'favorite' ? sortBoards(filtered.filter((board) => board.isFavorite), 'favorite') : sortBoards(filtered, 'recent');

  if (!visibleBoards.length) {
    return (
      <EmptyState
        title="No boards yet"
        description="Create your first board from a prompt and it will appear here."
        actionLabel="Create a board"
        actionHref="/app/new"
      />
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