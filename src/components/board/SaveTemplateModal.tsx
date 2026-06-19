'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { lockBodyScroll } from '@/lib/body-scroll-lock';
import { editorLargeModalClass, editorModalScrimClass } from '@/components/board/board-editor-styles';
import { showToast } from '@/components/shared/toast-store';
import { apiFetch } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import type { Board } from '@/types/board';
import type { CommunityTemplateRecord } from '@/lib/db/template-mappers';

type SaveTemplateModalProps = {
  open: boolean;
  board: Board | null;
  onOpenChange: (open: boolean) => void;
};

export function SaveTemplateModal({ open, board, onOpenChange }: SaveTemplateModalProps) {
  const [name, setName] = useState(board?.title ?? '');
  const [description, setDescription] = useState(board?.summary ?? '');
  const [isPublic, setIsPublic] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || typeof document === 'undefined') return;

    const unlockBodyScroll = lockBodyScroll();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submitting) {
        event.preventDefault();
        onOpenChange(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      unlockBodyScroll();
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onOpenChange, open, submitting]);

  const handleSave = async () => {
    if (!board) return;

    setSubmitting(true);
    try {
      await apiFetch<{ template: CommunityTemplateRecord }>('/api/templates', {
        method: 'POST',
        body: JSON.stringify({
          board,
          name,
          description,
          isPublic,
        }),
      });
      showToast(isPublic ? 'Template published to Community.' : 'Template saved to your library.', 'success');
      onOpenChange(false);
    } catch {
      showToast('Could not save template.', 'destructive');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[10060] flex items-center justify-center px-4 ${editorModalScrimClass}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-template-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) {
          onOpenChange(false);
        }
      }}
    >
      <div
        className={cn(editorLargeModalClass, 'w-full max-w-lg p-6')}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2
          id="save-template-title"
          className="[font-family:var(--font-display),serif] text-3xl tracking-tight text-(--text-strong)"
        >
          Save as template
        </h2>
        <p className="mt-3 text-sm leading-6 text-(--text-muted)">
          Reuse this board&apos;s direction, palette, typography, references, and notes as a starting point.
        </p>

        <div className="space-y-4 pt-4">
          <div className="grid gap-2">
            <label className="text-[10px] font-medium uppercase tracking-[0.28em] text-(--text-muted)">
              Template name
            </label>
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div className="grid gap-2">
            <label className="text-[10px] font-medium uppercase tracking-[0.28em] text-(--text-muted)">
              Description
            </label>
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="min-h-24 rounded-3xl"
            />
          </div>
          <label className="flex items-start gap-3 rounded-3xl border border-(--border) p-4">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(event) => setIsPublic(event.target.checked)}
              className="mt-1"
            />
            <span className="space-y-1">
              <span className="block text-sm font-medium text-(--text-strong)">Publish to Community</span>
              <span className="block text-sm leading-6 text-(--text-muted)">
                Public templates appear on the Community tab for all signed-in users.
              </span>
            </span>
          </label>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
            className="rounded-full"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void handleSave()}
            disabled={submitting}
            className="rounded-full bg-(--text-strong) text-(--background) hover:opacity-90"
          >
            {submitting ? 'Saving…' : 'Save template'}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
