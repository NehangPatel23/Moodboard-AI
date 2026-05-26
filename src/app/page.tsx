import { Hero } from '@/components/landing/Hero';
import { FeatureGrid } from '@/components/landing/FeatureGrid';
import { ExampleBoardPreview } from '@/components/landing/ExampleBoardPreview';
import { CTASection } from '@/components/landing/CTASection';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-16 pt-6 md:px-8 md:pt-10">
      <Hero />
      <FeatureGrid />
      <ExampleBoardPreview />
      <CTASection />
    </main>
  );
}