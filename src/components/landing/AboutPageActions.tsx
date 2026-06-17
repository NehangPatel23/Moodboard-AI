'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useGatedHref } from '@/components/auth/use-gated-href';
import { appOutlineButtonClass, appPrimaryButtonClass } from '@/components/shared/app-surface-styles';

export function AboutHeroActions() {
  const startBoardHref = useGatedHref('/app/new');

  return (
    <div className="flex flex-wrap gap-3 pt-2">
      <Link href={startBoardHref} className={appPrimaryButtonClass}>
        <Sparkles className="h-4 w-4" aria-hidden="true" />
        Try the app
        <ArrowRight
          className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </Link>
      <Link href="/discover" className={appOutlineButtonClass}>
        Browse Discover
      </Link>
    </div>
  );
}

export function AboutFooterActions() {
  const startBoardHref = useGatedHref('/app/new');

  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
      <Link href={startBoardHref} className={appPrimaryButtonClass}>
        Start a board
        <ArrowRight
          className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </Link>
      <Link href="/discover" className={appOutlineButtonClass}>
        View Discover
      </Link>
    </div>
  );
}
