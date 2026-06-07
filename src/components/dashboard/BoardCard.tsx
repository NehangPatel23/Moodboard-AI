'use client';

import { useRouter } from 'next/navigation';
import type { CSSProperties, KeyboardEvent, MouseEvent } from 'react';
import type { Board } from '@/types/board';
import { formatDateTime } from '@/lib/utils';
import { Globe, Lock, Star } from 'lucide-react';
import { toggleFavoriteById } from '@/lib/board-store';
import { showToast } from '@/components/shared/toast-store';
import { resolveReferenceImageUrl } from '@/lib/reference-images';

type BoardCardProps = {
  board: Board;
};

function getPreviewTiles(board: Board): Array<Board['references'][number] | null> {
  return Array.from({ length: 4 }, (_, index) => board.references[index] ?? null);
}

function getTileStyle(
  board: Board,
  tile: Board['references'][number] | null,
  index: number,
): CSSProperties {
  const paletteFallback = board.palette[index % Math.max(board.palette.length, 1)]?.hex ?? '#e5e2e1';

  if (tile) {
    const imageUrl = resolveReferenceImageUrl(tile, board, index);
    return {
      backgroundImage: `linear-gradient(180deg, rgba(17, 24, 39, 0.08), rgba(17, 24, 39, 0.18)), url(${imageUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  }

  return {
    background: `linear-gradient(135deg, ${paletteFallback} 0%, rgba(255,255,255,0.9) 100%)`,
  };
}

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
      showToast(updated.isFavorite ? 'Added to favorites.' : 'Removed from favorites.', 'success');
    }
  };

  const previewTiles = getPreviewTiles(board);

  return (
    <article
      role="link"
      tabIndex={0}
      onClick={openBoard}
      onKeyDown={handleKeyDown}
      aria-label={`Open ${board.title}`}
      className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-4xl border border-[var(--border)] bg-[var(--surface)] shadow-[0_22px_50px_rgba(15,23,42,0.10)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_32px_70px_rgba(15,23,42,0.14)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
    >
      <button
        type="button"
        onClick={handleFavorite}
        aria-label={
          board.isFavorite
            ? `Remove ${board.title} from favorites`
            : `Add ${board.title} to favorites`
        }
        aria-pressed={board.isFavorite}
        className="absolute right-4 top-4 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] shadow-sm transition hover:bg-[var(--surface-elevated)] hover:shadow-md"
      >
        {board.isFavorite ? (
          <Star className="h-4.5 w-4.5 fill-amber-400 text-amber-400" />
        ) : (
          <Star className="h-4.5 w-4.5 text-[var(--text-muted)]" />
        )}
      </button>

      <div className="p-4 pb-0">
        <div className="grid grid-cols-2 gap-2">
          {previewTiles.map((tile, index) => (
            <div
              key={`${board.id}-${index}`}
              className="relative aspect-square overflow-hidden rounded-[1.15rem] bg-black/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]"
              style={getTileStyle(board, tile, index)}
            >
              <div className="absolute inset-0 bg-linear-to-tr from-black/12 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 h-14 bg-linear-to-t from-black/25 to-transparent" />

              {!tile?.imageUrl ? (
                <div className="absolute inset-0 flex items-end p-3">
                  <span className="rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-medium text-slate-700">
                    {board.palette[index % Math.max(board.palette.length, 1)]?.label ?? 'Studio'}
                  </span>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col px-4 pb-4 pt-5">
        <div className="flex flex-wrap gap-2">
          {board.tags.slice(0, 3).map((tag) => (
            <span
              key={`${board.id}-${tag}`}
              className="rounded-full bg-[var(--surface-subtle)] px-3 py-1 text-[11px] font-medium tracking-wide text-[var(--text-muted)]"
            >
              {tag}
            </span>
          ))}
          <span className="rounded-full bg-[var(--surface-subtle)] px-3 py-1 text-[11px] font-medium tracking-wide text-[var(--text-muted)]">
            {board.references.length} Assets
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--surface-subtle)] px-3 py-1 text-[11px] font-medium tracking-wide text-[var(--text-muted)]">
            {board.visibility === 'shared' ? (
              <Globe className="h-3 w-3" />
            ) : (
              <Lock className="h-3 w-3" />
            )}
            {board.visibility === 'shared' ? 'Shared' : 'Private'}
          </span>
        </div>

        <h3 className="mt-4 [font-family:var(--font-display),serif] text-2xl leading-tight text-[var(--text-strong)]">
          {board.title}
        </h3>

        <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{board.summary}</p>

        <div className="mt-auto flex items-center justify-between gap-4 pt-6">
          <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--text-muted)]">
            Updated {formatDateTime(board.updatedAt)}
          </p>
        </div>
      </div>
    </article>
  );
}