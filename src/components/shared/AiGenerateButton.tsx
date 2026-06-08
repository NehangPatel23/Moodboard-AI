'use client';

import type { ReactNode } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    <Button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading}
      className={cn(
        loading ? aiGenerateButtonActiveClass : idleClassName,
        className,
      )}
    >
      {label}
      <Sparkles className={cn('h-4 w-4', loading && 'animate-pulse')} />
    </Button>
  );
}
