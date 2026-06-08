'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Camera, RotateCcw, X } from 'lucide-react';
import type { Board, BoardSnapshot } from '@/types/board';
import { apiFetch } from '@/lib/api-client';
import { formatDateTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmationModal } from '@/components/shared/ConfirmationModal';
import { showToast } from '@/components/shared/toast-store';

type BoardSnapshotsPanelProps = {
  open: boolean;
  board: Board;
  canEdit: boolean;
  onClose: () => void;
  onRestored: (board: Board) => void;
  returnFocusRef?: React.RefObject<HTMLButtonElement | null>;
};

export function BoardSnapshotsPanel({
  open,
  board,
  canEdit,
  onClose,
  onRestored,
  returnFocusRef,
}: BoardSnapshotsPanelProps) {
  const [snapshots, setSnapshots] = useState<BoardSnapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [labelDraft, setLabelDraft] = useState('');
  const [pendingRestore, setPendingRestore] = useState<BoardSnapshot | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ snapshots: BoardSnapshot[] }>(
        `/api/boards/${board.id}/snapshots`,
      );
      setSnapshots(data.snapshots);
    } catch {
      setSnapshots([]);
    } finally {
      setLoading(false);
    }
  }, [board.id]);

  useEffect(() => {
    if (!open) return;
    void refresh();
  }, [open, refresh]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !pendingRestore) {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, open, pendingRestore]);

  const handleClose = () => {
    setPendingRestore(null);
    onClose();
    window.setTimeout(() => returnFocusRef?.current?.focus(), 0);
  };

  const handleSaveSnapshot = async () => {
    if (!canEdit) return;

    setSaving(true);
    try {
      const data = await apiFetch<{ snapshot: BoardSnapshot }>(
        `/api/boards/${board.id}/snapshots`,
        {
          method: 'POST',
          body: JSON.stringify({
            board,
            label: labelDraft.trim() || undefined,
          }),
        },
      );
      setSnapshots((current) => [data.snapshot, ...current]);
      setLabelDraft('');
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

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-50 flex justify-end">
        <button
          type="button"
          aria-label="Close snapshots"
          className="absolute inset-0 bg-black/30 backdrop-blur-[1px]"
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
                disabled={saving}
                className="w-full rounded-full"
              >
                <Camera className="h-4 w-4" />
                {saving ? 'Saving…' : 'Save snapshot'}
              </Button>
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
                    <p className="text-sm font-medium text-(--text-strong)">
                      {snapshot.label?.trim() || 'Untitled snapshot'}
                    </p>
                    <p className="text-xs text-(--text-muted)">
                      {snapshot.actorName} · {formatDateTime(snapshot.createdAt)}
                    </p>
                    {canEdit ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={restoringId === snapshot.id}
                        onClick={() => setPendingRestore(snapshot)}
                        className="mt-3 rounded-full"
                      >
                        <RotateCcw className="h-4 w-4" />
                        {restoringId === snapshot.id ? 'Restoring…' : 'Restore'}
                      </Button>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>

      <ConfirmationModal
        open={pendingRestore !== null}
        title="Restore this snapshot?"
        description="This replaces the current board content for everyone. Your unsaved local edits will be lost."
        confirmLabel="Restore snapshot"
        cancelLabel="Cancel"
        destructive
        onConfirm={() => void handleConfirmRestore()}
        onCancel={() => setPendingRestore(null)}
      />
    </>,
    document.body,
  );
}
