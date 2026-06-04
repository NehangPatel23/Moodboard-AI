'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { AppIcon } from '@/components/shared/AppIcon';

export function LandingHeader() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.header
      className="pb-8 md:pb-10"
      initial={reduceMotion ? false : { opacity: 0, y: -8 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between md:gap-8">
        <motion.div
          className="flex items-start gap-4"
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            className="flex h-14 w-14 items-center justify-center rounded-[1.1rem] border border-(--border) bg-(--surface-elevated) shadow-[0_14px_35px_rgba(15,23,42,0.06)]"
            whileHover={reduceMotion ? undefined : { scale: 1.03 }}
            transition={{ duration: 0.2 }}
          >
            <AppIcon />
          </motion.div>

          <div>
            <p
              className="text-[2rem] leading-none tracking-[-0.055em] text-(--text-strong) md:text-[2.55rem]"
              style={{ fontFamily: 'var(--font-display), serif' }}
            >
              MoodBoard AI
            </p>
            <p className="mt-3 max-w-md text-sm leading-6 text-(--text-muted) md:text-base">
              AI creative direction, refined.
            </p>
          </div>
        </motion.div>

        <motion.p
          className="text-xs uppercase tracking-[0.48em] text-(--text-muted) md:text-sm"
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
        >
          Creative direction workspace
        </motion.p>
      </div>

      <div className="mt-6 h-px w-full bg-(--border)" />
    </motion.header>
  );
}