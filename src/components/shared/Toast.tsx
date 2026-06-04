'use client';

import { useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { dismissToast, getToastSnapshot, subscribeToast } from './toast-store';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

function getToneStyles(tone: 'default' | 'success' | 'destructive') {
  if (tone === 'success') {
    return {
      wrapper: 'border-emerald-200/80 bg-[var(--surface)] text-[var(--text-strong)]',
      icon: 'text-emerald-600',
      accent: 'bg-gradient-to-b from-emerald-400 via-emerald-500 to-emerald-600',
      title: 'Success',
      iconNode: <CheckCircle2 className="h-4 w-4" />,
    };
  }

  if (tone === 'destructive') {
    return {
      wrapper: 'border-rose-200/80 bg-[var(--surface)] text-[var(--text-strong)]',
      icon: 'text-rose-600',
      accent: 'bg-gradient-to-b from-rose-400 via-rose-500 to-rose-600',
      title: 'Attention',
      iconNode: <AlertTriangle className="h-4 w-4" />,
    };
  }

  return {
    wrapper: 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-strong)]',
    icon: 'text-[var(--text-muted)]',
    accent: 'bg-gradient-to-b from-slate-300 via-slate-400 to-slate-500',
    title: 'Note',
    iconNode: <Info className="h-4 w-4" />,
  };
}

export function Toast() {
  const toast = useSyncExternalStore(subscribeToast, getToastSnapshot, () => null);

  if (!toast || typeof document === 'undefined') return null;

  const tone = getToneStyles(toast.tone);
  const isVisible = toast.phase === 'visible';
  const isExiting = toast.phase === 'exit';

  return createPortal(
    <div className="pointer-events-none fixed right-4 top-4 z-10050 w-[calc(100vw-2rem)] max-w-sm sm:w-full">
      <div
        key={toast.id}
        role="status"
        aria-live={toast.tone === 'destructive' ? 'assertive' : 'polite'}
        aria-atomic="true"
        className={cn(
          'pointer-events-auto overflow-hidden rounded-[1.4rem] border shadow-[0_22px_70px_rgba(15,23,42,0.18)] backdrop-blur-xl will-change-transform',
          tone.wrapper,
          isVisible && !isExiting && 'toast-enter',
          isVisible && 'toast-visible',
          isExiting && 'toast-exit',
        )}
      >
        <div className={cn('h-1 w-full', tone.accent)} />

        <div className="flex gap-4 p-4">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-(--border) bg-(--surface-subtle) text-(--text-strong) shadow-sm">
            <span className={tone.icon}>{tone.iconNode}</span>
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-(--text-muted)">
              {tone.title}
            </p>
            <p className="mt-1 text-sm leading-6 text-(--text)">{toast.message}</p>
          </div>

          <button
            type="button"
            onClick={dismissToast}
            className="shrink-0 rounded-full p-1.5 text-(--text-muted) transition hover:bg-(--surface-subtle) hover:text-(--text-strong)"
            aria-label="Dismiss toast"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <style jsx>{`
        .toast-enter {
          animation: toastEnter 260ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .toast-visible {
          transform: translate3d(0, 0, 0);
          opacity: 1;
        }

        .toast-exit {
          animation: toastExit 220ms cubic-bezier(0.4, 0, 1, 1) both;
        }

        @keyframes toastEnter {
          0% {
            opacity: 0;
            transform: translate3d(110%, 0, 0) scale(0.98);
            filter: blur(3px);
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
            filter: blur(0);
          }
        }

        @keyframes toastExit {
          0% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
            filter: blur(0);
          }
          100% {
            opacity: 0;
            transform: translate3d(110%, 0, 0) scale(0.98);
            filter: blur(2px);
          }
        }
      `}</style>
    </div>,
    document.body,
  );
}