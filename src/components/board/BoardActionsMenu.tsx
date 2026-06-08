'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Copy, Trash2, ExternalLink, Share2, Download } from 'lucide-react';

type BoardActionsMenuProps = {
  isFavorite: boolean;
  saveStatus: string;
  isDirty: boolean;
  canEdit?: boolean;
  viewHref: string;
  onSave: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
  onShare: () => void;
  onExport: () => void;
};

export function BoardActionsMenu({
  isFavorite,
  saveStatus,
  isDirty,
  canEdit = true,
  viewHref,
  onSave,
  onDuplicate,
  onDelete,
  onToggleFavorite,
  onShare,
  onExport,
}: BoardActionsMenuProps) {
  return (
    <div className="flex flex-nowrap items-center gap-2 overflow-x-hidden">
      <Badge variant="outline" className="shrink-0">
        {saveStatus}
      </Badge>

      {canEdit ? (
        <Button
          type="button"
          variant={isDirty ? 'default' : 'outline'}
          size="sm"
          onClick={onSave}
          disabled={!isDirty}
          className="shrink-0 whitespace-nowrap px-3"
        >
          Save
        </Button>
      ) : null}

      {canEdit ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onToggleFavorite}
          className="shrink-0 whitespace-nowrap px-3"
        >
          {isFavorite ? <Star className="h-4 w-4" /> : <Star className="h-4 w-4" />}
          {isFavorite ? 'Unfavorite' : 'Favorite'}
        </Button>
      ) : null}

      {canEdit ? (
        <Button type="button" variant="outline" size="sm" onClick={onDuplicate} className="shrink-0 whitespace-nowrap px-3">
          <Copy className="h-4 w-4" />
          Duplicate
        </Button>
      ) : null}

      {canEdit ? (
        <Button type="button" variant="outline" size="sm" onClick={onShare} className="shrink-0 whitespace-nowrap px-3">
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      ) : null}

      <Button type="button" variant="outline" size="sm" onClick={onExport} className="shrink-0 whitespace-nowrap px-3">
        <Download className="h-4 w-4" />
        Export
      </Button>

      <Link
        href={viewHref}
        className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-full border border-(--border) bg-(--surface-elevated) px-3 text-sm font-medium text-(--text) transition hover:bg-(--surface-subtle) whitespace-nowrap"
      >
        <ExternalLink className="h-4 w-4" />
        View
      </Link>

      {canEdit ? (
        <Button type="button" variant="destructive" size="sm" onClick={onDelete} className="shrink-0 whitespace-nowrap px-3">
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      ) : null}
    </div>
  );
}
