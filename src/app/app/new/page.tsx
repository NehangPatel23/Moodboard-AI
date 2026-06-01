import { PromptComposer } from '@/components/creation/PromptComposer';
import { Badge } from '@/components/ui/badge';

export default function NewBoardPage() {
  return (
    <div className="space-y-8 pb-10">
      <section className="relative overflow-hidden rounded-[2.5rem] border border-black/5 bg-white/80 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)] backdrop-blur-md md:p-8">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-black/10 to-transparent" />
        <div className="absolute -right-24 top-0 h-48 w-48 rounded-full bg-amber-200/20 blur-3xl" />
        <div className="absolute -left-20 bottom-0 h-40 w-40 rounded-full bg-slate-900/5 blur-3xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-4xl space-y-4">
            <Badge
              variant="outline"
              className="w-fit rounded-full border-black/10 bg-white/70 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-slate-500"
            >
              Create board
            </Badge>

            <h1 className="[font-family:var(--font-display),serif] text-[clamp(3rem,7vw,5.75rem)] leading-[0.95] tracking-[-0.04em] text-slate-900">
              Describe the mood you want to build.
            </h1>

            <p className="max-w-3xl text-base leading-7 text-slate-500 md:text-lg">
              Turn a rough idea into a structured board with mood, palette, typography, references, and notes.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:w-[360px]">
            <div className="rounded-[1.75rem] border border-black/5 bg-white/85 p-4 shadow-sm">
              <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-slate-400">
                Prompt
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-700">Start with a feeling, scene, or brand cue.</p>
            </div>
            <div className="rounded-[1.75rem] border border-black/5 bg-white/85 p-4 shadow-sm">
              <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-slate-400">
                Direction
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-700">Mood, palette, and type are generated instantly.</p>
            </div>
            <div className="rounded-[1.75rem] border border-black/5 bg-white/85 p-4 shadow-sm">
              <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-slate-400">
                Studio
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-700">Refine the board after creation in the editor.</p>
            </div>
          </div>
        </div>
      </section>

      <PromptComposer />
    </div>
  );
}