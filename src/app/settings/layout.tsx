import type { ReactNode } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { TopBar } from '@/components/layout/TopBar';
import { AuthGuard } from '@/components/auth/AuthGuard';

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell topBar={<TopBar />}>
      <AuthGuard>{children}</AuthGuard>
    </AppShell>
  );
}