'use client';

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { ChevronDown, Eye, Info, Loader2, Pencil, WifiOff } from 'lucide-react';
import type { BoardRole } from '@/types/board';
import { cn } from '@/lib/utils';
import { Tooltip } from '@/components/ui/tooltip';
import { CollaboratorInfoDetails } from '@/components/board/CollaboratorInfoDetails';
import { fieldLabelFromId } from '@/lib/realtime/collaborator-fields';
import type {
  BoardPresenceUser,
  PresenceConnectionState,
} from '@/lib/realtime/use-board-realtime';
import {
  editorPresenceAvatarBorderClass,
  editorPresenceAvatarClass,
  editorPresenceAvatarCurrentClass,
  editorPresenceEditingDotClass,
  editorPresenceViewingDotClass,
  presenceAccentForUser,
} from '@/components/board/board-editor-styles';

type BoardPresenceStripProps = {
  boardId: string;
  users: BoardPresenceUser[];
  currentUserId?: string | null;
  connectionState?: PresenceConnectionState;
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
  boardId,
  user,
  isCurrentUser,
  infoOpen,
  onToggleInfo,
}: {
  boardId: string;
  user: BoardPresenceUser;
  isCurrentUser: boolean;
  infoOpen: boolean;
  onToggleInfo: () => void;
}) {
  const StatusIcon = user.status === 'editing' ? Pencil : Eye;
  const statusLabel = user.status === 'editing' ? 'Editing' : 'Viewing';
  const sectionLabel = user.sectionLabel?.trim();
  const infoButtonId = `collaborator-info-${user.userId}`;

  return (
    <li className="rounded-xl px-2 py-2.5">
      <div className="flex items-start gap-3">
        <PresenceAvatar user={user} isCurrentUser={isCurrentUser} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="truncate text-sm font-medium text-(--text-strong)">
              {isCurrentUser ? 'You' : user.name}
            </p>
            <span className="rounded-full border border-(--border) bg-(--surface-subtle) px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-(--text-muted)">
              {roleLabel(user.role)}
            </span>
            <Tooltip content="Collaborator details" side="left">
              <button
                type="button"
                id={infoButtonId}
                aria-expanded={infoOpen}
                aria-controls={infoOpen ? `${infoButtonId}-panel` : undefined}
                aria-label={`Show details for ${isCurrentUser ? 'you' : user.name}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleInfo();
                }}
                className={cn(
                  'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-(--border) bg-(--surface-elevated) text-(--text-muted) transition',
                  'hover:text-(--text-strong) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--ring)',
                  infoOpen && 'border-(--text-muted)/30 bg-(--surface-subtle) text-(--text-strong)',
                )}
              >
                <Info className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </Tooltip>
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
            {user.activeFieldId ? (
              <>
                <span aria-hidden="true">·</span>
                <span className="truncate">{fieldLabelFromId(user.activeFieldId)}</span>
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
      </div>

      {infoOpen ? (
        <div id={`${infoButtonId}-panel`} role="region" aria-labelledby={infoButtonId}>
          <CollaboratorInfoDetails
            boardId={boardId}
            userId={user.userId}
            isCurrentUser={isCurrentUser}
          />
        </div>
      ) : null}
    </li>
  );
}

function PresenceStatusPill({
  children,
  className,
  title,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <div
      title={title}
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-(--border) bg-(--surface-elevated) px-3 py-1.5 text-xs shadow-sm',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function BoardPresenceStrip({
  boardId,
  users,
  currentUserId,
  connectionState = 'disabled',
  className,
}: BoardPresenceStripProps) {
  const [open, setOpen] = useState(false);
  const [activeInfoUserId, setActiveInfoUserId] = useState<string | null>(null);
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
        if (activeInfoUserId) {
          setActiveInfoUserId(null);
          return;
        }
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeInfoUserId, open]);

  if (connectionState === 'disabled') return null;

  if (connectionState === 'connecting') {
    return (
      <PresenceStatusPill className={className} title="Connecting to live co-editing session">
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-(--text-muted)" aria-hidden="true" />
        <span className="font-medium text-(--text-muted)">Connecting live session…</span>
      </PresenceStatusPill>
    );
  }

  if (connectionState === 'error') {
    return (
      <Tooltip
        content="Live co-editing needs Supabase Realtime. Confirm migrations 006 and 016 are applied, or enable public Realtime access in your project settings."
        side="bottom"
      >
        <PresenceStatusPill className={className}>
          <WifiOff className="h-4 w-4 shrink-0 text-(--text-muted)" aria-hidden="true" />
          <span className="font-medium text-(--text-muted)">Live co-editing offline</span>
        </PresenceStatusPill>
      </Tooltip>
    );
  }

  if (users.length === 0) {
    return (
      <PresenceStatusPill className={className} title="Joining live co-editing session">
        <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" aria-hidden="true" />
        <span className="font-medium text-(--text-strong)">Live · Joining…</span>
      </PresenceStatusPill>
    );
  }

  const visible = users.slice(0, 4);
  const overflow = users.length - visible.length;
  const othersCount = currentUserId
    ? users.filter((user) => user.userId !== currentUserId).length
    : users.length;

  return (
    <div className={cn('relative', className)} ref={containerRef}>
      <Tooltip
        content={
          othersCount === 0
            ? 'You are the only person on this board. Use Collaborate to invite someone, or open this board in another tab to test live co-editing.'
            : `${users.length} collaborator${users.length === 1 ? '' : 's'} online`
        }
        side="bottom"
      >
        <button
          type="button"
          onClick={() => {
            setOpen((value) => {
              if (value) {
                setActiveInfoUserId(null);
              }
              return !value;
            });
          }}
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
          <span className="relative flex -space-x-2">
            <span className="absolute -left-1 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-emerald-500 ring-2 ring-(--surface-elevated)" aria-hidden="true" />
            {visible.map((user) => {
              const isCurrentUser = currentUserId === user.userId;

              return (
                <div key={user.userId}>
                  <PresenceAvatar user={user} isCurrentUser={isCurrentUser} />
                </div>
              );
            })}
          </span>
          <div className="min-w-0 text-xs leading-tight">
            <p className="font-medium text-(--text-strong)">
              {users.length} online
              {overflow > 0 ? ` (+${overflow})` : ''}
            </p>
            <p className="text-(--text-muted)">
              {othersCount === 0 ? 'Just you · invite to co-edit' : `${othersCount} collaborator${othersCount === 1 ? '' : 's'}`}
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
            <p className="text-sm font-semibold text-(--text-strong)">Live co-editing</p>
            <p className="mt-0.5 text-xs text-(--text-muted)">
              {othersCount === 0
                ? 'Open this board in another tab or invite a collaborator to see presence dots and live field sync.'
                : `${users.length} person${users.length === 1 ? '' : 's'} on this board`}
            </p>
          </div>

          <ul className="max-h-72 overflow-y-auto bg-(--background) p-2">
            {sortedUsers.map((user) => (
              <PresenceUserRow
                key={user.userId}
                boardId={boardId}
                user={user}
                isCurrentUser={currentUserId === user.userId}
                infoOpen={activeInfoUserId === user.userId}
                onToggleInfo={() =>
                  setActiveInfoUserId((current) => (current === user.userId ? null : user.userId))
                }
              />
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
