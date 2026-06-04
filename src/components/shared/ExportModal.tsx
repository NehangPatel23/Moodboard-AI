'use client';

import type { Board } from '@/types/board';
import { Button } from '@/components/ui/button';

type ExportModalProps = {
  open: boolean;
  board: Board;
  onExported: () => void;
  onClose: () => void;
};

export function ExportModal({
  open,
  board,
  onExported,
  onClose,
}: ExportModalProps) {
  if (!open) return null;

  function handleDownload() {
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

    onExported();
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
            Download JSON
          </h2>

          <p
            id="export-description"
            className="text-sm leading-6 text-[var(--text-muted)]"
          >
            Download the current board as JSON for backup or handoff.
          </p>
        </div>

        <div className="mt-5 rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-subtle)] p-4 text-sm leading-6 text-[var(--text-muted)]">
          Includes title, prompt, summary, palette, typography,
          references, notes, timestamps, and visibility.
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
            onClick={handleDownload}
            className="rounded-full"
          >
            Download JSON
          </Button>
        </div>
      </div>
    </div>
  );
}