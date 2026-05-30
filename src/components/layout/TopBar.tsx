'use client';

import { Search } from 'lucide-react';
import { openCommandPalette } from '@/components/shared/command-palette-store';

type TopBarProps = {
  title: string;
  description: string;
};

export function TopBar({ title, description }: TopBarProps) {
  return (
    <header className="border-b border-black/5 bg-[rgba(248,247,244,0.88)] backdrop-blur-xl">
      <div className="mx-auto w-full max-w-360 px-4 md:px-8">
        <div className="flex items-center justify-between gap-4 py-4">
          <div className="min-w-0">
            <p className="[font-family:var(--font-display),serif] text-2xl tracking-tight text-slate-900 md:text-[2rem]">
              {title}
            </p>
            <p className="text-sm text-slate-500">{description}</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={openCommandPalette}
              aria-label="Open command palette"
              aria-keyshortcuts="Control+K Meta+K"
              className="flex h-11 items-center gap-3 rounded-full border border-black/5 bg-white px-4 text-sm text-slate-500 shadow-sm transition hover:border-black/10 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
            >
              <Search className="h-4.5 w-4.5" />
              <span className="hidden sm:inline">Search</span>
              <span className="rounded-full border border-black/5 bg-[#f6f4ef] px-2.5 py-1 text-[11px] font-medium text-slate-500">
                ⌘K
              </span>
            </button>

            <div
              aria-hidden="true"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-black/5 bg-slate-900 text-[11px] font-medium text-white shadow-sm"
            >
              MB
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}