'use client';

import type { NoteItem, NoteType } from '@/types/board';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type StickyNoteProps = {
  note: NoteItem;
  readOnly?: boolean;
  onChange?: (value: string) => void;
  onTypeChange?: (value: NoteType) => void;
  onDelete?: () => void;
};

const noteToneClasses: Record<NoteItem['type'], string> = {
  idea: 'border-amber-200 bg-amber-50',
  instruction: 'border-sky-200 bg-sky-50',
  keyword: 'border-violet-200 bg-violet-50',
};

const noteTypeOptions: { value: NoteType; label: string }[] = [
  { value: 'idea', label: 'Idea' },
  { value: 'instruction', label: 'Instruction' },
  { value: 'keyword', label: 'Keyword' },
];

export function StickyNote({
  note,
  readOnly = false,
  onChange,
  onTypeChange,
  onDelete,
}: StickyNoteProps) {
  return (
    <Card className={cn('overflow-hidden border shadow-sm', noteToneClasses[note.type])}>
      <CardHeader className="flex flex-row items-start justify-between gap-3 px-4 py-4">
        <Badge variant="secondary">{note.type}</Badge>

        {!readOnly && onDelete ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onDelete}
            aria-label="Delete note"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ) : null}
      </CardHeader>

      <CardContent className="space-y-4 px-4 pb-4 pt-0">
        {!readOnly ? (
          <div className="grid gap-2">
            <label className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">
              Note type
            </label>

            <select
              value={note.type}
              onChange={(e) => onTypeChange?.(e.target.value as NoteType)}
              className="flex h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-950 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
            >
              {noteTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {!readOnly ? (
          <div className="grid gap-2">
            <label className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">
              Note text
            </label>

            <Textarea
              value={note.text}
              onChange={(event) => onChange?.(event.target.value)}
              className="min-h-14 resize-y border-slate-200 bg-white/80"
            />
          </div>
        ) : (
          <p className="whitespace-pre-wrap wrap-break-word text-sm leading-6 text-slate-700">
            {note.text}
          </p>
        )}
      </CardContent>
    </Card>
  );
}