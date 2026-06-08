'use client';

import { cn } from '@/lib/utils';
import type { BoardPresenceUser } from '@/lib/realtime/use-board-realtime';

type BoardPresenceStripProps = {
  users: BoardPresenceUser[];
  className?: string;
};

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

const ACCENT_COLORS = ['#cbd5e1', '#fcd34d', '#86efac', '#93c5fd', '#f9a8d4', '#c4b5fd'];

function accentForUser(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i += 1) {
    hash = (hash + userId.charCodeAt(i) * (i + 1)) % ACCENT_COLORS.length;
  }
  return ACCENT_COLORS[hash] ?? ACCENT_COLORS[0];
}

export function BoardPresenceStrip({ users, className }: BoardPresenceStripProps) {
  if (users.length === 0) return null;

  const visible = users.slice(0, 4);
  const overflow = users.length - visible.length;

  return (
    <div
      className={cn('flex items-center gap-2', className)}
      aria-label={`${users.length} collaborator${users.length === 1 ? '' : 's'} online`}
    >
      <div className="flex -space-x-2">
        {visible.map((user) => (
          <div
            key={user.userId}
            title={`${user.name} (${user.status === 'editing' ? 'editing' : 'viewing'})`}
            className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-[10px] font-semibold text-slate-900 shadow-sm dark:border-slate-900"
            style={{ backgroundColor: accentForUser(user.userId) }}
          >
            {initialsFromName(user.name)}
          </div>
        ))}
      </div>
      <p className="text-xs text-(--text-muted)">
        {users.length} online
        {overflow > 0 ? ` (+${overflow} more)` : ''}
      </p>
    </div>
  );
}
