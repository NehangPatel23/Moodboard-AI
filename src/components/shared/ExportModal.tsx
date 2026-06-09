'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal, flushSync } from 'react-dom';
import type { Board } from '@/types/board';
import { jsPDF } from 'jspdf';
import { Button } from '@/components/ui/button';
import { BoardExportCapture } from '@/components/board/BoardExportCapture';
import { captureExportBlocks, captureExportPng, EXPORT_CAPTURE_WIDTH } from '@/lib/export-capture';
import { buildPdfFromExportBlocks } from '@/lib/export-pdf';
import {
  buildDeterministicDesignSystemTokens,
  designSystemDownloadExtension,
  designSystemMimeType,
  exportDesignSystemFormat,
  type DesignSystemFormat,
  type DesignSystemTokens,
} from '@/lib/export-design-system';
import { fetchDesignSystemTokens } from '@/lib/ai';
import { AiEnhanceButton } from '@/components/shared/AiEnhanceButton';
import { showToast } from '@/components/shared/toast-store';
import { editorModalScrimClass } from '@/components/board/board-editor-styles';
import { cn } from '@/lib/utils';

export type ExportFormat = 'json' | 'png' | 'pdf' | 'design-system';
type PreviewFormat = 'visual' | 'json' | 'design-system';

type ExportModalProps = {
  open: boolean;
  board: Board;
  onExported: (format: ExportFormat, detail?: DesignSystemFormat) => void;
  onClose: () => void;
};

const DESIGN_SYSTEM_FORMATS: Array<{ id: DesignSystemFormat; label: string }> = [
  { id: 'css', label: 'CSS' },
  { id: 'tailwind', label: 'Tailwind' },
  { id: 'json', label: 'Tokens JSON' },
  { id: 'markdown', label: 'Markdown' },
];

function downloadSlug(title: string): string {
  return title.replace(/\s+/g, '-').toLowerCase();
}

function downloadTextFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

async function waitForNextFrame(): Promise<void> {
  await new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => resolve());
    });
  });
}

export function ExportModal({
  open,
  board,
  onExported,
  onClose,
}: ExportModalProps) {
  const portalRef = useRef<HTMLDivElement>(null);
  const exportingRef = useRef<'png' | 'pdf' | null>(null);
  const [captureBoard, setCaptureBoard] = useState<Board | null>(null);
  const [exportingVisual, setExportingVisual] = useState<'png' | 'pdf' | null>(null);
  const [previewFormat, setPreviewFormat] = useState<PreviewFormat>('visual');
  const [designSystemFormat, setDesignSystemFormat] = useState<DesignSystemFormat>('css');
  const [designSystemTokens, setDesignSystemTokens] = useState<DesignSystemTokens | null>(null);
  const [designSystemSource, setDesignSystemSource] = useState<'deterministic' | 'gemini' | 'mock'>(
    'deterministic',
  );
  const [designSystemEnhancing, setDesignSystemEnhancing] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDesignSystemTokens(buildDeterministicDesignSystemTokens(board));
    setDesignSystemSource('deterministic');
    setPreviewFormat('visual');
    setDesignSystemFormat('css');
  }, [open, board]);

  if (!open) return null;

  const jsonPreview = JSON.stringify(board, null, 2);
  const designSystemPreview = designSystemTokens
    ? exportDesignSystemFormat(designSystemTokens, designSystemFormat)
    : '';
  const hasDesignSystemContent = board.palette.length > 0 || board.typography.length > 0;

  function handleDownloadJson() {
    downloadTextFile(jsonPreview, `${downloadSlug(board.title)}.json`, 'application/json');
    onExported('json');
  }

  function handleDownloadDesignSystem(format: DesignSystemFormat) {
    if (!designSystemTokens) return;
    const content = exportDesignSystemFormat(designSystemTokens, format);
    downloadTextFile(
      content,
      `${downloadSlug(board.title)}-${designSystemDownloadExtension(format)}`,
      designSystemMimeType(format),
    );
    onExported('design-system', format);
  }

  async function handleEnhanceDesignSystem() {
    if (!hasDesignSystemContent || designSystemEnhancing) return;

    setDesignSystemEnhancing(true);
    try {
      const result = await fetchDesignSystemTokens(board);
      setDesignSystemTokens(result.tokens);
      setDesignSystemSource(result.source);

      if (result.notice) {
        showToast(result.notice, 'default');
        return;
      }

      showToast(
        result.source === 'gemini'
          ? 'Design system tokens enhanced with AI.'
          : 'Design system tokens updated.',
        'success',
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Design system enhancement failed';
      showToast(message, 'destructive');
    } finally {
      setDesignSystemEnhancing(false);
    }
  }

  async function withExportCapture<T>(capture: (container: HTMLDivElement) => Promise<T>): Promise<T> {
    flushSync(() => {
      setCaptureBoard(board);
    });

    let container: HTMLDivElement | null = null;
    for (let attempt = 0; attempt < 20; attempt += 1) {
      container = portalRef.current;
      if (container?.querySelector('[data-board-export]')) {
        break;
      }
      await waitForNextFrame();
    }

    if (!container?.querySelector('[data-board-export]')) {
      setCaptureBoard(null);
      throw new Error('Export layout not ready.');
    }

    try {
      return await capture(container);
    } finally {
      setCaptureBoard(null);
    }
  }

  async function captureLayoutPng(): Promise<string> {
    return withExportCapture((container) => captureExportPng(container));
  }

  async function captureLayoutForPdf() {
    return withExportCapture((container) => captureExportBlocks(container));
  }

  async function handleDownloadPng() {
    if (exportingRef.current !== null) return;

    exportingRef.current = 'png';
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
      exportingRef.current = null;
      setExportingVisual(null);
    }
  }

  async function handleDownloadPdf() {
    if (exportingRef.current !== null) return;

    exportingRef.current = 'pdf';
    setExportingVisual('pdf');
    try {
      const blocks = await captureLayoutForPdf();
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      buildPdfFromExportBlocks(pdf, blocks);
      pdf.save(`${downloadSlug(board.title)}.pdf`);
      onExported('pdf');
    } catch {
      showToast('PDF export failed. Try PNG or JSON instead.', 'destructive');
    } finally {
      exportingRef.current = null;
      setExportingVisual(null);
    }
  }

  const designSystemSourceLabel =
    designSystemSource === 'gemini'
      ? 'AI-enhanced token names'
      : designSystemSource === 'mock'
        ? 'Demo token names'
        : 'Deterministic token names';

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-[10050] flex items-center justify-center px-4 py-6',
          editorModalScrimClass,
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-title"
        aria-describedby="export-description"
        onMouseDown={onClose}
      >
        <div
          className="flex max-h-[min(92vh,960px)] w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] shadow-[0_30px_80px_rgba(15,23,42,0.15)]"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <header className="border-b border-[var(--border)] px-6 py-5">
            <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--text-muted)]">
              Export board
            </p>
            <h2
              id="export-title"
              className="mt-1 [font-family:var(--font-display),serif] text-3xl tracking-tight text-[var(--text-strong)]"
            >
              Download board
            </h2>
            <p id="export-description" className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
              Preview your export below, then download the format you need.
            </p>
          </header>

          <div className="grid min-h-0 flex-1 lg:grid-cols-[1.15fr_0.85fr]">
            <section className="min-h-0 overflow-hidden border-b border-[var(--border)] lg:border-b-0 lg:border-r">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-3">
                <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--text-muted)]">
                  Preview
                </p>
                <div className="inline-flex flex-wrap rounded-full border border-[var(--border)] bg-[var(--surface-subtle)] p-1">
                  <button
                    type="button"
                    onClick={() => setPreviewFormat('visual')}
                    aria-pressed={previewFormat === 'visual'}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      previewFormat === 'visual'
                        ? 'bg-[var(--surface)] text-[var(--text-strong)] shadow-sm'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-strong)]'
                    }`}
                  >
                    Visual
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewFormat('json')}
                    aria-pressed={previewFormat === 'json'}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      previewFormat === 'json'
                        ? 'bg-[var(--surface)] text-[var(--text-strong)] shadow-sm'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-strong)]'
                    }`}
                  >
                    JSON
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewFormat('design-system')}
                    aria-pressed={previewFormat === 'design-system'}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      previewFormat === 'design-system'
                        ? 'bg-[var(--surface)] text-[var(--text-strong)] shadow-sm'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-strong)]'
                    }`}
                  >
                    Design system
                  </button>
                </div>
              </div>

              <div className="h-full max-h-[min(52vh,560px)] overflow-y-auto p-5 lg:max-h-none">
                {previewFormat === 'visual' ? (
                  <div className="space-y-3">
                    <div className="overflow-hidden rounded-[1.5rem] border border-[var(--border)]">
                      <BoardExportCapture board={board} layout="fluid" />
                    </div>
                    <p className="text-xs leading-5 text-[var(--text-muted)]">
                      PNG and PDF exports use this layout. PDF may add page breaks between sections.
                    </p>
                  </div>
                ) : previewFormat === 'json' ? (
                  <div className="space-y-3">
                    <pre className="max-h-[min(48vh,520px)] overflow-auto rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-subtle)] p-4 text-xs leading-6 text-[var(--text)]">
                      {jsonPreview}
                    </pre>
                    <p className="text-xs leading-5 text-[var(--text-muted)]">
                      JSON includes the full board data, including metadata not shown in the visual export.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {!hasDesignSystemContent ? (
                      <div className="rounded-[1.5rem] border border-dashed border-[var(--border)] bg-[var(--surface-subtle)] p-6 text-sm leading-6 text-[var(--text-muted)]">
                        Add palette colors or typography to generate a design system export.
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="inline-flex rounded-full border border-[var(--border)] bg-[var(--surface-subtle)] p-1">
                            {DESIGN_SYSTEM_FORMATS.map((format) => (
                              <button
                                key={format.id}
                                type="button"
                                onClick={() => setDesignSystemFormat(format.id)}
                                aria-pressed={designSystemFormat === format.id}
                                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                                  designSystemFormat === format.id
                                    ? 'bg-[var(--surface)] text-[var(--text-strong)] shadow-sm'
                                    : 'text-[var(--text-muted)] hover:text-[var(--text-strong)]'
                                }`}
                              >
                                {format.label}
                              </button>
                            ))}
                          </div>
                          <AiEnhanceButton
                            loading={designSystemEnhancing}
                            disabled={!hasDesignSystemContent}
                            onClick={() => void handleEnhanceDesignSystem()}
                          />
                        </div>
                        <pre className="max-h-[min(44vh,480px)] overflow-auto rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-subtle)] p-4 text-xs leading-6 text-[var(--text)]">
                          {designSystemPreview}
                        </pre>
                        <p className="text-xs leading-5 text-[var(--text-muted)]">
                          {designSystemSourceLabel}. Downloads match this preview for the selected format.
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </section>

            <section className="min-h-0 overflow-y-auto p-5">
              <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--text-muted)]">
                Download
              </p>
              <div className="space-y-3">
                <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
                  <p className="text-sm leading-6 text-[var(--text-muted)]">
                    <strong className="font-medium text-[var(--text-strong)]">JSON</strong> — full board data.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleDownloadJson}
                    className="mt-3 w-full rounded-full sm:w-auto"
                  >
                    Download JSON
                  </Button>
                </div>
                <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
                  <p className="text-sm leading-6 text-[var(--text-muted)]">
                    <strong className="font-medium text-[var(--text-strong)]">PNG</strong> — visual moodboard image.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void handleDownloadPng()}
                    disabled={exportingVisual === 'png'}
                    className="mt-3 w-full rounded-full sm:w-auto"
                  >
                    {exportingVisual === 'png' ? 'Exporting…' : 'Download PNG'}
                  </Button>
                </div>
                <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
                  <p className="text-sm leading-6 text-[var(--text-muted)]">
                    <strong className="font-medium text-[var(--text-strong)]">PDF</strong> — printable moodboard summary.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void handleDownloadPdf()}
                    disabled={exportingVisual === 'pdf'}
                    className="mt-3 w-full rounded-full sm:w-auto"
                  >
                    {exportingVisual === 'pdf' ? 'Exporting…' : 'Download PDF'}
                  </Button>
                </div>
                <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
                  <p className="text-sm leading-6 text-[var(--text-muted)]">
                    <strong className="font-medium text-[var(--text-strong)]">Design system</strong> — CSS variables,
                    Tailwind config, tokens JSON, or Markdown spec for developer handoff.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {DESIGN_SYSTEM_FORMATS.map((format) => (
                      <Button
                        key={format.id}
                        type="button"
                        variant="outline"
                        disabled={!hasDesignSystemContent}
                        onClick={() => handleDownloadDesignSystem(format.id)}
                        className="rounded-full"
                      >
                        {format.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5 flex justify-end">
                <Button variant="default" type="button" onClick={onClose} className="rounded-full">
                  Close
                </Button>
              </div>
            </section>
          </div>
        </div>
      </div>

      {captureBoard && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={portalRef}
              aria-hidden="true"
              style={{
                position: 'fixed',
                left: 0,
                top: 0,
                width: EXPORT_CAPTURE_WIDTH,
                visibility: 'visible',
                opacity: 1,
                pointerEvents: 'none',
                zIndex: 9998,
              }}
            >
              <BoardExportCapture board={captureBoard} />
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
