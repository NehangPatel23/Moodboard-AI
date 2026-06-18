'use client';

import Link from 'next/link';
import type { CSSProperties } from 'react';
import type { Board } from '@/types/board';
import { formatDateTime } from '@/lib/utils';
import { Globe, Sparkles } from 'lucide-react';
import { resolveReferenceImageUrl } from '@/lib/reference-images';
import { cn } from '@/lib/utils';
import {
  appOverlayBadgeClass,
  appPreviewFallbackHex,
  appPreviewLabelClass,
  appPreviewTileClass,
  appPreviewTileFooterClass,
  appPreviewTileOverlayClass,
} from '@/components/shared/app-surface-styles';
import { DiscoverRemixButton } from '@/components/discover/DiscoverRemixButton';

type DiscoverBoardCardProps = {
  board: Board;
  featured?: boolean;
};

function getPreviewTiles(board: Board): Array<Board['references'][number] | null> {
  return Array.from({ length: 4 }, (_, index) => board.references[index] ?? null);
}

function getTileStyle(
  board: Board,
  tile: Board['references'][number] | null,
  index: number,
): CSSProperties {
  const paletteFallback = board.palette[index % Math.max(board.palette.length, 1)]?.hex ?? appPreviewFallbackHex;

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

export function DiscoverBoardCard({ board, featured = false }: DiscoverBoardCardProps) {
  const previewTiles = getPreviewTiles(board);
  const creatorLabel = board.creatorName ?? 'Creator';
  const profileHref = board.creatorId ? `/profile/${board.creatorId}` : null;

  return (
    <article
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-(--border) bg-(--surface) shadow-[var(--shadow-card)] transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-elevated)]',
        featured && 'ring-1 ring-(--border)',
      )}
    >
      {featured ? (
        <div className={`absolute right-4 top-4 z-10 ${appOverlayBadgeClass}`}>
          <Sparkles className="h-3 w-3" aria-hidden="true" />
          Featured
        </div>
      ) : null}

      <Link
        href={`/share/${board.id}`}
        aria-label={`View ${board.title}`}
        className="flex flex-1 flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--ring) focus-visible:ring-offset-2 focus-visible:ring-offset-(--background)"
      >
        <div className="p-4 pb-0">
          <div className="grid grid-cols-2 gap-2">
            {previewTiles.map((tile, index) => (
              <div
                key={`${board.id}-${index}`}
                className={`relative aspect-square overflow-hidden rounded-[1rem] ${appPreviewTileClass}`}
                style={getTileStyle(board, tile, index)}
              >
                <div className={appPreviewTileOverlayClass} />
                <div className={appPreviewTileFooterClass} />

                {!tile?.imageUrl ? (
                  <div className="absolute inset-0 flex items-end p-3">
                    <span className={appPreviewLabelClass}>
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

          <h3 className="mt-4 [font-family:var(--font-display),serif] text-[1.65rem] leading-tight text-(--text-strong)">
            {board.title}
          </h3>

          <p className="mt-2 line-clamp-3 flex-1 text-sm leading-6 text-(--text-muted)">{board.summary}</p>
        </div>
      </Link>

      <div className="flex items-center justify-between gap-3 border-t border-(--border) bg-(--surface-subtle)/40 px-4 py-3">
        <p className="min-w-0 flex-1 text-[10px] font-medium uppercase tracking-[0.28em] text-(--text-muted)">
          {profileHref ? (
            <>
              By{' '}
              <Link
                href={profileHref}
                className="underline decoration-(--border) underline-offset-4 transition hover:text-(--text-strong) hover:decoration-(--text-muted)"
              >
                {creatorLabel}
              </Link>
              <span className="mx-2">·</span>
            </>
          ) : board.creatorName ? (
            <>
              By {board.creatorName}
              <span className="mx-2">·</span>
            </>
          ) : null}
          Updated {formatDateTime(board.updatedAt)}
        </p>
        <DiscoverRemixButton boardId={board.id} boardTitle={board.title} />
      </div>
    </article>
  );
}