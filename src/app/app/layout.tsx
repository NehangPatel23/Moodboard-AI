import type { ReactNode } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { TopBar } from '@/components/layout/TopBar';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell
      topBar={<TopBar title="MoodBoard AI" description="Your saved creative direction boards." />}
    >
      {children}
    </AppShell>
  );
}