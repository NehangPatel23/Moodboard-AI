'use client';

import dynamic from 'next/dynamic';

const DashboardClient = dynamic(
  () => import('@/components/dashboard/DashboardClient').then((mod) => mod.DashboardClient),
  {
    ssr: false,
    loading: () => null,
  },
);

export function DashboardShell() {
  return <DashboardClient />;
}