'use client';

import { PageLabel } from '@/components/shared/PageLabel';

export function DashboardHeader() {
  return (
    <section className="flex gap-4 md:gap-6">
      <PageLabel label="Dashboard" />

      <div className="max-w-5xl space-y-4">
        <h2 className="text-[clamp(3.5rem,8vw,5.75rem)] leading-[0.95] text-(--text-strong)">
          Curated Spaces
        </h2>

        <p className="max-w-3xl text-base leading-7 text-(--text-muted) md:text-lg">
          Browse saved boards, revisit directions, and continue shaping ideas into polished visual systems.
        </p>
      </div>
    </section>
  );
}