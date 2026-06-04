'use client';

import type { ReactNode } from 'react';
import { useSyncExternalStore } from 'react';
import { cn } from '@/lib/utils';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { BoardStoreBootstrap } from './BoardStoreBootstrap';
import {
  getServerSidebarCollapsed,
  readSidebarCollapsed,
  subscribeSidebar,
} from './sidebar-store';

type AppShellProps = {
  children: ReactNode;
  topBar?: ReactNode;
};

export function AppShell({ children, topBar }: AppShellProps) {
  const collapsed = useSyncExternalStore(
    subscribeSidebar,
    readSidebarCollapsed,
    getServerSidebarCollapsed,
  );

  return (
    <div
      className="min-h-screen bg-[var(--background)] text-[var(--text)]"
    >
      <BoardStoreBootstrap />
      <Sidebar />

      <div className={cn('min-h-screen transition-[padding] duration-200', collapsed ? 'md:pl-20' : 'md:pl-72')}>
        {topBar ? <div className="sticky top-0 z-30">{topBar}</div> : null}

        <main className="mx-auto w-full max-w-360 px-4 pb-24 pt-6 md:px-8 md:pb-16 md:pt-10">
          {children}
        </main>
      </div>

      <MobileNav />
    </div>
  );
}