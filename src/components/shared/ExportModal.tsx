'use client';

import { useRef, useState } from 'react';
import type { Board } from '@/types/board';
import { toPng } from 'html-to-image';
import { Button } from '@/components/ui/button';
import { BoardExportCapture } from '@/components/board/BoardExportCapture';
import { showToast } from '@/components/shared/toast-store';

type ExportModalProps = {
  open: boolean;
  board: Board;
  onExported: (format: 'json' | 'png') => void;
  onClose: () => void;
};

export function ExportModal({
  open,
  board,
  onExported,
  onClose,
}: ExportModalProps) {
  const captureRef = useRef<HTMLDivElement>(null);
  const [exportingPng, setExportingPng] = useState(false);

  if (!open) return null;

  function handleDownloadJson() {
    const payload = JSON.stringify(board, null, 2);

    const blob = new Blob([payload], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${board.title
      .replace(/\s+/g, '-')
      .toLowerCase()}.json`;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);

    onExported('json');
  }

  async function handleDownloadPng() {
    const node = captureRef.current;
    if (!node) {
      showToast('Export layout not ready.', 'destructive');
      return;
    }

    setExportingPng(true);
    try {
      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 2,
      });

      const anchor = document.createElement('a');
      anchor.href = dataUrl;
      anchor.download = `${board.title.replace(/\s+/g, '-').toLowerCase()}.png`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      onExported('png');
    } catch {
      showToast('PNG export failed. Try again or export JSON instead.', 'destructive');
    } finally {
      setExportingPng(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[10050] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-title"
      aria-describedby="export-description"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-lg rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 text-[var(--text)] shadow-[0_30px_80px_rgba(15,23,42,0.15)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="space-y-2">
          <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--text-muted)]">
            Export board
          </p>

          <h2
            id="export-title"
            className="[font-family:var(--font-display),serif] text-3xl tracking-tight text-[var(--text-strong)]"
          >
            Download board
          </h2>

          <p
            id="export-description"
            className="text-sm leading-6 text-[var(--text-muted)]"
          >
            Export the current board as JSON for backup or as a PNG moodboard for sharing.
          </p>
        </div>

        <div className="mt-5 space-y-3">
          <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-subtle)] p-4 text-sm leading-6 text-[var(--text-muted)]">
            <strong className="font-medium text-[var(--text-strong)]">JSON</strong> — full board
            data including palette, typography, references, notes, and timestamps.
          </div>
          <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-subtle)] p-4 text-sm leading-6 text-[var(--text-muted)]">
            <strong className="font-medium text-[var(--text-strong)]">PNG moodboard</strong> — visual
            summary with title, palette swatches, typography, and reference thumbnails.
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button
            variant="outline"
            type="button"
            onClick={onClose}
            className="rounded-full"
          >
            Close
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleDownloadJson}
            className="rounded-full"
          >
            Download JSON
          </Button>

          <Button
            type="button"
            onClick={() => void handleDownloadPng()}
            disabled={exportingPng}
            className="rounded-full"
          >
            {exportingPng ? 'Exporting…' : 'Download PNG'}
          </Button>
        </div>
      </div>

      <div
        ref={captureRef}
        aria-hidden="true"
        className="pointer-events-none fixed -left-[9999px] top-0"
      >
        <BoardExportCapture board={board} />
      </div>
    </div>
  );
}
