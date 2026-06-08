'use client';

import type { ReactNode } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type TemplateUseTemplateButtonProps = {
  isCreating: boolean;
  isActive?: boolean;
  onClick: () => void;
  className?: string;
  children?: ReactNode;
};

export function TemplateUseTemplateButton({
  isCreating,
  isActive = false,
  onClick,
  className,
  children,
}: TemplateUseTemplateButtonProps) {
  const showGeminiAnimation = isCreating && isActive;

  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={isCreating}
      aria-busy={showGeminiAnimation}
      className={cn(
        'rounded-full',
        showGeminiAnimation
          ? 'gemini-creating-button border-slate-900/10 text-slate-900 shadow-[0_4px_20px_rgba(147,197,253,0.35)] hover:opacity-95'
          : className,
      )}
    >
      {children ?? (showGeminiAnimation ? 'Creating board...' : 'Use template')}
      <Sparkles className={cn('h-4 w-4', showGeminiAnimation && 'animate-pulse')} />
    </Button>
  );
}
