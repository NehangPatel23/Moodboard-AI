import { PromptComposer } from '@/components/creation/PromptComposer';
import { PageLabel } from '@/components/shared/PageLabel';

export default function NewBoardPage() {
  return (
    <div className="space-y-8 pb-10">
      <section className="relative overflow-hidden rounded-[2.5rem] border border-(--border) bg-(--surface-elevated) p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)] md:p-8 dark:shadow-[0_24px_60px_rgba(0,0,0,0.22)]">
        <div className="relative flex gap-4 md:gap-6">
          <PageLabel label="Create board" />

          <div className="flex flex-1 flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-4xl space-y-4">
            <h1 className="[font-family:var(--font-display),serif] text-[clamp(3rem,7vw,5.75rem)] leading-[0.95] tracking-[-0.04em] text-(--text-strong)">
              Describe the mood you want to build.
            </h1>

            <p className="max-w-3xl text-base leading-7 text-(--text-muted) md:text-lg">
              Turn a rough idea into a structured board with mood, palette, typography, references, and notes.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:w-90">
            <div className="rounded-[1.75rem] border border-(--border) bg-(--surface) p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)] dark:shadow-[0_12px_30px_rgba(0,0,0,0.18)]">
              <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-(--text-muted)">
                Prompt
              </p>
              <p className="mt-2 text-sm leading-6 text-(--text-strong)">
                Start with a feeling, scene, or brand cue.
              </p>
            </div>

            <div className="rounded-[1.75rem] border border-(--border) bg-(--surface) p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)] dark:shadow-[0_12px_30px_rgba(0,0,0,0.18)]">
              <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-(--text-muted)">
                Direction
              </p>
              <p className="mt-2 text-sm leading-6 text-(--text-strong)">
                Mood, palette, and type are generated instantly.
              </p>
            </div>

            <div className="rounded-[1.75rem] border border-(--border) bg-(--surface) p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)] dark:shadow-[0_12px_30px_rgba(0,0,0,0.18)]">
              <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-(--text-muted)">
                Studio
              </p>
              <p className="mt-2 text-sm leading-6 text-(--text-strong)">
                Refine the board after creation in the editor.
              </p>
            </div>
            </div>
          </div>
        </div>
      </section>

      <PromptComposer />
    </div>
  );
}