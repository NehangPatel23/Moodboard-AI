'use client';

import { useEffect, useRef } from 'react';
import type { Board } from '@/types/board';
import {
  GenerationPreview,
  type GenerationPhase,
} from '@/components/creation/GenerationPreview';
import { cn } from '@/lib/utils';

type TemplateGenerationPanelProps = {
  status: string | null;
  board: Board | null;
  phase: GenerationPhase;
  enrichProgress: { done: number; total: number };
  scrollIntoView?: boolean;
  className?: string;
};

export function TemplateGenerationPanel({
  status,
  board,
  phase,
  enrichProgress,
  scrollIntoView = false,
  className,
}: TemplateGenerationPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollIntoView || !panelRef.current) return;

    panelRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [scrollIntoView, status, board?.id]);

  if (!status && !board) return null;

  return (
    <div ref={panelRef} className={cn('space-y-4', className)}>
      {status ? (
        <p className="text-sm leading-6 text-(--text-muted)" role="status" aria-live="polite">
          {status}
        </p>
      ) : null}

      {board ? (
        <GenerationPreview board={board} phase={phase} enrichProgress={enrichProgress} />
      ) : null}
    </div>
  );
}
