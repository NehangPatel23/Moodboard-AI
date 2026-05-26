'use client';

import { useRouter } from 'next/navigation';
import type { Board } from '@/types/board';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/utils';
import { Star } from 'lucide-react';
import { toggleFavoriteById } from '@/lib/board-store';

type BoardCardProps = {
  board: Board;
};

export function BoardCard({ board }: BoardCardProps) {
  const router = useRouter();

  function openBoard() {
    router.push(`/app/boards/${board.id}`);
  }

  function handleCardKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openBoard();
    }
  }

  function handleFavorite(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    toggleFavoriteById(board.id);
  }

  return (
    <article
      role="link"
      tabIndex={0}
      onClick={openBoard}
      onKeyDown={handleCardKeyDown}
      className="group relative h-full cursor-pointer overflow-hidden rounded-4xl border border-slate-200 bg-white/85 transition hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(15,23,42,0.10)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
      aria-label={`Open ${board.title}`}
    >
      <button
        type="button"
        onClick={handleFavorite}
        className="absolute right-4 top-4 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition hover:bg-slate-50"
        aria-label={board.isFavorite ? `Unfavorite ${board.title}` : `Favorite ${board.title}`}
      >
        {board.isFavorite ? (
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
        ) : (
          <Star className="h-4 w-4 text-slate-500" />
        )}
      </button>

      <div className="relative z-10">
        <Card className="border-0 bg-transparent shadow-none">
          <CardHeader className="space-y-3 pr-14">
            <div className="flex flex-wrap gap-2">
              {board.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
            <CardTitle className="wrap-break-word">{board.title}</CardTitle>
            <CardDescription className="wrap-break-word">{board.summary}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-4 gap-2">
              {board.palette.slice(0, 4).map((color) => (
                <div key={color.id} className="space-y-2">
                  <div
                    className="h-12 rounded-2xl border border-slate-200"
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