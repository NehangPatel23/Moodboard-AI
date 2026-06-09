'use client';

import type { ReactNode } from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  aiGenerateButtonActiveClass,
  aiGenerateButtonIdleClass,
} from '@/components/board/board-editor-styles';

type AiGenerateButtonProps = {
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  idleLabel: ReactNode;
  loadingLabel: ReactNode;
  className?: string;
  idleClassName?: string;
  type?: 'button' | 'submit';
  children?: ReactNode;
};

export function AiGenerateButton({
  loading = false,
  disabled = false,
  onClick,
  idleLabel,
  loadingLabel,
  className,
  idleClassName = aiGenerateButtonIdleClass,
  type = 'button',
  children,
}: AiGenerateButtonProps) {
  const label = children ?? (loading ? loadingLabel : idleLabel);

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading}
      className={cn(
        'inline-flex h-10 min-h-10 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium leading-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--ring) focus-visible:ring-offset-2 focus-visible:ring-offset-(--background)',
        'disabled:pointer-events-none disabled:opacity-50',
        loading ? aiGenerateButtonActiveClass : idleClassName,
        className,
      )}
    >
      {label}
      <Sparkles className={cn('h-4 w-4 shrink-0', loading && 'animate-pulse')} aria-hidden="true" />
    </button>
  );
}
