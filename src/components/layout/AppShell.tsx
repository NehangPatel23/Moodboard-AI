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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.9),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(203,215,200,0.18),transparent_28%),linear-gradient(180deg,#f8f7f4_0%,#fbfaf8_100%)] text-slate-900">
      <BoardStoreBootstrap />
      <Sidebar />

      <div className="min-h-screen md:pl-72">
        {topBar ? <div className="sticky top-0 z-30">{topBar}</div> : null}

        <main className="mx-auto w-full max-w-360 px-4 pb-24 pt-6 md:px-8 md:pb-16 md:pt-10">
          {children}
        </main>
      </div>

      <MobileNav />
    </div>
  );
}