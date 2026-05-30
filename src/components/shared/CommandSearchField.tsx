'use client';

import type { ChangeEvent, KeyboardEvent, ReactNode } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { openCommandPalette } from './command-palette-store';

type CommandSearchFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
  inputClassName?: string;
  autoFocus?: boolean;
  icon?: ReactNode;
};

export function CommandSearchField({
  label,
  value,
  onChange,
  placeholder,
  className,
  inputClassName,
  autoFocus = false,
  icon,
}: CommandSearchFieldProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const key = event.key.toLowerCase();
    if ((event.metaKey || event.ctrlKey) && key === 'k') {
      event.preventDefault();
      openCommandPalette();
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      <label className="block text-xs font-medium uppercase tracking-[0.24em] text-slate-400">
        {label}
      </label>

      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            {icon ?? <Search className="h-5 w-5" />}
          </span>

          <Input
            value={value}
            onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            aria-label={label}
            aria-keyshortcuts="Control+K Meta+K"
            autoFocus={autoFocus}
            className={cn('h-14 rounded-full pl-12 pr-20 text-base shadow-sm', inputClassName)}
          />

          <button
            type="button"
            onClick={openCommandPalette}
            aria-label={`Open command palette for ${label.toLowerCase()}`}
            aria-keyshortcuts="Control+K Meta+K"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-500 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
          >
            <span className="sr-only">Open command palette</span>
            <span aria-hidden="true">⌘K</span>
          </button>
        </div>
      </div>
    </div>
  );
}