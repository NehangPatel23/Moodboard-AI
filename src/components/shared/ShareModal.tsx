'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type ShareModalProps = {
  open: boolean;
  boardTitle: string;
  sharePath: string;
  onCopied: () => void;
  onClose: () => void;
};

export function ShareModal({ open, boardTitle, sharePath, onCopied, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  async function handleCopy() {
    const fullUrl = `${window.location.origin}${sharePath}`;
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(fullUrl);
    } else {
      window.prompt('Copy this link', fullUrl);
    }
    setCopied(true);
    onCopied();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-title"
      aria-describedby="share-description"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-lg rounded-4xl border border-slate-200 bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.25)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="space-y-2">
          <h2 id="share-title" className="text-2xl font-semibold tracking-tight text-slate-950">
            Share board
          </h2>
          <p id="share-description" className="text-sm leading-6 text-slate-500">
            Copy a view-only link for <span className="font-medium text-slate-700">{boardTitle}</span>.
          </p>
        </div>

        <div className="mt-5 space-y-3">
          <Input readOnly value={`${window.location.origin}${sharePath}`} />
          <p className="text-xs leading-5 text-slate-400">
            The copied link will include your current site origin.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button variant="outline" type="button" onClick={onClose}>
            Close
          </Button>
          <Button type="button" onClick={handleCopy}>
            {copied ? 'Copied' : 'Copy link'}
          </Button>
        </div>
      </div>
    </div>
  );
}