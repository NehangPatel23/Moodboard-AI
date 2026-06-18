import { landingFeatures } from '@/components/landing/landing-features';
import { CapabilitiesWorkflow } from '@/components/landing/CapabilitiesWorkflow';
import { appDisplayHeadingClass, appFeatureCardClass, appSectionLabelClass } from '@/components/shared/app-surface-styles';

export function FeatureGrid() {
  return (
    <section className="space-y-8" aria-labelledby="capabilities-heading">
      <div className="max-w-2xl">
        <p className={appSectionLabelClass}>Capabilities</p>
        <h2
          id="capabilities-heading"
          className={`mt-2 text-3xl md:text-4xl ${appDisplayHeadingClass}`}
        >
          Everything you need to shape a direction
        </h2>
        <p className="mt-3 text-sm leading-7 text-(--text-muted) md:text-base">
          From AI generation to collaboration and export — a full workspace, not a one-off demo.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {landingFeatures.map((feature) => {
          const Icon = feature.icon;

          return (
            <article
              key={feature.id}
              className={appFeatureCardClass}
            >
              <div className={`h-1.5 ${feature.accent}`} />

              <div className="flex flex-col gap-4 p-5">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl border border-(--border) bg-(--surface-soft) ${feature.iconTone}`}
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

      <CapabilitiesWorkflow />
    </section>
  );
}
