'use client';

import { useEffect } from 'react';
import { cn } from '@/lib/utils';

type ToastProps = {
  message: string | null;
  onClose: () => void;
  tone?: 'default' | 'success' | 'destructive';
};

export function Toast({ message, onClose, tone = 'default' }: ToastProps) {
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(onClose, 2600);
    return () => window.clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div
        className={cn(
          'rounded-2xl border px-4 py-3 text-sm shadow-[0_20px_50px_rgba(15,23,42,0.18)]',
          tone === 'success' && 'border-emerald-200 bg-emerald-50 text-emerald-900',
          tone === 'destructive' && 'border-rose-200 bg-rose-50 text-rose-900',
          tone === 'default' && 'border-slate-200 bg-white text-slate-900',
        )}
      >
        {message}
      </div>
    </div>
  );
}