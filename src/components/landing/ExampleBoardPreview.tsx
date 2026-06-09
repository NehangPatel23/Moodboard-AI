import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  displayHeadingClass,
  heroGradientClass,
  outlineButtonClass,
  sectionLabelClass,
} from '@/components/landing/landing-styles';

const palette = ['#F7F2EB', '#A8B5A2', '#B89A6A', '#2D2A26'];

export function ExampleBoardPreview() {
  return (
    <section className="space-y-6" aria-labelledby="example-board-title">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className={sectionLabelClass}>Example board</p>
          <h2
            id="example-board-title"
            className={`mt-2 text-3xl md:text-4xl ${displayHeadingClass}`}
          >
            Studio output that feels finished.
          </h2>
          <p className="mt-3 text-sm leading-7 text-(--text-muted) md:text-base">
            A real board structure — palette, typography, and direction — generated from a single
            prompt and ready to refine.
          </p>
        </div>

        <Link href="/discover" className={`${outlineButtonClass} shrink-0 self-start sm:self-auto`}>
          Explore public boards
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="relative overflow-hidden rounded-[2.5rem] border border-(--border) bg-(--surface-elevated) shadow-[0_24px_60px_rgba(15,23,42,0.06)] dark:shadow-[0_24px_60px_rgba(0,0,0,0.22)]">
        <div aria-hidden="true" className={heroGradientClass} />

        <div className="relative border-b border-(--border)/80 bg-(--surface)/60 px-6 py-6 backdrop-blur-sm md:px-8 md:py-7">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="default">Calm luxury</Badge>
            <Badge variant="secondary">Wellness</Badge>
            <Badge variant="secondary">Editorial</Badge>
          </div>

          <h3 className={`mt-4 text-2xl md:text-3xl ${displayHeadingClass}`}>
            Soft Luxury Wellness
          </h3>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-(--text-muted) md:text-base">
            A calm, elevated identity built around restraint, warmth, and trust.
          </p>
        </div>

        <div className="relative grid gap-4 p-6 md:p-8 lg:grid-cols-3">
          <div className="rounded-[1.5rem] border border-(--border) bg-(--surface)/80 p-5 backdrop-blur-sm transition duration-300 hover:-translate-y-0.5">
            <p className={sectionLabelClass}>Palette</p>

            <div className="mt-4 grid grid-cols-4 gap-3">
              {palette.map((color) => (
                <div key={color} className="space-y-2">
                  <div
                    className="aspect-square rounded-2xl border border-(--border) shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]"
                    style={{ backgroundColor: color }}
                  />
                  <p className="break-all text-[10px] text-(--text-muted)">{color}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-(--border) bg-(--surface)/80 p-5 backdrop-blur-sm transition duration-300 hover:-translate-y-0.5">
            <p className={sectionLabelClass}>Typography</p>

            <div className="mt-4 space-y-5">
              <div>
                <p className={`text-xl ${displayHeadingClass}`}>Bodoni Moda</p>
                <p className="mt-1 text-sm text-(--text-muted)">Heading</p>
              </div>

              <div>
                <p className="text-base font-medium text-(--text-strong)">DM Sans</p>
                <p className="mt-1 text-sm text-(--text-muted)">Body</p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-(--border) bg-(--surface)/80 p-5 backdrop-blur-sm transition duration-300 hover:-translate-y-0.5 lg:col-span-1">
            <p className={sectionLabelClass}>Direction</p>
            <p className="mt-4 text-sm leading-7 text-(--text-muted) md:text-base">
              Soft textures, generous spacing, warm neutrality, and restrained premium accents.
            </p>

            <div className="mt-5 flex flex-wrap gap-2 border-t border-(--border) pt-4">
              {['Restraint', 'Warmth', 'Trust'].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-(--border) bg-(--surface-elevated) px-3 py-1 text-[11px] font-medium text-(--text-muted)"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
