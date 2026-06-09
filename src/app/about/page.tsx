import type { Metadata } from 'next';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { ProjectOverview } from '@/components/landing/ProjectOverview';

export const metadata: Metadata = {
  title: 'About · MoodBoard AI',
  description:
    'About MoodBoard AI — a portfolio product exploring AI-assisted creative direction, collaboration, and export.',
};

export default function AboutPage() {
  return (
    <main className="landing-page mx-auto flex min-h-screen w-full max-w-7xl flex-col overflow-x-hidden bg-(--background) px-4 pb-20 pt-6 md:px-8 md:pt-10">
      <LandingHeader />
      <div className="mt-6 md:mt-8">
        <ProjectOverview />
      </div>
    </main>
  );
}
