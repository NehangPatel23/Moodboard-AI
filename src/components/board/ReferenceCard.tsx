'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import type { ReferenceItem } from '@/types/board';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Pencil, Trash2, X } from 'lucide-react';
import { showToast } from '@/components/shared/toast-store';
import { ReferenceImageDisplay } from '@/components/board/ReferenceImageDisplay';
import { ReferenceImageSearchButton } from '@/components/board/ReferenceImageSearchButton';
import { sanitizeReferenceItem } from '@/lib/reference-images';
import type { Board } from '@/types/board';
import {
  editorFieldClass,
  editorIconButtonClass,
  editorInsetSurfaceClass,
  editorLabelClass,
  editorSelectClass,
} from '@/components/board/board-editor-styles';

type ReferenceCardProps = {
  reference: ReferenceItem;
  board?: Pick<Board, 'id' | 'prompt' | 'mood' | 'summary' | 'palette'>;
  readOnly?: boolean;
  onChange?: (next: ReferenceItem) => void;
  onRemove?: () => void;
  className?: string;
};

const referenceTypeOptions = ['Interior', 'Packaging', 'Campaign', 'Dashboard', 'UI', 'Other'];

function ReferenceEditorModal({
  open,
  initialValue,
  board,
  onSave,
  onClose,
}: {
  open: boolean;
  initialValue: ReferenceItem;
  board?: Pick<Board, 'id' | 'prompt' | 'mood' | 'summary' | 'palette'>;
  onSave: (next: ReferenceItem) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(() =>
    board ? sanitizeReferenceItem(initialValue, board, 0) : initialValue,
  );

  if (!open || typeof document === 'undefined') return null;

  const updateDraft = (patch: Partial<ReferenceItem>) => {
    setDraft((current) => ({ ...current, ...patch }));
  };

  const modal = (
    <div
      className="fixed inset-0 z-9999 flex items-center justify-center bg-(--text-strong)/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reference-editor-title"
      aria-describedby="reference-editor-description"
      onMouseDown={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-4xl border border-(--border) bg-(--surface-elevated) text-(--text) shadow-[var(--shadow-elevated)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="shrink-0 px-6 pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <h2
                id="reference-editor-title"
                className="text-3xl font-semibold tracking-tight text-(--text-strong)"
              >
                Edit reference
              </h2>
              <p
                id="reference-editor-description"
                className="max-w-2xl text-sm leading-6 text-(--text-muted)"
              >
                Update the title, type, source, and image for this inspiration card.
              </p>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Close editor"
              className="shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div
          className="reference-modal-scroll min-h-0 flex-1 overflow-y-auto px-6 pb-6 pr-4 pt-6"
          style={{
            scrollbarGutter: 'stable',
            scrollbarWidth: 'thin',
            scrollbarColor: 'var(--text-muted) transparent',
          }}
        >
          <div className={editorInsetSurfaceClass}>
            <div className="relative aspect-16/10 w-full">
              <ReferenceImageDisplay
                title={draft.title}
                category={draft.category}
                imageUrl={draft.imageUrl}
                source={draft.source}
                board={board}
              />
            </div>
          </div>

          <div className="mt-6 grid gap-5">
            <div className="grid gap-2">
              <label className={editorLabelClass}>Reference title</label>
              <Textarea
                value={draft.title}
                onChange={(e) => updateDraft({ title: e.target.value })}
                placeholder="Reference title"
                className="min-h-14 resize-y wrap-break-word whitespace-pre-wrap"
              />
            </div>

            <div className="grid gap-2">
              <label className={editorLabelClass}>Reference type</label>
              <select
                value={draft.category}
                onChange={(e) => updateDraft({ category: e.target.value })}
                className={editorSelectClass}
              >
                {referenceTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <label className={editorLabelClass}>Source</label>
              <Input
                value={draft.source ?? ''}
                onChange={(e) => updateDraft({ source: e.target.value })}
                placeholder="Generated"
                className={editorFieldClass}
              />
            </div>

            <div className="grid gap-2">
              <label className={editorLabelClass}>Image URL</label>
              <ReferenceImageSearchButton
                title={draft.title}
                category={draft.category}
                board={board}
                referenceId={draft.id}
                onResolved={(imageUrl, source) => updateDraft({ imageUrl, source })}
                className="mb-2 w-fit rounded-full"
              />
              <Textarea
                value={draft.imageUrl}
                onChange={(e) => updateDraft({ imageUrl: e.target.value })}
                placeholder="https://..."
                className={cn('min-h-14 resize-y break-all whitespace-pre-wrap', editorFieldClass)}
              />
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t border-(--border) bg-(--surface-elevated)/95 px-6 py-5">
          <div className="flex flex-wrap justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" onClick={() => onSave(draft)}>
              Save reference
            </Button>
          </div>
        </div>

        <style jsx>{`
          .reference-modal-scroll::-webkit-scrollbar {
            width: 10px;
          }
          .reference-modal-scroll::-webkit-scrollbar-track {
            background: transparent;
          }
          .reference-modal-scroll::-webkit-scrollbar-thumb {
            background-color: color-mix(in srgb, var(--text-muted) 70%, transparent);
            border-radius: 9999px;
            border: 2px solid transparent;
            background-clip: padding-box;
          }
          .reference-modal-scroll::-webkit-scrollbar-thumb:hover {
            background-color: color-mix(in srgb, var(--text-muted) 85%, transparent);
            border: 2px solid transparent;
            background-clip: padding-box;
          }
        `}</style>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

export function ReferenceCard({
  reference,
  board,
  readOnly = false,
  onChange,
  onRemove,
  className,
}: ReferenceCardProps) {
  const [editorOpen, setEditorOpen] = useState(false);

  function openEditor() {
    if (readOnly) return;
    setEditorOpen(true);
  }

  function saveReference(next: ReferenceItem) {
    onChange?.(next);
    setEditorOpen(false);
    showToast('Reference saved.', 'success');
  }

  return (
    <>
      <article
        className={cn(
          'group relative overflow-hidden rounded-3xl border border-(--border) bg-(--surface-elevated) shadow-sm transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]',
          className,
        )}
      >
        <button
          type="button"
          onClick={openEditor}
          className={cn(
            'relative block w-full overflow-hidden bg-(--surface-muted) text-left',
            readOnly ? 'cursor-default' : 'cursor-pointer',
          )}
          aria-label={readOnly ? reference.title : `Edit ${reference.title}`}
        >
          <div className="relative aspect-4/3 w-full overflow-hidden">
            <ReferenceImageDisplay
              title={reference.title}
              category={reference.category}
              imageUrl={reference.imageUrl}
              source={reference.source}
              board={board}
            />
          </div>

          {!readOnly ? (
            <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-(--border) bg-(--surface-elevated)/90 px-3 py-1 text-xs font-medium text-(--text) shadow-sm opacity-0 transition group-hover:opacity-100">
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </div>
          ) : null}
        </button>

        {!readOnly && onRemove ? (
          <button
            type="button"
            onClick={() => {
              onRemove();
              showToast('Reference removed.', 'success');
            }}
            className={cn('absolute right-3 top-3 z-20 shadow-sm', editorIconButtonClass)}
            aria-label={`Remove ${reference.title}`}
          >
            <Trash2 className="h-4 w-4 text-(--text)" />
          </button>
        ) : null}

        {readOnly ? (
          <div className="space-y-3 px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{reference.category}</Badge>
                  {reference.source ? (
                    <span className="min-w-0 text-xs text-(--text-muted) wrap-break-word">
                      {reference.source}
                    </span>
                  ) : null}
                </div>

                <h3 className="text-base font-semibold tracking-tight text-(--text-strong) wrap-break-word">
                  {reference.title}
                </h3>
              </div>
            </div>
          </div>
        ) : null}
      </article>

      {editorOpen ? (
        <ReferenceEditorModal
          key={reference.id}
          open={editorOpen}
          initialValue={reference}
          board={board}
          onSave={saveReference}
          onClose={() => setEditorOpen(false)}
        />
      ) : null}
    </>
  );
}
