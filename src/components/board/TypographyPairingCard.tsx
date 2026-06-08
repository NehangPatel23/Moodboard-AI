'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { TypographyItem, TypographyRole } from '@/types/board';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { editorLabelClass, editorNestedCardClass, editorSelectClass } from '@/components/board/board-editor-styles';

type TypographyPairingCardProps = {
  typography: TypographyItem[];
  onChange: (index: number, next: TypographyItem) => void;
  onAdd?: () => void;
  onRemove?: (index: number) => void;
};

const roleOptions: { value: TypographyRole; label: string }[] = [
  { value: 'heading', label: 'Heading' },
  { value: 'body', label: 'Body' },
  { value: 'accent', label: 'Accent' },
];

export function TypographyPairingCard({
  typography,
  onChange,
  onAdd,
  onRemove,
}: TypographyPairingCardProps) {
  return (
    <Card className="border-(--border) bg-(--surface-elevated)/85">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Typography</CardTitle>
          <CardDescription>Pair the fonts with short notes for the design direction.</CardDescription>
        </div>

        {onAdd ? (
          <Button type="button" variant="outline" size="sm" onClick={onAdd} className="rounded-full px-4 whitespace-nowrap">
            <Plus className="h-4 w-4" />
            Add row
          </Button>
        ) : null}
      </CardHeader>

      <CardContent className="space-y-4">
        {typography.map((item, index) => (
          <div key={item.id} className={cn(editorNestedCardClass, 'p-4')}>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <Badge variant="secondary">{item.role}</Badge>
                {onRemove ? (
                  <Button type="button" variant="ghost" size="sm" onClick={() => onRemove(index)}>
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </Button>
                ) : null}
              </div>

              <div className="grid gap-2">
                <label className={editorLabelClass}>Type badge</label>
                <select
                  value={item.role}
                  onChange={(e) => onChange(index, { ...item, role: e.target.value as TypographyRole })}
                  className={editorSelectClass}
                >
                  {roleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-2">
                <label className={editorLabelClass}>Font name</label>
                <Input
                  value={item.fontName}
                  onChange={(e) => onChange(index, { ...item, fontName: e.target.value })}
                  placeholder="Cormorant Garamond"
                />
              </div>

              <div className="grid gap-2">
                <label className={editorLabelClass}>Usage note</label>
                <Input
                  value={item.note}
                  onChange={(e) => onChange(index, { ...item, note: e.target.value })}
                  placeholder="Elegant, editorial, high-trust"
                />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
