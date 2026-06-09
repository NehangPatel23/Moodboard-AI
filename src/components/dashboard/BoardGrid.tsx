'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { loadBoards, subscribeBoards } from '@/lib/board-store';
import { BoardCard } from './BoardCard';
import type { BoardSort, VisibilityFilter, AccessFilter } from './BoardFilterBar';

type BoardGridProps = {
  sort: BoardSort;
  visibility: VisibilityFilter;
  access: AccessFilter;
};

function boardHasEditAccess(board: { role?: string }): boolean {
  return !board.role || board.role === 'owner' || board.role === 'editor';
}

function boardHasViewAccess(board: { role?: string }): boolean {
  return board.role === 'viewer';
}

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

export function BoardGrid({ sort, visibility, access }: BoardGridProps) {
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
    .filter((board) => {
      if (visibility === 'all') return true;
      if (visibility === 'collaborating') {
        return board.role === 'editor' || board.role === 'viewer';
      }
      if (visibility === 'with-others') {
        return (!board.role || board.role === 'owner') && board.hasCollaborators === true;
      }
      if (visibility === 'shared' || visibility === 'private') {
        return (!board.role || board.role === 'owner') && board.visibility === visibility;
      }
      return true;
    })
    .filter((board) => {
      if (access === 'all') return true;
      if (access === 'edit') return boardHasEditAccess(board);
      if (access === 'view') return boardHasViewAccess(board);
      return true;
    })
    .filter((board) => (sort === 'favorite' ? board.isFavorite : true))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  if (!visibleBoards.length) {
    const visibilityLabel =
      visibility === 'shared'
        ? 'public'
        : visibility === 'with-others'
          ? 'shared with others'
          : visibility === 'private'
            ? 'private'
            : visibility;

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

    if (visibility === 'with-others') {
      return (
        <EmptyGallery
          title="No boards shared with others yet."
          description="Invite collaborators from a board's Collaborate menu. Boards with members or pending invites will appear here."
          actionHref="/app"
          actionLabel="Clear filters"
        />
      );
    }

    if (visibility === 'collaborating') {
      return (
        <EmptyGallery
          title="No shared boards yet."
          description="When someone invites you to a board, it will appear here."
          actionHref="/discover"
          actionLabel="Browse public boards"
        />
      );
    }

    if (access === 'edit') {
      return (
        <EmptyGallery
          title="No editable boards here."
          description="Boards you own or can edit will appear when this filter is active."
          actionHref="/app"
          actionLabel="Clear filters"
        />
      );
    }

    if (access === 'view') {
      return (
        <EmptyGallery
          title="No view-only boards here."
          description="Boards shared with you as a viewer will appear when this filter is active."
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