'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';

const primaryButtonClass =
  'inline-flex h-11 items-center justify-center rounded-full border border-transparent bg-[var(--text-strong)]! px-5 text-sm font-medium text-[var(--background)]! shadow-[0_12px_30px_rgba(15,23,42,0.14)] transition-[transform,background-color,box-shadow,color,border-color] duration-200 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-[0_16px_36px_rgba(15,23,42,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] dark:border-white/10 dark:bg-white dark:text-slate-950 dark:shadow-[0_12px_30px_rgba(0,0,0,0.22)] dark:hover:bg-slate-200 dark:hover:shadow-[0_16px_36px_rgba(0,0,0,0.28)] dark:focus-visible:ring-offset-[var(--background)]';

const secondaryButtonClass =
  'inline-flex h-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-elevated)] px-5 text-sm font-medium text-[var(--text-strong)] shadow-none transition-[transform,background-color,box-shadow,color,border-color] duration-200 hover:-translate-y-0.5 hover:bg-[var(--surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] dark:border-white/10 dark:bg-white/5 dark:text-[var(--text-strong)] dark:hover:bg-white/10 dark:focus-visible:ring-offset-[var(--background)]';

export function Hero() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="grid gap-10 py-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:py-16">
      <motion.div
        className="max-w-2xl"
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.h1
          className="max-w-xl text-5xl font-semibold tracking-tight text-(--text-strong) md:text-6xl"
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.8, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
        >
          Turn rough ideas into a beautiful visual board.
        </motion.h1>

        <motion.p
          className="mt-6 max-w-xl text-lg leading-8 text-(--text-muted)"
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.75, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
        >
          MoodBoard AI helps designers, founders, and creators transform vague prompts into
          palettes, typography, references, and clear creative direction.
        </motion.p>

        <motion.div
          className="mt-8 flex flex-wrap gap-3"
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.75, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link href="/app/new" className={primaryButtonClass}>
            Start a board
          </Link>

          <Link href="/app" className={secondaryButtonClass}>
            View my boards
          </Link>
        </motion.div>
      </motion.div>

      <motion.div
        className="rounded-4xl border border-(--border) bg-(--surface-elevated) p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)]"
        initial={reduceMotion ? false : { opacity: 0, x: 20, y: 8 }}
        whileInView={reduceMotion ? undefined : { opacity: 1, x: 0, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
        whileHover={reduceMotion ? undefined : { y: -4 }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <motion.div
            className="rounded-[1.6rem] border border-(--border) bg-(--surface-soft) p-5 text-(--text-strong) shadow-none"
            animate={reduceMotion ? undefined : { y: [0, -3, 0] }}
            transition={reduceMotion ? undefined : { duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          >
            <p className="text-xs uppercase tracking-[0.3em] text-(--text-muted)">Prompt</p>
            <p className="mt-3 text-lg leading-7">
              “soft luxury wellness brand for women aged 25–40”
            </p>
          </motion.div>

          <motion.div
            className="rounded-[1.6rem] border border-(--border) bg-(--surface-soft) p-5 shadow-none"
            animate={reduceMotion ? undefined : { y: [0, 3, 0] }}
            transition={reduceMotion ? undefined : { duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          >
            <p className="text-xs uppercase tracking-[0.3em] text-(--text-muted)">
              Generated mood
            </p>
            <p className="mt-3 text-xl font-medium text-(--text-strong)">Calm luxury</p>
            <p className="mt-2 text-sm leading-6 text-(--text-muted)">
              Ivory, sage, muted gold, charcoal.
            </p>
          </motion.div>

          <motion.div
            className="rounded-[1.6rem] border border-(--border) bg-(--surface-soft) p-5 md:col-span-2 shadow-none"
            animate={reduceMotion ? undefined : { y: [0, -2, 0] }}
            transition={reduceMotion ? undefined : { duration: 8.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <p className="text-xs uppercase tracking-[0.3em] text-(--text-muted)">
              Creative summary
            </p>
            <p className="mt-3 max-w-xl text-base leading-7 text-(--text-muted)">
              A calm, elevated identity built around restraint, warmth, and trust.
            </p>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}