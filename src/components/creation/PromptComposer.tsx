'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TemplatePicker } from './TemplatePicker';
import { PromptSuggestions } from './PromptSuggestions';
import { GenerationLoader } from './GenerationLoader';
import { generateBoardDraft, getBoardTemplates, getQuickPromptSuggestions } from '@/lib/ai';
import { loadBoards, saveBoards, upsertBoard } from '@/lib/board-store';
import { cn } from '@/lib/utils';

export function PromptComposer() {
  const router = useRouter();
  const templates = useMemo(() => getBoardTemplates(), []);
  const suggestions = useMemo(() => getQuickPromptSuggestions(), []);
  const redirectTimerRef = useRef<number | null>(null);

  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current !== null) {
        window.clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  const canGenerate = prompt.trim().length > 8 && !isGenerating;

  const updatePrompt = (value: string) => {
    setPrompt(value);
    if (status && !isGenerating) {
      setStatus(null);
    }
  };

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      void handleGenerate();
    }
  };

  async function handleGenerate() {
    const trimmedPrompt = prompt.trim();

    if (isGenerating) return;

    if (!trimmedPrompt) {
      setStatus('Describe the direction first, then generate the board.');
      return;
    }

    if (trimmedPrompt.length <= 8) {
      setStatus('Add a little more detail so the board has enough context.');
      return;
    }

    setIsGenerating(true);
    setStatus('Generating mood, palette, type, and references...');

    try {
      await new Promise((resolve) => window.setTimeout(resolve, 850));

      const { board, followUpPrompt } = generateBoardDraft(trimmedPrompt);
      const existingBoards = loadBoards();
      const nextBoards = upsertBoard(existingBoards, board);
      saveBoards(nextBoards);

      setStatus(`Created ${board.title}. ${followUpPrompt}`);

      redirectTimerRef.current = window.setTimeout(() => {
        setIsGenerating(false);
        router.push('/app');
      }, 650);
    } catch {
      setIsGenerating(false);
      setStatus('Something went wrong while generating the board.');
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-4xl border border-slate-200 bg-white/85 p-6 shadow-sm" aria-busy={isGenerating}>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">Step 1</Badge>
          <span className="text-sm text-slate-500">
            Describe the mood, brand, or scene you want to explore.
          </span>
        </div>

        <div className="mt-4 space-y-4">
          <Textarea
            value={prompt}
            onChange={(event) => updatePrompt(event.target.value)}
            onKeyDown={handleComposerKeyDown}
            placeholder="e.g. soft, modern brand for a skincare startup"
            className="min-h-40 text-base"
            disabled={isGenerating}
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className={cn('space-y-4', isGenerating && 'pointer-events-none opacity-60')}>
              <PromptSuggestions suggestions={suggestions} onSelect={updatePrompt} />
            </div>

            <Button
              type="button"
              onClick={() => void handleGenerate()}
              disabled={!canGenerate}
              aria-busy={isGenerating}
              className="rounded-full px-5"
            >
              {isGenerating ? 'Generating...' : 'Generate board'}
            </Button>
          </div>

          <p className="text-xs text-slate-400">Press Ctrl/Cmd + Enter to generate faster.</p>
        </div>

        {status ? (
          <p className="mt-4 text-sm leading-6 text-slate-500" role="status" aria-live="polite">
            {status}
          </p>
        ) : null}
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-400">Templates</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            Start from a direction, then refine it.
          </h2>
        </div>

        <div className={cn(isGenerating && 'pointer-events-none opacity-60')}>
          <TemplatePicker templates={templates} activePrompt={prompt} onSelect={updatePrompt} />
        </div>
      </section>

      {isGenerating ? <GenerationLoader /> : null}
    </div>
  );
}