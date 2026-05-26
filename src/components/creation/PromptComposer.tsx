'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TemplatePicker } from './TemplatePicker';
import { PromptSuggestions } from './PromptSuggestions';
import { GenerationLoader } from './GenerationLoader';
import { generateBoardDraft, getBoardTemplates, getQuickPromptSuggestions } from '@/lib/ai';
import { loadBoards, saveBoards, upsertBoard } from '@/lib/board-store';

export function PromptComposer() {
  const router = useRouter();
  const templates = useMemo(() => getBoardTemplates(), []);
  const suggestions = useMemo(() => getQuickPromptSuggestions(), []);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const canGenerate = prompt.trim().length > 8 && !isGenerating;

  async function handleGenerate() {
    if (!canGenerate) return;

    setIsGenerating(true);
    setStatus('Generating board draft...');

    await new Promise((resolve) => window.setTimeout(resolve, 800));

    const { board, followUpPrompt } = generateBoardDraft(prompt);
    const existing = loadBoards();
    const nextBoards = upsertBoard(existing, board);
    saveBoards(nextBoards);

    setStatus(`Created ${board.title}. ${followUpPrompt}`);
    router.push('/app');
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <section className="rounded-4xl border border-slate-200 bg-white/85 p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">Step 1</Badge>
          <span className="text-sm text-slate-500">Describe the mood, brand, or scene you want to explore.</span>
        </div>

        <div className="mt-4 space-y-4">
          <Textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="e.g. soft, modern brand for a skincare startup"
            className="min-h-40 text-base"
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <PromptSuggestions suggestions={suggestions} onSelect={setPrompt} />
            <Button type="button" onClick={handleGenerate} disabled={!canGenerate} className="rounded-full px-5">
              {isGenerating ? 'Generating...' : 'Generate board'}
            </Button>
          </div>
        </div>

        {status ? <p className="mt-4 text-sm leading-6 text-slate-500">{status}</p> : null}
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-400">Templates</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            Start from a direction, then refine it.
          </h2>
        </div>

        <TemplatePicker templates={templates} activePrompt={prompt} onSelect={setPrompt} />
      </section>

      {isGenerating ? <GenerationLoader /> : null}
    </div>
  );
}