import { PromptComposer } from '@/components/creation/PromptComposer';

export default function NewBoardPage() {
  return (
    <div className="space-y-6">
      <section className="max-w-3xl">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-400">Create board</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-950">Describe the mood you want to build.</h1>
        <p className="mt-4 text-base leading-7 text-slate-500">
          Turn a rough idea into a structured board with mood, palette, type, references, and notes.
        </p>
      </section>

      <PromptComposer />
    </div>
  );
}