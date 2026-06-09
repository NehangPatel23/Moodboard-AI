'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion';
import { Check, Download, Pause, Play, Sparkles } from 'lucide-react';
import { EditorSectionBadge } from '@/components/board/EditorSectionBadge';
import { landingFeatures } from '@/components/landing/landing-features';
import {
  EDITOR_SECTION_META,
  EDITOR_SECTION_ORDER,
  type EditorSectionName,
} from '@/lib/editor-sections';
import {
  displayHeadingClass,
  heroGradientClass,
  sectionLabelClass,
} from '@/components/landing/landing-styles';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const WORKFLOW_STEPS = [
  {
    id: 'generate',
    label: 'Generate direction',
    summary: 'Turn a prompt into mood, palette, and structure.',
  },
  {
    id: 'refine',
    label: 'Refine palette & type',
    summary: 'Refresh colors and typography with one Gemini click.',
  },
  {
    id: 'collaborate',
    label: 'Collaborate live',
    summary: 'Comments, roles, and activity sync in real time.',
  },
  {
    id: 'export',
    label: 'Export & share',
    summary: 'Hand off JSON, PNG, PDF, or design tokens.',
  },
] as const;

const STEP_DURATION_MS = 4800;
const LOOP_PAUSE_MS = 1400;

const PROMPT = 'calm luxury wellness brand for women aged 25–40';
const PALETTE = ['#F7F2EB', '#A8B5A2', '#B89A6A', '#2D2A26'];
const EXPORT_FORMATS = ['JSON', 'PNG', 'PDF', 'Tokens'] as const;

function useStepTimers(
  active: boolean,
  isPaused: boolean,
  activeStep: number,
  onStep: (step: number) => void,
) {
  const timersRef = useRef<number[]>([]);
  const activeStepRef = useRef(activeStep);
  const onStepRef = useRef(onStep);

  useEffect(() => {
    activeStepRef.current = activeStep;
  }, [activeStep]);

  useEffect(() => {
    onStepRef.current = onStep;
  }, [onStep]);

  useEffect(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    if (!active || isPaused) return;

    let cancelled = false;

    const schedule = (fn: () => void, ms: number) => {
      timersRef.current.push(
        window.setTimeout(() => {
          if (!cancelled) fn();
        }, ms),
      );
    };

    const startFrom = (currentStep: number) => {
      for (let offset = 1; offset <= 4; offset += 1) {
        const nextStep = (currentStep + offset) % 4;
        schedule(() => onStepRef.current(nextStep), STEP_DURATION_MS * offset);
      }

      schedule(() => {
        onStepRef.current(0);
        startFrom(0);
      }, STEP_DURATION_MS * 4 + LOOP_PAUSE_MS);
    };

    startFrom(activeStepRef.current);

    return () => {
      cancelled = true;
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, [active, isPaused]);
}

function usePreserveScrollStep(setter: (step: number) => void) {
  return useCallback(
    (step: number) => {
      const scrollY = window.scrollY;
      setter(step);
      requestAnimationFrame(() => {
        window.scrollTo({ top: scrollY, left: 0, behavior: 'instant' });
      });
    },
    [setter],
  );
}

type StepPanelProps = {
  staticPreview: boolean;
  enabled: boolean;
};

function StepGeneratePanel({ staticPreview, enabled }: StepPanelProps) {
  const [typed, setTyped] = useState(0);
  const [phase, setPhase] = useState<'typing' | 'generating' | 'ready'>('typing');

  useEffect(() => {
    if (staticPreview || !enabled) return;

    const timers: number[] = [];
    let delay = 250;

    for (let index = 1; index <= PROMPT.length; index += 1) {
      const length = index;
      timers.push(window.setTimeout(() => setTyped(length), delay));
      delay += 24;
    }

    timers.push(window.setTimeout(() => setPhase('generating'), delay + 180));
    timers.push(window.setTimeout(() => setPhase('ready'), delay + 1050));

    return () => timers.forEach(clearTimeout);
  }, [staticPreview, enabled]);

  const resolvedPhase = staticPreview ? 'ready' : phase;
  const resolvedTyped = staticPreview ? PROMPT.length : typed;
  const text = PROMPT.slice(0, resolvedTyped);
  const promptClosed = resolvedPhase !== 'typing' || resolvedTyped === PROMPT.length;

  return (
    <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
      <div className="rounded-[1.35rem] border border-(--border) bg-(--surface)/80 p-5 backdrop-blur-sm">
        <p className={sectionLabelClass}>Board prompt</p>
        <p className="mt-3 min-h-16 text-sm leading-7 text-(--text-strong) md:text-base">
          {text ? `“${text}${promptClosed ? '”' : ''}` : 'Describe the creative direction…'}
          {phase === 'typing' && resolvedTyped > 0 && !promptClosed ? (
            <span className="ml-0.5 inline-block h-4 w-px animate-pulse bg-(--text-strong)" />
          ) : null}
        </p>
      </div>

      <div className="rounded-[1.35rem] border border-(--border) bg-(--surface)/80 p-5 backdrop-blur-sm">
        <p className={sectionLabelClass}>Generated output</p>

        {resolvedPhase === 'generating' ? (
          <div className="mt-3 space-y-3">
            <Skeleton className="h-6 w-28 rounded-full" />
            <div className="flex gap-2">
              <Skeleton className="h-7 w-16 rounded-full" />
              <Skeleton className="h-7 w-20 rounded-full" />
            </div>
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-10 w-10 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-3 w-full rounded-full" />
            <Skeleton className="h-3 w-[88%] rounded-full" />
          </div>
        ) : null}

        {resolvedPhase === 'ready' ? (
          <motion.div
            initial={staticPreview ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 space-y-3"
          >
            <p className={`text-2xl ${displayHeadingClass}`}>Calm luxury</p>
            <div className="flex flex-wrap gap-2">
              {['Wellness', 'Editorial'].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-(--border) bg-(--surface-elevated) px-2.5 py-1 text-[11px] text-(--text-muted)"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {PALETTE.map((hex) => (
                <div key={hex} className="overflow-hidden rounded-xl border border-(--border)">
                  <div className="h-10 w-full" style={{ backgroundColor: hex }} />
                  <p className="px-1.5 py-1 text-[9px] text-(--text-muted)">{hex}</p>
                </div>
              ))}
            </div>
            <p className="text-sm leading-6 text-(--text-muted)">
              A calm, elevated identity built around restraint, warmth, and trust.
            </p>
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}

function StepRefinePanel({ staticPreview, enabled }: StepPanelProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [showRefined, setShowRefined] = useState(false);

  useEffect(() => {
    if (staticPreview || !enabled) return;

    const timers = [
      window.setTimeout(() => setRefreshing(true), 500),
      window.setTimeout(() => {
        setRefreshing(false);
        setShowRefined(true);
      }, 1400),
    ];

    return () => timers.forEach(clearTimeout);
  }, [staticPreview, enabled]);

  const resolvedRefined = staticPreview || showRefined;
  const palette = resolvedRefined
    ? PALETTE
    : ['#E8DFD3', '#C9D4C3', '#C4A574', '#3D3832'];

  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-[1.35rem] border border-(--border) bg-(--surface)/80 p-5 backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className={sectionLabelClass}>Palette</p>
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium',
              refreshing
                ? 'gemini-creating-button text-slate-900'
                : 'gemini-enhance-button text-slate-900',
            )}
          >
            <Sparkles className={cn('h-3.5 w-3.5', refreshing && 'animate-pulse')} aria-hidden="true" />
            {refreshing ? 'Suggesting palette…' : 'Suggest palette'}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {palette.map((hex) => (
            <motion.div
              key={`${resolvedRefined}-${hex}`}
              initial={staticPreview ? false : { opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              className="overflow-hidden rounded-xl border border-(--border) bg-(--surface-elevated)"
            >
              <div className="h-14 w-full" style={{ backgroundColor: hex }} />
              <p className="px-2 py-1.5 text-[10px] text-(--text-muted)">{hex}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="rounded-[1.35rem] border border-(--border) bg-(--surface)/80 p-5 backdrop-blur-sm">
          <p className={sectionLabelClass}>Heading</p>
          <AnimatePresence mode="wait">
            <motion.p
              key={resolvedRefined ? 'bodoni' : 'inter'}
              initial={staticPreview ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className={cn('mt-2 text-2xl', resolvedRefined && displayHeadingClass)}
            >
              {resolvedRefined ? 'Bodoni Moda' : 'Inter'}
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="rounded-[1.35rem] border border-(--border) bg-(--surface)/80 p-5 backdrop-blur-sm">
          <p className={sectionLabelClass}>Body</p>
          <p className="mt-2 text-base font-medium text-(--text-strong)">DM Sans</p>
        </div>
      </div>
    </div>
  );
}

function StepCollaborateDemo({
  staticPreview,
  resolvedStep,
}: {
  staticPreview: boolean;
  resolvedStep: number;
}) {
  const [manualSelection, setManualSelection] = useState<{
    section: EditorSectionName;
    highlight: string | null;
    commentId: string | null;
  } | null>(null);

  const demoComments = useMemo(
    () => [
      {
        id: 'mira-palette',
        author: 'Mira',
        section: 'palette' as const,
        body: 'Love the sage — can we push warmth on the gold accent?',
        highlight: 'gold-swatch',
      },
      {
        id: 'alex-notes',
        author: 'Alex',
        section: 'notes' as const,
        body: 'Updated tone keywords and saved ✓',
      },
    ],
    [],
  );

  const autoSection: EditorSectionName =
    staticPreview || resolvedStep >= 1
      ? resolvedStep >= 2
        ? 'notes'
        : 'palette'
      : 'overview';
  const autoHighlight =
    staticPreview || resolvedStep === 1 ? 'gold-swatch' : null;

  const activeDemoSection = manualSelection?.section ?? autoSection;
  const activeHighlight = manualSelection?.highlight ?? autoHighlight;
  const selectedCommentId = manualSelection?.commentId ?? null;

  const handleCommentSelect = (comment: (typeof demoComments)[number]) => {
    setManualSelection({
      section: comment.section,
      highlight: comment.highlight ?? null,
      commentId: comment.id,
    });
  };

  const handleTabSelect = (section: EditorSectionName) => {
    setManualSelection({
      section,
      highlight: section === 'palette' ? 'gold-swatch' : null,
      commentId: null,
    });
  };

  const demoPalette = [
    { id: 'ivory', hex: '#F7F2EB', label: 'Ivory' },
    { id: 'sage', hex: '#A8B5A2', label: 'Sage' },
    { id: 'gold-swatch', hex: '#B89A6A', label: 'Gold accent' },
    { id: 'charcoal', hex: '#2D2A26', label: 'Charcoal' },
  ];

  const demoNotes = ['warm minimal', 'premium calm', 'editorial restraint'];

  const activeSectionMeta = EDITOR_SECTION_META[activeDemoSection];

  return (
    <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="rounded-[1.35rem] border border-(--border) bg-(--surface)/80 p-5 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-2">
          <p className={sectionLabelClass}>Board preview</p>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5" role="tablist" aria-label="Board sections">
          {EDITOR_SECTION_ORDER.map((section) => {
            const meta = EDITOR_SECTION_META[section];
            const Icon = meta.icon;
            const isActive = activeDemoSection === section;
            return (
              <button
                key={section}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => handleTabSelect(section)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] transition',
                  isActive
                    ? cn('border-(--text-strong)/15 bg-(--surface-elevated) text-(--text-strong) ring-1', meta.tabActiveRingClass)
                    : 'border-(--border) bg-(--surface)/70 text-(--text-muted) hover:text-(--text-strong)',
                )}
              >
                <Icon className="h-3 w-3" aria-hidden="true" />
                {meta.label}
              </button>
            );
          })}
        </div>

        <div
          className={cn(
            'mt-4 rounded-xl border border-(--border) bg-(--surface-elevated) p-4 transition-shadow',
            `ring-1 ${activeSectionMeta.tabActiveRingClass}`,
          )}
        >
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-(--text-muted)">
            {activeSectionMeta.label}
          </p>

          {activeDemoSection === 'overview' ? (
            <div className="mt-3 space-y-2">
              <p className="text-sm font-medium text-(--text-strong)">Calm luxury editorial</p>
              <p className="text-xs leading-5 text-(--text-muted)">
                Warm neutrals, restrained type, and premium spacing for a boutique hospitality brand.
              </p>
            </div>
          ) : null}

          {activeDemoSection === 'palette' ? (
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {demoPalette.map((swatch) => (
                <div key={swatch.id} className="space-y-1.5">
                  <div
                    className={cn(
                      'aspect-square rounded-lg border border-(--border) transition',
                      activeHighlight === swatch.id
                        ? 'ring-2 ring-amber-400/70 shadow-[0_0_24px_rgba(251,191,36,0.35)]'
                        : '',
                    )}
                    style={{ backgroundColor: swatch.hex }}
                    aria-hidden="true"
                  />
                  <p className="text-[10px] text-(--text-muted)">{swatch.label}</p>
                </div>
              ))}
            </div>
          ) : null}

          {activeDemoSection === 'typography' ? (
            <div className="mt-3 space-y-3">
              <p className="[font-family:var(--font-display),serif] text-2xl text-(--text-strong)">Bodoni Moda</p>
              <p className="text-sm text-(--text-muted)">DM Sans · body and UI</p>
            </div>
          ) : null}

          {activeDemoSection === 'references' ? (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {['Editorial', 'Lifestyle', 'Campaign'].map((label) => (
                <div
                  key={label}
                  className="aspect-4/3 rounded-lg border border-(--border) bg-(--surface-subtle)"
                  aria-hidden="true"
                />
              ))}
            </div>
          ) : null}

          {activeDemoSection === 'notes' ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {demoNotes.map((note) => (
                <span
                  key={note}
                  className="rounded-full border border-violet-200 bg-violet-50/90 px-2.5 py-1 text-[10px] font-medium text-violet-950 dark:border-violet-300/25 dark:bg-violet-300/10 dark:text-violet-50"
                >
                  {note}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="rounded-[1.35rem] border border-(--border) bg-(--surface)/80 p-5 backdrop-blur-sm">
        <p className={sectionLabelClass}>Comments & activity</p>
        <div className="mt-4 space-y-3">
          <AnimatePresence>
            {demoComments.slice(0, resolvedStep).map((comment, index) => {
              const isSelected = selectedCommentId === comment.id;
              const isLinkedSection = activeDemoSection === comment.section;
              return (
                <motion.button
                  key={comment.id}
                  type="button"
                  initial={staticPreview ? false : { opacity: 0, x: index === 0 ? -10 : 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => handleCommentSelect(comment)}
                  className={cn(
                    'block w-full rounded-xl border bg-(--surface-elevated) px-4 py-3 text-left transition',
                    index === 1 ? 'ml-6' : '',
                    isSelected || isLinkedSection
                      ? cn('border-(--text-strong)/15 ring-1', EDITOR_SECTION_META[comment.section].tabActiveRingClass)
                      : 'border-(--border)',
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-(--text-strong)">{comment.author}</p>
                    <EditorSectionBadge section={comment.section} showIcon />
                  </div>
                  <p className="mt-1 text-sm text-(--text-strong)">{comment.body}</p>
                </motion.button>
              );
            })}
          </AnimatePresence>

          <AnimatePresence>
            {resolvedStep >= 3 ? (
              <motion.p
                initial={staticPreview ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-(--text-muted)"
              >
                Activity replay · synced 2s ago
              </motion.p>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function StepCollaboratePanel({ staticPreview, enabled }: StepPanelProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (staticPreview || !enabled) return;

    const timers = [
      window.setTimeout(() => setStep(1), 600),
      window.setTimeout(() => setStep(2), 1700),
      window.setTimeout(() => setStep(3), 2900),
    ];

    return () => timers.forEach(clearTimeout);
  }, [staticPreview, enabled]);

  const resolvedStep = staticPreview ? 3 : step;

  return (
    <StepCollaborateDemo
      key={staticPreview ? 'static' : `step-${resolvedStep}`}
      staticPreview={staticPreview}
      resolvedStep={resolvedStep}
    />
  );
}

function StepExportPanel({ staticPreview, enabled }: StepPanelProps) {
  const [formatIndex, setFormatIndex] = useState(0);
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    if (staticPreview || !enabled) return;

    const timers = [
      window.setTimeout(() => setFormatIndex(1), 900),
      window.setTimeout(() => setFormatIndex(2), 1800),
      window.setTimeout(() => setFormatIndex(3), 2700),
      window.setTimeout(() => setDownloaded(true), 3600),
    ];

    return () => timers.forEach(clearTimeout);
  }, [staticPreview, enabled]);

  const resolvedFormatIndex = staticPreview ? 3 : formatIndex;
  const resolvedDownloaded = staticPreview || downloaded;
  const format = EXPORT_FORMATS[resolvedFormatIndex];

  return (
    <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded-[1.35rem] border border-(--border) bg-(--surface)/80 p-5 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-2">
          <p className={sectionLabelClass}>Export board</p>
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border border-(--border) px-2.5 py-1 text-[10px] font-medium',
              resolvedDownloaded
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                : 'bg-(--surface-elevated) text-(--text-muted)',
            )}
          >
            {resolvedDownloaded ? (
              <>
                <Check className="h-3 w-3" aria-hidden="true" />
                Downloaded
              </>
            ) : (
              <>
                <Download className="h-3 w-3" aria-hidden="true" />
                Ready
              </>
            )}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {EXPORT_FORMATS.map((label, index) => (
            <span
              key={label}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                index === resolvedFormatIndex
                  ? 'border-(--text-strong)/20 bg-(--text-strong) text-(--background)'
                  : 'border-(--border) bg-(--surface-elevated) text-(--text-muted)',
              )}
            >
              {label}
            </span>
          ))}
        </div>

        <p className="mt-4 text-sm leading-6 text-(--text-muted)">
          Share on Discover or export for developer handoff.
        </p>
      </div>

      <div className="rounded-[1.35rem] border border-(--border) bg-(--surface)/80 p-5 backdrop-blur-sm">
        <p className={sectionLabelClass}>Preview</p>
        <AnimatePresence mode="wait">
          <motion.div
            key={format}
            initial={staticPreview ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="mt-3 min-h-36 rounded-xl border border-(--border) bg-(--surface-elevated) p-4 font-mono text-xs leading-6 text-(--text-muted)"
          >
            {format === 'JSON' ? (
              <>
                <span className="text-violet-600 dark:text-violet-300">{'{'}</span>
                <br />
                {'  '}
                <span className="text-sky-600 dark:text-sky-300">&quot;title&quot;</span>: &quot;Soft Luxury
                Wellness&quot;,
                <br />
                {'  '}
                <span className="text-sky-600 dark:text-sky-300">&quot;mood&quot;</span>: &quot;Calm luxury&quot;,
                <br />
                {'  '}
                <span className="text-sky-600 dark:text-sky-300">&quot;palette&quot;</span>: [&quot;#F7F2EB&quot;, …]
                <br />
                <span className="text-violet-600 dark:text-violet-300">{'}'}</span>
              </>
            ) : null}
            {format === 'PNG' ? (
              <div className="space-y-3 font-sans">
                <div className="grid grid-cols-4 gap-2">
                  {PALETTE.map((hex) => (
                    <span
                      key={hex}
                      className="aspect-square rounded-lg border border-(--border)"
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
                <p className="text-xs">High-resolution board preview · 2400×1600</p>
              </div>
            ) : null}
            {format === 'PDF' ? (
              <div className="flex flex-col items-center gap-3 font-sans">
                <div className="h-24 w-16 rounded-lg border border-(--border) bg-white shadow-sm dark:bg-slate-900" />
                <p className="text-xs">Multi-page moodboard PDF</p>
              </div>
            ) : null}
            {format === 'Tokens' ? (
              <>
                <span className="text-emerald-600 dark:text-emerald-300">--color-ivory</span>: #F7F2EB;
                <br />
                <span className="text-emerald-600 dark:text-emerald-300">--color-sage</span>: #A8B5A2;
                <br />
                <span className="text-emerald-600 dark:text-emerald-300">--font-heading</span>: &quot;Bodoni Moda&quot;;
                <br />
                <span className="text-emerald-600 dark:text-emerald-300">--font-body</span>: &quot;DM Sans&quot;;
              </>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function WorkflowStepPanel({
  step,
  staticPreview,
  enabled,
}: {
  step: number;
  staticPreview: boolean;
  enabled: boolean;
}) {
  switch (step) {
    case 0:
      return <StepGeneratePanel staticPreview={staticPreview} enabled={enabled} />;
    case 1:
      return <StepRefinePanel staticPreview={staticPreview} enabled={enabled} />;
    case 2:
      return <StepCollaboratePanel staticPreview={staticPreview} enabled={enabled} />;
    case 3:
      return <StepExportPanel staticPreview={staticPreview} enabled={enabled} />;
    default:
      return null;
  }
}

export function CapabilitiesWorkflow() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { amount: 0.2 });
  const reduceMotion = useReducedMotion();
  const autoPlayEnabled = inView && !reduceMotion;
  const [activeStep, setActiveStep] = useState(0);
  const [isManuallyPaused, setIsManuallyPaused] = useState(false);
  const [isHoverPaused, setIsHoverPaused] = useState(false);
  const setActiveStepPreserveScroll = usePreserveScrollStep(setActiveStep);

  const isPaused = isManuallyPaused || isHoverPaused;

  useStepTimers(autoPlayEnabled, isPaused, activeStep, setActiveStepPreserveScroll);

  const showStaticStep = Boolean(reduceMotion) || isManuallyPaused;

  const handleStepSelect = useCallback(
    (index: number) => {
      setActiveStepPreserveScroll(index);
      setIsManuallyPaused(true);
    },
    [setActiveStepPreserveScroll],
  );

  const handleTogglePlayback = useCallback(() => {
    setIsManuallyPaused((current) => !current);
  }, []);

  return (
    <section
      ref={ref}
      aria-labelledby="capabilities-workflow-heading"
      className="relative overflow-hidden rounded-[2.5rem] border border-(--border) bg-(--surface-elevated) p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)] md:p-8 dark:shadow-[0_24px_60px_rgba(0,0,0,0.22)] [overflow-anchor:none]"
    >
      <div aria-hidden="true" className={heroGradientClass} />

      <div className="relative space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className={sectionLabelClass}>See it in action</p>
            <h3
              id="capabilities-workflow-heading"
              className={`mt-2 text-2xl md:text-3xl ${displayHeadingClass}`}
            >
              From prompt to export in four steps
            </h3>
          </div>

          {autoPlayEnabled ? (
            <button
              type="button"
              onClick={handleTogglePlayback}
              aria-pressed={isManuallyPaused}
              className="inline-flex h-10 shrink-0 items-center gap-2 self-start rounded-full border border-(--border) bg-(--surface)/80 px-4 text-sm font-medium text-(--text-strong) shadow-sm transition hover:bg-(--surface-subtle) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--ring) focus-visible:ring-offset-2 focus-visible:ring-offset-(--background) sm:self-auto"
            >
              {isManuallyPaused ? (
                <>
                  <Play className="h-4 w-4" aria-hidden="true" />
                  Play demo
                </>
              ) : (
                <>
                  <Pause className="h-4 w-4" aria-hidden="true" />
                  Pause demo
                </>
              )}
            </button>
          ) : null}
        </div>

        <div role="group" aria-label="Workflow steps" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {WORKFLOW_STEPS.map((step, index) => {
            const feature = landingFeatures[index];
            const isActive = activeStep === index;

            return (
              <button
                key={step.id}
                type="button"
                aria-current={isActive ? 'step' : undefined}
                onClick={() => handleStepSelect(index)}
                className={cn(
                  'min-h-28 w-full rounded-[1.25rem] border px-4 py-3 text-left transition-[opacity,box-shadow,border-color,background-color] duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--ring) focus-visible:ring-offset-2 focus-visible:ring-offset-(--background)',
                  isActive
                    ? 'border-(--text-strong)/15 bg-(--surface)/85 opacity-100 shadow-[0_12px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm'
                    : 'border-(--border) bg-(--surface)/40 opacity-70 hover:border-(--text-muted)/30 hover:opacity-100',
                )}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold',
                      isActive
                        ? 'bg-(--text-strong) text-(--background)'
                        : 'border border-(--border) bg-(--surface-elevated) text-(--text-muted)',
                    )}
                  >
                    0{index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-(--text-strong)">{step.label}</p>
                    <p className="mt-1 text-xs leading-5 text-(--text-muted)">{step.summary}</p>
                    {feature ? (
                      <div className={`mt-2 h-1 w-10 rounded-full ${feature.accent}`} />
                    ) : null}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div
          id="workflow-step-panel"
          aria-live="polite"
          aria-atomic="true"
          className="grid overflow-hidden rounded-[1.75rem] border border-(--border) bg-(--surface)/70 p-5 backdrop-blur-sm [overflow-anchor:none] md:p-6"
          onMouseEnter={() => {
            if (autoPlayEnabled && !isManuallyPaused) setIsHoverPaused(true);
          }}
          onMouseLeave={() => {
            if (autoPlayEnabled && !isManuallyPaused) setIsHoverPaused(false);
          }}
        >
          {WORKFLOW_STEPS.map((step, index) => {
            const isActive = activeStep === index;
            const panelStatic = showStaticStep || !isActive;

            return (
              <div
                key={step.id}
                className={cn(
                  'col-start-1 row-start-1 transition-opacity duration-300',
                  isActive
                    ? 'z-10 opacity-100'
                    : 'pointer-events-none invisible z-0 opacity-0',
                )}
                aria-hidden={!isActive}
              >
                <WorkflowStepPanel
                  step={index}
                  staticPreview={panelStatic}
                  enabled={isActive && !panelStatic}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
