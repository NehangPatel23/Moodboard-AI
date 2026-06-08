'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import type { Board } from '@/types/board';
import { Button } from '@/components/ui/button';
import { fetchReferenceImageSearch } from '@/lib/ai';
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

  async function handleSearch() {
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
      });

      onResolved(result.imageUrl, result.sourceLabel);

      if (result.notice) {
        showToast(result.notice, 'default');
        return;
      }

      showToast(
        result.sourceLabel === 'Pexels' ? 'Pexels photo applied.' : 'Demo placeholder applied.',
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
    <Button
      type="button"
      variant="outline"
      onClick={() => void handleSearch()}
      disabled={loading}
      className={className ?? 'rounded-full'}
    >
      <Search className="h-4 w-4" />
      {loading ? 'Searching…' : 'Find photo'}
    </Button>
  );
}
