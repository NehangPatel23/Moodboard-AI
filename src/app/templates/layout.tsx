import type { ReactNode } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { TopBar } from '@/components/layout/TopBar';

export default function TemplatesLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell topBar={<TopBar />}>
      {children}
    </AppShell>
  );
}