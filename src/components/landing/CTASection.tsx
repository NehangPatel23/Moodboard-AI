'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { useGatedHref } from '@/components/auth/use-gated-href';
import {
  appDisplayHeadingClass,
  appElevatedCardClass,
  appGlassPanelClass,
  appHeroGradientClass,
  appHeroSectionClass,
  appOutlineButtonClass,
  appPrimaryButtonClass,
  appSectionLabelClass,
  appSwatchInsetClass,
} from '@/components/shared/app-surface-styles';

function MoodBoardMark({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className={className} fill="none">
      <circle cx="24" cy="24" r="18" stroke="currentColor" strokeOpacity="0.14" strokeWidth="1.5" />
      <circle cx="24" cy="24" r="12" stroke="currentColor" strokeOpacity="0.08" strokeWidth="1" />
      <path
        d="M14.5 31V17.5L24 28.5L33.5 17.5V31"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DecorativeOrbitVisual() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={`relative min-h-82.5 overflow-hidden lg:min-h-95 ${appElevatedCardClass}`}
      aria-hidden="true"
      initial={reduceMotion ? false : { opacity: 0, scale: 0.98, x: 18 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, scale: 1, x: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
      whileHover={reduceMotion ? undefined : { y: -3 }}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-5 top-7 h-28 w-28 rounded-full border border-(--border) opacity-[0.42] lg:left-10 lg:top-10 lg:h-40 lg:w-40" />
        <div className="absolute right-10 top-12 h-52 w-52 rounded-full border border-(--border) opacity-[0.24] lg:right-14 lg:top-28 lg:h-72 lg:w-72" />
        <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-(--border) opacity-[0.14] lg:h-144 lg:w-xl" />
        <div className="absolute bottom-10 left-14 h-24 w-24 rounded-full border border-(--border) opacity-[0.3] lg:bottom-16 lg:left-16 lg:h-36 lg:w-36" />
        <div className="absolute right-12 bottom-14 h-28 w-28 rounded-full border border-(--border) opacity-[0.28] lg:right-16 lg:bottom-18 lg:h-40 lg:w-40" />
        <div className="absolute inset-x-10 top-1/2 h-px -translate-y-1/2 bg-(--border) opacity-[0.26]" />
        <div className="absolute left-1/2 top-14 h-[calc(100%-7rem)] w-px -translate-x-1/2 bg-(--border) opacity-[0.1]" />
      </div>

      <motion.div
        className={`absolute left-6 top-6 z-20 px-5 py-5 lg:left-10 lg:top-8 lg:px-6 lg:py-6 ${appGlassPanelClass}`}
        initial={false}
        animate={reduceMotion ? undefined : { y: [0, -5, 0], rotate: [-0.35, 0.35, -0.35] }}
        transition={reduceMotion ? undefined : { duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-[1.15rem] border border-(--border) bg-(--surface-elevated) text-(--text-strong) shadow-[var(--shadow-card)]">
            <MoodBoardMark className="h-8 w-8" />
          </div>

          <div className="space-y-3">
            <div className="h-2.5 w-36 rounded-full border border-(--border) bg-(--surface-soft)" />
            <div className="h-2.5 w-28 rounded-full border border-(--border) bg-(--surface-soft)" />
          </div>
        </div>
      </motion.div>

      <motion.div
        className={`absolute right-6 top-24 z-30 w-68 px-5 py-5 lg:right-14 lg:top-28 lg:w-76 lg:px-6 lg:py-6 ${appGlassPanelClass}`}
        initial={false}
        animate={reduceMotion ? undefined : { y: [0, 5, 0], rotate: [0.4, -0.4, 0.4] }}
        transition={reduceMotion ? undefined : { duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="flex items-center justify-between gap-4">
          <p className={appSectionLabelClass}>Visual language</p>
          <span className="h-2 w-12 rounded-full border border-(--border) bg-(--surface-soft)" />
        </div>

        <div className="mt-4 grid grid-cols-4 gap-3">
          {['#F7F2EB', '#A8B5A2', '#B89A6A', '#2D2A26'].map((color) => (
            <span
              key={color}
              className={`h-14 rounded-2xl border border-(--border) ${appSwatchInsetClass}`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>

        <div className="mt-4 h-px bg-(--border) opacity-60" />

        <div className="mt-4 flex items-center gap-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-(--text-strong) opacity-30" />
          <span className="h-2.5 w-2.5 rounded-full bg-(--text-strong) opacity-50" />
          <span className="h-2.5 w-2.5 rounded-full bg-(--text-strong) opacity-75" />
          <span className="ml-1 h-2.5 w-12 rounded-full border border-(--border) bg-(--surface-soft)" />
        </div>
      </motion.div>

      <motion.div
        className={`absolute left-6 bottom-6 z-10 w-60 px-5 py-5 lg:left-10 lg:bottom-8 lg:w-[16rem] lg:px-6 lg:py-6 ${appGlassPanelClass}`}
        initial={false}
        animate={reduceMotion ? undefined : { y: [0, -4, 0], x: [0, 4, 0] }}
        transition={reduceMotion ? undefined : { duration: 7.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-(--border) bg-(--surface-elevated) text-(--text-strong)">
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-(--text-strong) opacity-35" />
              <span className="h-2.5 w-2.5 rounded-full bg-(--text-strong) opacity-55" />
              <span className="h-2.5 w-2.5 rounded-full bg-(--text-strong) opacity-80" />
            </div>
          </div>

          <div className="flex-1 space-y-2">
            <div className="h-2.5 w-24 rounded-full border border-(--border) bg-(--surface-soft)" />
            <div className="h-2.5 w-16 rounded-full border border-(--border) bg-(--surface-soft)" />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function CTASection() {
  const reduceMotion = useReducedMotion();
  const beginBoardHref = useGatedHref('/app/new');

  return (
    <motion.section
      aria-labelledby="landing-cta-heading"
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        className={`relative overflow-hidden px-6 py-10 md:px-10 md:py-12 lg:grid lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-10 ${appHeroSectionClass}`}
        whileHover={reduceMotion ? undefined : { y: -4 }}
        transition={{ duration: 0.2 }}
      >
        <div aria-hidden="true" className={appHeroGradientClass} />

        <motion.div
          className="relative max-w-2xl space-y-5"
          initial={reduceMotion ? false : { opacity: 0, x: -12 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.75, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className={appSectionLabelClass}>Get started</p>
          <h2
            id="landing-cta-heading"
            className={`text-3xl md:text-4xl ${appDisplayHeadingClass}`}
          >
            Start with a prompt. Leave with a creative direction.
          </h2>
          <p className="text-sm leading-7 text-(--text-muted) md:text-base">
            Build a moodboard that looks polished, feels intentional, and is easy to iterate on —
            then share it on Discover or export for your team.
          </p>

          <div className="flex flex-wrap gap-3 pt-1">
            <Link href={beginBoardHref} className={appPrimaryButtonClass}>
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Begin your first board
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
            <Link href="/about" className={appOutlineButtonClass}>
              Learn more
            </Link>
          </div>
        </motion.div>

        <div className="relative mt-8 lg:mt-0">
          <DecorativeOrbitVisual />
        </div>
      </motion.div>
    </motion.section>
  );
}
