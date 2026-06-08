'use client';

import { useRef, useState } from 'react';
import type { Board } from '@/types/board';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { Button } from '@/components/ui/button';
import { BoardExportCapture } from '@/components/board/BoardExportCapture';
import { showToast } from '@/components/shared/toast-store';

type ExportFormat = 'json' | 'png' | 'pdf';

type ExportModalProps = {
  open: boolean;
  board: Board;
  onExported: (format: ExportFormat) => void;
  onClose: () => void;
};

function downloadSlug(title: string): string {
  return title.replace(/\s+/g, '-').toLowerCase();
}

export function ExportModal({
  open,
  board,
  onExported,
  onClose,
}: ExportModalProps) {
  const captureRef = useRef<HTMLDivElement>(null);
  const [exportingVisual, setExportingVisual] = useState<'png' | 'pdf' | null>(null);

  if (!open) return null;

  function handleDownloadJson() {
    const payload = JSON.stringify(board, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${downloadSlug(board.title)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    onExported('json');
  }

  async function captureLayoutPng(): Promise<string> {
    const node = captureRef.current;
    if (!node) {
      throw new Error('Export layout not ready.');
    }

    return toPng(node, {
      cacheBust: true,
      pixelRatio: 2,
      width: node.scrollWidth,
      height: node.scrollHeight,
    });
  }

  async function handleDownloadPng() {
    setExportingVisual('png');
    try {
      const dataUrl = await captureLayoutPng();
      const anchor = document.createElement('a');
      anchor.href = dataUrl;
      anchor.download = `${downloadSlug(board.title)}.png`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      onExported('png');
    } catch {
      showToast('PNG export failed. Try again or export JSON instead.', 'destructive');
    } finally {
      setExportingVisual(null);
    }
  }

  async function handleDownloadPdf() {
    setExportingVisual('pdf');
    try {
      const dataUrl = await captureLayoutPng();
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const maxWidth = pageWidth - margin * 2;
      const maxHeight = pageHeight - margin * 2;

      const image = new Image();
      image.src = dataUrl;
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error('Failed to load capture'));
      });

      const scale = Math.min(maxWidth / image.width, maxHeight / image.height);
      const width = image.width * scale;
      const height = image.height * scale;
      const x = (pageWidth - width) / 2;
      const y = margin;

      pdf.addImage(dataUrl, 'PNG', x, y, width, height);
      pdf.save(`${downloadSlug(board.title)}.pdf`);
      onExported('pdf');
    } catch {
      showToast('PDF export failed. Try PNG or JSON instead.', 'destructive');
    } finally {
      setExportingVisual(null);
    }
  }

  const exporting = exportingVisual !== null;

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
          <p id="export-description" className="text-sm leading-6 text-[var(--text-muted)]">
            Export the current board as JSON, PNG, or PDF.
          </p>
        </div>

        <div className="mt-5 space-y-3">
          <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-subtle)] p-4 text-sm leading-6 text-[var(--text-muted)]">
            <strong className="font-medium text-[var(--text-strong)]">JSON</strong> — full board data.
          </div>
          <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-subtle)] p-4 text-sm leading-6 text-[var(--text-muted)]">
            <strong className="font-medium text-[var(--text-strong)]">PNG</strong> — visual moodboard image.
          </div>
          <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-subtle)] p-4 text-sm leading-6 text-[var(--text-muted)]">
            <strong className="font-medium text-[var(--text-strong)]">PDF</strong> — printable moodboard summary.
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button variant="outline" type="button" onClick={onClose} className="rounded-full">
            Close
          </Button>
          <Button type="button" variant="outline" onClick={handleDownloadJson} className="rounded-full">
            Download JSON
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleDownloadPng()}
            disabled={exporting}
            className="rounded-full"
          >
            {exportingVisual === 'png' ? 'Exporting…' : 'Download PNG'}
          </Button>
          <Button
            type="button"
            onClick={() => void handleDownloadPdf()}
            disabled={exporting}
            className="rounded-full"
          >
            {exportingVisual === 'pdf' ? 'Exporting…' : 'Download PDF'}
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
