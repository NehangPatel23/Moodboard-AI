import type { LucideIcon } from 'lucide-react';
import {
  Compass,
  Download,
  Globe,
  Layers,
  Rocket,
  UserRound,
  Wrench,
} from 'lucide-react';
import { AboutFooterActions, AboutHeroActions } from '@/components/landing/AboutPageActions';
import { landingFeatures } from '@/components/landing/landing-features';

const sectionLabelClass =
  'text-[10px] font-medium uppercase tracking-[0.28em] text-(--text-muted)';

const TECH_STACK = [
  { label: 'Next.js 16', detail: 'App Router' },
  { label: 'React 19', detail: 'UI' },
  { label: 'TypeScript', detail: 'Types' },
  { label: 'Tailwind CSS v4', detail: 'Styling' },
  { label: 'Supabase', detail: 'Auth · DB · Realtime' },
  { label: 'Google Gemini', detail: 'AI generation' },
  { label: 'Pexels + Unsplash', detail: 'Reference photos' },
  { label: 'Vercel', detail: 'Deploy' },
];

const WORKFLOW_STEPS = [
  {
    step: '01',
    title: 'Describe the idea',
    body: 'Start from a prompt or curated template — a brand refresh, campaign look, or product launch vibe.',
  },
  {
    step: '02',
    title: 'AI drafts direction',
    body: 'Gemini generates palette, typography, references, notes, and summary with a progressive live preview.',
  },
  {
    step: '03',
    title: 'Refine in the editor',
    body: 'Edit every section, run AI suggestions, save snapshots, and collaborate with your team in real time.',
  },
  {
    step: '04',
    title: 'Share and export',
    body: 'Publish to Discover, invite collaborators, or export JSON, PNG, PDF, and developer design-system tokens.',
  },
] as const;

const PRODUCT_HIGHLIGHTS = [
  {
    title: 'Public Discover gallery',
    description: 'Browse shared boards, explore creator profiles, and open view-only presentations without signing in.',
    icon: Globe,
    accent: 'bg-sky-400/70',
    iconTone: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
  },
  {
    title: 'Design system export',
    description: 'Download CSS variables, Tailwind snippets, tokens JSON, or Markdown specs for developer handoff.',
    icon: Download,
    accent: 'bg-violet-400/70',
    iconTone: 'bg-violet-500/10 text-violet-700 dark:text-violet-200',
  },
  {
    title: 'Creator profiles',
    description: 'Public profile pages show workspace identity and every board a creator has shared on Discover.',
    icon: UserRound,
    accent: 'bg-rose-400/70',
    iconTone: 'bg-rose-500/10 text-rose-700 dark:text-rose-200',
  },
] as const;

const WHY_VALUE_POINTS = [
  {
    title: 'Skip the blank page',
    body: 'Turn a vague brief into palette, typography, and references in minutes.',
  },
  {
    title: 'Stay aligned',
    body: 'One structured board beats scattered bookmarks and inconsistent decks.',
  },
  {
    title: 'Hand off cleanly',
    body: 'Share, collaborate live, and export when the direction is ready.',
  },
] as const;

type InfoCard = {
  title: string;
  icon: LucideIcon;
  body: string;
  points?: string[];
};

const INFO_CARDS: InfoCard[] = [
  {
    title: 'The concept',
    icon: Compass,
    body: 'Creative projects often start with language like “make it feel premium but approachable.” MoodBoard AI turns that fuzzy brief into a structured board — palette, type, references, notes, and brand strategy — in minutes instead of hours of manual curation.',
  },
  {
    title: 'What I built',
    icon: Layers,
    body: 'A portfolio-grade product surface designed and engineered end to end:',
    points: [
      'Landing, dashboard, templates, board editor, settings, Discover, and creator profiles',
      'Supabase Auth, per-user persistence, collaboration, comments, and activity replay',
      'AI generation with Gemini, progressive preview, and on-demand palette, type, and brand suggestions',
      'Export modal with JSON, PNG, PDF, and design-system handoff formats',
    ],
  },
  {
    title: 'Engineering approach',
    icon: Wrench,
    body: 'Hand-rolled stores with useSyncExternalStore backed by typed API routes and Row Level Security. Semantic design tokens, accessible modals, command palette, and reduced-motion support are baseline — not polish added later.',
  },
  {
    title: 'Current status',
    icon: Rocket,
    body: 'Deployed MVP on Vercel with Waves 1–3 and Sprints A–F complete: collaboration notifications, snapshot limits, brand strategy AI, design system export, and public creator profiles. Active development continues with incremental visual polish.',
  },
];

export function ProjectOverview() {
  return (
    <div className="space-y-16 pb-8 pt-2 md:space-y-20 md:pb-12 md:pt-4">
      <section
        aria-labelledby="about-heading"
        className="relative overflow-hidden rounded-[2.5rem] border border-(--border) bg-(--surface-elevated) p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)] md:p-10 dark:shadow-[0_24px_60px_rgba(0,0,0,0.22)]"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_0%_0%,rgba(184,216,252,0.24),transparent_55%),radial-gradient(90%_70%_at_100%_0%,rgba(212,200,245,0.20),transparent_50%),radial-gradient(80%_60%_at_50%_100%,rgba(200,240,216,0.16),transparent_55%)]"
        />

        <div className="relative grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-5">
            <p className={sectionLabelClass}>Portfolio project</p>
            <h1
              id="about-heading"
              className="max-w-3xl [font-family:var(--font-display),serif] text-[clamp(2.4rem,5vw,3.75rem)] leading-[0.98] tracking-[-0.04em] text-(--text-strong)"
            >
              AI-assisted creative direction, built like a real product.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-(--text-muted) md:text-lg">
              MoodBoard AI explores how teams can move from a vague creative brief to a
              shareable moodboard — with colors, typography, references, notes, and brand
              guidance — without starting from a blank page.
            </p>

            <AboutHeroActions />
          </div>

          <div className="rounded-[1.75rem] border border-(--border) bg-(--surface)/70 p-5 text-center backdrop-blur-sm md:p-6 lg:self-center">
            <p className={sectionLabelClass}>Why it exists</p>
            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-(--text-muted) md:text-base">
              Moodboards are how teams align on feel before anything gets designed — but
              assembling one manually means scattered bookmarks, inconsistent structure, and
              slow handoffs. This project automates the first draft so you can refine, share,
              and export instead of rebuilding from scratch.
            </p>
            <div className="mt-5 grid gap-4 border-t border-(--border) pt-5 sm:grid-cols-3 sm:gap-3">
              {WHY_VALUE_POINTS.map((point) => (
                <div key={point.title} className="space-y-1.5">
                  <p className="text-sm font-medium tracking-tight text-(--text-strong)">
                    {point.title}
                  </p>
                  <p className="text-xs leading-5 text-(--text-muted)">{point.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="workflow-heading" className="space-y-6">
        <div className="max-w-2xl">
          <p className={sectionLabelClass}>How it works</p>
          <h2
            id="workflow-heading"
            className="mt-2 [font-family:var(--font-display),serif] text-3xl tracking-tight text-(--text-strong) md:text-4xl"
          >
            From prompt to polished direction
          </h2>
        </div>

        <ol className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {WORKFLOW_STEPS.map((item, index) => (
            <li
              key={item.step}
              className="relative overflow-hidden rounded-[1.75rem] border border-(--border) bg-(--surface-elevated) p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)]"
            >
              <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-(--text-muted)">
                Step {item.step}
              </p>
              <h3 className="mt-3 text-lg font-medium tracking-tight text-(--text-strong)">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-(--text-muted)">{item.body}</p>
              {index < WORKFLOW_STEPS.length - 1 ? (
                <span
                  aria-hidden="true"
                  className="absolute right-4 top-1/2 hidden h-px w-8 -translate-y-1/2 bg-(--border) xl:block"
                />
              ) : null}
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="capabilities-heading" className="space-y-6">
        <div className="max-w-2xl">
          <p className={sectionLabelClass}>Capabilities</p>
          <h2
            id="capabilities-heading"
            className="mt-2 [font-family:var(--font-display),serif] text-3xl tracking-tight text-(--text-strong) md:text-4xl"
          >
            What the product does today
          </h2>
          <p className="mt-3 text-sm leading-7 text-(--text-muted) md:text-base">
            More than a demo shell — a full workspace for creating, collaborating, publishing,
            and handing off creative direction.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {landingFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <article
                key={feature.title}
                className="overflow-hidden rounded-[1.75rem] border border-(--border) bg-(--surface-elevated) shadow-[0_16px_40px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_rgba(15,23,42,0.08)]"
              >
                <div className={`h-1.5 ${feature.accent}`} />
                <div className="flex flex-col gap-4 p-5">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl border border-(--border) ${feature.iconTone}`}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-base font-medium tracking-tight text-(--text-strong)">
                      {feature.title}
                    </h3>
                    <p className="text-sm leading-6 text-(--text-muted)">{feature.description}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {PRODUCT_HIGHLIGHTS.map((item) => {
            const Icon = item.icon;
            return (
              <article
                key={item.title}
                className="overflow-hidden rounded-[1.75rem] border border-(--border) bg-(--surface-soft)/80 shadow-[0_12px_32px_rgba(15,23,42,0.04)]"
              >
                <div className={`h-1.5 ${item.accent}`} />
                <div className="flex flex-col gap-4 p-5">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl border border-(--border) ${item.iconTone}`}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-base font-medium tracking-tight text-(--text-strong)">
                      {item.title}
                    </h3>
                    <p className="text-sm leading-6 text-(--text-muted)">{item.description}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="story-heading" className="space-y-6">
        <div className="max-w-2xl">
          <p className={sectionLabelClass}>Behind the build</p>
          <h2
            id="story-heading"
            className="mt-2 [font-family:var(--font-display),serif] text-3xl tracking-tight text-(--text-strong) md:text-4xl"
          >
            Concept, scope, and engineering
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {INFO_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <article
                key={card.title}
                className="rounded-[1.75rem] border border-(--border) bg-(--surface-elevated) p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_rgba(15,23,42,0.08)]"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-(--border) bg-(--surface-soft) text-(--text-strong)">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>

                <h3 className="mt-5 text-lg font-medium tracking-tight text-(--text-strong)">
                  {card.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-(--text-muted)">{card.body}</p>

                {card.points ? (
                  <ul className="mt-4 space-y-2.5">
                    {card.points.map((point) => (
                      <li
                        key={point}
                        className="flex gap-2.5 text-sm leading-6 text-(--text-muted)"
                      >
                        <span
                          className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-(--accent-strong)"
                          aria-hidden="true"
                        />
                        {point}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>

      <section
        aria-labelledby="stack-heading"
        className="rounded-[2rem] border border-(--border) bg-(--surface-soft)/80 p-6 md:p-8"
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-xl space-y-3">
            <p className={sectionLabelClass}>Built with</p>
            <h2
              id="stack-heading"
              className="[font-family:var(--font-display),serif] text-2xl tracking-tight text-(--text-strong) md:text-3xl"
            >
              Stack and integrations
            </h2>
            <p className="text-sm leading-7 text-(--text-muted) md:text-base">
              Modern full-stack tooling chosen for speed, type safety, and a production-like
              feel — with optional AI and stock-photo APIs that degrade gracefully when keys
              are not configured.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:max-w-xl lg:flex-1">
            {TECH_STACK.map((tech) => (
              <div
                key={tech.label}
                className="rounded-[1.25rem] border border-(--border) bg-(--surface-elevated) px-4 py-3"
              >
                <p className="text-sm font-medium text-(--text-strong)">{tech.label}</p>
                <p className="mt-0.5 text-xs text-(--text-muted)">{tech.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-(--border) bg-(--surface-elevated) p-6 text-center shadow-[0_20px_50px_rgba(15,23,42,0.06)] md:p-10">
        <p className={sectionLabelClass}>Try it yourself</p>
        <h2 className="mt-3 [font-family:var(--font-display),serif] text-3xl tracking-tight text-(--text-strong) md:text-4xl">
          See the workflow in action
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-(--text-muted) md:text-base">
          Create a board from a short prompt, explore public work on Discover, or sign in with
          the demo account to test collaboration and export.
        </p>
        <AboutFooterActions />
      </section>
    </div>
  );
}
