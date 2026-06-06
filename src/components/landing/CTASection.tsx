'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { useGatedHref } from '@/components/auth/use-gated-href';

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
      className="relative min-h-82.5 overflow-hidden rounded-[2.25rem] border border-(--border) bg-(--surface-elevated) shadow-[0_24px_80px_rgba(15,23,42,0.08)] dark:shadow-[0_24px_80px_rgba(0,0,0,0.22)] lg:min-h-95"
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
        className="absolute left-6 top-6 z-20 rounded-[1.75rem] border border-(--border) bg-(--surface)! px-5 py-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur-sm dark:bg-[rgba(15,23,42,0.92)] lg:left-10 lg:top-8 lg:px-6 lg:py-6"
        initial={false}
        animate={reduceMotion ? undefined : { y: [0, -5, 0], rotate: [-0.35, 0.35, -0.35] }}
        transition={reduceMotion ? undefined : { duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-[1.15rem] border border-(--border) bg-(--surface-elevated) text-(--text-strong) shadow-[0_10px_24px_rgba(15,23,42,0.06)] dark:bg-white/5">
            <MoodBoardMark className="h-8 w-8" />
          </div>

          <div className="space-y-3">
            <div className="h-2.5 w-36 rounded-full border border-(--border) bg-(--surface-soft)" />
            <div className="h-2.5 w-28 rounded-full border border-(--border) bg-(--surface-soft)" />
          </div>
        </div>
      </motion.div>

      <motion.div
        className="absolute right-6 top-24 z-30 w-68 rounded-4xl border border-(--border) bg-(--surface)! px-5 py-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur-sm dark:bg-[rgba(15,23,42,0.9)] lg:right-14 lg:top-28 lg:w-76 lg:px-6 lg:py-6"
        initial={false}
        animate={reduceMotion ? undefined : { y: [0, 5, 0], rotate: [0.4, -0.4, 0.4] }}
        transition={reduceMotion ? undefined : { duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs uppercase tracking-[0.36em] text-(--text-muted)">
            Visual language
          </p>
          <span className="h-2 w-12 rounded-full border border-(--border) bg-(--surface-soft)" />
        </div>

        <div className="mt-4 grid grid-cols-4 gap-3">
          {['#F7F2EB', '#A8B5A2', '#B89A6A', '#2D2A26'].map((color) => (
            <span
              key={color}
              className="h-14 rounded-2xl border border-(--border) shadow-[inset_0_1px_0_rgba(255,255,255,0.58),0_1px_0_rgba(255,255,255,0.2)]"
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
        className="absolute left-6 bottom-6 z-10 w-60 rounded-[1.75rem] border border-(--border) bg-(--surface)! px-5 py-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur-sm dark:bg-[rgba(15,23,42,0.9)] lg:left-10 lg:bottom-8 lg:w-[16rem] lg:px-6 lg:py-6"
        initial={false}
        animate={reduceMotion ? undefined : { y: [0, -4, 0], x: [0, 4, 0] }}
        transition={reduceMotion ? undefined : { duration: 7.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-(--border) bg-(--surface-elevated) text-(--text-strong) dark:bg-white/5">
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

const primaryButtonClass =
  'inline-flex h-11 items-center justify-center rounded-full border border-transparent bg-[var(--text-strong)]! px-5 text-sm font-medium text-[var(--background)]! shadow-[0_12px_30px_rgba(15,23,42,0.14)] transition-[transform,background-color,box-shadow,color,border-color] duration-200 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-[0_16px_36px_rgba(15,23,42,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] dark:border-white/10 dark:bg-white dark:text-slate-950 dark:shadow-[0_12px_30px_rgba(0,0,0,0.22)] dark:hover:bg-slate-200 dark:hover:shadow-[0_16px_36px_rgba(0,0,0,0.28)] dark:focus-visible:ring-offset-[var(--background)]';

export function CTASection() {
  const reduceMotion = useReducedMotion();
  const beginBoardHref = useGatedHref('/app/new');

  return (
    <motion.section
      className="py-12"
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        className="grid gap-8 rounded-4xl border border-(--border) bg-(--surface-elevated) px-6 py-10 text-(--text-strong) shadow-[0_20px_60px_rgba(15,23,42,0.06)] md:px-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-10"
        whileHover={reduceMotion ? undefined : { y: -4 }}
        transition={{ duration: 0.2 }}
      >
        <motion.div
          className="max-w-2xl"
          initial={reduceMotion ? false : { opacity: 0, x: -12 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.75, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2 className="text-3xl font-semibold tracking-tight text-(--text-strong) dark:text-white-400 md:text-4xl">
            Start with a prompt. Leave with a creative direction.
          </h2>
          <p className="mt-4 text-base leading-7 text-(--text-muted) dark:text-slate-500">
            Build a moodboard that looks polished, feels intentional, and is easy to iterate on.
          </p>

          <div className="mt-7">
            <Link href={beginBoardHref} className={primaryButtonClass}>
              Begin your first board
            </Link>
          </div>
        </motion.div>

        <DecorativeOrbitVisual />
      </motion.div>
    </motion.section>
  );
}