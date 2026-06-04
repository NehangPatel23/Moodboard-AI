import type { ReactNode } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { TopBar } from '@/components/layout/TopBar';

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell topBar={<TopBar />}>
      {children}
    </AppShell>
  );
}