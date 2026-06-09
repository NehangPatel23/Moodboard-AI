'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Eye, Globe, ListFilter, Lock, PencilLine, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export type BoardSort = 'recent' | 'favorite';
export type VisibilityFilter = 'all' | 'shared' | 'private' | 'collaborating' | 'with-others';
export type AccessFilter = 'all' | 'edit' | 'view';

type BoardFilterBarProps = {
  sort: BoardSort;
  onSortChange: (value: BoardSort) => void;
  visibility: VisibilityFilter;
  onVisibilityChange: (value: VisibilityFilter) => void;
  access: AccessFilter;
  onAccessChange: (value: AccessFilter) => void;
};

function FilterPill({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
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
          ? 'h-10 rounded-full bg-(--text-strong) px-5 text-sm font-medium text-(--background)! shadow-[0_10px_25px_rgba(15,23,42,0.14)] transition hover:opacity-90'
          : 'h-10 rounded-full border border-(--border) bg-(--surface) px-5 text-sm font-medium text-(--text-muted) shadow-sm transition hover:bg-(--surface-subtle) hover:text-(--text-strong)'
      }
    >
      {label}
    </Button>
  );
}

function getFilterSummary(visibility: VisibilityFilter, access: AccessFilter): string {
  if (visibility === 'all' && access === 'all') {
    return 'Filter';
  }

  const visibilityLabel =
    visibility === 'collaborating'
      ? 'With me'
      : visibility === 'with-others'
        ? 'With others'
      : visibility === 'shared'
        ? 'Public'
        : visibility === 'private'
          ? 'Private'
          : 'All boards';

  if (access === 'edit' && visibility === 'collaborating') return `${visibilityLabel} · Edit`;
  if (access === 'view' && visibility === 'collaborating') return `${visibilityLabel} · View`;
  return visibilityLabel;
}

function FilterOption({
  active,
  onClick,
  label,
  description,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-start gap-3 rounded-2xl px-3 py-2.5 text-left transition',
        active
          ? 'bg-(--text-strong) text-(--background)!'
          : 'text-(--text-strong) hover:bg-(--surface-subtle)',
      )}
    >
      {icon ? (
        <span className={cn('mt-0.5 shrink-0', active ? 'text-(--background)!' : 'text-(--text-muted)')}>
          {icon}
        </span>
      ) : null}
      <span className="min-w-0">
        <span className="block text-sm font-medium">{label}</span>
        {description ? (
          <span className={cn('mt-0.5 block text-xs', active ? 'text-(--background)!/80' : 'text-(--text-muted)')}>
            {description}
          </span>
        ) : null}
      </span>
    </button>
  );
}

function BoardFilterMenu({
  visibility,
  onVisibilityChange,
  access,
  onAccessChange,
}: {
  visibility: VisibilityFilter;
  onVisibilityChange: (value: VisibilityFilter) => void;
  access: AccessFilter;
  onAccessChange: (value: AccessFilter) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const hasActiveFilters = visibility !== 'all';
  const showAccessOptions = visibility === 'collaborating';

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  function handleVisibilityChange(value: VisibilityFilter) {
    onVisibilityChange(value);
  }

  function handleReset() {
    onVisibilityChange('all');
    onAccessChange('all');
    setOpen(false);
  }

  return (
    <div className="relative" ref={containerRef}>
      <Button
        type="button"
        variant="ghost"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          'h-10 gap-2 rounded-full px-4 text-sm font-medium shadow-sm transition',
          hasActiveFilters
            ? 'bg-(--text-strong) text-(--background)! hover:opacity-90'
            : 'border border-(--border) bg-(--surface) text-(--text-muted) hover:bg-(--surface-subtle) hover:text-(--text-strong)',
        )}
      >
        <ListFilter className="h-4 w-4" />
        <span className="max-w-[10rem] truncate">{getFilterSummary(visibility, access)}</span>
        <ChevronDown className={cn('h-4 w-4 transition', open ? 'rotate-180' : '')} />
      </Button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute left-0 top-[calc(100%+0.5rem)] z-50 w-[min(100vw-2rem,18rem)] rounded-[1.75rem] border border-(--border) bg-(--surface) p-3 shadow-[0_24px_60px_rgba(15,23,42,0.14)]"
        >
          <p className="px-3 pb-1 text-[10px] font-medium uppercase tracking-[0.28em] text-(--text-muted)">
            Show
          </p>
          <div className="space-y-1">
            <FilterOption
              active={visibility === 'all'}
              onClick={() => handleVisibilityChange('all')}
              label="All boards"
              description="Everything you own or collaborate on"
            />
            <FilterOption
              active={visibility === 'collaborating'}
              onClick={() => handleVisibilityChange('collaborating')}
              label="With me"
              description="Boards shared with you"
              icon={<Users className="h-4 w-4" />}
            />
            <FilterOption
              active={visibility === 'with-others'}
              onClick={() => handleVisibilityChange('with-others')}
              label="With others"
              description="Boards you've shared with collaborators"
              icon={<Users className="h-4 w-4" />}
            />
            <FilterOption
              active={visibility === 'shared'}
              onClick={() => handleVisibilityChange('shared')}
              label="Public"
              description="Your boards listed on Discover"
              icon={<Globe className="h-4 w-4" />}
            />
            <FilterOption
              active={visibility === 'private'}
              onClick={() => handleVisibilityChange('private')}
              label="Private"
              description="Not listed on Discover"
              icon={<Lock className="h-4 w-4" />}
            />
          </div>

          {showAccessOptions ? (
            <>
              <div className="my-3 h-px bg-(--border)" />
              <p className="px-3 pb-1 text-[10px] font-medium uppercase tracking-[0.28em] text-(--text-muted)">
                Access
              </p>
              <div className="space-y-1">
                <FilterOption
                  active={access === 'all'}
                  onClick={() => onAccessChange('all')}
                  label="Any access"
                />
                <FilterOption
                  active={access === 'edit'}
                  onClick={() => onAccessChange('edit')}
                  label="Can edit"
                  description="Boards you can change"
                  icon={<PencilLine className="h-4 w-4" />}
                />
                <FilterOption
                  active={access === 'view'}
                  onClick={() => onAccessChange('view')}
                  label="View only"
                  description="Boards you can view but not edit"
                  icon={<Eye className="h-4 w-4" />}
                />
              </div>
            </>
          ) : null}

          {hasActiveFilters ? (
            <div className="mt-3 border-t border-(--border) pt-3">
              <button
                type="button"
                onClick={handleReset}
                className="w-full rounded-2xl px-3 py-2 text-sm font-medium text-(--text-muted) transition hover:bg-(--surface-subtle) hover:text-(--text-strong)"
              >
                Reset filters
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function BoardFilterBar({
  sort,
  onSortChange,
  visibility,
  onVisibilityChange,
  access,
  onAccessChange,
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

          <BoardFilterMenu
            visibility={visibility}
            onVisibilityChange={onVisibilityChange}
            access={access}
            onAccessChange={onAccessChange}
          />
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
