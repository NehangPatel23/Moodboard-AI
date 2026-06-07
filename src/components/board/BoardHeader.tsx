'use client';

import { Badge } from '@/components/ui/badge';
import { BoardActionsMenu } from './BoardActionsMenu';

type BoardHeaderProps = {
  boardId: string;
  title: string;
  prompt: string;
  updatedAt: string;
  visibility: string;
  isFavorite: boolean;
  saveStatus: string;
  isDirty: boolean;
  onTitleChange: (value: string) => void;
  onSave: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
  onShare: () => void;
  onExport: () => void;
};

const TITLE_LIMIT = 35;

export function BoardHeader({
  boardId,
  title,
  prompt,
  updatedAt,
  visibility,
  isFavorite,
  saveStatus,
  isDirty,
  onTitleChange,
  onSave,
  onDuplicate,
  onDelete,
  onToggleFavorite,
  onShare,
  onExport,
}: BoardHeaderProps) {
  return (
    <section className="space-y-5 rounded-4xl border border-slate-200 bg-white/85 p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{visibility}</Badge>
          <span className="text-xs uppercase tracking-[0.3em] text-slate-400">{boardId}</span>
        </div>

        <div className="shrink-0">
          <BoardActionsMenu
            isFavorite={isFavorite}
            saveStatus={saveStatus}
            isDirty={isDirty}
            viewHref={`/app/boards/${boardId}/view`}
            onSave={onSave}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
            onToggleFavorite={onToggleFavorite}
            onShare={onShare}
            onExport={onExport}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">
          Board title
        </label>

        <div className="w-full">
          <textarea
            value={title}
            onChange={(event) => onTitleChange(event.target.value.slice(0, TITLE_LIMIT))}
            rows={1}
            wrap="off"
            maxLength={TITLE_LIMIT}
            className="block w-full resize-none overflow-x-auto whitespace-nowrap border-0 bg-transparent px-0 py-2 text-4xl font-semibold leading-tight tracking-tight shadow-none outline-none placeholder:text-slate-300 focus:ring-0 md:text-5xl"
            placeholder="Untitled board"
          />
        </div>

        <p className="text-xs text-slate-400">
          Up to {TITLE_LIMIT} characters • {title.length}/{TITLE_LIMIT}
        </p>
      </div>

      <div className="space-y-2">
        <p className="max-w-none text-sm leading-6 text-slate-500">
          Prompt: <span className="font-medium text-slate-700">{prompt}</span>
        </p>

        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Last updated {updatedAt}</p>
      </div>
    </section>
  );
}