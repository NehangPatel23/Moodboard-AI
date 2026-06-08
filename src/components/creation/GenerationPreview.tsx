'use client';

import { useSyncExternalStore } from 'react';
import type { Board } from '@/types/board';
import { ReferenceImageDisplay } from '@/components/board/ReferenceImageDisplay';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DEFAULT_APP_SETTINGS,
  readAppSettings,
  subscribeAppSettings,
} from '@/lib/settings-store';
import { cn } from '@/lib/utils';

export type GenerationPhase = 'draft' | 'enriching' | 'complete';

type GenerationPreviewProps = {
  board: Board;
  phase: GenerationPhase;
  enrichProgress: { done: number; total: number };
  className?: string;
};

function noteTypeLabel(type: string): string {
  if (type === 'instruction') return 'Instruction';
  if (type === 'keyword') return 'Keyword';
  return 'Idea';
}

export function GenerationPreview({
  board,
  phase,
  enrichProgress,
  className,
}: GenerationPreviewProps) {
  const settings = useSyncExternalStore(
    subscribeAppSettings,
    readAppSettings,
    () => DEFAULT_APP_SETTINGS,
  );
  const reduceMotion = settings.reduceMotionEnabled;
  const total = enrichProgress.total || board.references.length;

  return (
    <section
      className={cn(
        'rounded-[2.25rem] border border-(--border) bg-(--surface-elevated) p-6 shadow-[var(--shadow-elevated)]',
        className,
      )}
      aria-live="polite"
      aria-busy={phase === 'enriching'}
    >
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-(--text-muted)">
          Live preview
        </p>
        {phase === 'enriching' ? (
          <Badge variant="secondary">
            References {enrichProgress.done}/{total}
          </Badge>
        ) : null}
        {phase === 'complete' ? <Badge variant="secondary">Ready</Badge> : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="[font-family:var(--font-display),serif] text-3xl tracking-tight text-(--text-strong) md:text-4xl">
              {board.title}
            </h3>
            <p className="text-sm leading-6 text-(--text-muted)">{board.summary}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{board.mood}</Badge>
            {board.tags.slice(0, 4).map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {board.palette.map((color) => (
              <div
                key={color.id}
                className="overflow-hidden rounded-2xl border border-(--border) bg-(--surface)"
              >
                <div className="h-14 w-full" style={{ backgroundColor: color.hex }} />
                <div className="space-y-0.5 px-3 py-2">
                  <p className="text-xs font-medium text-(--text-strong)">{color.label}</p>
                  <p className="text-[10px] uppercase tracking-wide text-(--text-muted)">{color.hex}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-(--text-muted)">
              Typography
            </p>
            <ul className="space-y-2">
              {board.typography.map((item) => (
                <li
                  key={item.id}
                  className="rounded-2xl border border-(--border) bg-(--surface-muted) px-4 py-3"
                >
                  <p className="text-sm font-medium capitalize text-(--text-strong)">{item.role}</p>
                  <p className="text-sm text-(--text)">{item.fontName}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-(--text-muted)">
              Notes
            </p>
            <ul className="space-y-2">
              {board.notes.slice(0, 3).map((note) => (
                <li
                  key={note.id}
                  className="rounded-2xl border border-(--border) bg-(--surface-muted) px-4 py-3"
                >
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-(--text-muted)">
                    {noteTypeLabel(note.type)}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-(--text)">{note.text}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-(--text-muted)">
              References
            </p>
            <div className="grid grid-cols-2 gap-3">
              {board.references.map((reference, index) => {
                const isResolved = phase !== 'enriching' || index < enrichProgress.done;
                const showSkeleton = phase === 'enriching' && index >= enrichProgress.done;

                return (
                  <div
                    key={reference.id}
                    className="overflow-hidden rounded-2xl border border-(--border) bg-(--surface)"
                  >
                    <div className="relative aspect-[4/3] bg-(--surface-muted)">
                      {showSkeleton ? (
                        <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
                      ) : (
                        <ReferenceImageDisplay
                          title={reference.title}
                          category={reference.category}
                          imageUrl={reference.imageUrl}
                          source={reference.source}
                          board={{
                            prompt: board.prompt,
                            mood: board.mood,
                            palette: board.palette,
                          }}
                          index={index}
                          sizes="(max-width: 768px) 50vw, 200px"
                          className={cn(
                            'object-cover',
                            !reduceMotion && 'transition-opacity duration-300',
                            isResolved ? 'opacity-100' : 'opacity-70',
                          )}
                        />
                      )}
                    </div>
                    <div className="px-3 py-2">
                      <p className="line-clamp-1 text-xs font-medium text-(--text-strong)">
                        {reference.title}
                      </p>
                      {reference.source ? (
                        <p className="text-[10px] text-(--text-muted)">{reference.source}</p>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            {phase === 'enriching' && enrichProgress.done < total ? (
              <p className="text-xs text-(--text-muted)">
                Finding reference {Math.min(enrichProgress.done + 1, total)} of {total}...
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
