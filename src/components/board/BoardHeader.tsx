'use client';

import { Badge } from '@/components/ui/badge';
import { BoardActionsMenu } from './BoardActionsMenu';
import { editorLabelClass } from '@/components/board/board-editor-styles';

type BoardHeaderProps = {
  boardId: string;
  title: string;
  prompt: string;
  updatedAt: string;
  visibility: string;
  isFavorite: boolean;
  saveStatus: string;
  isDirty: boolean;
  canEdit?: boolean;
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
  canEdit = true,
  onTitleChange,
  onSave,
  onDuplicate,
  onDelete,
  onToggleFavorite,
  onShare,
  onExport,
}: BoardHeaderProps) {
  return (
    <section className="space-y-5 rounded-4xl border border-(--border) bg-(--surface-elevated)/85 p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{visibility}</Badge>
          <span className="text-xs uppercase tracking-[0.3em] text-(--text-muted)">{boardId}</span>
        </div>

        <div className="shrink-0">
          <BoardActionsMenu
            isFavorite={isFavorite}
            saveStatus={saveStatus}
            isDirty={isDirty}
            canEdit={canEdit}
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
        <label className={editorLabelClass}>Board title</label>

        <div className="w-full">
          <textarea
            value={title}
            readOnly={!canEdit}
            onChange={(event) => onTitleChange(event.target.value.slice(0, TITLE_LIMIT))}
            rows={1}
            wrap="off"
            maxLength={TITLE_LIMIT}
            className="block w-full resize-none overflow-x-auto whitespace-nowrap border-0 bg-transparent px-0 py-2 text-4xl font-semibold leading-tight tracking-tight text-(--text-strong) shadow-none outline-none placeholder:text-(--text-muted) focus:ring-0 md:text-5xl"
            placeholder="Untitled board"
          />
        </div>

        <p className="text-xs text-(--text-muted)">
          Up to {TITLE_LIMIT} characters • {title.length}/{TITLE_LIMIT}
        </p>
      </div>

      <div className="space-y-2">
        <p className="max-w-none text-sm leading-6 text-(--text-muted)">
          Prompt: <span className="font-medium text-(--text)">{prompt}</span>
        </p>

        <p className="text-xs uppercase tracking-[0.24em] text-(--text-muted)">
          Last updated {updatedAt}
        </p>
      </div>
    </section>
  );
}
