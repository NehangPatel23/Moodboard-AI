import type { ReactNode } from 'react';
import { LandingHeader } from '@/components/landing/LandingHeader';

export default function ShareLayout({ children }: { children: ReactNode }) {
  return (
    <main className="landing-page mx-auto flex min-h-screen w-full max-w-7xl flex-col overflow-x-hidden bg-(--background) px-4 pb-20 pt-6 md:px-8 md:pt-10">
      <LandingHeader />
      {children}
    </main>
  );
}
