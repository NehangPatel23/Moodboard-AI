import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { AppIcon } from '@/components/shared/AppIcon';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { ProjectOverview } from '@/components/landing/ProjectOverview';

export const metadata: Metadata = {
  title: 'About · MoodBoard AI',
  description: 'About MoodBoard AI — a portfolio project exploring AI-assisted creative direction.',
};

export default function AboutPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col overflow-x-hidden bg-(--background) px-4 pb-16 pt-6 md:px-8 md:pt-10">
      <header className="flex items-center justify-between gap-4">
        <Link
          href="/"
          aria-label="MoodBoard AI home"
          className="flex items-center gap-3 rounded-2xl transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--ring) focus-visible:ring-offset-2 focus-visible:ring-offset-(--background)"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-[1.1rem] border border-(--border) bg-(--surface-elevated) shadow-[0_14px_35px_rgba(15,23,42,0.06)]">
            <AppIcon className="h-6 w-6" />
          </span>
          <span
            className="text-2xl tracking-tight text-(--text-strong)"
            style={{ fontFamily: 'var(--font-display), serif' }}
          >
            MoodBoard AI
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <Link
            href="/"
            className="group inline-flex h-11 items-center gap-2 rounded-full border border-(--border) bg-(--surface-elevated) px-4 text-sm font-medium text-(--text-strong) shadow-sm transition hover:bg-(--surface-subtle) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--ring) focus-visible:ring-offset-2 focus-visible:ring-offset-(--background)"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
            Back to home
          </Link>
        </div>
      </header>

      <div className="mt-6 h-px w-full bg-(--border)" />

      <ProjectOverview />
    </main>
  );
}
