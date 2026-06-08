'use client';

import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { BoardActivityEvent } from '@/types/board';
import {
  editorWarningBannerClass,
  editorWarningChipActiveClass,
  editorWarningLabelClass,
} from '@/components/board/board-editor-styles';
import { formatDateTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  EDITOR_SECTION_ORDER,
  getNextReplaySectionIndex,
  getPreviousReplaySectionIndex,
  getReplayNavigationIndex,
  getReplaySectionIndices,
  getReplayStepLabel,
} from '@/lib/board-replay';

type BoardReplayBannerProps = {
  event: BoardActivityEvent;
  activeSectionIndex: number;
  onExit: () => void;
  onGoToSection: (index: number) => void;
};

export function BoardReplayBanner({
  event,
  activeSectionIndex,
  onExit,
  onGoToSection,
}: BoardReplayBannerProps) {
  const replaySections = getReplaySectionIndices(event.changes);
  const navIndex = getReplayNavigationIndex(event.changes, activeSectionIndex);
  const resolvedSectionIndex = replaySections[navIndex] ?? activeSectionIndex;
  const stepLabel = getReplayStepLabel(event.changes, resolvedSectionIndex);
  const prevSection = getPreviousReplaySectionIndex(event.changes, activeSectionIndex);
  const nextSection = getNextReplaySectionIndex(event.changes, activeSectionIndex);
  const hasMultipleSteps = replaySections.length > 1;

  return (
    <div
      role="region"
      aria-label="Board replay controls"
      className={`sticky top-4 z-20 px-4 py-4 ${editorWarningBannerClass}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className={editorWarningLabelClass}>
            Board replay
          </p>
          <p className="text-sm font-medium text-(--text-strong)">
            {event.actorName} · {formatDateTime(event.createdAt)}
          </p>
          <p className="text-sm text-(--text-muted)" aria-live="polite">
            {hasMultipleSteps ? (
              <>
                Step {navIndex + 1} of {replaySections.length}
                {stepLabel ? ` · ${stepLabel}` : null}
              </>
            ) : (
              stepLabel ?? 'One section changed in this save.'
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {hasMultipleSteps ? (
            <>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={prevSection === null}
                onClick={() => {
                  if (prevSection !== null) onGoToSection(prevSection);
                }}
                className="rounded-full"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={nextSection === null}
                onClick={() => {
                  if (nextSection !== null) onGoToSection(nextSection);
                }}
                className="rounded-full"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          ) : null}
          <Button type="button" size="sm" onClick={onExit} className="rounded-full">
            <X className="h-4 w-4" />
            Exit replay
          </Button>
        </div>
      </div>

      {replaySections.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {replaySections.map((index) => {
            const section = EDITOR_SECTION_ORDER[index];
            return (
              <button
                key={section}
                type="button"
                onClick={() => onGoToSection(index)}
                className={[
                  'rounded-full border px-3 py-1 text-xs font-medium capitalize transition',
                  index === resolvedSectionIndex
                    ? editorWarningChipActiveClass
                    : 'border-(--border) bg-(--surface-elevated) text-(--text-muted) hover:text-(--text-strong)',
                ].join(' ')}
              >
                {section}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
