import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { CHANGELOG_ENTRIES } from '@/lib/changelog-entries';
import {
  appDisplayHeadingClass,
  appFeatureCardClass,
  appOutlineButtonClass,
  appSectionClass,
  appSectionLabelClass,
} from '@/components/shared/app-surface-styles';

export default function ChangelogPage() {
  return (
    <main className="landing-page mx-auto flex min-h-screen w-full max-w-7xl flex-col overflow-x-hidden bg-(--background) px-4 pb-20 pt-6 md:px-8 md:pt-10">
      <LandingHeader />

      <div className="mt-6 space-y-8 md:mt-8">
        <section className={appSectionClass}>
          <p className={appSectionLabelClass}>Product updates</p>
          <h1
            className={`mt-2 text-[clamp(2.2rem,4.5vw,3.4rem)] leading-[0.96] ${appDisplayHeadingClass}`}
          >
            Changelog
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-(--text-muted) md:text-base">
            Shipped improvements to MoodBoard AI — collaboration, export, profiles, and polish.
            Newest updates first.
          </p>
        </section>

        <ol className="space-y-4">
          {CHANGELOG_ENTRIES.map((entry) => (
            <li key={`${entry.date}-${entry.title}`}>
              <article className={appFeatureCardClass}>
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <time
                    dateTime={entry.date}
                    className="text-[10px] font-medium uppercase tracking-[0.28em] text-(--text-muted)"
                  >
                    {entry.date}
                  </time>
                  {entry.sprint ? (
                    <span className="rounded-full border border-(--border) bg-(--surface-subtle) px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-(--text-muted)">
                      Sprint {entry.sprint}
                    </span>
                  ) : null}
                </div>

                <h2 className="mt-3 text-xl font-semibold tracking-tight text-(--text-strong)">
                  {entry.title}
                </h2>

                <ul className="mt-3 space-y-2 text-sm leading-6 text-(--text-muted)">
                  {entry.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-2">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-(--text-muted)" aria-hidden="true" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </article>
            </li>
          ))}
        </ol>

        <section className={`text-center ${appSectionClass}`}>
          <p className={appSectionLabelClass}>Try it</p>
          <h2 className={`mt-2 text-2xl md:text-3xl ${appDisplayHeadingClass}`}>
            See what shipped in the product
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-(--text-muted)">
            Create a board, invite a collaborator, or browse public work on Discover.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/app/new" className={appOutlineButtonClass}>
              Start a board
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link href="/discover" className={appOutlineButtonClass}>
              Browse Discover
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
