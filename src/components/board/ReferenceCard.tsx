'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import type { ReferenceItem } from '@/types/board';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ImageOff, Pencil, Trash2, X } from 'lucide-react';

type ReferenceCardProps = {
  reference: ReferenceItem;
  readOnly?: boolean;
  onChange?: (next: ReferenceItem) => void;
  onRemove?: () => void;
  className?: string;
};

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80';

const referenceTypeOptions = ['Interior', 'Packaging', 'Campaign', 'Dashboard', 'UI', 'Other'];

function ReferenceImage({
  title,
  imageUrl,
}: {
  title: string;
  imageUrl?: string;
}) {
  const [hasError, setHasError] = useState(false);

  const src = useMemo(() => {
    return imageUrl && imageUrl.trim().length > 0 ? imageUrl : FALLBACK_IMAGE;
  }, [imageUrl]);

  if (hasError) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-linear-to-br from-slate-200 to-slate-100 text-slate-500">
        <ImageOff className="h-8 w-8" />
        <p className="px-4 text-center text-xs uppercase tracking-[0.24em]">
          Image unavailable
        </p>
      </div>
    );
  }

  return (
    <Image
      key={src}
      src={src}
      alt={title || 'Reference image'}
      fill
      sizes="(max-width: 768px) 100vw, 33vw"
      className="object-cover"
      onError={() => setHasError(true)}
    />
  );
}

function ReferenceEditorModal({
  open,
  initialValue,
  onSave,
  onClose,
}: {
  open: boolean;
  initialValue: ReferenceItem;
  onSave: (next: ReferenceItem) => void;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [draft, setDraft] = useState<ReferenceItem>(initialValue);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setDraft(initialValue);
  }, [initialValue]);

  if (!open || !mounted) return null;

  function updateDraft(patch: Partial<ReferenceItem>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  const modal = (
    <div
      className="fixed inset-0 z-9999 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reference-editor-title"
      aria-describedby="reference-editor-description"
      onMouseDown={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.35)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="shrink-0 px-6 pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <h2
                id="reference-editor-title"
                className="text-3xl font-semibold tracking-tight text-slate-950"
              >
                Edit reference
              </h2>
              <p
                id="reference-editor-description"
                className="max-w-2xl text-sm leading-6 text-slate-500"
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
            scrollbarColor: '#cbd5e1 transparent',
          }}
        >
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
            <div className="relative aspect-16/10 w-full">
              <ReferenceImage title={draft.title} imageUrl={draft.imageUrl} />
            </div>
          </div>

          <div className="mt-6 grid gap-5">
            <div className="grid gap-2">
              <label className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">
                Reference title
              </label>
              <Textarea
                value={draft.title}
                onChange={(e) => updateDraft({ title: e.target.value })}
                placeholder="Reference title"
                className="min-h-14 resize-y wrap-break-word whitespace-pre-wrap"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">
                Reference type
              </label>
              <select
                value={draft.category}
                onChange={(e) => updateDraft({ category: e.target.value })}
                className="flex h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-950 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
              >
                {referenceTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <label className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">
                Source
              </label>
              <Input
                value={draft.source ?? ''}
                onChange={(e) => updateDraft({ source: e.target.value })}
                placeholder="Unsplash"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">
                Image URL
              </label>
              <Textarea
                value={draft.imageUrl}
                onChange={(e) => updateDraft({ imageUrl: e.target.value })}
                placeholder="https://..."
                className="min-h-14 resize-y break-all whitespace-pre-wrap"
              />
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t border-slate-200 bg-white/95 px-6 py-5">
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
            background-color: rgba(148, 163, 184, 0.7);
            border-radius: 9999px;
            border: 2px solid transparent;
            background-clip: padding-box;
          }
          .reference-modal-scroll::-webkit-scrollbar-thumb:hover {
            background-color: rgba(100, 116, 139, 0.8);
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
  }

  return (
    <>
      <article
        className={cn(
          'group relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(15,23,42,0.08)]',
          className,
        )}
      >
        <button
          type="button"
          onClick={openEditor}
          className={cn(
            'relative block w-full overflow-hidden bg-slate-100 text-left',
            readOnly ? 'cursor-default' : 'cursor-pointer',
          )}
          aria-label={readOnly ? reference.title : `Edit ${reference.title}`}
        >
          <div className="relative aspect-4/3 w-full overflow-hidden">
            <ReferenceImage title={reference.title} imageUrl={reference.imageUrl} />
          </div>

          {!readOnly ? (
            <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-white/70 bg-white/90 px-3 py-1 text-xs font-medium text-slate-900 shadow-sm opacity-0 transition group-hover:opacity-100">
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </div>
          ) : null}
        </button>

        {!readOnly ? (
          <button
            type="button"
            onClick={onRemove}
            className="absolute right-3 top-3 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition hover:bg-slate-50"
            aria-label={`Remove ${reference.title}`}
          >
            <Trash2 className="h-4 w-4 text-slate-700" />
          </button>
        ) : null}

        {readOnly ? (
          <div className="space-y-3 px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{reference.category}</Badge>
                  {reference.source ? (
                    <span className="min-w-0 text-xs text-slate-400 wrap-break-word">{reference.source}</span>
                  ) : null}
                </div>

                <h3 className="text-base font-semibold tracking-tight text-slate-950 wrap-break-word">
                  {reference.title}
                </h3>
              </div>
            </div>
          </div>
        ) : null}
      </article>

      <ReferenceEditorModal
        open={editorOpen}
        initialValue={reference}
        onSave={saveReference}
        onClose={() => setEditorOpen(false)}
      />
    </>
  );
}