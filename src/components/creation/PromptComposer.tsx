'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { BoardTemplate } from '@/types/board';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  generateBoardDraft,
  generateBoardDraftFromTemplate,
  getBoardTemplates,
  getQuickPromptSuggestions,
} from '@/lib/ai';
import { loadBoards, saveBoards, upsertBoard } from '@/lib/board-store';
import { cn } from '@/lib/utils';

type SuggestionPillsProps = {
  suggestions: string[];
  onSelect: (prompt: string) => void;
};

function SuggestionPills({ suggestions, onSelect }: SuggestionPillsProps) {
  return (
    <div className="flex flex-wrap gap-2" aria-label="Quick prompt suggestions">
      {suggestions.map((suggestion) => (
        <Button
          key={suggestion}
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onSelect(suggestion)}
          className="rounded-full border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-950"
        >
          {suggestion}
        </Button>
      ))}
    </div>
  );
}

type TemplatePickerProps = {
  templates: BoardTemplate[];
  activeTemplateId: string | null;
  onCreateTemplate: (templateId: string) => void;
};

function TemplatePicker({ templates, activeTemplateId, onCreateTemplate }: TemplatePickerProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3" aria-label="Board templates">
      {templates.map((template) => {
        const isActive = activeTemplateId === template.id;

        return (
          <button
            key={template.id}
            type="button"
            onClick={() => onCreateTemplate(template.id)}
            aria-pressed={isActive}
            aria-label={`Create board from template ${template.name}`}
            className={cn(
              'group text-left transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2',
              'rounded-[1.75rem]',
              isActive ? 'ring-1 ring-slate-200' : '',
            )}
          >
            <Card className="h-full rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
              <div className="h-1.5 bg-linear-to-r from-slate-200 via-[#cbd7c8] to-[#d7c4b3]" />
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="[font-family:var(--font-display),serif] text-2xl tracking-tight text-slate-950">
                      {template.name}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{template.description}</p>
                  </div>

                  <Badge variant="secondary">Instant board</Badge>
                </div>

                <div className="mt-4 rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-slate-400">
                    Mood
                  </p>
                  <p className="[font-family:var(--font-display),serif] mt-2 text-xl tracking-tight text-slate-950">
                    {template.mood ?? template.name}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {template.summary ?? template.prompt}
                  </p>
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-600">{template.prompt}</p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {template.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium tracking-wide text-slate-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </Card>
          </button>
        );
      })}
    </div>
  );
}

function LoadingPreview() {
  return (
    <section className="rounded-[2.25rem] border border-slate-200 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-44 w-full" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-8 w-28 rounded-full" />
            <Skeleton className="h-8 w-32 rounded-full" />
            <Skeleton className="h-8 w-24 rounded-full" />
          </div>
        </div>

        <div className="space-y-4">
          <Skeleton className="h-28 w-full rounded-[1.75rem]" />
          <Skeleton className="h-28 w-full rounded-[1.75rem]" />
          <Skeleton className="h-28 w-full rounded-[1.75rem]" />
        </div>
      </div>
    </section>
  );
}

export function PromptComposer() {
  const router = useRouter();
  const templates = useMemo(() => getBoardTemplates(), []);
  const suggestions = useMemo(() => getQuickPromptSuggestions(), []);
  const redirectTimerRef = useRef<number | null>(null);

  const [prompt, setPrompt] = useState('');
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
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
    setActiveTemplateId(null);

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
        router.push(`/app/boards/${board.id}`);
      }, 650);
    } catch {
      setIsGenerating(false);
      setStatus('Something went wrong while generating the board.');
    }
  }

  async function handleTemplateCreate(templateId: string) {
    if (isGenerating) return;

    const template = templates.find((item) => item.id === templateId);
    if (!template) {
      setStatus('Template not found.');
      return;
    }

    setActiveTemplateId(templateId);
    setIsGenerating(true);
    setStatus(`Creating ${template.name} board...`);

    try {
      await new Promise((resolve) => window.setTimeout(resolve, 250));

      const generated = generateBoardDraftFromTemplate(templateId);
      if (!generated) {
        throw new Error('Template generation failed');
      }

      const existingBoards = loadBoards();
      const nextBoards = upsertBoard(existingBoards, generated.board);
      saveBoards(nextBoards);

      setStatus(`Created ${generated.board.title}. ${generated.followUpPrompt}`);

      redirectTimerRef.current = window.setTimeout(() => {
        setIsGenerating(false);
        router.push(`/app/boards/${generated.board.id}`);
      }, 500);
    } catch {
      setIsGenerating(false);
      setStatus('Something went wrong while creating the board.');
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)] md:p-8">
        <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <div className="space-y-4">
              <Badge variant="outline" className="w-fit rounded-full px-3 py-1">
                Step 1
              </Badge>

              <div className="space-y-2">
                <h2 className="[font-family:var(--font-display),serif] text-[clamp(2.6rem,6vw,5rem)] leading-[0.94] tracking-[-0.04em] text-slate-950">
                  Describe your vision
                </h2>
                <p className="max-w-2xl text-sm leading-6 text-slate-500 md:text-base">
                  Write a prompt and the studio will shape mood, palette, typography, references, and notes.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-medium uppercase tracking-[0.28em] text-slate-400">
                  Prompt
                </label>

                <Textarea
                  value={prompt}
                  onChange={(event) => updatePrompt(event.target.value)}
                  onKeyDown={handleComposerKeyDown}
                  placeholder="e.g. soft, modern brand for a skincare startup"
                  className="min-h-52.5 resize-y rounded-[1.75rem] border-slate-200 bg-white px-4 py-4 text-base text-slate-900 shadow-none placeholder:text-slate-400 focus-visible:ring-slate-900"
                  disabled={isGenerating}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <SuggestionPills suggestions={suggestions} onSelect={updatePrompt} />

                <Button
                  type="button"
                  onClick={() => void handleGenerate()}
                  disabled={!canGenerate}
                  aria-busy={isGenerating}
                  className="rounded-full bg-slate-950 px-5 text-white shadow-sm hover:bg-slate-800"
                >
                  {isGenerating ? 'Generating...' : 'Generate board'}
                </Button>
              </div>

              <p className="text-xs text-slate-400">Press Ctrl/Cmd + Enter to generate faster.</p>

              {status ? (
                <p className="text-sm leading-6 text-slate-600" role="status" aria-live="polite">
                  {status}
                </p>
              ) : null}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-4xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
              <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-slate-400">
                Studio guide
              </p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                <li>Describe mood, audience, and materiality.</li>
                <li>Use a single sentence or a full brief.</li>
                <li>Templates give you a faster starting point.</li>
              </ul>
            </div>

            <div className="rounded-4xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-slate-400">
                  Templates
                </p>
                <Badge variant="secondary">{templates.length} ready-made directions</Badge>
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Pick a direction and create a fully populated board instantly.
              </p>

              <div className="mt-4 space-y-3">
                {templates.slice(0, 3).map((template) => {
                  const active = activeTemplateId === template.id;

                  return (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => void handleTemplateCreate(template.id)}
                      aria-pressed={active}
                      className={cn(
                        'w-full rounded-3xl border text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2',
                        active ? 'border-slate-200 bg-slate-50' : 'border-slate-200 bg-white hover:bg-slate-50',
                      )}
                    >
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="[font-family:var(--font-display),serif] text-xl tracking-tight text-slate-950">
                              {template.name}
                            </h3>
                            <p className="mt-2 text-sm leading-6 text-slate-500">{template.description}</p>
                          </div>
                          {active ? (
                            <Badge variant="secondary">Creating...</Badge>
                          ) : (
                            <Badge variant="secondary">Instant board</Badge>
                          )}
                        </div>

                        <p className="mt-3 text-sm leading-6 text-slate-600">{template.prompt}</p>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {template.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium tracking-wide text-slate-600"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-slate-400">
            Templates
          </p>
          <h3 className="[font-family:var(--font-display),serif] text-3xl tracking-tight text-slate-950">
            Start from a direction, then refine it.
          </h3>
        </div>

        <TemplatePicker
          templates={templates}
          activeTemplateId={activeTemplateId}
          onCreateTemplate={(templateId) => void handleTemplateCreate(templateId)}
        />
      </section>

      {isGenerating ? <LoadingPreview /> : null}
    </div>
  );
}