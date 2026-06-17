import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { LandingHeader } from '@/components/landing/LandingHeader';

export const metadata: Metadata = {
  title: 'Help · MoodBoard AI',
  description: 'Getting started, collaboration, export, and settings guides for MoodBoard AI.',
};

export default function HelpLayout({ children }: { children: ReactNode }) {
  return (
    <main className="landing-page mx-auto flex min-h-screen w-full max-w-7xl flex-col overflow-x-hidden bg-(--background) px-4 pb-20 pt-6 md:px-8 md:pt-10">
      <LandingHeader />
      <div className="mt-6 md:mt-8">{children}</div>
    </main>
  );
}
