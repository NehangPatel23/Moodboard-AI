'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { editorModalScrimClass } from '@/components/board/board-editor-styles';
import { cn } from '@/lib/utils';

type ShareModalProps = {
  open: boolean;
  boardTitle: string;
  sharePath: string;
  onCopied: () => void;
  onClose: () => void;
};

export function ShareModal({
  open,
  boardTitle,
  sharePath,
  onCopied,
  onClose,
}: ShareModalProps) {
  if (!open) return null;

  const fullUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${sharePath}`
      : '';

  async function handleCopy() {
    const urlToCopy = fullUrl || `${window.location.origin}${sharePath}`;

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(urlToCopy);
    } else {
      window.prompt('Copy this link', urlToCopy);
    }

    onCopied();
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-10050 flex items-center justify-center px-4',
        editorModalScrimClass,
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-title"
      aria-describedby="share-description"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-lg rounded-4xl border border-(--border) bg-(--surface) p-6 text-(--text) shadow-[0_30px_80px_rgba(15,23,42,0.15)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="space-y-2">
          <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-(--text-muted)">
            Share board
          </p>

          <h2
            id="share-title"
            className="[font-family:var(--font-display),serif] text-3xl tracking-tight text-(--text-strong)"
          >
            View-only link
          </h2>

          <p
            id="share-description"
            className="text-sm leading-6 text-(--text-muted)"
          >
            Copy a view-only link for{' '}
            <span className="font-medium text-(--text-strong)">
              {boardTitle}
            </span>
            . Anyone with this link can view this board (read-only).
          </p>
        </div>

        <div className="mt-5 space-y-3">
          <Input readOnly value={fullUrl} />

          <p className="text-xs leading-5 text-(--text-muted)">
            Recipients do not need an account to view the board.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button
            variant="default"
            type="button"
            onClick={onClose}
            className="rounded-full"
          >
            Close
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleCopy}
            className="rounded-full"
          >
            Copy link
          </Button>
        </div>
      </div>
    </div>
  );
}