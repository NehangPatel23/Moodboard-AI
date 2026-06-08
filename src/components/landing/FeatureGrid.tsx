import { landingFeatures } from '@/components/landing/landing-features';

export function FeatureGrid() {
  return (
    <section className="py-6" aria-label="Core product capabilities">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {landingFeatures.map((feature, index) => {
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
                  <p className="text-sm leading-6 text-(--text-muted)">{feature.description}</p>
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
