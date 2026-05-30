'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

type BoardFilterBarProps = {
  sort: 'recent' | 'favorite';
  onSortChange: (value: 'recent' | 'favorite') => void;
};

export function BoardFilterBar({ sort, onSortChange }: BoardFilterBarProps) {
  const recentActive = sort === 'recent';
  const favoritesActive = sort === 'favorite';

  return (
    <section className="border-b border-black/10 pb-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={() => onSortChange('recent')}
            aria-pressed={recentActive}
            aria-current={recentActive ? 'page' : undefined}
            className={
              recentActive
                ? 'h-10 rounded-full bg-slate-900 px-5 text-sm font-medium text-white shadow-[0_10px_25px_rgba(15,23,42,0.14)] transition hover:bg-slate-800'
                : 'h-10 rounded-full border border-black/10 bg-white px-5 text-sm font-medium text-slate-500 shadow-sm transition hover:border-black/15 hover:text-slate-900'
            }
            variant="ghost"
          >
            Recent
          </Button>

          <Button
            type="button"
            onClick={() => onSortChange('favorite')}
            aria-pressed={favoritesActive}
            aria-current={favoritesActive ? 'page' : undefined}
            className={
              favoritesActive
                ? 'h-10 rounded-full bg-slate-900 px-5 text-sm font-medium text-white shadow-[0_10px_25px_rgba(15,23,42,0.14)] transition hover:bg-slate-800'
                : 'h-10 rounded-full border border-black/10 bg-white px-5 text-sm font-medium text-slate-500 shadow-sm transition hover:border-black/15 hover:text-slate-900'
            }
            variant="ghost"
          >
            Favorites
          </Button>
        </div>

        <Link
          href="/app/new"
          className="inline-flex h-11 items-center justify-center rounded-full bg-[#cbd7c8] px-5 text-sm font-medium text-slate-950 shadow-[0_12px_30px_rgba(203,215,200,0.35)] transition hover:bg-[#bccab4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
        >
          New Board
        </Link>
      </div>
    </section>
  );
}