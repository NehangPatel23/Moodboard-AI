'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ChevronDown, ExternalLink } from 'lucide-react';
import { HELP_SECTIONS, HELP_SUPPORT_LINK } from '@/lib/help-sections';
import {
  appDisplayHeadingClass,
  appFeatureCardClass,
  appOutlineButtonClass,
  appSectionClass,
  appSectionLabelClass,
} from '@/components/shared/app-surface-styles';
import { cn } from '@/lib/utils';

export default function HelpPage() {
  const [openSectionId, setOpenSectionId] = useState<string>(HELP_SECTIONS[0]?.id ?? '');

  return (
    <div className="space-y-8 py-2 md:py-4">
      <section className={appSectionClass}>
        <p className={appSectionLabelClass}>Help</p>
        <h1
          className={`mt-2 text-[clamp(2.2rem,4.5vw,3.4rem)] leading-[0.96] ${appDisplayHeadingClass}`}
        >
          How MoodBoard AI works
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-(--text-muted) md:text-base">
          Quick guides for boards, collaboration, export, and public browsing. Expand a topic below
          or jump straight into the app.
        </p>
      </section>

      <div className="space-y-3">
        {HELP_SECTIONS.map((section) => {
          const open = openSectionId === section.id;

          return (
            <article key={section.id} className={appFeatureCardClass}>
              <button
                type="button"
                onClick={() => setOpenSectionId((current) => (current === section.id ? '' : section.id))}
                className="flex w-full items-start justify-between gap-4 text-left"
                aria-expanded={open}
                aria-controls={`help-panel-${section.id}`}
              >
                <span>
                  <h2 className="text-lg font-semibold tracking-tight text-(--text-strong)">
                    {section.title}
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-(--text-muted)">{section.summary}</p>
                </span>
                <ChevronDown
                  className={cn(
                    'mt-1 h-5 w-5 shrink-0 text-(--text-muted) transition',
                    open && 'rotate-180',
                  )}
                  aria-hidden="true"
                />
              </button>

              {open ? (
                <div id={`help-panel-${section.id}`} className="mt-4 space-y-4 border-t border-(--border) pt-4">
                  <ul className="space-y-2 text-sm leading-6 text-(--text-muted)">
                    {section.bullets.map((bullet) => (
                      <li key={bullet} className="flex gap-2">
                        <span
                          className="mt-2 h-1 w-1 shrink-0 rounded-full bg-(--text-muted)"
                          aria-hidden="true"
                        />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>

                  {section.links && section.links.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {section.links.map((link) => (
                        <Link key={link.href} href={link.href} className={appOutlineButtonClass}>
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      <section className={`text-center ${appSectionClass}`}>
        <p className={appSectionLabelClass}>Support</p>
        <h2 className={`mt-2 text-2xl md:text-3xl ${appDisplayHeadingClass}`}>Need more help?</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-(--text-muted)">
          Open an issue on GitHub with steps to reproduce, or browse the changelog for recent
          product updates.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <a
            href={HELP_SUPPORT_LINK.href}
            target="_blank"
            rel="noreferrer"
            className={appOutlineButtonClass}
          >
            {HELP_SUPPORT_LINK.label}
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
          <Link href="/changelog" className={appOutlineButtonClass}>
            View changelog
          </Link>
        </div>
      </section>
    </div>
  );
}
