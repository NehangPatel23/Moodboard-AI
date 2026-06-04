import type { LucideIcon } from 'lucide-react';
import { LayoutGrid, Palette, Sparkles, Type } from 'lucide-react';

type Feature = {
  title: string;
  description: string;
  icon: LucideIcon;
  accent: string;
  iconTone: string;
};

const features: Feature[] = [
  {
    title: 'AI creative direction',
    description: 'Turn a vague prompt into mood, tone, and a concise design summary.',
    icon: Sparkles,
    accent: 'bg-sky-400/70',
    iconTone: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
  },
  {
    title: 'Curated palettes',
    description: 'Generate a color system that feels intentional and easy to apply.',
    icon: Palette,
    accent: 'bg-emerald-400/70',
    iconTone: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  },
  {
    title: 'Typography pairing',
    description: 'Suggest heading and body fonts with short usage notes.',
    icon: Type,
    accent: 'bg-amber-400/80',
    iconTone: 'bg-amber-500/10 text-amber-700 dark:text-amber-200',
  },
  {
    title: 'Composable boards',
    description: 'Work with cards, notes, and references in a polished board layout.',
    icon: LayoutGrid,
    accent: 'bg-violet-400/70',
    iconTone: 'bg-violet-500/10 text-violet-700 dark:text-violet-200',
  },
];

export function FeatureGrid() {
  return (
    <section className="py-6" aria-label="Core product capabilities">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {features.map((feature, index) => {
          const Icon = feature.icon;

          return (
            <article
              key={feature.title}
              className="animate-fade-up group overflow-hidden rounded-4xl border border-(--border) bg-(--surface-elevated) shadow-(--shadow-card) transition-[transform,box-shadow,background-color,border-color] duration-300 hover:-translate-y-1 hover:shadow-(--shadow-elevated)"
              style={{ animationDelay: `${180 + index * 90}ms` }}
            >
              <div className={`h-1.5 ${feature.accent}`} />

              <div className="flex flex-col gap-5 p-6">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl border border-(--border) shadow-none ${feature.iconTone}`}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>

                <div className="space-y-3">
                  <p className="text-lg font-medium tracking-tight text-(--text-strong)">
                    {feature.title}
                  </p>
                  <p className="text-sm leading-6 text-(--text-muted)">
                    {feature.description}
                  </p>
                </div>
              </div>

              <div className="px-6 pb-6">
                <div className="h-px w-full bg-(--border) opacity-70" />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}