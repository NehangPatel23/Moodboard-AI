'use client';

import type { BoardActivityChange } from '@/types/board';
import { cn } from '@/lib/utils';

function extractHex(value: string | null | undefined): string | null {
  if (!value) return null;
  const match = value.match(/#[0-9a-fA-F]{3,8}/);
  return match?.[0] ?? null;
}

type BoardReplayCalloutProps = {
  change: BoardActivityChange;
  variant?: 'inline' | 'card' | 'removed';
  className?: string;
};

export function BoardReplayCallout({
  change,
  variant = 'inline',
  className,
}: BoardReplayCalloutProps) {
  const beforeHex = change.kind === 'palette' ? extractHex(change.before) : null;
  const afterHex = change.kind === 'palette' ? extractHex(change.after) : null;

  if (variant === 'removed') {
    return (
      <div
        className={cn(
          'rounded-[1.75rem] border border-dashed border-red-300/80 bg-red-50/60 px-4 py-4 dark:border-red-900/50 dark:bg-red-950/20',
          className,
        )}
      >
        <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-red-700 dark:text-red-300">
          Removed in this save
        </p>
        <p className="mt-2 text-sm font-medium text-(--text-strong)">{change.summary}</p>
        {change.before ? (
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-red-950/80 line-through dark:text-red-100/80">
            {change.before}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-2xl border border-amber-300/70 bg-amber-50/80 p-3 dark:border-amber-900/50 dark:bg-amber-950/20',
        variant === 'card' && 'p-4',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-amber-800 dark:text-amber-300">
            Replay
          </p>
          <p className="mt-1 text-sm font-medium text-(--text-strong)">{change.summary}</p>
        </div>
        <span
          className={cn(
            'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em]',
            change.action === 'added' && 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
            change.action === 'removed' && 'bg-red-500/10 text-red-700 dark:text-red-300',
            change.action === 'updated' && 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
          )}
        >
          {change.action}
        </span>
      </div>

      <div className={cn('mt-3 space-y-2', variant === 'inline' && 'grid gap-2 md:grid-cols-2')}>
        {change.before ? (
          <div className="rounded-xl border border-red-200/70 bg-red-50/70 px-3 py-2 dark:border-red-900/40 dark:bg-red-950/20">
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-red-700/80 dark:text-red-300/80">
              Before
            </p>
            <div className="mt-1 flex items-center gap-2">
              {beforeHex ? (
                <span
                  className="h-4 w-4 shrink-0 rounded-full border border-(--border)"
                  style={{ backgroundColor: beforeHex }}
                  aria-hidden="true"
                />
              ) : null}
              <p className="whitespace-pre-wrap text-sm leading-6 text-red-950/90 line-through dark:text-red-100/90">
                {change.before}
              </p>
            </div>
          </div>
        ) : null}

        {change.after ? (
          <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/70 px-3 py-2 dark:border-emerald-900/40 dark:bg-emerald-950/20">
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-emerald-700/80 dark:text-emerald-300/80">
              {change.before ? 'After' : 'Added'}
            </p>
            <div className="mt-1 flex items-center gap-2">
              {afterHex ? (
                <span
                  className="h-4 w-4 shrink-0 rounded-full border border-(--border)"
                  style={{ backgroundColor: afterHex }}
                  aria-hidden="true"
                />
              ) : null}
              <p className="whitespace-pre-wrap text-sm leading-6 text-emerald-950/90 dark:text-emerald-100/90">
                {change.after}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function BoardReplaySectionBlock({
  changes,
  className,
}: {
  changes: BoardActivityChange[];
  className?: string;
}) {
  if (changes.length === 0) return null;

  const removed = changes.filter((change) => change.action === 'removed');
  const active = changes.filter((change) => change.action !== 'removed');

  return (
    <div className={cn('space-y-3', className)}>
      {active.map((change, index) => (
        <BoardReplayCallout key={`${change.summary}-${index}`} change={change} variant="card" />
      ))}
      {removed.map((change, index) => (
        <BoardReplayCallout
          key={`${change.summary}-removed-${index}`}
          change={change}
          variant="removed"
        />
      ))}
    </div>
  );
}
