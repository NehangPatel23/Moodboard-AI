'use client';

import Link from 'next/link';
import type { CSSProperties } from 'react';
import type { Board } from '@/types/board';
import { formatDateTime } from '@/lib/utils';
import { Globe } from 'lucide-react';
import { resolveReferenceImageUrl } from '@/lib/reference-images';

type DiscoverBoardCardProps = {
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

export function DiscoverBoardCard({ board }: DiscoverBoardCardProps) {
  const previewTiles = getPreviewTiles(board);

  return (
    <Link
      href={`/share/${board.id}`}
      aria-label={`View ${board.title}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-4xl border border-(--border) bg-(--surface) shadow-[0_22px_50px_rgba(15,23,42,0.10)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_32px_70px_rgba(15,23,42,0.14)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--ring) focus-visible:ring-offset-2 focus-visible:ring-offset-(--background)"
    >
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
          {board.mood ? (
            <span className="rounded-full bg-(--surface-subtle) px-3 py-1 text-[11px] font-medium tracking-wide text-(--text-muted)">
              {board.mood}
            </span>
          ) : null}
          {board.tags.slice(0, 2).map((tag) => (
            <span
              key={`${board.id}-${tag}`}
              className="rounded-full bg-(--surface-subtle) px-3 py-1 text-[11px] font-medium tracking-wide text-(--text-muted)"
            >
              {tag}
            </span>
          ))}
          <span className="inline-flex items-center gap-1 rounded-full bg-(--surface-subtle) px-3 py-1 text-[11px] font-medium tracking-wide text-(--text-muted)">
            <Globe className="h-3 w-3" />
            Public
          </span>
        </div>

        <h3 className="mt-4 [font-family:var(--font-display),serif] text-2xl leading-tight text-(--text-strong)">
          {board.title}
        </h3>

        <p className="mt-2 line-clamp-3 text-sm leading-6 text-(--text-muted)">{board.summary}</p>

        <p className="mt-auto pt-6 text-[10px] font-medium uppercase tracking-[0.28em] text-(--text-muted)">
          {board.creatorName ? (
            <>
              By {board.creatorName}
              <span className="mx-2">·</span>
            </>
          ) : null}
          Updated {formatDateTime(board.updatedAt)}
        </p>
      </div>
    </Link>
  );
}
