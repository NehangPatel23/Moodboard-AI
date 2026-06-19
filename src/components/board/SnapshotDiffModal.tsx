'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Board, BoardSnapshot } from '@/types/board';
import { BoardReplayCallout } from '@/components/board/BoardReplayCallout';
import { SnapshotPreviewModal } from '@/components/board/SnapshotPreviewModal';
import { Button } from '@/components/ui/button';
import { lockBodyScroll } from '@/lib/body-scroll-lock';
import { diffBoards } from '@/lib/board-diff';
import {
  EDITOR_SECTION_META,
  EDITOR_SECTION_ORDER,
  type EditorSectionName,
} from '@/lib/editor-sections';
import { editorLargeModalClass, editorModalScrimClass } from '@/components/board/board-editor-styles';
import { cn, formatDateTime } from '@/lib/utils';

type SnapshotDiffModalProps = {
  open: boolean;
  snapshot: BoardSnapshot | null;
  currentBoard: Board;
  allSnapshots: BoardSnapshot[];
  onClose: () => void;
};

type SnapshotDiffModalContentProps = {
  snapshot: BoardSnapshot;
  currentBoard: Board;
  allSnapshots: BoardSnapshot[];
  onClose: () => void;
};

type BaselineOption = 'current' | string;

function isEditorSection(value: string): value is EditorSectionName {
  return (EDITOR_SECTION_ORDER as readonly string[]).includes(value);
}

function SnapshotDiffModalContent({
  snapshot,
  currentBoard,
  allSnapshots,
  onClose,
}: SnapshotDiffModalContentProps) {
  const [baseline, setBaseline] = useState<BaselineOption>('current');
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const unlockBodyScroll = lockBodyScroll();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (previewOpen) {
          setPreviewOpen(false);
          return;
        }
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      unlockBodyScroll();
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, previewOpen]);

  const compareBoard = useMemo(() => {
    if (baseline === 'current') return currentBoard;

    const other = allSnapshots.find((item) => item.id === baseline);
    return other?.boardData ?? currentBoard;
  }, [allSnapshots, baseline, currentBoard]);

  const baselineLabel = useMemo(() => {
    if (baseline === 'current') return 'Current board';
    const other = allSnapshots.find((item) => item.id === baseline);
    if (!other) return 'Current board';
    return other.label?.trim() || 'Untitled snapshot';
  }, [allSnapshots, baseline]);

  const changes = useMemo(() => diffBoards(snapshot.boardData, compareBoard), [compareBoard, snapshot.boardData]);

  const groupedChanges = useMemo(() => {
    const groups = new Map<EditorSectionName, typeof changes>();

    for (const change of changes) {
      const section = isEditorSection(change.section) ? change.section : 'overview';
      const existing = groups.get(section) ?? [];
      existing.push(change);
      groups.set(section, existing);
    }

    return EDITOR_SECTION_ORDER.map((section) => ({
      section,
      label: EDITOR_SECTION_META[section].label,
      changes: groups.get(section) ?? [],
    })).filter((group) => group.changes.length > 0);
  }, [changes]);

  const snapshotTitle = snapshot.label?.trim() || 'Untitled snapshot';
  const otherSnapshots = allSnapshots.filter((item) => item.id !== snapshot.id);

  return (
    <>
      {!previewOpen ? (
        <div
          className={cn(
            'fixed inset-0 z-[10075] flex items-center justify-center px-4 py-6',
            editorModalScrimClass,
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby="snapshot-diff-title"
          onMouseDown={onClose}
        >
          <div
            className={cn(
              editorLargeModalClass,
              'flex max-h-[min(90vh,900px)] w-full max-w-3xl flex-col overflow-hidden',
            )}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="border-b border-(--border) px-6 py-4">
              <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-(--text-muted)">
                Snapshot diff
              </p>
              <h2 id="snapshot-diff-title" className="mt-1 text-xl font-semibold text-(--text-strong)">
                {snapshotTitle}
              </h2>
              <p className="mt-1 text-sm text-(--text-muted)">
                {snapshot.actorName} · {formatDateTime(snapshot.createdAt)}
              </p>

              <label className="mt-4 block text-sm text-(--text-strong)">
                <span className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.28em] text-(--text-muted)">
                  Compare to
                </span>
                <select
                  value={baseline}
                  onChange={(event) => setBaseline(event.target.value as BaselineOption)}
                  className="h-10 w-full rounded-full border border-(--border) bg-(--surface-elevated) px-4 text-sm text-(--text-strong) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--ring)"
                >
                  <option value="current">Current board</option>
                  {otherSnapshots.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label?.trim() || 'Untitled snapshot'} · {formatDateTime(item.createdAt)}
                    </option>
                  ))}
                </select>
              </label>
              <p className="mt-2 text-xs text-(--text-muted)">
                Showing changes from this snapshot to {baselineLabel.toLowerCase()}.
              </p>
            </header>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {groupedChanges.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-(--border) bg-(--surface-soft) px-4 py-8 text-center text-sm text-(--text-muted)">
                  No differences — snapshot matches the selected baseline.
                </p>
              ) : (
                <div className="space-y-6">
                  {groupedChanges.map((group) => (
                    <section key={group.section}>
                      <h3 className="text-[10px] font-medium uppercase tracking-[0.28em] text-(--text-muted)">
                        {group.label}
                      </h3>
                      <div className="mt-3 space-y-3">
                        {group.changes.map((change, index) => (
                          <BoardReplayCallout
                            key={`${group.section}-${change.summary}-${index}`}
                            change={change}
                            variant="card"
                          />
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </div>

            <footer className="flex flex-wrap items-center justify-end gap-3 border-t border-(--border) px-6 py-4">
              <Button type="button" variant="outline" onClick={() => setPreviewOpen(true)} className="rounded-full">
                Preview snapshot
              </Button>
              <Button type="button" onClick={onClose} className="rounded-full">
                Close
              </Button>
            </footer>
          </div>
        </div>
      ) : null}

      <SnapshotPreviewModal
        open={previewOpen}
        board={snapshot.boardData}
        title={snapshotTitle}
        onClose={() => setPreviewOpen(false)}
      />
    </>
  );
}

export function SnapshotDiffModal({
  open,
  snapshot,
  currentBoard,
  allSnapshots,
  onClose,
}: SnapshotDiffModalProps) {
  if (!open || !snapshot || typeof document === 'undefined') return null;

  return createPortal(
    <SnapshotDiffModalContent
      key={snapshot.id}
      snapshot={snapshot}
      currentBoard={currentBoard}
      allSnapshots={allSnapshots}
      onClose={onClose}
    />,
    document.body,
  );
}
