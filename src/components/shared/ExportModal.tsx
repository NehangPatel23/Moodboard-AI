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

async function waitForCaptureReady(node: HTMLElement) {
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    await document.fonts.ready;
  }

  const images = Array.from(node.querySelectorAll('img'));
  await Promise.all(
    images.map(
      (image) =>
        new Promise<void>((resolve) => {
          if (image.complete) {
            resolve();
            return;
          }

          image.onload = () => resolve();
          image.onerror = () => resolve();
        }),
    ),
  );

  await new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });
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

    await waitForCaptureReady(node);

    const width = node.offsetWidth || node.scrollWidth || 1200;
    const height = node.offsetHeight || node.scrollHeight;

    if (!width || !height) {
      throw new Error('Export layout has no dimensions.');
    }

    return toPng(node, {
      cacheBust: true,
      pixelRatio: 2,
      width,
      height,
      backgroundColor: '#f7f4ef',
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

      const { width: imageWidth, height: imageHeight } = pdf.getImageProperties(dataUrl);
      if (!imageWidth || !imageHeight) {
        throw new Error('Captured image has no dimensions.');
      }

      const pdfWidth = maxWidth;
      const pdfHeight = (imageHeight * pdfWidth) / imageWidth;

      if (pdfHeight <= maxHeight) {
        pdf.addImage(dataUrl, 'PNG', margin, margin, pdfWidth, pdfHeight);
      } else {
        let heightLeft = pdfHeight;
        let position = margin;

        pdf.addImage(dataUrl, 'PNG', margin, position, pdfWidth, pdfHeight);
        heightLeft -= maxHeight;

        while (heightLeft > 0) {
          position = heightLeft - pdfHeight + margin;
          pdf.addPage();
          pdf.addImage(dataUrl, 'PNG', margin, position, pdfWidth, pdfHeight);
          heightLeft -= maxHeight;
        }
      }

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
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
            <p className="text-sm leading-6 text-[var(--text-muted)]">
              <strong className="font-medium text-[var(--text-strong)]">JSON</strong> — full board data.
            </p>
            <Button type="button" variant="outline" onClick={handleDownloadJson} className="shrink-0 rounded-full">
              Download JSON
            </Button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
            <p className="text-sm leading-6 text-[var(--text-muted)]">
              <strong className="font-medium text-[var(--text-strong)]">PNG</strong> — visual moodboard image.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => void handleDownloadPng()}
              disabled={exporting}
              className="shrink-0 rounded-full"
            >
              {exportingVisual === 'png' ? 'Exporting…' : 'Download PNG'}
            </Button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
            <p className="text-sm leading-6 text-[var(--text-muted)]">
              <strong className="font-medium text-[var(--text-strong)]">PDF</strong> — printable moodboard summary.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => void handleDownloadPdf()}
              disabled={exporting}
              className="shrink-0 rounded-full"
            >
              {exportingVisual === 'pdf' ? 'Exporting…' : 'Download PDF'}
            </Button>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button variant="default" type="button" onClick={onClose} className="rounded-full">
            Close
          </Button>
        </div>
      </div>

      <div
        ref={captureRef}
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-[-10000px]"
      >
        <BoardExportCapture board={board} />
      </div>
    </div>
  );
}
