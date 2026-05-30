'use client';

import { useRouter } from 'next/navigation';
import type { KeyboardEvent, MouseEvent } from 'react';
import type { Board } from '@/types/board';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/utils';
import { Star, StarOff } from 'lucide-react';
import { toggleFavoriteById } from '@/lib/board-store';
import { showToast } from '@/components/shared/toast-store';

type BoardCardProps = {
  board: Board;
};

export function BoardCard({ board }: BoardCardProps) {
  const router = useRouter();

  const openBoard = () => {
    router.push(`/app/boards/${board.id}`);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openBoard();
    }
  };

  const handleFavorite = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const updated = toggleFavoriteById(board.id);
    if (updated) {
      showToast(
        updated.isFavorite ? 'Added to favorites.' : 'Removed from favorites.',
        'success',
      );
    }
  };

  return (
    <article
      role="link"
      tabIndex={0}
      onClick={openBoard}
      onKeyDown={handleKeyDown}
      aria-label={`Open ${board.title}`}
      className="group relative h-full cursor-pointer overflow-hidden rounded-4xl border border-slate-200/80 bg-white/90 shadow-[0_1px_0_rgba(255,255,255,0.9),0_16px_40px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1.5 hover:border-slate-300 hover:shadow-[0_28px_60px_rgba(15,23,42,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-transparent via-slate-200 to-transparent opacity-90" />

      <button
        type="button"
        onClick={handleFavorite}
        aria-label={
          board.isFavorite ? `Remove ${board.title} from favorites` : `Add ${board.title} to favorites`
        }
        aria-pressed={board.isFavorite}
        className="absolute right-4 top-4 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
      >
        {board.isFavorite ? (
          <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
        ) : (
          <StarOff className="h-5 w-5 text-slate-500" />
        )}
      </button>

      <div className="relative z-10">
        <Card className="border-0 bg-transparent shadow-none">
          <CardHeader className="space-y-3 pr-14">
            <div className="flex flex-wrap gap-2">
              {board.tags.slice(0, 3).map((tag) => (
                <Badge key={`${board.id}-${tag}`} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
            <CardTitle className="wrap-break-word">{board.title}</CardTitle>
            <CardDescription className="wrap-break-word">{board.summary}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-4 gap-2">
              {board.palette.slice(0, 4).map((color, index) => (
                <div key={`${board.id}-${color.hex}-${index}`} className="space-y-2">
                  <div
                    className="h-12 rounded-2xl border border-slate-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]"
                    style={{ backgroundColor: color.hex }}
                  />
                  <p className="text-[11px] text-slate-500 wrap-break-word">{color.label}</p>
                </div>
              ))}
            </div>

            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
              Updated {formatDateTime(board.updatedAt)}
            </p>
          </CardContent>
        </Card>
      </div>
    </article>
  );
}