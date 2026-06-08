'use client';

import type { BoardPresenceUser } from '@/lib/realtime/use-board-realtime';
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
    <p
      className={cn(
        'rounded-full border border-(--border) bg-(--surface-subtle) px-3 py-1 text-xs text-(--text-muted)',
        className,
      )}
      aria-live="polite"
    >
      {label}
    </p>
  );
}
