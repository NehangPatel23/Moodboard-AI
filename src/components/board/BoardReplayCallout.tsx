'use client';

import type { BoardActivityChange } from '@/types/board';
import {
  editorReplayActionBadgeAddedClass,
  editorReplayActionBadgeRemovedClass,
  editorReplayActionBadgeUpdatedClass,
  editorReplayAfterClass,
  editorReplayAfterLabelClass,
  editorReplayAfterTextClass,
  editorReplayBeforeClass,
  editorReplayBeforeLabelClass,
  editorReplayBeforeTextClass,
  editorReplayCalloutClass,
  editorReplayRemovedClass,
  editorReplayRemovedLabelClass,
  editorReplayRemovedTextClass,
  editorWarningLabelClass,
} from '@/components/board/board-editor-styles';
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
      <div className={cn(editorReplayRemovedClass, 'px-4 py-4', className)}>
        <p className={editorReplayRemovedLabelClass}>Removed in this save</p>
        <p className="mt-2 text-sm font-medium text-(--text-strong)">{change.summary}</p>
        {change.before ? (
          <p className={cn('mt-2', editorReplayRemovedTextClass)}>{change.before}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={cn(editorReplayCalloutClass, 'p-3', variant === 'card' && 'p-4', className)}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={editorWarningLabelClass}>Replay</p>
          <p className="mt-1 text-sm font-medium text-(--text-strong)">{change.summary}</p>
        </div>
        <span
          className={cn(
            'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em]',
            change.action === 'added' && editorReplayActionBadgeAddedClass,
            change.action === 'removed' && editorReplayActionBadgeRemovedClass,
            change.action === 'updated' && editorReplayActionBadgeUpdatedClass,
          )}
        >
          {change.action}
        </span>
      </div>

      <div className={cn('mt-3 space-y-2', variant === 'inline' && 'grid gap-2 md:grid-cols-2')}>
        {change.before ? (
          <div className={editorReplayBeforeClass}>
            <p className={editorReplayBeforeLabelClass}>Before</p>
            <div className="mt-1 flex items-center gap-2">
              {beforeHex ? (
                <span
                  className="h-4 w-4 shrink-0 rounded-full border border-(--border)"
                  style={{ backgroundColor: beforeHex }}
                  aria-hidden="true"
                />
              ) : null}
              <p className={editorReplayBeforeTextClass}>{change.before}</p>
            </div>
          </div>
        ) : null}

        {change.after ? (
          <div className={editorReplayAfterClass}>
            <p className={editorReplayAfterLabelClass}>{change.before ? 'After' : 'Added'}</p>
            <div className="mt-1 flex items-center gap-2">
              {afterHex ? (
                <span
                  className="h-4 w-4 shrink-0 rounded-full border border-(--border)"
                  style={{ backgroundColor: afterHex }}
                  aria-hidden="true"
                />
              ) : null}
              <p className={editorReplayAfterTextClass}>{change.after}</p>
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
