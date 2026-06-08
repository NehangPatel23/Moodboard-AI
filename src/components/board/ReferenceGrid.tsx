'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { ReferenceItem } from '@/types/board';
import {
  editorEmptyStateClass,
  editorSettingsCardClass,
} from '@/components/board/board-editor-styles';
import { Plus } from 'lucide-react';
import { ReferenceCard } from './ReferenceCard';

type ReferenceGridProps = {
  references: ReferenceItem[];
  readOnly?: boolean;
  onAdd?: () => void;
  onChange?: (index: number, next: ReferenceItem) => void;
  onRemove?: (index: number) => void;
};

export function ReferenceGrid({
  references,
  readOnly = false,
  onAdd,
  onChange,
  onRemove,
}: ReferenceGridProps) {
  return (
    <Card className={editorSettingsCardClass}>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Inspiration grid</CardTitle>
          <CardDescription>Visual references that support the mood and composition.</CardDescription>
        </div>

        {!readOnly && onAdd ? (
          <Button type="button" variant="outline" size="sm" onClick={onAdd} className="rounded-full px-4 whitespace-nowrap">
            <Plus className="h-4 w-4" />
            Add reference
          </Button>
        ) : null}
      </CardHeader>

      <CardContent>
        {references.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {references.map((reference, index) => (
              <ReferenceCard
                key={reference.id}
                reference={reference}
                readOnly={readOnly}
                onChange={onChange ? (next) => onChange(index, next) : undefined}
                onRemove={onRemove ? () => onRemove(index) : undefined}
              />
            ))}
          </div>
        ) : (
          <div className={editorEmptyStateClass}>No references yet.</div>
        )}
      </CardContent>
    </Card>
  );
}
