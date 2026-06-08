'use client';

import type { BoardTemplate } from '@/types/board';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  creationFocusRingClass,
  creationTagPillClass,
  creationTemplateCardClass,
  creationTemplateInsetClass,
  editorCardTitleClass,
  editorLabelClass,
} from '@/components/board/board-editor-styles';
import { cn } from '@/lib/utils';

type TemplatePickerProps = {
  templates: BoardTemplate[];
  activePrompt: string;
  onSelect: (prompt: string) => void;
};

const fallbackSwatches = ['#e5e7eb', '#cbd5e1', '#d6d3d1', '#cbd7c8'];

export function TemplatePicker({ templates, activePrompt, onSelect }: TemplatePickerProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {templates.map((template) => {
        const isActive = activePrompt.trim() === template.prompt.trim();
        const palette = template.palette?.length ? template.palette.slice(0, 4) : [];

        return (
          <button
            key={template.id}
            type="button"
            onClick={() => onSelect(template.prompt)}
            aria-pressed={isActive}
            aria-label={`Use template ${template.name}`}
            className={cn(
              'rounded-[1.75rem] text-left transition hover:-translate-y-0.5',
              creationFocusRingClass,
              isActive ? 'ring-2 ring-(--border)' : '',
            )}
          >
            <Card className={creationTemplateCardClass}>
              <div className="h-1.5 bg-linear-to-r from-(--surface-subtle) via-[#cbd7c8] to-[#d7c4b3]" />

              <CardHeader className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className={editorCardTitleClass}>{template.name}</CardTitle>
                    <CardDescription className="mt-2 text-sm leading-6 text-(--text-muted)">
                      {template.description}
                    </CardDescription>
                  </div>

                  {isActive ? <Badge variant="secondary">Selected</Badge> : null}
                </div>

                <div className={creationTemplateInsetClass}>
                  <p className={editorLabelClass}>Mood</p>
                  <p className="[font-family:var(--font-display),serif] mt-2 text-xl tracking-tight text-(--text-strong)">
                    {template.mood ?? template.name}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-(--text-muted)">
                    {template.summary ?? template.prompt}
                  </p>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-4 gap-2">
                  {(palette.length
                    ? palette
                    : fallbackSwatches.map((hex, index) => ({
                        label: `Color ${index + 1}`,
                        hex,
                        usage: '',
                      }))
                  ).map((swatch) => (
                    <div key={`${template.id}-${swatch.label}-${swatch.hex}`} className="space-y-2">
                      <div
                        className="h-12 rounded-2xl border border-(--border)"
                        style={{ backgroundColor: swatch.hex }}
                      />
                      <p className="text-[11px] text-(--text-muted)">{swatch.label}</p>
                    </div>
                  ))}
                </div>

                {template.tone?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {template.tone.slice(0, 3).map((tone) => (
                      <span key={`${template.id}-${tone}`} className={creationTagPillClass}>
                        {tone}
                      </span>
                    ))}
                  </div>
                ) : null}

                <p className="text-sm leading-6 text-(--text-strong)">{template.prompt}</p>

                <div className="flex flex-wrap gap-2">
                  {template.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {template.typography?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {template.typography.slice(0, 3).map((item) => (
                      <span
                        key={`${template.id}-${item.fontName}-${item.role}`}
                        className={creationTagPillClass}
                      >
                        {item.fontName}
                      </span>
                    ))}
                  </div>
                ) : null}

                {template.references?.length ? (
                  <p className={editorLabelClass}>{template.references.length} reference assets</p>
                ) : null}
              </CardContent>
            </Card>
          </button>
        );
      })}
    </div>
  );
}
