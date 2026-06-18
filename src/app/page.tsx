import { CTASection } from '@/components/landing/CTASection';
import { ExampleBoardPreview } from '@/components/landing/ExampleBoardPreview';
import { FeatureGrid } from '@/components/landing/FeatureGrid';
import { Hero } from '@/components/landing/Hero';
import { LandingHeader } from '@/components/landing/LandingHeader';

export default function HomePage() {
  return (
    <main className="landing-page mx-auto flex min-h-screen w-full max-w-7xl flex-col overflow-x-hidden bg-(--background) px-4 pb-20 pt-6 md:px-8 md:pt-10">
      <LandingHeader />
      <div className="mt-6 flex flex-col gap-16 md:mt-8 md:gap-20">
        <Hero />
        <div className="rounded-[2.5rem] border border-(--border) bg-(--surface-subtle) px-4 py-10 md:px-8 md:py-12">
          <div className="flex flex-col gap-16 md:gap-20">
            <FeatureGrid />
            <ExampleBoardPreview />
          </div>
        </div>
        <CTASection />
      </div>
    </main>
  );
}