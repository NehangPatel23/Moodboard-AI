'use client';

import type { BoardPresenceUser } from '@/lib/realtime/use-board-realtime';
import { editorPresenceEditingClass } from '@/components/board/board-editor-styles';
import { cn } from '@/lib/utils';

type BoardSectionPresenceBarProps = {
  users: BoardPresenceUser[];
  currentUserId?: string | null;
  activeSectionIndex: number;
  activeSectionLabel: string;
  className?: string;
};

export function BoardSectionPresenceBar({
  users,
  currentUserId,
  activeSectionIndex,
  activeSectionLabel,
  className,
}: BoardSectionPresenceBarProps) {
  const onSection = users.filter((user) => user.sectionIndex === activeSectionIndex);
  const editingOthers = onSection.filter(
    (user) => user.status === 'editing' && user.userId !== currentUserId,
  );

  if (onSection.length === 0) {
    return null;
  }

  const names = onSection.map((user) =>
    currentUserId && user.userId === currentUserId ? 'You' : user.name,
  );
  const label =
    names.length === 1
      ? `${names[0]} ${names[0] === 'You' ? 'are' : 'is'} on ${activeSectionLabel}`
      : `${names.slice(0, 2).join(', ')}${names.length > 2 ? ` +${names.length - 2}` : ''} are on ${activeSectionLabel}`;

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <p
        className="rounded-full border border-(--border) bg-(--surface-subtle) px-3 py-1 text-xs text-(--text-muted)"
        aria-live="polite"
      >
        {label}
      </p>
      {editingOthers.length > 0 ? (
        <span className={editorPresenceEditingClass}>
          {editingOthers.length === 1
            ? `${editingOthers[0].name} is editing`
            : `${editingOthers.length} editing`}
        </span>
      ) : null}
    </div>
  );
}
