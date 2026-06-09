'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useGatedHref } from '@/components/auth/use-gated-href';

const primaryButtonClass =
  'group inline-flex h-11 items-center justify-center gap-2 rounded-full border border-transparent bg-[var(--text-strong)]! px-5 text-sm font-medium text-[var(--background)]! shadow-[0_12px_30px_rgba(15,23,42,0.14)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] dark:border-white/10 dark:bg-white! dark:text-slate-950!';

const outlineButtonClass =
  'inline-flex h-11 items-center justify-center gap-2 rounded-full border border-(--border) bg-(--surface-elevated) px-5 text-sm font-medium text-(--text-strong) shadow-sm transition hover:bg-(--surface-subtle) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--ring) focus-visible:ring-offset-2 focus-visible:ring-offset-(--background)';

export function AboutHeroActions() {
  const startBoardHref = useGatedHref('/app/new');

  return (
    <div className="flex flex-wrap gap-3 pt-2">
      <Link href={startBoardHref} className={primaryButtonClass}>
        <Sparkles className="h-4 w-4" aria-hidden="true" />
        Try the app
        <ArrowRight
          className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </Link>
      <Link href="/discover" className={outlineButtonClass}>
        Browse Discover
      </Link>
    </div>
  );
}

export function AboutFooterActions() {
  const startBoardHref = useGatedHref('/app/new');

  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
      <Link href={startBoardHref} className={primaryButtonClass}>
        Start a board
        <ArrowRight
          className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </Link>
      <Link href="/discover" className={outlineButtonClass}>
        View Discover
      </Link>
    </div>
  );
}
