'use client';

import { useState } from 'react';
import { RefreshCw, Search } from 'lucide-react';
import type { Board } from '@/types/board';
import { Button } from '@/components/ui/button';
import { fetchReferenceImageSearch } from '@/lib/ai';
import { REFERENCE_IMAGE_SOURCE_PEXELS } from '@/lib/reference-images';
import { showToast } from '@/components/shared/toast-store';

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
      <Button
        type="button"
        variant="outline"
        onClick={() => void runSearch(0)}
        disabled={loading}
        className="rounded-full"
      >
        <Search className="h-4 w-4" />
        {loading ? 'Searching…' : 'Find photo'}
      </Button>
      {hasResult ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => void runSearch(refreshAttempt)}
          disabled={loading}
          className="rounded-full"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh photo
        </Button>
      ) : null}
    </div>
  );
}
