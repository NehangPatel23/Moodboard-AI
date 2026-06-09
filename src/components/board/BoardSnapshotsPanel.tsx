'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Camera, Eye, RotateCcw, Trash2, X } from 'lucide-react';
import type { Board, BoardSnapshot } from '@/types/board';
import { apiFetch } from '@/lib/api-client';
import { formatDateTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmationModal } from '@/components/shared/ConfirmationModal';
import { SnapshotPreviewModal } from '@/components/board/SnapshotPreviewModal';
import { showToast } from '@/components/shared/toast-store';
import { editorModalScrimClass, editorPanelScrimClass } from '@/components/board/board-editor-styles';
import { cn } from '@/lib/utils';
import { lockBodyScroll } from '@/lib/body-scroll-lock';

type BoardSnapshotsPanelProps = {
  open: boolean;
  board: Board;
  canEdit: boolean;
  isOwner: boolean;
  onClose: () => void;
  onRestored: (board: Board) => void;
  returnFocusRef?: React.RefObject<HTMLButtonElement | null>;
};

export function BoardSnapshotsPanel({
  open,
  board,
  canEdit,
  isOwner,
  onClose,
  onRestored,
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
  const [autoBackupBeforeRestore, setAutoBackupBeforeRestore] = useState(true);

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
    void refresh();
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
      setPendingDelete(null);
      showToast('Snapshot deleted.', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete snapshot';
      showToast(message, 'destructive');
    } finally {
      setDeletingId(null);
    }
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
              className="rounded-full border-(--border) bg-transparent"
              aria-label="Close snapshots panel"
            >
              <X className="h-4 w-4" />
            </Button>
          </header>

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
                {snapshots.map((snapshot) => (
                  <li
                    key={snapshot.id}
                    className="rounded-2xl border border-(--border) bg-(--surface-muted) px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-(--text-strong)">
                          {snapshot.label?.trim() || 'Untitled snapshot'}
                        </p>
                        <p className="text-xs text-(--text-muted)">
                          {snapshot.actorName} · {formatDateTime(snapshot.createdAt)}
                        </p>
                      </div>
                      {isOwner ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={deletingId === snapshot.id}
                          onClick={() => setPendingDelete(snapshot)}
                          className="h-8 w-8 shrink-0 rounded-full text-(--text-muted) hover:text-red-600"
                          aria-label={`Delete snapshot ${snapshot.label?.trim() || 'Untitled snapshot'}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </div>
                    {canEdit ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setPreviewSnapshot(snapshot)}
                          className="rounded-full"
                        >
                          <Eye className="h-4 w-4" />
                          Preview
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
                ))}
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
          <div className="w-full max-w-md rounded-[2rem] border border-(--border) bg-(--surface) p-6 shadow-[0_30px_80px_rgba(15,23,42,0.15)]">
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
    </>,
    document.body,
  );
}
