'use client';

import { useState } from 'react';
import type { Board } from '@/types/board';
import { fetchReferenceImageSearch } from '@/lib/ai';
import { REFERENCE_IMAGE_SOURCE_PEXELS, REFERENCE_IMAGE_SOURCE_UNSPLASH } from '@/lib/reference-images';
import { showToast } from '@/components/shared/toast-store';
import { AiGenerateButton } from '@/components/shared/AiGenerateButton';

type ReferenceImageSearchButtonProps = {
  title: string;
  category?: string;
  board?: Pick<Board, 'id' | 'prompt' | 'mood' | 'palette'>;
  referenceId: string;
  onResolved: (imageUrl: string, source: string) => void;
  className?: string;
};

export function ReferenceImageSearchButton({
  title,
  category,
  board,
  referenceId,
  onResolved,
  className,
}: ReferenceImageSearchButtonProps) {
  const [loading, setLoading] = useState(false);
  const [refreshAttempt, setRefreshAttempt] = useState(0);
  const [hasResult, setHasResult] = useState(false);

  async function runSearch(nextRefreshAttempt: number) {
    if (!title.trim()) {
      showToast('Add a reference title before searching for a photo.', 'destructive');
      return;
    }

    setLoading(true);
    try {
      const result = await fetchReferenceImageSearch({
        title: title.trim(),
        category,
        mood: board?.mood,
        prompt: board?.prompt,
        palette: board?.palette,
        boardId: board?.id,
        referenceId,
        refreshAttempt: nextRefreshAttempt,
      });

      onResolved(result.imageUrl, result.sourceLabel);
      setHasResult(true);
      setRefreshAttempt(nextRefreshAttempt + 1);

      if (result.notice) {
        showToast(result.notice, 'default');
        return;
      }

      showToast(
        nextRefreshAttempt > 0
          ? 'Photo refreshed.'
          : result.sourceLabel === REFERENCE_IMAGE_SOURCE_PEXELS
            ? 'Pexels photo applied.'
            : result.sourceLabel === REFERENCE_IMAGE_SOURCE_UNSPLASH
              ? 'Unsplash photo applied.'
              : 'Demo placeholder applied.',
        'success',
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Reference photo search failed';
      showToast(message, 'destructive');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className ?? ''}`}>
      <AiGenerateButton
        loading={loading && !hasResult}
        disabled={loading}
        onClick={() => void runSearch(0)}
        idleLabel="Find photo"
        loadingLabel="Searching…"
      />
      {hasResult ? (
        <AiGenerateButton
          loading={loading}
          disabled={loading}
          onClick={() => void runSearch(refreshAttempt)}
          idleLabel="Refresh photo"
          loadingLabel="Refreshing…"
        />
      ) : null}
    </div>
  );
}
