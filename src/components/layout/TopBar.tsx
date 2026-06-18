'use client';

import { GuardedLink } from '@/components/shared/GuardedLink';
import { Search } from 'lucide-react';
import { openCommandPalette } from '@/components/shared/command-palette-store';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { AccountMenu } from '@/components/layout/AccountMenu';
import { AppIcon } from '@/components/shared/AppIcon';
import { Tooltip } from '@/components/ui/tooltip';
import { useMinSm } from '@/lib/use-media-query';

export function TopBar() {
  const searchLabelVisible = useMinSm();

  const searchButton = (
    <button
      type="button"
      onClick={openCommandPalette}
      aria-label="Open command palette"
      aria-keyshortcuts="Control+K Meta+K"
      className="flex h-11 items-center gap-3 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 text-sm text-[var(--text-muted)] shadow-sm transition hover:text-[var(--text-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
    >
      <Search className="h-4.5 w-4.5" />
      <span className="hidden sm:inline">Search</span>
      <span className="rounded-full border border-[var(--border)] bg-[var(--surface-subtle)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-muted)]">
        ⌘K
      </span>
    </button>
  );

  return (
    <header className="border-b border-[var(--border)] bg-[var(--surface-elevated)] backdrop-blur-xl">
      <div className="mx-auto w-full max-w-360 px-4 md:px-8">
        <div className="flex items-center justify-between gap-4 py-4">
          <GuardedLink
            href="/"
            aria-label="MoodBoard AI home"
            className="flex min-w-0 items-center gap-3 rounded-2xl transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-1 shadow-sm sm:h-14 sm:w-14 sm:p-1.5">
              <AppIcon className="h-full w-full" />
            </span>
            <div className="min-w-0">
              <p className="[font-family:var(--font-display),serif] truncate text-2xl tracking-tight text-[var(--text-strong)] md:text-[2rem]">
                MoodBoard AI
              </p>
              <p className="truncate text-sm text-[var(--text-muted)]">Creative direction workspace</p>
            </div>
          </GuardedLink>

          <div className="flex items-center gap-3">
            {searchLabelVisible ? (
              searchButton
            ) : (
              <Tooltip content="Search boards and commands (⌘K)" side="bottom">
                {searchButton}
              </Tooltip>
            )}

            <ThemeToggle />

            <AccountMenu />
          </div>
        </div>
      </div>
    </header>
  );
}