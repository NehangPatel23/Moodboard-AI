import { Badge } from '@/components/ui/badge';

const palette = ['#F7F2EB', '#A8B5A2', '#B89A6A', '#2D2A26'];

export function ExampleBoardPreview() {
  return (
    <section className="py-10" aria-labelledby="example-board-title">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-(--text-muted)">
            Example board
          </p>
          <h2
            id="example-board-title"
            className="animate-fade-up mt-2 text-3xl font-normal tracking-[-0.04em] text-(--text-strong) md:text-[2.35rem]"
            style={{ animationDelay: '120ms' }}
          >
            Studio output that feels finished.
          </h2>
        </div>
      </div>

      <div
        className="animate-fade-up overflow-hidden rounded-[2.5rem] border border-(--border) bg-(--surface-elevated) shadow-(--shadow-elevated)"
        style={{ animationDelay: '180ms' }}
      >
        <div className="border-b border-(--border) bg-(--surface-soft) px-6 py-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="default">Calm luxury</Badge>
            <Badge variant="secondary">Wellness</Badge>
            <Badge variant="secondary">Editorial</Badge>
          </div>

          <h3 className="mt-4 text-2xl font-normal tracking-[-0.04em] text-(--text-strong)">
            Soft Luxury Wellness
          </h3>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-(--text-muted)">
            A calm, elevated identity built around restraint, warmth, and trust.
          </p>
        </div>

        <div className="grid gap-4 p-6 lg:grid-cols-3">
          <div className="rounded-[1.75rem] border border-(--border) bg-(--surface-soft) p-5 shadow-none transition-transform duration-200 hover:-translate-y-0.5">
            <p className="text-xs uppercase tracking-[0.3em] text-(--text-muted)">Palette</p>

            <div className="mt-4 grid grid-cols-4 gap-3">
              {palette.map((color) => (
                <div key={color} className="space-y-2">
                  <div
                    className="h-16 rounded-2xl border border-(--border) shadow-none"
                    style={{ backgroundColor: color }}
                  />
                  <p className="break-all text-[11px] text-(--text-muted)">{color}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-(--border) bg-(--surface-soft) p-5 shadow-none transition-transform duration-200 hover:-translate-y-0.5">
            <p className="text-xs uppercase tracking-[0.3em] text-(--text-muted)">
              Typography
            </p>

            <div className="mt-4 space-y-5">
              <div>
                <p className="text-sm font-medium text-(--text-strong)">Bodoni Moda</p>
                <p className="text-sm text-(--text-muted)">Heading</p>
              </div>

              <div>
                <p className="text-sm font-medium text-(--text-strong)">DM Sans</p>
                <p className="text-sm text-(--text-muted)">Body</p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-(--border) bg-(--surface-soft) p-5 shadow-none transition-transform duration-200 hover:-translate-y-0.5">
            <p className="text-xs uppercase tracking-[0.3em] text-(--text-muted)">Direction</p>
            <p className="mt-4 text-sm leading-7 text-(--text-muted)">
              Soft textures, generous spacing, warm neutrality, and restrained premium accents.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}