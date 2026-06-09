'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { lockBodyScroll } from '@/lib/body-scroll-lock';
import { editorModalScrimClass } from '@/components/board/board-editor-styles';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type ConfirmationModalProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmationModal({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  useEffect(() => {
    if (!open || typeof document === 'undefined') return;

    const unlockBodyScroll = lockBodyScroll();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      unlockBodyScroll();
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onCancel]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-[10060] flex items-center justify-center px-4',
        editorModalScrimClass,
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-title"
      aria-describedby="confirmation-description"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onCancel();
        }
      }}
    >
      <div
        className="w-full max-w-md rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 text-[var(--text)] shadow-[0_30px_80px_rgba(15,23,42,0.15)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2
          id="confirmation-title"
          className="[font-family:var(--font-display),serif] text-3xl tracking-tight text-[var(--text-strong)]"
        >
          {title}
        </h2>

        <p
          id="confirmation-description"
          className="mt-3 text-sm leading-6 text-[var(--text-muted)]"
        >
          {description}
        </p>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button
            variant="outline"
            type="button"
            onClick={onCancel}
            autoFocus
            className="rounded-full"
          >
            {cancelLabel}
          </Button>

          <Button
            type="button"
            variant={destructive ? 'destructive' : 'default'}
            onClick={onConfirm}
            className="rounded-full"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}