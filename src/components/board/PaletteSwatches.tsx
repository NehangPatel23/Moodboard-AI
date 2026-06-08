'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { PaletteItem } from '@/types/board';
import {
  editorFieldClass,
  editorLabelClass,
  editorSettingsCardClass,
  editorSettingsNestedClass,
} from '@/components/board/board-editor-styles';
import { Plus, Trash2 } from 'lucide-react';

type PaletteSwatchesProps = {
  palette: PaletteItem[];
  onChange: (index: number, next: PaletteItem) => void;
  onAdd?: () => void;
  onRemove?: (index: number) => void;
};

export function PaletteSwatches({ palette, onChange, onAdd, onRemove }: PaletteSwatchesProps) {
  return (
    <Card className={editorSettingsCardClass}>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Palette</CardTitle>
          <CardDescription>Fine-tune the colors and usage notes for the board.</CardDescription>
        </div>

        {onAdd ? (
          <Button type="button" variant="outline" size="sm" onClick={onAdd} className="rounded-full px-4 whitespace-nowrap">
            <Plus className="h-4 w-4" />
            Add color
          </Button>
        ) : null}
      </CardHeader>

      <CardContent className="space-y-4">
        {palette.map((item, index) => (
          <div key={item.id} className={editorSettingsNestedClass}>
            <div className="mb-4 h-20 rounded-2xl border border-(--border)" style={{ backgroundColor: item.hex }} />

            <div className="space-y-4">
              <div className="grid gap-2">
                <label className={editorLabelClass}>Color name</label>
                <Input
                  value={item.label}
                  onChange={(e) => onChange(index, { ...item, label: e.target.value })}
                  placeholder="Ivory"
                  className={editorFieldClass}
                />
              </div>

              <div className="grid gap-2">
                <label className={editorLabelClass}>Color hex</label>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-14 items-center justify-center rounded-2xl border border-(--border) bg-(--surface-elevated) p-1">
                    <input
                      type="color"
                      value={item.hex}
                      onChange={(e) => onChange(index, { ...item, hex: e.target.value })}
                      className="h-full w-full cursor-pointer rounded-xl border-0 bg-transparent p-0"
                      aria-label={`Pick color for ${item.label}`}
                    />
                  </div>
                  <Input
                    value={item.hex}
                    onChange={(e) => onChange(index, { ...item, hex: e.target.value })}
                    placeholder="#000000"
                    className={`font-mono ${editorFieldClass}`}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <label className={editorLabelClass}>Usage note</label>
                <Input
                  value={item.usage}
                  onChange={(e) => onChange(index, { ...item, usage: e.target.value })}
                  placeholder="Background and base surfaces"
                  className={editorFieldClass}
                />
              </div>
            </div>

            {onRemove ? (
              <div className="mt-4 flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(index)}
                  className="whitespace-nowrap"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove
                </Button>
              </div>
            ) : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
