'use client';

import type { BoardPresenceUser } from '@/lib/realtime/use-board-realtime';
import { cn } from '@/lib/utils';

type BoardSectionPresenceBarProps = {
  users: BoardPresenceUser[];
  activeSectionIndex: number;
  activeSectionLabel: string;
  className?: string;
};

export function BoardSectionPresenceBar({
  users,
  activeSectionIndex,
  activeSectionLabel,
  className,
}: BoardSectionPresenceBarProps) {
  const onSection = users.filter((user) => user.sectionIndex === activeSectionIndex);

  if (onSection.length === 0) {
    return null;
  }

  const names = onSection.map((user) => user.name);
  const label =
    names.length === 1
      ? `${names[0]} is on ${activeSectionLabel}`
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
