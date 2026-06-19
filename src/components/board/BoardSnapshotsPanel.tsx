'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Camera, Eye, GitCompare, RotateCcw, Trash2, X } from 'lucide-react';
import type { Board, BoardSnapshot } from '@/types/board';
import { apiFetch } from '@/lib/api-client';
import { formatDateTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmationModal } from '@/components/shared/ConfirmationModal';
import { SnapshotPreviewModal } from '@/components/board/SnapshotPreviewModal';
import { SnapshotDiffModal } from '@/components/board/SnapshotDiffModal';
import {
  collaborationListItemClassName,
  CollaborationUnseenIndicator,
} from '@/components/board/CollaborationUnseenIndicator';
import { isCollaborationItemUnreadForViewer } from '@/lib/collaboration-read-state';
import { showToast } from '@/components/shared/toast-store';
import { editorLargeModalClass, editorModalScrimClass, editorPanelScrimClass } from '@/components/board/board-editor-styles';
import { cn } from '@/lib/utils';
import { lockBodyScroll } from '@/lib/body-scroll-lock';

type BoardSnapshotsPanelProps = {
  open: boolean;
  board: Board;
  canEdit: boolean;
  isOwner: boolean;
  onClose: () => void;
  onRestored: (board: Board) => void;
  onMarkAllRead?: () => Promise<boolean>;
  onMarkSnapshotRead?: (snapshotId: string) => Promise<boolean>;
  onSnapshotsChanged?: () => void;
  snapshotsLastReadAt?: string | null;
  currentUserId?: string | null;
  returnFocusRef?: React.RefObject<HTMLButtonElement | null>;
};

export function BoardSnapshotsPanel({
  open,
  board,
  canEdit,
  isOwner,
  onClose,
  onRestored,
  onMarkAllRead,
  onMarkSnapshotRead,
  onSnapshotsChanged,
  snapshotsLastReadAt = null,
  currentUserId = null,
  returnFocusRef,
}: BoardSnapshotsPanelProps) {
  const [snapshots, setSnapshots] = useState<BoardSnapshot[]>([]);
  const [snapshotCount, setSnapshotCount] = useState(0);
  const [snapshotLimit, setSnapshotLimit] = useState(25);
  const [snapshotAutoPrune, setSnapshotAutoPrune] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [labelDraft, setLabelDraft] = useState('');
  const [pendingRestore, setPendingRestore] = useState<BoardSnapshot | null>(null);
  const [pendingDelete, setPendingDelete] = useState<BoardSnapshot | null>(null);
  const [previewSnapshot, setPreviewSnapshot] = useState<BoardSnapshot | null>(null);
  const [diffSnapshot, setDiffSnapshot] = useState<BoardSnapshot | null>(null);
  const [autoBackupBeforeRestore, setAutoBackupBeforeRestore] = useState(true);

  const isUnseenSnapshot = useCallback(
    (snapshot: BoardSnapshot) =>
      isCollaborationItemUnreadForViewer(
        currentUserId,
        snapshot.userId,
        snapshot.createdAt,
        snapshotsLastReadAt,
      ),
    [currentUserId, snapshotsLastReadAt],
  );

  const unseenSnapshotCount = useMemo(
    () => snapshots.filter((snapshot) => isUnseenSnapshot(snapshot)).length,
    [isUnseenSnapshot, snapshots],
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{
        snapshots: BoardSnapshot[];
        count: number;
        limit: number;
        autoPrune: boolean;
      }>(`/api/boards/${board.id}/snapshots`);
      setSnapshots(data.snapshots);
      setSnapshotCount(data.count);
      setSnapshotLimit(data.limit);
      setSnapshotAutoPrune(data.autoPrune);
    } catch {
      setSnapshots([]);
      setSnapshotCount(0);
    } finally {
      setLoading(false);
    }
  }, [board.id]);

  const atSnapshotLimit =
    snapshotLimit > 0 && !snapshotAutoPrune && snapshotCount >= snapshotLimit;
  const limitLabel =
    snapshotLimit > 0 ? `${snapshotCount} of ${snapshotLimit} snapshots` : `${snapshotCount} snapshots (unlimited)`;

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        void refresh();
      }
    });

    return () => {
      cancelled = true;
    };
  }, [open, refresh]);

  useEffect(() => {
    if (!open) return;

    const unlockBodyScroll = lockBodyScroll();
    return () => {
      unlockBodyScroll();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !pendingRestore && !pendingDelete && !previewSnapshot) {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, open, pendingDelete, pendingRestore, previewSnapshot]);

  const handleClose = () => {
    setPendingRestore(null);
    setPendingDelete(null);
    onClose();
    window.setTimeout(() => returnFocusRef?.current?.focus(), 0);
  };

  const handleSaveSnapshot = async () => {
    if (!canEdit) return;

    setSaving(true);
    try {
      const data = await apiFetch<{
        snapshot: BoardSnapshot;
        pruned?: number;
        count: number;
        limit: number;
        autoPrune: boolean;
      }>(`/api/boards/${board.id}/snapshots`, {
        method: 'POST',
        body: JSON.stringify({
          board,
          label: labelDraft.trim() || undefined,
        }),
      });
      await refresh();
      setLabelDraft('');
      onSnapshotsChanged?.();
      if (data.pruned && data.pruned > 0) {
        showToast(
          `Snapshot saved. ${data.pruned} older snapshot${data.pruned === 1 ? '' : 's'} removed to stay within your limit.`,
          'default',
        );
        return;
      }
      showToast('Snapshot saved.', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save snapshot';
      showToast(message, 'destructive');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmRestore = async () => {
    if (!pendingRestore) return;

    setRestoringId(pendingRestore.id);
    try {
      if (autoBackupBeforeRestore) {
        await apiFetch<{ snapshot: BoardSnapshot }>(`/api/boards/${board.id}/snapshots`, {
          method: 'POST',
          body: JSON.stringify({
            board,
            label: 'Auto-backup before restore',
          }),
        });
      }

      const data = await apiFetch<{ board: Board }>(
        `/api/boards/${board.id}/snapshots/${pendingRestore.id}/restore`,
        { method: 'POST' },
      );
      onRestored(data.board);
      setPendingRestore(null);
      handleClose();
      showToast('Board restored from snapshot.', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to restore snapshot';
      showToast(message, 'destructive');
    } finally {
      setRestoringId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;

    setDeletingId(pendingDelete.id);
    try {
      await apiFetch(`/api/boards/${board.id}/snapshots/${pendingDelete.id}`, {
        method: 'DELETE',
      });
      setSnapshots((current) => current.filter((snapshot) => snapshot.id !== pendingDelete.id));
      setSnapshotCount((count) => Math.max(0, count - 1));
      setPendingDelete(null);
      onSnapshotsChanged?.();
      showToast('Snapshot deleted.', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete snapshot';
      showToast(message, 'destructive');
    } finally {
      setDeletingId(null);
    }
  };

  const handleMarkAllRead = async () => {
    if (!onMarkAllRead) return;
    const ok = await onMarkAllRead();
    if (ok) {
      showToast('Snapshots marked as seen.', 'success');
    }
  };

  const handleMarkSnapshotRead = async (snapshot: BoardSnapshot) => {
    if (!onMarkSnapshotRead || !isUnseenSnapshot(snapshot)) return;
    const ok = await onMarkSnapshotRead(snapshot.id);
    if (!ok) {
      showToast('Failed to update read state.', 'destructive');
    }
  };

  const handlePreviewSnapshot = async (snapshot: BoardSnapshot) => {
    if (isUnseenSnapshot(snapshot) && onMarkSnapshotRead) {
      const ok = await onMarkSnapshotRead(snapshot.id);
      if (!ok) {
        showToast('Failed to update read state.', 'destructive');
      }
    }
    setPreviewSnapshot(snapshot);
  };

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-50 flex justify-end">
        <button
          type="button"
          aria-label="Close snapshots"
          className={cn('absolute inset-0', editorPanelScrimClass)}
          onClick={handleClose}
        />

        <aside
          role="dialog"
          aria-modal="true"
          aria-labelledby="board-snapshots-title"
          className="relative flex h-full w-full max-w-md flex-col border-l border-(--border) bg-(--background) shadow-[var(--shadow-elevated)]"
        >
          <header className="flex items-start justify-between gap-3 border-b border-(--border) px-5 py-4">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-(--text-muted)">
                Snapshots
              </p>
              <h2 id="board-snapshots-title" className="mt-1 text-lg font-semibold text-(--text-strong)">
                {board.title}
              </h2>
              <p className="mt-1 text-xs text-(--text-muted)">{limitLabel}</p>
              {snapshotLimit > 0 && snapshotAutoPrune ? (
                <p className="text-xs text-(--text-muted)">Oldest snapshots auto-remove when over limit.</p>
              ) : null}
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleClose}
              tooltip="Close snapshots"
              tooltipSide="bottom"
              className="rounded-full border-(--border) bg-transparent"
              aria-label="Close snapshots panel"
            >
              <X className="h-4 w-4" />
            </Button>
          </header>

          {unseenSnapshotCount > 0 && onMarkAllRead ? (
            <div className="flex justify-end border-b border-(--border) px-5 py-2">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => void handleMarkAllRead()}
                className="rounded-full text-xs"
              >
                Mark all as seen
              </Button>
            </div>
          ) : null}

          {canEdit ? (
            <div className="space-y-3 border-b border-(--border) px-5 py-4">
              <label htmlFor="snapshot-label" className="text-xs uppercase tracking-[0.2em] text-(--text-muted)">
                Optional label
              </label>
              <Input
                id="snapshot-label"
                value={labelDraft}
                onChange={(event) => setLabelDraft(event.target.value)}
                placeholder="Before palette refresh"
                className="rounded-2xl border-(--border) bg-(--background)"
              />
              <Button
                type="button"
                onClick={() => void handleSaveSnapshot()}
                disabled={saving || atSnapshotLimit}
                className="w-full rounded-full"
              >
                <Camera className="h-4 w-4" />
                {saving ? 'Saving…' : atSnapshotLimit ? 'Snapshot limit reached' : 'Save snapshot'}
              </Button>
              {atSnapshotLimit ? (
                <p className="text-xs leading-5 text-(--text-muted)">
                  Delete old snapshots or enable auto-prune in Settings to save more.
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="flex-1 overflow-y-auto px-5 py-4">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-20 w-full rounded-2xl" />
                ))}
              </div>
            ) : snapshots.length === 0 ? (
              <p className="text-sm text-(--text-muted)">
                No snapshots yet. Save one before a big change to restore later.
              </p>
            ) : (
              <ul className="space-y-3">
                {snapshots.map((snapshot) => {
                  const unseen = isUnseenSnapshot(snapshot);

                  return (
                  <li
                    key={snapshot.id}
                    className={collaborationListItemClassName()}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium text-(--text-strong)">
                            {snapshot.label?.trim() || 'Untitled snapshot'}
                          </p>
                          {unseen ? <CollaborationUnseenIndicator /> : null}
                        </div>
                        <p className="text-xs text-(--text-muted)">
                          {snapshot.actorName} · {formatDateTime(snapshot.createdAt)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        {unseen && onMarkSnapshotRead ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => void handleMarkSnapshotRead(snapshot)}
                            tooltip="Mark as seen"
                            tooltipSide="bottom"
                            className="h-8 w-8 rounded-full text-(--text-muted) hover:text-(--text-strong)"
                            aria-label={`Mark snapshot ${snapshot.label?.trim() || 'Untitled snapshot'} as seen`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        ) : null}
                        {isOwner ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={deletingId === snapshot.id}
                            onClick={() => setPendingDelete(snapshot)}
                            tooltip="Delete snapshot"
                            tooltipSide="bottom"
                            className="h-8 w-8 rounded-full text-(--text-muted) hover:text-red-600"
                            aria-label={`Delete snapshot ${snapshot.label?.trim() || 'Untitled snapshot'}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ) : null}
                      </div>
                    </div>
                    {canEdit ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => void handlePreviewSnapshot(snapshot)}
                          className="rounded-full"
                        >
                          <Eye className="h-4 w-4" />
                          Preview
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setDiffSnapshot(snapshot)}
                          className="rounded-full"
                        >
                          <GitCompare className="h-4 w-4" />
                          Compare
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={restoringId === snapshot.id || deletingId === snapshot.id}
                          onClick={() => {
                            setAutoBackupBeforeRestore(true);
                            setPendingRestore(snapshot);
                          }}
                          className="rounded-full"
                        >
                          <RotateCcw className="h-4 w-4" />
                          {restoringId === snapshot.id ? 'Restoring…' : 'Restore'}
                        </Button>
                      </div>
                    ) : null}
                  </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>
      </div>

      <ConfirmationModal
        open={pendingDelete !== null}
        title="Delete this snapshot?"
        description="This permanently removes the snapshot. The live board will not change."
        confirmLabel="Delete snapshot"
        cancelLabel="Cancel"
        destructive
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setPendingDelete(null)}
      />

      {pendingRestore ? (
        <div
          className={cn(
            'fixed inset-0 z-[10065] flex items-center justify-center px-4',
            editorModalScrimClass,
          )}
        >
          <div className={cn(editorLargeModalClass, 'w-full max-w-md p-6')}>
            <h2 className="[font-family:var(--font-display),serif] text-3xl tracking-tight text-(--text-strong)">
              Restore this snapshot?
            </h2>
            <p className="mt-3 text-sm leading-6 text-(--text-muted)">
              This replaces the current board content for everyone. Your unsaved local edits will be lost.
            </p>
            <label className="mt-4 flex items-start gap-2 text-sm text-(--text-strong)">
              <input
                type="checkbox"
                checked={autoBackupBeforeRestore}
                onChange={(event) => setAutoBackupBeforeRestore(event.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-(--border)"
              />
              Save an auto-backup of the current board before restoring
            </label>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setPendingRestore(null)} className="rounded-full">
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={restoringId !== null}
                onClick={() => void handleConfirmRestore()}
                className="rounded-full"
              >
                {restoringId ? 'Restoring…' : 'Restore snapshot'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <SnapshotPreviewModal
        open={previewSnapshot !== null}
        board={previewSnapshot?.boardData ?? board}
        title={previewSnapshot?.label?.trim() || 'Untitled snapshot'}
        onClose={() => setPreviewSnapshot(null)}
      />

      <SnapshotDiffModal
        open={diffSnapshot !== null}
        snapshot={diffSnapshot}
        currentBoard={board}
        allSnapshots={snapshots}
        onClose={() => setDiffSnapshot(null)}
      />
    </>,
    document.body,
  );
}
