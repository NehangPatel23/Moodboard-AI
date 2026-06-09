'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { displayHeadingClass, sectionLabelClass } from '@/components/landing/landing-styles';

const PROMPT = 'soft luxury wellness brand for women aged 25–40';

const PALETTE = [
  { hex: '#F7F2EB', label: 'Ivory' },
  { hex: '#A8B5A2', label: 'Sage' },
  { hex: '#B89A6A', label: 'Gold' },
  { hex: '#2D2A26', label: 'Charcoal' },
] as const;

const TYPOGRAPHY = [
  { role: 'Heading', font: 'Bodoni Moda' },
  { role: 'Body', font: 'DM Sans' },
] as const;

const REFERENCES = [
  { title: 'Soft linen texture', tone: 'from-[#F7F2EB] to-[#E8DFD3]' },
  { title: 'Spa interior light', tone: 'from-[#DDE5DA] to-[#A8B5A2]' },
  { title: 'Minimal packaging', tone: 'from-[#E8DCC8] to-[#B89A6A]' },
  { title: 'Editorial portrait', tone: 'from-[#6B6760] to-[#2D2A26]' },
] as const;

const SUMMARY =
  'A calm, elevated identity built around restraint, warmth, and trust — ivory, sage, muted gold, and charcoal.';

type DemoStatus = 'typing' | 'generating' | 'draft' | 'enriching' | 'ready';

type DemoState = {
  typedLength: number;
  showMood: boolean;
  paletteVisible: number;
  showSummary: boolean;
  typographyVisible: number;
  referencesVisible: number;
  status: DemoStatus;
};

const STATIC_DEMO_STATE: DemoState = {
  typedLength: PROMPT.length,
  showMood: true,
  paletteVisible: PALETTE.length,
  showSummary: true,
  typographyVisible: TYPOGRAPHY.length,
  referencesVisible: REFERENCES.length,
  status: 'ready',
};

const INITIAL_DEMO_STATE: DemoState = {
  typedLength: 0,
  showMood: false,
  paletteVisible: 0,
  showSummary: false,
  typographyVisible: 0,
  referencesVisible: 0,
  status: 'typing',
};

function statusLabel(status: DemoStatus, referencesVisible: number): string {
  if (status === 'typing') return 'Typing prompt';
  if (status === 'generating') return 'Generating';
  if (status === 'draft') return 'Draft ready';
  if (status === 'enriching') return `References ${referencesVisible}/${REFERENCES.length}`;
  return 'Ready';
}

function statusDotClass(status: DemoStatus): string {
  if (status === 'typing') return 'bg-(--text-muted)';
  if (status === 'generating') return 'bg-amber-500 animate-pulse';
  if (status === 'draft') return 'bg-sky-500';
  if (status === 'enriching') return 'bg-violet-500 animate-pulse';
  return 'bg-emerald-500';
}

function usePromptToBoardDemo(enabled: boolean): DemoState {
  const [state, setState] = useState<DemoState>(
    enabled ? INITIAL_DEMO_STATE : STATIC_DEMO_STATE,
  );
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    if (!enabled) {
      return;
    }

    let cancelled = false;

    const schedule = (fn: () => void, ms: number) => {
      timersRef.current.push(
        window.setTimeout(() => {
          if (!cancelled) fn();
        }, ms),
      );
    };

    const patch = (next: Partial<DemoState>) => {
      setState((current) => ({ ...current, ...next }));
    };

    const runCycle = () => {
      setState(INITIAL_DEMO_STATE);

      let delay = 500;

      for (let index = 1; index <= PROMPT.length; index += 1) {
        const length = index;
        schedule(() => patch({ typedLength: length, status: 'typing' }), delay);
        delay += 34;
      }

      schedule(() => patch({ status: 'generating' }), delay + 250);
      delay += 1100;

      schedule(() => patch({ status: 'draft', showMood: true }), delay);
      delay += 350;

      for (let index = 1; index <= PALETTE.length; index += 1) {
        const count = index;
        schedule(() => patch({ paletteVisible: count }), delay);
        delay += 170;
      }

      schedule(() => patch({ showSummary: true }), delay);
      delay += 450;

      for (let index = 1; index <= TYPOGRAPHY.length; index += 1) {
        const count = index;
        schedule(() => patch({ typographyVisible: count }), delay);
        delay += 220;
      }

      schedule(() => patch({ status: 'enriching', referencesVisible: 0 }), delay);
      delay += 300;

      for (let index = 1; index <= REFERENCES.length; index += 1) {
        const count = index;
        schedule(() => patch({ referencesVisible: count }), delay);
        delay += 420;
      }

      schedule(() => patch({ status: 'ready' }), delay);
      delay += 3200;

      schedule(runCycle, delay);
    };

    runCycle();

    return () => {
      cancelled = true;
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, [enabled]);

  return enabled ? state : STATIC_DEMO_STATE;
}

function PreviewCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-[1.35rem] border border-(--border) bg-(--surface-soft) p-4',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PromptToBoardAnimation() {
  const reduceMotion = useReducedMotion();
  const {
    typedLength,
    showMood,
    paletteVisible,
    showSummary,
    typographyVisible,
    referencesVisible,
    status,
  } = usePromptToBoardDemo(!reduceMotion);

  const typedPrompt = PROMPT.slice(0, typedLength);
  const isGenerating = status === 'generating';
  const showReferences = status === 'enriching' || status === 'ready';

  return (
    <div
      className="relative overflow-hidden rounded-[1.75rem] border border-(--border) bg-(--surface)/75 p-4 backdrop-blur-sm md:p-5"
      aria-hidden="true"
    >
      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <p className={sectionLabelClass}>Live preview</p>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-(--border) bg-(--surface-elevated) px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-(--text-muted)">
          <span className={cn('h-1.5 w-1.5 rounded-full', statusDotClass(status))} />
          {statusLabel(status, referencesVisible)}
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <PreviewCard>
          <p className={sectionLabelClass}>Prompt</p>
          <p className="mt-2 min-h-12 text-sm leading-6 text-(--text-strong) md:text-base">
            {typedPrompt ? `“${typedPrompt}` : ''}
            {status === 'typing' ? (
              <motion.span
                aria-hidden="true"
                className="inline-block w-0.5 translate-y-px bg-(--text-strong)"
                animate={reduceMotion ? undefined : { opacity: [1, 0, 1] }}
                transition={
                  reduceMotion ? undefined : { duration: 0.9, repeat: Infinity, ease: 'linear' }
                }
              >
                &nbsp;
              </motion.span>
            ) : null}
            {typedPrompt && status !== 'typing' ? '”' : null}
            {!typedPrompt && status === 'typing' ? (
              <span className="text-(--text-muted)">Enter a creative brief…</span>
            ) : null}
          </p>
        </PreviewCard>

        <PreviewCard>
          <p className={sectionLabelClass}>Generated mood</p>

          {isGenerating ? (
            <div className="mt-3 space-y-3">
              <Skeleton className="h-7 w-32 rounded-xl" />
              <div className="flex gap-2">
                {PALETTE.map((color) => (
                  <Skeleton key={color.hex} className="h-8 w-8 rounded-xl" />
                ))}
              </div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {showMood ? (
                <motion.div
                  key="mood"
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  <p className={`mt-2 text-xl ${displayHeadingClass}`}>Calm luxury</p>
                  <div className="mt-3 flex gap-2">
                    {PALETTE.map((color, index) => (
                      <motion.span
                        key={color.hex}
                        initial={reduceMotion ? false : { opacity: 0, scale: 0.82 }}
                        animate={
                          index < paletteVisible
                            ? { opacity: 1, scale: 1 }
                            : { opacity: 0, scale: 0.82 }
                        }
                        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                        className="h-8 w-8 rounded-xl border border-(--border) shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]"
                        style={{ backgroundColor: color.hex }}
                        title={color.label}
                      />
                    ))}
                  </div>
                </motion.div>
              ) : (
                <div className="mt-3 h-[4.5rem]" />
              )}
            </AnimatePresence>
          )}
        </PreviewCard>

        <PreviewCard className="md:col-span-2">
          <p className={sectionLabelClass}>Creative summary</p>

          {isGenerating ? (
            <div className="mt-3 space-y-2">
              <Skeleton className="h-3 w-full rounded-full" />
              <Skeleton className="h-3 w-[92%] rounded-full" />
              <Skeleton className="h-3 w-[78%] rounded-full" />
            </div>
          ) : showSummary ? (
            <motion.p
              className="mt-2 text-sm leading-6 text-(--text-muted) md:text-base"
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              {SUMMARY}
            </motion.p>
          ) : (
            <div className="mt-3 h-16" />
          )}
        </PreviewCard>

        <AnimatePresence>
          {typographyVisible > 0 ? (
            <motion.div
              key="typography"
              className="md:col-span-2"
              initial={reduceMotion ? false : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <PreviewCard>
                <p className={sectionLabelClass}>Typography</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {TYPOGRAPHY.map((item, index) => (
                    <motion.div
                      key={item.role}
                      initial={reduceMotion ? false : { opacity: 0, x: -8 }}
                      animate={
                        index < typographyVisible
                          ? { opacity: 1, x: 0 }
                          : { opacity: 0, x: -8 }
                      }
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="rounded-xl border border-(--border) bg-(--surface-elevated) px-3 py-2.5"
                    >
                      <p className="text-[10px] uppercase tracking-[0.18em] text-(--text-muted)">
                        {item.role}
                      </p>
                      <p
                        className={cn(
                          'mt-1 text-sm text-(--text-strong)',
                          item.role === 'Heading' && displayHeadingClass,
                        )}
                      >
                        {item.font}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </PreviewCard>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <AnimatePresence>
          {showReferences ? (
            <motion.div
              key="references"
              className="md:col-span-2"
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <PreviewCard>
                <p className={sectionLabelClass}>References</p>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {REFERENCES.map((reference, index) => {
                    const isLoaded = index < referencesVisible;

                    return (
                      <div
                        key={reference.title}
                        className="overflow-hidden rounded-xl border border-(--border) bg-(--surface-elevated)"
                      >
                        <div className="relative aspect-[4/3] bg-(--surface-muted)">
                          {isLoaded ? (
                            <motion.div
                              initial={reduceMotion ? false : { opacity: 0, scale: 1.04 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                              className={cn('absolute inset-0 bg-linear-to-br', reference.tone)}
                            />
                          ) : (
                            <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
                          )}
                        </div>
                        <p className="line-clamp-1 px-2 py-1.5 text-[11px] font-medium text-(--text-strong)">
                          {reference.title}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </PreviewCard>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {status === 'generating' ? (
        <motion.div
          className="pointer-events-none absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-sky-400/60 to-transparent"
          animate={reduceMotion ? undefined : { opacity: [0.2, 0.9, 0.2], x: ['-20%', '20%', '-20%'] }}
          transition={
            reduceMotion ? undefined : { duration: 1.8, repeat: Infinity, ease: 'easeInOut' }
          }
          aria-hidden="true"
        />
      ) : null}
    </div>
  );
}
