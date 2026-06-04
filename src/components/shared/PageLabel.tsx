'use client';

import { useSyncExternalStore } from 'react';
import {
  getServerSidebarCollapsed,
  readSidebarCollapsed,
  subscribeSidebar,
} from '@/components/layout/sidebar-store';
import { cn } from '@/lib/utils';

type PageLabelProps = {
  label: string;
  className?: string;
};

/**
 * Editorial vertical page label that runs down the left edge of a page hero.
 * Reads bottom-to-top via vertical writing mode and spans the full height of
 * the hero container. Only shown while the sidebar is collapsed.
 */
export function PageLabel({ label, className }: PageLabelProps) {
  const collapsed = useSyncExternalStore(
    subscribeSidebar,
    readSidebarCollapsed,
    getServerSidebarCollapsed,
  );

  if (!collapsed) return null;

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center self-stretch border-r border-(--border) pr-4 md:pr-6',
        className,
      )}
    >
      <span className="[writing-mode:vertical-rl] rotate-180 select-none text-[11px] font-medium uppercase tracking-[0.32em] text-(--text-muted)">
        {label}
      </span>
    </div>
  );
}
