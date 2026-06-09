'use client';

import { useSyncExternalStore } from 'react';
import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip } from '@/components/ui/tooltip';
import {
  getThemeSnapshot,
  subscribeAppSettings,
  updateAppSettings,
  type ThemeSnapshot,
} from '@/lib/settings-store';

const SERVER_SNAPSHOT: ThemeSnapshot = { mode: 'system', resolvedTheme: 'light' };

function getServerSnapshot(): ThemeSnapshot {
  return SERVER_SNAPSHOT;
}

/**
 * Standalone light/dark toggle that writes directly to the shared settings
 * store. Theme is written to a cookie + local cache and applied app-wide by
 * `ThemeSync`, so toggling on the landing page stays in sync with the app.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme } = useSyncExternalStore(
    subscribeAppSettings,
    getThemeSnapshot,
    getServerSnapshot,
  );

  const isDark = resolvedTheme === 'dark';
  const nextLabel = isDark ? 'Switch to light mode' : 'Switch to dark mode';

  function handleToggle() {
    updateAppSettings({ themeMode: isDark ? 'light' : 'dark' });
  }

  return (
    <Tooltip content={nextLabel} side="bottom">
      <button
        type="button"
        onClick={handleToggle}
        aria-label={nextLabel}
        className={cn(
          'inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-muted)] shadow-sm transition hover:text-[var(--text-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]',
          className,
        )}
      >
        {isDark ? (
          <Sun className="h-4.5 w-4.5" aria-hidden="true" />
        ) : (
          <Moon className="h-4.5 w-4.5" aria-hidden="true" />
        )}
      </button>
    </Tooltip>
  );
}
