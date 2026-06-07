'use client';

import { useEffect, useState } from 'react';
import { PageLabel } from '@/components/shared/PageLabel';
import {
  consumeWelcomeSession,
  markWelcomeSessionShown,
  welcomeFirstName,
  type WelcomeSession,
} from '@/lib/welcome-session';
import { hydrateAuthStore } from '@/lib/auth-store';

const welcomeCopy: Record<
  WelcomeSession['kind'],
  { eyebrow: string; subtitle: string }
> = {
  'sign-up': {
    eyebrow: 'Welcome',
    subtitle:
      'Your studio is ready. Create a board, explore shared work, or shape your next direction.',
  },
  'sign-in': {
    eyebrow: 'Welcome back',
    subtitle: 'Good to see you again. Pick up where you left off or start something new.',
  },
};

export function DashboardHeader() {
  const [welcome] = useState<WelcomeSession | null>(() => consumeWelcomeSession());

  useEffect(() => {
    hydrateAuthStore();

    if (!welcome) return;

    const timer = window.setTimeout(() => {
      markWelcomeSessionShown();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [welcome]);

  if (welcome) {
    const welcomeName = welcomeFirstName(welcome.name);
    const copy = welcomeCopy[welcome.kind];

    return (
      <section className="flex gap-4 md:gap-6">
        <PageLabel label="Dashboard" />

        <div className="max-w-5xl space-y-4">
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-(--text-muted) md:text-sm">
            {copy.eyebrow}
          </p>

          <h2 className="[font-family:var(--font-display),serif] text-[clamp(3.5rem,8vw,5.75rem)] leading-[0.95] text-(--text-strong)">
            {welcomeName === 'there' ? copy.eyebrow : welcomeName}
          </h2>

          <p className="max-w-3xl text-base leading-7 text-(--text-muted) md:text-lg">
            {copy.subtitle}
          </p>
        </div>
      </section>
    );
  }

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
