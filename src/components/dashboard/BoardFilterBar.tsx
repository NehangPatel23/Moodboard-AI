'use client';

import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type BoardFilterBarProps = {
  query: string;
  sort: 'recent' | 'favorite';
  onQueryChange: (value: string) => void;
  onSortChange: (value: 'recent' | 'favorite') => void;
};

export function BoardFilterBar({ query, sort, onQueryChange, onSortChange }: BoardFilterBarProps) {
  const recentActive = sort === 'recent';
  const favoritesActive = sort === 'favorite';

  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm md:flex-row md:items-center md:justify-between">
      <div className="w-full md:max-w-md">
        <label className="mb-2 block text-xs font-medium uppercase tracking-[0.24em] text-slate-400">
          Search boards
        </label>
        <Input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search boards, tags, or prompts"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={recentActive ? 'default' : 'outline'}
          type="button"
          onClick={() => onSortChange('recent')}
        >
          Recent
        </Button>

        <Button
          variant={favoritesActive ? 'default' : 'outline'}
          type="button"
          onClick={() => onSortChange('favorite')}
        >
          Favorites
        </Button>

        <Link
          href="/app/new"
          className="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 bg-slate-100 px-4 text-sm font-medium text-slate-900 shadow-sm transition hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
        >
          New Board
        </Link>
      </div>
    </div>
  );
}