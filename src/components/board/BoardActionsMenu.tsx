'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, StarOff, Copy, Trash2, ExternalLink, Share2, Download } from 'lucide-react';

type BoardActionsMenuProps = {
  isFavorite: boolean;
  saveStatus: string;
  isDirty: boolean;
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

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onToggleFavorite}
        className="shrink-0 whitespace-nowrap px-3"
      >
        {isFavorite ? <StarOff className="h-4 w-4" /> : <Star className="h-4 w-4" />}
        {isFavorite ? 'Unfavorite' : 'Favorite'}
      </Button>

      <Button type="button" variant="outline" size="sm" onClick={onDuplicate} className="shrink-0 whitespace-nowrap px-3">
        <Copy className="h-4 w-4" />
        Duplicate
      </Button>

      <Button type="button" variant="outline" size="sm" onClick={onShare} className="shrink-0 whitespace-nowrap px-3">
        <Share2 className="h-4 w-4" />
        Share
      </Button>

      <Button type="button" variant="outline" size="sm" onClick={onExport} className="shrink-0 whitespace-nowrap px-3">
        <Download className="h-4 w-4" />
        Export
      </Button>

      <Link
        href={viewHref}
        className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 transition hover:bg-slate-50 whitespace-nowrap"
      >
        <ExternalLink className="h-4 w-4" />
        View
      </Link>

      <Button type="button" variant="destructive" size="sm" onClick={onDelete} className="shrink-0 whitespace-nowrap px-3">
        <Trash2 className="h-4 w-4" />
        Delete
      </Button>
    </div>
  );
}