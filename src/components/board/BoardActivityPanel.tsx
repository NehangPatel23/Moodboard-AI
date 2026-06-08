'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GuardedLink } from '@/components/shared/GuardedLink';
import { Archive, Eye, EyeOff, History, Play, Trash2, X } from 'lucide-react';
import type { BoardActivityEvent } from '@/types/board';
import { formatDateTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmationModal } from '@/components/shared/ConfirmationModal';
import { showToast } from '@/components/shared/toast-store';
import {
  editorReplayActiveBorderClass,
  editorUnreadBadgeClass,
  editorUnreadItemBorderClass,
} from '@/components/board/board-editor-styles';

function isSnapshotRestoreSummary(summary: string | null | undefined): boolean {
  return Boolean(summary?.startsWith('Switched to Snapshot '));
}

type PanelFilter = 'all' | 'unread' | 'hidden';

type BoardActivityPanelProps = {
  open: boolean;
  boardTitle: string;
  activity: BoardActivityEvent[];
  loading: boolean;
  isOwner: boolean;
  activeReplayId?: string | null;
  onClose: () => void;
  onReplayOnBoard: (event: BoardActivityEvent) => void;
  onDelete?: (activityId: string) => Promise<boolean>;
  onMarkAllRead?: () => Promise<boolean>;
  onToggleRead?: (activityId: string, isRead: boolean) => Promise<boolean>;
  onHide?: (activityId: string) => Promise<boolean>;
  onUnhide?: (activityId: string) => Promise<boolean>;
  returnFocusRef?: React.RefObject<HTMLButtonElement | null>;
};

function ActivityItem({
  event,
  isActiveReplay,
  canDelete,
  showHiddenActions,
  onReplayOnBoard,
  onDeleteRequest,
  onToggleRead,
  onHide,
  onUnhide,
}: {
  event: BoardActivityEvent;
  isActiveReplay: boolean;
  canDelete: boolean;
  showHiddenActions: boolean;
  onReplayOnBoard: (event: BoardActivityEvent) => void;
  onDeleteRequest?: (event: BoardActivityEvent) => void;
  onToggleRead?: (activityId: string, isRead: boolean) => Promise<boolean>;
  onHide?: (activityId: string) => Promise<boolean>;
  onUnhide?: (activityId: string) => Promise<boolean>;
}) {
  const changes = event.changes.length > 0 ? event.changes : [];
  const showSummaryLine = Boolean(
    event.summary && (changes.length === 0 || isSnapshotRestoreSummary(event.summary)),
  );

  const handleToggleRead = async () => {
    if (!onToggleRead) return;
    const ok = await onToggleRead(event.id, !event.isRead);
    if (!ok) {
      showToast('Failed to update read state.', 'destructive');
    }
  };

  const handleHide = async () => {
    if (!onHide) return;
    const ok = await onHide(event.id);
    if (ok) {
      showToast('Activity hidden from your view.', 'success');
      return;
    }
    showToast('Failed to hide activity.', 'destructive');
  };

  const handleUnhide = async () => {
    if (!onUnhide) return;
    const ok = await onUnhide(event.id);
    if (ok) {
      showToast('Activity restored.', 'success');
    } else {
      showToast('Failed to restore activity.', 'destructive');
    }
  };

  return (
    <li
      className={[
        'rounded-2xl border bg-(--surface-muted) px-4 py-3',
        isActiveReplay
          ? editorReplayActiveBorderClass
          : event.isRead
            ? 'border-(--border)'
            : editorUnreadItemBorderClass,
      ].join(' ')}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-(--border) bg-(--surface-elevated)">
          <History className="h-4 w-4 text-(--text-muted)" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-(--text-strong)">{event.actorName}</p>
                {!event.isRead ? (
                  <span className={editorUnreadBadgeClass}>
                    New
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-(--text-muted)">{formatDateTime(event.createdAt)}</p>
            </div>
            <div className="flex items-center gap-1">
              {showHiddenActions ? (
                onUnhide ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => void handleUnhide()}
                    className="h-8 rounded-full px-2 text-xs"
                  >
                    Restore
                  </Button>
                ) : null
              ) : (
                <>
                  {onToggleRead ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => void handleToggleRead()}
                      className="h-8 w-8 rounded-full text-(--text-muted) hover:text-(--text-strong)"
                      aria-label={
                        event.isRead
                          ? `Mark activity by ${event.actorName} as unread`
                          : `Mark activity by ${event.actorName} as read`
                      }
                    >
                      {event.isRead ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  ) : null}
                  {onHide ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => void handleHide()}
                      className="h-8 w-8 rounded-full text-(--text-muted) hover:text-(--text-strong)"
                      aria-label={`Hide activity by ${event.actorName} from your view`}
                    >
                      <Archive className="h-4 w-4" />
                    </Button>
                  ) : null}
                  {canDelete && onDeleteRequest ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteRequest(event)}
                      className="h-8 w-8 rounded-full text-(--text-muted) hover:text-red-600"
                      aria-label={`Delete activity by ${event.actorName}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : null}
                </>
              )}
            </div>
          </div>

          {showSummaryLine ? (
            <p className="mt-2 text-sm text-(--text-muted)">{event.summary}</p>
          ) : null}

          {changes.length > 0 ? (
            <ul className={showSummaryLine ? 'mt-2 space-y-1.5' : 'mt-3 space-y-1.5'}>
              {changes.slice(0, 4).map((change, index) => (
                <li key={`${event.id}-${index}`} className="text-sm leading-6 text-(--text)">
                  • {change.summary}
                </li>
              ))}
              {changes.length > 4 ? (
                <li className="text-sm text-(--text-muted)">+ {changes.length - 4} more changes</li>
              ) : null}
            </ul>
          ) : !showSummaryLine ? (
            <p className="mt-2 text-sm text-(--text-muted)">
              {event.summary ?? 'Saved board changes'}
            </p>
          ) : null}

          {!showHiddenActions ? (
            <Button
              type="button"
              size="sm"
              variant={isActiveReplay ? 'default' : 'outline'}
              disabled={changes.length === 0}
              onClick={() => onReplayOnBoard(event)}
              className="mt-3 rounded-full"
            >
              <Play className="h-4 w-4" />
              {isActiveReplay ? 'Replaying on board' : 'Show on board'}
            </Button>
          ) : null}
        </div>
      </div>
    </li>
  );
}

export function BoardActivityPanel({
  open,
  boardTitle,
  activity,
  loading,
  isOwner,
  activeReplayId = null,
  onClose,
  onReplayOnBoard,
  onDelete,
  onMarkAllRead,
  onToggleRead,
  onHide,
  onUnhide,
  returnFocusRef,
}: BoardActivityPanelProps) {
  const [filter, setFilter] = useState<PanelFilter>('all');
  const [pendingDelete, setPendingDelete] = useState<BoardActivityEvent | null>(null);
  const markedReadRef = useRef(false);

  const visibleActivity = useMemo(() => {
    if (filter === 'hidden') {
      return activity.filter((event) => event.isHidden);
    }
    if (filter === 'unread') {
      return activity.filter((event) => !event.isHidden && !event.isRead);
    }
    return activity.filter((event) => !event.isHidden);
  }, [activity, filter]);

  const unreadCount = useMemo(
    () => activity.filter((event) => !event.isHidden && !event.isRead).length,
    [activity],
  );

  const hiddenCount = useMemo(
    () => activity.filter((event) => event.isHidden).length,
    [activity],
  );

  useEffect(() => {
    if (!open) {
      markedReadRef.current = false;
      return;
    }

    if (onMarkAllRead && !markedReadRef.current) {
      markedReadRef.current = true;
      void onMarkAllRead();
    }
  }, [onMarkAllRead, open]);

  const handleClose = useCallback(() => {
    setPendingDelete(null);
    onClose();
    window.setTimeout(() => returnFocusRef?.current?.focus(), 0);
  }, [onClose, returnFocusRef]);

  const handleMarkAllRead = async () => {
    if (!onMarkAllRead) return;
    const ok = await onMarkAllRead();
    if (ok) {
      showToast('Activity marked as read.', 'success');
    }
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete || !onDelete) return;

    const ok = await onDelete(pendingDelete.id);
    setPendingDelete(null);
    if (ok) {
      showToast('Activity deleted.', 'success');
      return;
    }

    showToast('Failed to delete activity.', 'destructive');
  };

  if (!open || typeof document === 'undefined') return null;

  return (
    <>
      <aside
        role="complementary"
        aria-label="Board activity"
        className="fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col border-l border-(--border) bg-(--background) shadow-[var(--shadow-elevated)]"
      >
        <header className="flex items-start justify-between gap-3 border-b border-(--border) px-5 py-4">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-(--text-muted)">
              Activity
            </p>
            <h2 className="mt-1 text-lg font-semibold text-(--text-strong)">{boardTitle}</h2>
            <p className="mt-1 text-sm text-(--text-muted)">
              Replay changes directly on the board canvas.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleClose}
            className="rounded-full border-(--border) bg-transparent"
            aria-label="Close activity panel"
          >
            <X className="h-4 w-4" />
          </Button>
        </header>

        <div className="flex flex-wrap items-center gap-2 border-b border-(--border) px-5 py-3">
          <Button
            type="button"
            size="sm"
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            className="rounded-full"
          >
            All
          </Button>
          <Button
            type="button"
            size="sm"
            variant={filter === 'unread' ? 'default' : 'outline'}
            onClick={() => setFilter('unread')}
            className="rounded-full"
          >
            Unread{unreadCount > 0 ? ` (${unreadCount})` : ''}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={filter === 'hidden' ? 'default' : 'outline'}
            onClick={() => setFilter('hidden')}
            className="rounded-full"
          >
            Hidden{hiddenCount > 0 ? ` (${hiddenCount})` : ''}
          </Button>
          {onMarkAllRead && unreadCount > 0 && filter !== 'hidden' ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => void handleMarkAllRead()}
              className="ml-auto rounded-full"
            >
              Mark all as read
            </Button>
          ) : null}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="space-y-3" aria-busy="true" aria-label="Loading activity">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-16 w-full rounded-2xl" />
              ))}
            </div>
          ) : visibleActivity.length === 0 ? (
            <div className="flex h-full min-h-48 flex-col items-center justify-center gap-3 text-center">
              <History className="h-8 w-8 text-(--text-muted)" aria-hidden="true" />
              <p className="text-sm text-(--text-muted)">
                {filter === 'unread'
                  ? 'No unread activity.'
                  : filter === 'hidden'
                    ? 'No hidden activity.'
                    : 'No activity yet. Saves from collaborators will appear here.'}
              </p>
              {filter === 'unread' ? (
                <GuardedLink href="/settings#collaboration" className="text-sm text-(--text-strong) underline">
                  Adjust retention in settings
                </GuardedLink>
              ) : null}
            </div>
          ) : (
            <ul className="space-y-3">
              {visibleActivity.map((event) => (
                <ActivityItem
                  key={event.id}
                  event={event}
                  isActiveReplay={activeReplayId === event.id}
                  canDelete={isOwner}
                  showHiddenActions={filter === 'hidden'}
                  onReplayOnBoard={onReplayOnBoard}
                  onDeleteRequest={setPendingDelete}
                  onToggleRead={onToggleRead}
                  onHide={onHide}
                  onUnhide={onUnhide}
                />
              ))}
            </ul>
          )}
        </div>
      </aside>

      <ConfirmationModal
        open={pendingDelete !== null}
        title="Delete this activity entry?"
        description="This removes the activity entry for everyone on the board. This cannot be undone."
        confirmLabel="Delete activity"
        cancelLabel="Cancel"
        destructive
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}
