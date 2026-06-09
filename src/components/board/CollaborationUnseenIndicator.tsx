'use client';

import { cn } from '@/lib/utils';
import { Tooltip } from '@/components/ui/tooltip';
import { editorUnreadDotClass } from '@/components/board/board-editor-styles';

export function collaborationListItemClassName(extra?: string): string {
  return cn('rounded-2xl border border-(--border) bg-(--surface-muted) px-4 py-3', extra);
}

export function CollaborationUnseenIndicator({ className }: { className?: string }) {
  return (
    <Tooltip content="Unseen" side="top">
      <span
        className={cn('inline-flex shrink-0 items-center', className)}
        aria-label="Unseen"
      >
        <span className={editorUnreadDotClass} aria-hidden="true" />
      </span>
    </Tooltip>
  );
}
