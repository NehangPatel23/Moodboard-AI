import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { BoardStoreBootstrap } from './BoardStoreBootstrap';

type AppShellProps = {
  children: ReactNode;
  topBar?: ReactNode;
};

export function AppShell({ children, topBar }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.08),transparent_30%),linear-gradient(180deg,#fafafa_0%,#ffffff_100%)]">
      <BoardStoreBootstrap />
      <Sidebar />
      <div className="min-h-screen md:pl-72">
        {topBar ? <div className="sticky top-0 z-30">{topBar}</div> : null}
        <main className="px-4 pb-24 pt-6 md:px-8 md:pb-10 md:pt-8">{children}</main>
      </div>
      <MobileNav />
    </div>
  );
}