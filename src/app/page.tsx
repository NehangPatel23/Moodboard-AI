import { CTASection } from '@/components/landing/CTASection';
import { ExampleBoardPreview } from '@/components/landing/ExampleBoardPreview';
import { FeatureGrid } from '@/components/landing/FeatureGrid';
import { Hero } from '@/components/landing/Hero';
import { LandingHeader } from '@/components/landing/LandingHeader';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col overflow-x-hidden bg-(--background) px-4 pb-16 pt-6 md:px-8 md:pt-10">
      <LandingHeader />
      <Hero />
      <FeatureGrid />
      <ExampleBoardPreview />
      <CTASection />
    </main>
  );
}