import type { LucideIcon } from 'lucide-react';
import { Compass, Layers, Rocket, Wrench } from 'lucide-react';

const TECH_STACK = [
  'Next.js 16 (App Router)',
  'React 19',
  'TypeScript',
  'Tailwind CSS v4',
  'Framer Motion',
  'Vercel',
];

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
    body: 'MoodBoard AI turns a vague prompt into structured creative direction — palettes, typography, references, and a clear summary — so designers and founders can move from idea to visual language quickly.',
  },
  {
    title: 'What I built',
    icon: Layers,
    body: 'A polished, app-like product surface, designed and built end to end:',
    points: [
      'Dashboard, board editor, presentation view, templates, and settings',
      'Theme system, command palette, toasts, and accessible modals',
      'Supabase Auth with gated routes and per-user board persistence',
      'AI board generation via Google Gemini free tier (optional) with demo fallback',
    ],
  },
  {
    title: 'Engineering notes',
    icon: Wrench,
    body: 'State uses hand-rolled useSyncExternalStore stores backed by Supabase API routes. Theming is token-driven with full light/dark support, and accessibility (keyboard, focus, reduced motion) is a baseline requirement.',
  },
  {
    title: 'Project status',
    icon: Rocket,
    body: 'This is an actively evolving portfolio build. Auth and persistence run on Supabase; AI generation uses Gemini free tier when configured. Next milestones: collaboration and public discovery.',
  },
];

export function ProjectOverview() {
  return (
    <section aria-labelledby="about-heading" className="py-10 md:py-14">
      <div className="animate-fade-up max-w-2xl">
        <p className="text-xs font-medium uppercase tracking-[0.32em] text-(--text-muted)">
          Portfolio project
        </p>
        <h1
          id="about-heading"
          className="mt-4 text-4xl tracking-tight text-(--text-strong) md:text-5xl"
        >
          About this project
        </h1>
        <p className="mt-4 text-base leading-7 text-(--text-muted)">
          MoodBoard AI is a self-directed product build exploring how AI can assist the
          earliest, fuzziest stage of creative work. It is designed to feel like a real,
          premium product rather than a demo shell.
        </p>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {INFO_CARDS.map((card, index) => {
          const Icon = card.icon;
          return (
            <article
              key={card.title}
              className="animate-fade-up rounded-4xl border border-(--border) bg-(--surface-elevated) p-6 shadow-(--shadow-card) transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1"
              style={{ animationDelay: `${160 + index * 80}ms` }}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-(--border) bg-(--surface-soft) text-(--text-strong)">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>

              <h3 className="mt-5 text-lg font-medium tracking-tight text-(--text-strong)">
                {card.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-(--text-muted)">{card.body}</p>

              {card.points ? (
                <ul className="mt-3 space-y-2">
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

      <div className="animate-fade-up mt-6 rounded-4xl border border-(--border) bg-(--surface-soft) p-6 md:p-8">
        <p className="text-xs font-medium uppercase tracking-[0.32em] text-(--text-muted)">
          Built with
        </p>
        <div className="mt-4 flex flex-wrap gap-2.5">
          {TECH_STACK.map((tech) => (
            <span
              key={tech}
              className="rounded-full border border-(--border) bg-(--surface-elevated) px-4 py-1.5 text-sm font-medium text-(--text-strong)"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
