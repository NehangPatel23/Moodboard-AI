'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
  const [copied, setCopied] = useState(false);
  const [fullUrl, setFullUrl] = useState('');

  useEffect(() => {
    if (open && typeof window !== 'undefined') {
      setFullUrl(`${window.location.origin}${sharePath}`);
      setCopied(false);
    }
  }, [open, sharePath]);

  if (!open) return null;

  async function handleCopy() {
    const urlToCopy =
      fullUrl || `${window.location.origin}${sharePath}`;

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(urlToCopy);
    } else {
      window.prompt('Copy this link', urlToCopy);
    }

    setCopied(true);
    onCopied();
  }

  return (
    <div
      className="fixed inset-0 z-[10050] flex items-center justify-center bg-black/35 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-title"
      aria-describedby="share-description"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-lg rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.15)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="space-y-2">
          <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-slate-400">
            Share board
          </p>

          <h2
            id="share-title"
            className="[font-family:var(--font-display),serif] text-3xl tracking-tight text-slate-950"
          >
            View-only link
          </h2>

          <p
            id="share-description"
            className="text-sm leading-6 text-slate-500"
          >
            Copy a view-only link for{' '}
            <span className="font-medium text-slate-700">
              {boardTitle}
            </span>.
          </p>
        </div>

        <div className="mt-5 space-y-3">
          <Input
            readOnly
            value={fullUrl}
          />

          <p className="text-xs leading-5 text-slate-400">
            Anyone with this link can view the board.
          </p>
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
            onClick={handleCopy}
            className="rounded-full bg-slate-950 text-white hover:bg-slate-800"
          >
            {copied ? 'Copied' : 'Copy link'}
          </Button>
        </div>
      </div>
    </div>
  );
}