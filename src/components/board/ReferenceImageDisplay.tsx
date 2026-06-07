'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { ImageOff } from 'lucide-react';
import {
  isInlineReferenceImage,
  resolveReferenceImageUrl,
} from '@/lib/reference-images';

type ReferenceImageDisplayProps = {
  title: string;
  category: string;
  imageUrl?: string;
  source?: string;
  board?: {
    prompt?: string;
    mood?: string;
    palette?: Array<{ hex: string; label?: string }>;
  };
  index?: number;
  sizes?: string;
  className?: string;
};

export function ReferenceImageDisplay({
  title,
  category,
  imageUrl,
  source,
  board,
  index = 0,
  sizes = '(max-width: 768px) 100vw, 33vw',
  className = 'object-cover',
}: ReferenceImageDisplayProps) {
  const [hasError, setHasError] = useState(false);

  const src = useMemo(
    () =>
      resolveReferenceImageUrl(
        { title, category, imageUrl, source },
        board
          ? {
              prompt: board.prompt,
              mood: board.mood,
              palette: board.palette,
            }
          : undefined,
        index,
      ),
    [title, category, imageUrl, source, board, index],
  );

  if (hasError) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-linear-to-br from-slate-200 to-slate-100 text-slate-500">
        <ImageOff className="h-8 w-8" />
        <p className="px-4 text-center text-xs uppercase tracking-[0.24em]">
          Image unavailable
        </p>
      </div>
    );
  }

  return (
    <Image
      key={src}
      src={src}
      alt={title || 'Reference image'}
      fill
      sizes={sizes}
      unoptimized={isInlineReferenceImage(src)}
      className={className}
      onError={() => setHasError(true)}
    />
  );
}
