'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { Globe, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type BoardSort = 'recent' | 'favorite';
export type VisibilityFilter = 'all' | 'shared' | 'private';

type BoardFilterBarProps = {
  sort: BoardSort;
  onSortChange: (value: BoardSort) => void;
  visibility: VisibilityFilter;
  onVisibilityChange: (value: VisibilityFilter) => void;
};

function FilterPill({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon?: ReactNode;
}) {
  return (
    <Button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-current={active ? 'page' : undefined}
      variant="ghost"
      className={
        active
          ? 'h-10 gap-1.5 rounded-full bg-(--text-strong) px-5 text-sm font-medium text-(--background)! shadow-[0_10px_25px_rgba(15,23,42,0.14)] transition hover:opacity-90'
          : 'h-10 gap-1.5 rounded-full border border-(--border) bg-(--surface) px-5 text-sm font-medium text-(--text-muted) shadow-sm transition hover:bg-(--surface-subtle) hover:text-(--text-strong)'
      }
    >
      {icon}
      {label}
    </Button>
  );
}

export function BoardFilterBar({
  sort,
  onSortChange,
  visibility,
  onVisibilityChange,
}: BoardFilterBarProps) {
  return (
    <section className="border-b border-(--border) pb-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Sort boards">
            <FilterPill
              active={sort === 'recent'}
              onClick={() => onSortChange('recent')}
              label="Recent"
            />
            <FilterPill
              active={sort === 'favorite'}
              onClick={() => onSortChange('favorite')}
              label="Favorites"
            />
          </div>

          <span className="hidden h-6 w-px bg-(--border) md:block" aria-hidden="true" />

          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by visibility">
            <FilterPill
              active={visibility === 'all'}
              onClick={() => onVisibilityChange('all')}
              label="All"
            />
            <FilterPill
              active={visibility === 'shared'}
              onClick={() => onVisibilityChange('shared')}
              label="Shared"
              icon={<Globe className="h-4 w-4" />}
            />
            <FilterPill
              active={visibility === 'private'}
              onClick={() => onVisibilityChange('private')}
              label="Private"
              icon={<Lock className="h-4 w-4" />}
            />
          </div>
        </div>

        <Link
          href="/app/new"
          className="inline-flex h-11 items-center justify-center rounded-full bg-(--accent) px-5 text-sm font-medium text-(--text-strong) shadow-[0_12px_30px_rgba(203,215,200,0.25)] transition hover:bg-(--accent-strong) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--ring) focus-visible:ring-offset-2 focus-visible:ring-offset-(--background)"
        >
          New Board
        </Link>
      </div>
    </section>
  );
}
