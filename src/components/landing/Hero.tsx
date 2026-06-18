'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { useGatedHref } from '@/components/auth/use-gated-href';
import { PromptToBoardAnimation } from '@/components/landing/PromptToBoardAnimation';
import {
  appDisplayHeadingClass,
  appHeroGradientClass,
  appHeroSectionClass,
  appOutlineButtonClass,
  appPrimaryButtonClass,
  appSectionLabelClass,
} from '@/components/shared/app-surface-styles';

export function Hero() {
  const reduceMotion = useReducedMotion();
  const startBoardHref = useGatedHref('/app/new');
  const viewBoardsHref = useGatedHref('/app');

  return (
    <section
      aria-labelledby="landing-hero-heading"
      className={appHeroSectionClass}
    >
      <div aria-hidden="true" className={appHeroGradientClass} />

      <div className="relative grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12">
        <motion.div
          className="max-w-2xl space-y-5"
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className={appSectionLabelClass}>Creative direction</p>

          <motion.h1
            id="landing-hero-heading"
            className={`max-w-xl text-[clamp(2.5rem,5vw,3.75rem)] leading-[0.98] ${appDisplayHeadingClass}`}
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.8, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
          >
            Turn rough ideas into a beautiful visual board.
          </motion.h1>

          <motion.p
            className="max-w-xl text-base leading-7 md:text-lg"
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.75, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="text-(--text-strong)">MoodBoard AI</span>{' '}
            <span className="text-(--text-muted)">
              helps designers, founders, and creators transform vague prompts into palettes,
              typography, references, and clear creative direction — with collaboration and export
              built in.
            </span>
          </motion.p>

          <motion.div
            className="flex flex-wrap gap-3 pt-1"
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.75, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link href={startBoardHref} className={appPrimaryButtonClass}>
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Start a board
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>

            <Link href={viewBoardsHref} className={appOutlineButtonClass}>
              View my boards
            </Link>

            <Link
              href="/discover"
              className="inline-flex h-11 items-center rounded-full px-4 text-sm font-medium text-(--text-muted) transition hover:text-(--text-strong) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--ring) focus-visible:ring-offset-2 focus-visible:ring-offset-(--background)"
            >
              Browse Discover
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, x: 20, y: 8 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, x: 0, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          whileHover={reduceMotion ? undefined : { y: -4 }}
        >
          <PromptToBoardAnimation />
        </motion.div>
      </div>
    </section>
  );
}
