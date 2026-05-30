'use client';

import Link from 'next/link';
import { Search } from 'lucide-react';
import { openCommandPalette } from '@/components/shared/command-palette-store';

type TopBarProps = {
  title: string;
  description: string;
};

export function TopBar({ title, description }: TopBarProps) {
  return (
    <header className="bg-slate-50">
      <div className="mx-auto w-full max-w-7xl px-4 pt-6 md:px-8 md:pt-8">
        <section className="relative overflow-hidden rounded-[2.5rem] border border-slate-200/80 bg-white/90 px-5 py-5 shadow-[0_24px_60px_rgba(15,23,42,0.06)] md:px-8 md:py-6">
          <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-slate-200 to-transparent" />
          <div className="absolute -right-24 top-0 h-48 w-48 rounded-full bg-slate-950/5 blur-3xl" />
          <div className="absolute -left-20 bottom-0 h-40 w-40 rounded-full bg-sky-100/60 blur-3xl" />

          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-3xl space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
                {title}
              </h1>
              <p className="text-base leading-7 text-slate-500">{description}</p>
            </div>

            <Link
              href="/app/new"
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-medium text-white! shadow-sm transition hover:bg-[#020617] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
            >
              New Board
            </Link>
          </div>

          <button
            type="button"
            onClick={openCommandPalette}
            aria-label="Open command palette"
            aria-keyshortcuts="Control+K Meta+K"
            className="group relative mt-5 flex h-14 w-full max-w-3xl items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 text-left shadow-sm transition hover:border-slate-300 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
          >
            <Search className="h-5 w-5 shrink-0 text-slate-400 transition group-hover:text-slate-500" />
            <span className="min-w-0 flex-1 truncate text-base text-slate-400 transition group-hover:text-slate-500">
              Search boards, actions, templates, or settings
            </span>
            <span className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-500 shadow-sm">
              ⌘K
            </span>
          </button>
        </section>
      </div>
    </header>
  );
}