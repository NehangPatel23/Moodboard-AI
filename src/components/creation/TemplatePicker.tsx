'use client';

import type { BoardTemplate } from '@/types/board';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
              'rounded-[1.75rem] text-left transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 dark:focus-visible:ring-white/20',
              isActive ? 'ring-2 ring-slate-900/10 dark:ring-white/10' : '',
            )}
          >
            <Card className="h-full overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[rgba(15,23,42,0.82)] dark:shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
              <div className="h-1.5 bg-linear-to-r from-slate-200 via-[#cbd7c8] to-[#d7c4b3] dark:from-slate-700 dark:via-slate-500/50 dark:to-amber-100/20" />

              <CardHeader className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="[font-family:var(--font-display),serif] text-2xl tracking-tight text-slate-950 dark:text-slate-100">
                      {template.name}
                    </CardTitle>
                    <CardDescription className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                      {template.description}
                    </CardDescription>
                  </div>

                  {isActive ? <Badge variant="secondary">Selected</Badge> : null}
                </div>

                <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                  <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-slate-400 dark:text-slate-500">
                    Mood
                  </p>
                  <p className="[font-family:var(--font-display),serif] mt-2 text-xl tracking-tight text-slate-950 dark:text-slate-100">
                    {template.mood ?? template.name}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
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
                        className="h-12 rounded-2xl border border-slate-200 dark:border-white/10"
                        style={{ backgroundColor: swatch.hex }}
                      />
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{swatch.label}</p>
                    </div>
                  ))}
                </div>

                {template.tone?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {template.tone.slice(0, 3).map((tone) => (
                      <span
                        key={`${template.id}-${tone}`}
                        className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium tracking-wide text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                      >
                        {tone}
                      </span>
                    ))}
                  </div>
                ) : null}

                <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{template.prompt}</p>

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
                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium tracking-wide text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400"
                      >
                        {item.fontName}
                      </span>
                    ))}
                  </div>
                ) : null}

                {template.references?.length ? (
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
                    {template.references.length} reference assets
                  </p>
                ) : null}
              </CardContent>
            </Card>
          </button>
        );
      })}
    </div>
  );
}