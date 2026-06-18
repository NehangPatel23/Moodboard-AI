'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
import { cn } from '@/lib/utils';

import { appPrimaryButtonClass } from '@/components/shared/app-surface-styles';

const primaryPillClass = appPrimaryButtonClass;

const LANDING_NAV_LINKS = [
  { href: '/changelog', label: 'Changelog', className: 'hidden md:inline-flex' },
  { href: '/discover', label: 'Discover', className: 'hidden sm:inline-flex' },
  { href: '/help', label: 'Help', className: 'hidden sm:inline-flex' },
  { href: '/about', label: 'About', className: 'hidden sm:inline-flex' },
] as const;

const landingNavLinkFocusClass =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--ring) focus-visible:ring-offset-2 focus-visible:ring-offset-(--background)';

function isLandingNavActive(pathname: string, href: string): boolean {
  if (href === '/discover') {
    return (
      pathname === '/discover' ||
      pathname.startsWith('/discover/') ||
      pathname.startsWith('/share/') ||
      pathname.startsWith('/profile/')
    );
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function LandingHeader() {
  const pathname = usePathname();
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
            className="group flex min-w-0 items-center gap-3.5 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--ring) focus-visible:ring-offset-2 focus-visible:ring-offset-(--background) sm:gap-4"
            aria-label="MoodBoard AI home"
          >
            <motion.div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[1.1rem] border border-(--border) bg-(--surface-elevated) p-1 shadow-[var(--shadow-card)] transition group-hover:border-(--text-muted)/30 sm:h-[3.625rem] sm:w-[3.625rem] sm:p-1.5 md:h-16 md:w-16"
              whileHover={reduceMotion ? undefined : { scale: 1.03 }}
              transition={{ duration: 0.2 }}
            >
              <AppIcon className="h-full w-full" />
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
          aria-label="Site"
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
        >
          {LANDING_NAV_LINKS.map(({ href, label, className }) => {
            const active = isLandingNavActive(pathname, href);

            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'inline-flex h-11 items-center rounded-full px-4 text-sm font-medium transition',
                  landingNavLinkFocusClass,
                  className,
                  active
                    ? 'border border-(--border) bg-(--surface-subtle) text-(--text-strong) shadow-[var(--shadow-card)]'
                    : 'text-(--text-muted) hover:bg-(--surface-subtle)/60 hover:text-(--text-strong)',
                )}
              >
                {label}
              </Link>
            );
          })}

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
                className={cn(
                  'inline-flex h-11 items-center rounded-full px-4 text-sm font-medium text-(--text-muted) transition hover:text-(--text-strong)',
                  landingNavLinkFocusClass,
                )}
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
