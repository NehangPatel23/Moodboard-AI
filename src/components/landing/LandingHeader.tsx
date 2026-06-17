'use client';

import Link from 'next/link';
import { useSyncExternalStore } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { AppIcon } from '@/components/shared/AppIcon';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import {
  getServerAuthSnapshot,
  readAuthState,
  subscribeAuth,
} from '@/lib/auth-store';

import { appPrimaryButtonClass } from '@/components/shared/app-surface-styles';

const primaryPillClass = appPrimaryButtonClass;

export function LandingHeader() {
  const reduceMotion = useReducedMotion();
  const auth = useSyncExternalStore(subscribeAuth, readAuthState, getServerAuthSnapshot);
  const isAuthenticated = auth.status === 'authenticated';

  return (
    <motion.header
      className="pb-0"
      initial={reduceMotion ? false : { opacity: 0, y: -8 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex items-center justify-between gap-6">
        <motion.div
          className="flex items-center gap-4"
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link
            href="/"
            className="group flex min-w-0 items-center gap-4 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--ring) focus-visible:ring-offset-2 focus-visible:ring-offset-(--background)"
            aria-label="MoodBoard AI home"
          >
            <motion.div
              className="flex h-12 w-12 items-center justify-center rounded-[1.1rem] border border-(--border) bg-(--surface-elevated) shadow-[var(--shadow-card)] transition group-hover:border-(--text-muted)/30 md:h-14 md:w-14"
              whileHover={reduceMotion ? undefined : { scale: 1.03 }}
              transition={{ duration: 0.2 }}
            >
              <AppIcon />
            </motion.div>

            <div className="min-w-0">
              <p
                className="text-2xl leading-none tracking-[-0.055em] text-(--text-strong) transition group-hover:text-(--text-strong) md:text-[2.1rem]"
                style={{ fontFamily: 'var(--font-display), serif' }}
              >
                MoodBoard AI
              </p>
              <p className="mt-2 hidden text-sm leading-6 text-(--text-muted) sm:block">
                AI creative direction, refined.
              </p>
            </div>
          </Link>
        </motion.div>

        <motion.nav
          className="flex items-center gap-2 sm:gap-3"
          aria-label="Account"
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link
            href="/discover"
            className="hidden h-11 items-center rounded-full px-4 text-sm font-medium text-(--text-muted) transition hover:text-(--text-strong) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--ring) focus-visible:ring-offset-2 focus-visible:ring-offset-(--background) sm:inline-flex"
          >
            Discover
          </Link>

          <Link
            href="/about"
            className="hidden h-11 items-center rounded-full px-4 text-sm font-medium text-(--text-muted) transition hover:text-(--text-strong) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--ring) focus-visible:ring-offset-2 focus-visible:ring-offset-(--background) sm:inline-flex"
          >
            About
          </Link>

          <ThemeToggle />

          {isAuthenticated ? (
            <Link href="/app" className={primaryPillClass}>
              Open app
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="inline-flex h-11 items-center rounded-full px-4 text-sm font-medium text-(--text-muted) transition hover:text-(--text-strong) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--ring) focus-visible:ring-offset-2 focus-visible:ring-offset-(--background)"
              >
                Sign in
              </Link>
              <Link href="/sign-in?mode=sign-up" className={primaryPillClass}>
                Get started
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            </>
          )}
        </motion.nav>
      </div>

      <div className="mt-6 h-px w-full bg-(--border)" />
    </motion.header>
  );
}
