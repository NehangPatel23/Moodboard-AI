'use client';

import { AiGenerateButton } from '@/components/shared/AiGenerateButton';
import { cn } from '@/lib/utils';

type AiEnhanceButtonProps = {
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
};

export function AiEnhanceButton({
  loading = false,
  disabled = false,
  onClick,
  className,
}: AiEnhanceButtonProps) {
  return (
    <AiGenerateButton
      loading={loading}
      disabled={disabled}
      onClick={onClick}
      idleLabel="Enhance with AI"
      loadingLabel="Enhancing…"
      className={cn('text-xs', className)}
    />
  );
}
