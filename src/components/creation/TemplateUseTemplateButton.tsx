'use client';

import type { ReactNode } from 'react';
import { AiGenerateButton } from '@/components/shared/AiGenerateButton';

type TemplateUseTemplateButtonProps = {
  isCreating: boolean;
  isActive?: boolean;
  onClick: () => void;
  className?: string;
  idleClassName?: string;
  children?: ReactNode;
};

export function TemplateUseTemplateButton({
  isCreating,
  isActive = false,
  onClick,
  className,
  idleClassName,
  children,
}: TemplateUseTemplateButtonProps) {
  const loading = isCreating && isActive;

  return (
    <AiGenerateButton
      loading={loading}
      disabled={isCreating}
      onClick={onClick}
      idleLabel="Use template"
      loadingLabel="Creating board..."
      className={className}
      idleClassName={idleClassName}
    >
      {children ?? (loading ? 'Creating board...' : 'Use template')}
    </AiGenerateButton>
  );
}
