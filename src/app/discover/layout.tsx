import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { LandingHeader } from '@/components/landing/LandingHeader';
import {
  SITE_NAME,
  absoluteUrl,
  buildDefaultOpenGraph,
  buildDefaultTwitter,
} from '@/lib/site-metadata';

export const metadata: Metadata = {
  title: 'Discover',
  description: 'Browse public moodboards, explore moods, and remix shared creative direction.',
  openGraph: {
    ...buildDefaultOpenGraph(),
    title: `Discover | ${SITE_NAME}`,
    description: 'Browse public moodboards, explore moods, and remix shared creative direction.',
    url: absoluteUrl('/discover'),
  },
  twitter: {
    ...buildDefaultTwitter(),
    title: `Discover | ${SITE_NAME}`,
    description: 'Browse public moodboards, explore moods, and remix shared creative direction.',
  },
};

export default function DiscoverLayout({ children }: { children: ReactNode }) {
  return (
    <main className="landing-page mx-auto flex min-h-screen w-full max-w-7xl flex-col overflow-x-hidden bg-(--background) px-4 pb-20 pt-6 md:px-8 md:pt-10">
      <LandingHeader />
      <div className="mt-6 md:mt-8">{children}</div>
    </main>
  );
}
