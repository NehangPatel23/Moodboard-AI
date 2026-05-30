'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

type BoardFilterBarProps = {
  sort: 'recent' | 'favorite';
  onSortChange: (value: 'recent' | 'favorite') => void;
};

export function BoardFilterBar({
  sort,
  onSortChange,
}: BoardFilterBarProps) {
  const recentActive = sort === 'recent';
  const favoritesActive = sort === 'favorite';

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-4"
      aria-label="Board filters"
    >
      <div className="flex flex-wrap gap-2">
        <Button
          variant={recentActive ? 'default' : 'outline'}
          type="button"
          onClick={() => onSortChange('recent')}
          aria-pressed={recentActive}
        >
          Recent
        </Button>

        <Button
          variant={favoritesActive ? 'default' : 'outline'}
          type="button"
          onClick={() => onSortChange('favorite')}
          aria-pressed={favoritesActive}
        >
          Favorites
        </Button>
      </div>

      <Link
        href="/app/new"
        className="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 bg-slate-100 px-4 text-sm font-medium text-slate-900 shadow-sm transition hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
      >
        New Board
      </Link>
    </div>
  );
}