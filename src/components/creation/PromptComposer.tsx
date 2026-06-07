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
  fetchGeneratedBoardDraft,
  fetchGeneratedBoardDraftFromTemplate,
  fetchGenerationProvider,
  getBoardTemplates,
  getQuickPromptSuggestions,
} from '@/lib/ai';
import { GenerationSourceBadge } from '@/components/creation/GenerationSourceBadge';
import { loadBoards, saveBoards, upsertBoard } from '@/lib/board-store';
import { readAppSettings } from '@/lib/settings-store';
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
          className="rounded-full border-(--border) bg-(--surface) text-(--text-muted) hover:bg-(--surface-subtle) hover:text-(--text-strong) dark:bg-[rgba(255,255,255,0.05)] dark:text-(--text-muted) dark:hover:bg-[rgba(255,255,255,0.08)] dark:hover:text-(--text-strong)"
        >
          {suggestion.charAt(0).toUpperCase() + suggestion.slice(1)}
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

const templateAccentGradients = [
  'linear-gradient(90deg, rgba(125, 211, 252, 0.98) 0%, rgba(167, 243, 208, 0.98) 100%)',
  'linear-gradient(90deg, rgba(52, 211, 153, 0.98) 0%, rgba(251, 191, 36, 0.98) 100%)',
  'linear-gradient(90deg, rgba(251, 191, 36, 0.98) 0%, rgba(251, 146, 60, 0.98) 55%, rgba(244, 114, 182, 0.98) 100%)',
  'linear-gradient(90deg, rgba(167, 139, 250, 0.98) 0%, rgba(96, 165, 250, 0.98) 100%)',
];

function TemplatePicker({ templates, activeTemplateId, onCreateTemplate }: TemplatePickerProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3" aria-label="Board templates">
      {templates.map((template, index) => {
        const isActive = activeTemplateId === template.id;
        const accentGradient = templateAccentGradients[index % templateAccentGradients.length];

        return (
          <button
            key={template.id}
            type="button"
            onClick={() => onCreateTemplate(template.id)}
            aria-pressed={isActive}
            aria-label={`Create board from template ${template.name}`}
            className={cn(
              'group rounded-[1.75rem] text-left transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--ring) focus-visible:ring-offset-2 focus-visible:ring-offset-(--background) dark:focus-visible:ring-[rgba(255,255,255,0.22)]',
              isActive ? 'ring-1 ring-(--border) dark:ring-white/10' : '',
            )}
          >
            <Card className="h-full overflow-hidden rounded-[1.75rem] border border-(--border) bg-(--surface-elevated) shadow-[0_10px_30px_rgba(15,23,42,0.06)] dark:shadow-[0_18px_50px_rgba(0,0,0,0.22)]">
              <div
                className="h-1.5 w-full"
                style={{
                  backgroundImage: accentGradient,
                  boxShadow: '0 0 18px rgba(255, 255, 255, 0.08)',
                }}
              />

              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="[font-family:var(--font-display),serif] text-2xl tracking-tight text-(--text-strong)">
                      {template.name}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-(--text-muted)">
                      {template.description}
                    </p>
                  </div>

                  <Badge variant="secondary">Instant board</Badge>
                </div>

                {template.mood || template.summary ? (
                  <div className="mt-4 rounded-[1.35rem] border border-(--border) bg-(--surface) p-4 dark:bg-[rgba(255,255,255,0.04)]">
                    <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-(--text-muted)">
                      Mood
                    </p>
                    {template.mood ? (
                      <p className="[font-family:var(--font-display),serif] mt-2 text-xl capitalize tracking-tight text-(--text-strong)">
                        {template.mood}
                      </p>
                    ) : null}
                    {template.summary ? (
                      <p className="mt-2 text-sm leading-6 text-(--text-muted)">
                        {template.summary}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                <p className="mt-4 text-sm leading-6 text-(--text-strong)">
                  {template.prompt.charAt(0).toUpperCase() + template.prompt.slice(1)}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {template.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-(--border) bg-(--surface) px-3 py-1 text-[11px] font-medium tracking-wide text-(--text-muted) dark:bg-[rgba(255,255,255,0.04)]"
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
    <section className="rounded-[2.25rem] border border-(--border) bg-(--surface-elevated) p-6 shadow-[0_20px_50px_rgba(15,23,42,0.06)] dark:shadow-[0_24px_60px_rgba(0,0,0,0.22)]">
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
  const [configuredProvider, setConfiguredProvider] = useState<'gemini' | 'mock' | null>(null);
  const [generationSource, setGenerationSource] = useState<'gemini' | 'mock' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void fetchGenerationProvider()
      .then((provider) => {
        if (!cancelled) {
          setConfiguredProvider(provider);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setConfiguredProvider('mock');
        }
      });

    return () => {
      cancelled = true;
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
    if (errorMessage && !isGenerating) {
      setErrorMessage(null);
    }
    if (generationSource && !isGenerating) {
      setGenerationSource(null);
    }
  };

  function formatGenerationError(error: unknown): string {
    if (error instanceof Error && error.message) {
      try {
        const parsed = JSON.parse(error.message) as { error?: { message?: string } };
        if (parsed.error?.message) return parsed.error.message;
      } catch {
        // Plain text error message.
      }
      return error.message;
    }
    return 'Something went wrong while generating the board.';
  }

  function formatSuccessStatus(
    boardTitle: string,
    followUpPrompt: string,
    source: 'gemini' | 'mock' | undefined,
    notice?: string,
  ): string {
    const prefix = source === 'gemini' ? 'AI-generated' : 'Demo-generated';
    const base = `${prefix} “${boardTitle}”. ${followUpPrompt}`;
    return notice ? `${base} ${notice}` : base;
  }

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
    setErrorMessage(null);
    setGenerationSource(null);
    setStatus('Generating mood, palette, typography, and references...');

    try {
      const { board: generatedBoard, followUpPrompt, source, notice } =
        await fetchGeneratedBoardDraft(trimmedPrompt);
      setGenerationSource(source ?? 'mock');
      setStatus('Saving your board...');

      const board = { ...generatedBoard, visibility: readAppSettings().defaultVisibility };
      const existingBoards = loadBoards();
      const nextBoards = upsertBoard(existingBoards, board);
      saveBoards(nextBoards);

      setStatus(formatSuccessStatus(board.title, followUpPrompt, source, notice));

      redirectTimerRef.current = window.setTimeout(() => {
        setIsGenerating(false);
        router.push(`/app/boards/${board.id}?source=${source ?? 'mock'}`);
      }, 650);
    } catch (error) {
      setIsGenerating(false);
      setErrorMessage(formatGenerationError(error));
      setStatus(null);
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
    setErrorMessage(null);
    setGenerationSource(null);
    setStatus(`Creating ${template.name} from template...`);

    try {
      const generated = await fetchGeneratedBoardDraftFromTemplate(templateId);
      setGenerationSource(generated.source ?? 'mock');
      const { notice } = generated;
      setStatus('Saving your board...');

      const board = { ...generated.board, visibility: readAppSettings().defaultVisibility };
      const existingBoards = loadBoards();
      const nextBoards = upsertBoard(existingBoards, board);
      saveBoards(nextBoards);

      setStatus(
        formatSuccessStatus(board.title, generated.followUpPrompt, generated.source, notice),
      );

      redirectTimerRef.current = window.setTimeout(() => {
        setIsGenerating(false);
        router.push(`/app/boards/${board.id}?source=${generated.source ?? 'mock'}`);
      }, 500);
    } catch (error) {
      setIsGenerating(false);
      setErrorMessage(formatGenerationError(error));
      setStatus(null);
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2.5rem] border border-(--border) bg-(--surface-elevated) p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)] md:p-8 dark:shadow-[0_24px_60px_rgba(0,0,0,0.22)]">
        <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <div className="space-y-4">
              {configuredProvider ? <GenerationSourceBadge source={configuredProvider} /> : null}

              <div className="space-y-2">
                <h2 className="[font-family:var(--font-display),serif] text-[clamp(2.6rem,6vw,5rem)] leading-[0.94] tracking-[-0.04em] text-(--text-strong)">
                  Describe your vision
                </h2>
                <p className="max-w-2xl text-sm leading-6 text-(--text-muted) md:text-base">
                  Write a prompt and the studio will shape mood, palette, typography, references, and notes.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-medium uppercase tracking-[0.28em] text-(--text-muted)">
                  Prompt
                </label>

                <Textarea
                  value={prompt}
                  onChange={(event) => updatePrompt(event.target.value)}
                  onKeyDown={handleComposerKeyDown}
                  placeholder="e.g. soft, modern brand for a skincare startup"
                  className="min-h-56 resize-y rounded-[1.75rem] border-(--border) bg-(--surface) px-4 py-4 text-base text-(--text-strong) shadow-none placeholder:text-(--text-muted)! focus-visible:ring-(--ring) dark:bg-[rgba(255,255,255,0.04)] dark:placeholder:text-[rgba(219,229,242,0.45)]"
                  disabled={isGenerating}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-7">
                <SuggestionPills suggestions={suggestions} onSelect={updatePrompt} />

                <Button
                  type="button"
                  onClick={() => void handleGenerate()}
                  disabled={!canGenerate}
                  aria-busy={isGenerating}
                  className="rounded-full bg-(--text-strong)! px-5 text-(--background)! shadow-sm hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                >
                  {isGenerating ? 'Generating...' : 'Generate board'}
                </Button>
              </div>

              <p className="text-xs text-(--text-muted)">Press Ctrl/Cmd + Enter to generate faster.</p>

              {generationSource && isGenerating ? (
                <GenerationSourceBadge source={generationSource} />
              ) : null}

              {status ? (
                <p className="text-sm leading-6 text-(--text-muted)" role="status" aria-live="polite">
                  {status}
                </p>
              ) : null}

              {errorMessage ? (
                <p
                  className="text-sm leading-6 text-red-600 dark:text-red-400"
                  role="alert"
                  aria-live="assertive"
                >
                  {errorMessage}
                </p>
              ) : null}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-4xl border border-(--border) bg-(--surface) p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] dark:bg-[rgba(255,255,255,0.04)] dark:shadow-[0_12px_30px_rgba(0,0,0,0.18)]">
              <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-(--text-muted)">
                Studio guide
              </p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-(--text-muted)">
                <li>Describe mood, audience, and materiality.</li>
                <li>Use a single sentence or a full brief.</li>
                <li>Templates give you a faster starting point.</li>
              </ul>
            </div>

            <div className="rounded-4xl border border-(--border) bg-(--surface) p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] dark:bg-[rgba(255,255,255,0.04)] dark:shadow-[0_12px_30px_rgba(0,0,0,0.18)]">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-(--text-muted)">
                  Templates
                </p>
                <Badge variant="secondary">{templates.length} ready-made directions</Badge>
              </div>

              <p className="mt-3 text-sm leading-6 text-(--text-muted)">
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
                        'w-full rounded-3xl border text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--ring) focus-visible:ring-offset-2 focus-visible:ring-offset-(--background) dark:focus-visible:ring-[rgba(255,255,255,0.22)]',
                        active
                          ? 'border-(--border) bg-(--surface-subtle) dark:border-white/10 dark:bg-[rgba(255,255,255,0.06)]'
                          : 'border-(--border) bg-(--surface-elevated) hover:bg-(--surface-subtle) dark:border-white/10 dark:bg-[rgba(255,255,255,0.03)] dark:hover:bg-[rgba(255,255,255,0.06)]',
                      )}
                    >
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="[font-family:var(--font-display),serif] text-xl tracking-tight text-(--text-strong)">
                              {template.name}
                            </h3>
                            <p className="mt-2 text-sm leading-6 text-(--text-muted)">
                              {template.description}
                            </p>
                          </div>

                          {active ? (
                            <Badge variant="secondary">Creating...</Badge>
                          ) : (
                            <Badge variant="secondary">Instant board</Badge>
                          )}
                        </div>

                        <p className="mt-3 text-sm leading-6 text-(--text-muted)">
                          {template.prompt}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {template.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full border border-(--border) bg-(--surface) px-3 py-1 text-[11px] font-medium tracking-wide text-(--text-muted) dark:bg-[rgba(255,255,255,0.04)]"
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
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-(--text-muted)">
            Templates
          </p>
          <h3 className="[font-family:var(--font-display),serif] text-3xl tracking-tight text-(--text-strong)">
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