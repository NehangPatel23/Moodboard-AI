'use client';

import { createPortal } from 'react-dom';
import type { Board } from '@/types/board';
import { BoardExportCapture } from '@/components/board/BoardExportCapture';
import { Button } from '@/components/ui/button';
import { lockBodyScroll } from '@/lib/body-scroll-lock';
import { useEffect } from 'react';

type SnapshotPreviewModalProps = {
  open: boolean;
  board: Board;
  title: string;
  onClose: () => void;
};

export function SnapshotPreviewModal({
  open,
  board,
  title,
  onClose,
}: SnapshotPreviewModalProps) {
  useEffect(() => {
    if (!open || typeof document === 'undefined') return;

    const unlockBodyScroll = lockBodyScroll();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      unlockBodyScroll();
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[10070] flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="snapshot-preview-title"
      onMouseDown={onClose}
    >
      <div
        className="flex max-h-[min(90vh,900px)] w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] border border-(--border) bg-(--surface) shadow-[0_30px_80px_rgba(15,23,42,0.15)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-(--border) px-6 py-4">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-(--text-muted)">
              Snapshot preview
            </p>
            <h2 id="snapshot-preview-title" className="mt-1 text-xl font-semibold text-(--text-strong)">
              {title}
            </h2>
          </div>
          <Button type="button" variant="outline" onClick={onClose} className="rounded-full">
            Close
          </Button>
        </header>

        <div className="overflow-y-auto p-6">
          <div className="overflow-hidden rounded-[1.5rem] border border-(--border)">
            <BoardExportCapture board={board} layout="fluid" />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
