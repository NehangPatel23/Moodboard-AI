'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ChevronDown, Eye, Pencil } from 'lucide-react';
import type { BoardRole } from '@/types/board';
import { cn } from '@/lib/utils';
import { Tooltip } from '@/components/ui/tooltip';
import type { BoardPresenceUser } from '@/lib/realtime/use-board-realtime';
import {
  editorPresenceAvatarBorderClass,
  editorPresenceAvatarClass,
  editorPresenceAvatarCurrentClass,
  editorPresenceEditingDotClass,
  editorPresenceViewingDotClass,
  presenceAccentForUser,
} from '@/components/board/board-editor-styles';

type BoardPresenceStripProps = {
  users: BoardPresenceUser[];
  currentUserId?: string | null;
  className?: string;
};

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}


function roleLabel(role: BoardRole): string {
  if (role === 'owner') return 'Owner';
  if (role === 'editor') return 'Editor';
  return 'Viewer';
}

function sortUsers(users: BoardPresenceUser[], currentUserId?: string | null): BoardPresenceUser[] {
  return [...users].sort((left, right) => {
    const leftIsCurrent = currentUserId === left.userId;
    const rightIsCurrent = currentUserId === right.userId;
    if (leftIsCurrent !== rightIsCurrent) {
      return leftIsCurrent ? -1 : 1;
    }

    return left.name.localeCompare(right.name);
  });
}

function PresenceAvatar({
  user,
  isCurrentUser,
  size = 'md',
}: {
  user: BoardPresenceUser;
  isCurrentUser: boolean;
  size?: 'sm' | 'md';
}) {
  const dimension = size === 'sm' ? 'h-8 w-8 text-[10px]' : 'h-7 w-7 text-[10px]';

  return (
    <div
      className={cn(
        editorPresenceAvatarClass,
        dimension,
        isCurrentUser ? editorPresenceAvatarCurrentClass : editorPresenceAvatarBorderClass,
      )}
      style={{ backgroundColor: presenceAccentForUser(user.userId) }}
      aria-hidden="true"
    >
      {initialsFromName(user.name)}
    </div>
  );
}

function PresenceUserRow({
  user,
  isCurrentUser,
}: {
  user: BoardPresenceUser;
  isCurrentUser: boolean;
}) {
  const StatusIcon = user.status === 'editing' ? Pencil : Eye;
  const statusLabel = user.status === 'editing' ? 'Editing' : 'Viewing';
  const sectionLabel = user.sectionLabel?.trim();

  return (
    <li className="flex items-start gap-3 rounded-xl px-2 py-2.5">
      <PresenceAvatar user={user} isCurrentUser={isCurrentUser} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="truncate text-sm font-medium text-(--text-strong)">
            {isCurrentUser ? 'You' : user.name}
          </p>
          <span className="rounded-full border border-(--border) bg-(--surface-subtle) px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-(--text-muted)">
            {roleLabel(user.role)}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-(--text-muted)">
          <span className="inline-flex items-center gap-1">
            <StatusIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {statusLabel}
          </span>
          {sectionLabel ? (
            <>
              <span aria-hidden="true">·</span>
              <span className="truncate">On {sectionLabel}</span>
            </>
          ) : null}
        </div>
      </div>
      <span
        className={cn(
          'mt-2 h-2 w-2 shrink-0 rounded-full',
          user.status === 'editing' ? editorPresenceEditingDotClass : editorPresenceViewingDotClass,
        )}
        aria-hidden="true"
      />
    </li>
  );
}

export function BoardPresenceStrip({ users, currentUserId, className }: BoardPresenceStripProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  const sortedUsers = useMemo(
    () => sortUsers(users, currentUserId),
    [currentUserId, users],
  );

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  if (users.length === 0) return null;

  const visible = users.slice(0, 4);
  const overflow = users.length - visible.length;
  const othersCount = currentUserId
    ? users.filter((user) => user.userId !== currentUserId).length
    : users.length;

  return (
    <div className={cn('relative', className)} ref={containerRef}>
      <Tooltip
        content={`${users.length} collaborator${users.length === 1 ? '' : 's'} online`}
        side="bottom"
      >
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          aria-haspopup="dialog"
          aria-label={`${users.length} collaborator${users.length === 1 ? '' : 's'} online. Show details.`}
          className={cn(
            'inline-flex items-center gap-2.5 rounded-full border border-(--border) bg-(--surface-elevated) px-3 py-1.5 text-left shadow-sm transition',
            'hover:border-(--text-muted)/30 hover:bg-(--surface-subtle) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--ring) focus-visible:ring-offset-2 focus-visible:ring-offset-(--background)',
            open && 'border-(--text-muted)/30 bg-(--surface-subtle)',
          )}
        >
          <div className="flex -space-x-2">
            {visible.map((user) => {
              const isCurrentUser = currentUserId === user.userId;

              return (
                <div key={user.userId}>
                  <PresenceAvatar user={user} isCurrentUser={isCurrentUser} />
                </div>
              );
            })}
          </div>
          <div className="min-w-0 text-xs leading-tight">
            <p className="font-medium text-(--text-strong)">
              {users.length} online
              {overflow > 0 ? ` (+${overflow})` : ''}
            </p>
            <p className="text-(--text-muted)">
              {othersCount === 0 ? 'Just you' : `${othersCount} collaborator${othersCount === 1 ? '' : 's'}`}
            </p>
          </div>
          <ChevronDown
            className={cn(
              'h-4 w-4 shrink-0 text-(--text-muted) transition-transform',
              open && 'rotate-180',
            )}
            aria-hidden="true"
          />
        </button>
      </Tooltip>

      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label="Active collaborators"
          className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,20rem)] overflow-hidden rounded-2xl border border-(--border) bg-(--background) shadow-[var(--shadow-elevated)]"
        >
          <div className="border-b border-(--border) bg-(--background) px-4 py-3">
            <p className="text-sm font-semibold text-(--text-strong)">Active now</p>
            <p className="mt-0.5 text-xs text-(--text-muted)">
              {users.length} person{users.length === 1 ? '' : 's'} on this board
            </p>
          </div>

          <ul className="max-h-72 overflow-y-auto bg-(--background) p-2">
            {sortedUsers.map((user) => (
              <PresenceUserRow
                key={user.userId}
                user={user}
                isCurrentUser={currentUserId === user.userId}
              />
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
