'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { appSectionLabelClass } from '@/components/shared/app-surface-styles';
import { cn } from '@/lib/utils';
import { formatDiscoverMoodLabel } from '@/lib/discover-moods';

const triggerFocusClass =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--ring) focus-visible:ring-offset-2 focus-visible:ring-offset-(--background)';

const menuScrollClass =
  'max-h-64 overflow-y-auto p-1.5 [scrollbar-color:color-mix(in_srgb,var(--border)_70%,transparent)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-(--border) [&::-webkit-scrollbar-track]:bg-transparent';

type DiscoverMoodFiltersProps = {
  moods: string[];
  selectedMood: string | null;
  onSelectMood: (mood: string | null) => void;
};

export function DiscoverMoodFilters({
  moods,
  selectedMood,
  onSelectMood,
}: DiscoverMoodFiltersProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const handleSelect = (mood: string | null) => {
    onSelectMood(mood);
    setOpen(false);
  };

  const triggerValue = selectedMood
    ? formatDiscoverMoodLabel(selectedMood, 28)
    : 'All moods';

  return (
    <div ref={containerRef} className="relative w-full sm:w-auto">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        title={selectedMood ?? 'All moods'}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          'inline-flex h-12 w-full min-w-[12rem] items-center gap-3 rounded-full border px-4 text-left transition sm:w-auto',
          triggerFocusClass,
          open
            ? 'border-(--text-muted)/30 bg-(--surface-subtle) shadow-[0_8px_24px_rgba(15,23,42,0.06)]'
            : selectedMood
              ? 'border-(--text-strong)/25 bg-(--surface-elevated) shadow-[0_8px_24px_rgba(15,23,42,0.05)]'
              : 'border-(--border) bg-(--surface-elevated) shadow-[0_8px_24px_rgba(15,23,42,0.04)] hover:border-(--text-muted)/25 hover:bg-(--surface-subtle)',
        )}
      >
        <span className="min-w-0 flex-1 leading-tight">
          <span className={appSectionLabelClass}>Mood</span>
          <span
            className={cn(
              'mt-0.5 block truncate text-sm font-medium capitalize',
              selectedMood ? 'text-(--text-strong)' : 'text-(--text-muted)',
            )}
          >
            {triggerValue}
          </span>
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-(--text-muted) transition-transform duration-200',
            open ? 'rotate-180' : '',
          )}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Filter boards by mood"
          className="absolute right-0 z-50 mt-2 w-[min(calc(100vw-2rem),22rem)] overflow-hidden rounded-[1.35rem] border border-(--border) bg-(--surface-elevated) shadow-[var(--shadow-elevated)]"
        >
          <div className="border-b border-(--border)/80 bg-(--surface-soft)/40 px-4 py-3">
            <p className={appSectionLabelClass}>Filter by mood</p>
            <p className="mt-1 text-xs text-(--text-muted)">
              {moods.length} {moods.length === 1 ? 'direction' : 'directions'} to explore
            </p>
          </div>

          <div className={menuScrollClass}>
            <MoodOption
              label="All moods"
              selected={selectedMood === null}
              onSelect={() => handleSelect(null)}
            />
            {moods.map((mood) => (
              <MoodOption
                key={mood}
                label={mood}
                selected={selectedMood === mood}
                onSelect={() => handleSelect(mood)}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MoodOption({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const isAllMoods = label === 'All moods';

  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onSelect}
      className={cn(
        'flex w-full items-start justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--ring) focus-visible:ring-offset-1 focus-visible:ring-offset-(--surface-elevated)',
        selected
          ? 'bg-(--surface-subtle) text-(--text-strong)'
          : 'text-(--text) hover:bg-(--surface-subtle)/70',
      )}
    >
      <span
        className={cn(
          'min-w-0 text-sm leading-snug',
          isAllMoods ? 'font-medium' : 'font-medium capitalize',
          selected ? 'text-(--text-strong)' : 'text-(--text)',
        )}
      >
        {label}
      </span>
      {selected ? (
        <Check className="mt-0.5 h-4 w-4 shrink-0 text-(--text-strong)" aria-hidden="true" />
      ) : (
        <span className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" />
      )}
    </button>
  );
}
