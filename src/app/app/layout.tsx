import type { ReactNode } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { TopBar } from '@/components/layout/TopBar';
import { AuthGuard } from '@/components/auth/AuthGuard';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell topBar={<TopBar />}>
      <AuthGuard>{children}</AuthGuard>
    </AppShell>
  );
}