import type { ReactNode } from 'react';
import Link from 'next/link';
import { AppIcon } from '@/components/shared/AppIcon';
import { ThemeToggle } from '@/components/shared/ThemeToggle';

const SHOWCASE_PALETTE = ['#F7F2EB', '#A8B5A2', '#B89A6A', '#2D2A26'];

const SHOWCASE_TAGS = ['Calm luxury', 'Editorial', 'Warm minimal', 'Considered'];

function ShowcasePanel() {
  return (
    <div className="relative hidden overflow-hidden bg-[var(--surface-soft)] lg:flex lg:w-[46%] lg:flex-col lg:justify-between lg:p-12 xl:p-16">
      {/* Layered ambient background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 120% at 0% 0%, color-mix(in srgb, var(--accent) 42%, transparent) 0%, transparent 55%), radial-gradient(120% 120% at 100% 100%, color-mix(in srgb, var(--accent-strong) 30%, transparent) 0%, transparent 55%)',
        }}
      />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full border border-[var(--border)] opacity-50" />
        <div className="absolute -right-24 bottom-8 h-96 w-96 rounded-full border border-[var(--border)] opacity-40" />
        <div className="absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--border)] opacity-25" />
      </div>

      <div className="relative">
        <Link
          href="/"
          aria-label="MoodBoard AI home"
          className="flex w-fit items-center gap-3 rounded-2xl transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] shadow-sm">
            <AppIcon className="h-6 w-6" />
          </span>
          <span
            className="text-xl tracking-tight text-[var(--text-strong)]"
            style={{ fontFamily: 'var(--font-display), serif' }}
          >
            MoodBoard AI
          </span>
        </Link>
      </div>

      <div className="relative max-w-md">
        <p className="text-xs uppercase tracking-[0.4em] text-[var(--text-muted)]">
          Creative direction workspace
        </p>
        <h2
          className="mt-5 text-4xl leading-[1.1] tracking-tight text-[var(--text-strong)] xl:text-5xl"
          style={{ fontFamily: 'var(--font-display), serif' }}
        >
          Turn rough ideas into a beautiful visual board.
        </h2>
        <p className="mt-5 text-base leading-7 text-[var(--text-muted)]">
          Sign in to generate palettes, typography, references, and clear creative
          direction from a single prompt.
        </p>

        <div className="mt-8 flex items-center gap-3">
          {SHOWCASE_PALETTE.map((color) => (
            <span
              key={color}
              className="h-11 w-11 rounded-2xl border border-[var(--border)] shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      <div className="relative flex flex-wrap gap-2">
        {SHOWCASE_TAGS.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-[var(--border)] bg-[var(--surface-elevated)]/70 px-4 py-1.5 text-xs font-medium text-[var(--text-muted)] backdrop-blur"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen bg-[var(--background)] text-[var(--text)]">
      <div className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>

      <ShowcasePanel />

      <div className="flex w-full flex-1 flex-col items-center justify-center px-4 py-10 sm:px-6 lg:px-12">
        <div className="w-full max-w-md">
          {/* Compact brand for mobile / narrow viewports */}
          <Link
            href="/"
            aria-label="MoodBoard AI home"
            className="mx-auto mb-8 flex w-fit items-center gap-3 rounded-2xl transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] lg:hidden"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] shadow-sm">
              <AppIcon className="h-6 w-6" />
            </span>
            <span
              className="text-2xl tracking-tight text-[var(--text-strong)]"
              style={{ fontFamily: 'var(--font-display), serif' }}
            >
              MoodBoard AI
            </span>
          </Link>

          <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-elevated)] p-6 shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur-xl sm:p-8 dark:shadow-[0_24px_70px_rgba(0,0,0,0.30)]">
            {children}
          </div>

          <p className="mt-6 text-center text-xs leading-5 text-[var(--text-muted)]">
            Demo authentication — accounts are stored locally in your browser and are
            not secure.
          </p>
        </div>
      </div>
    </div>
  );
}
