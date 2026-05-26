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

export function TemplatePicker({ templates, activePrompt, onSelect }: TemplatePickerProps) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {templates.map((template) => {
        const isActive = activePrompt.trim() === template.prompt.trim();
        return (
          <button
            key={template.id}
            type="button"
            onClick={() => onSelect(template.prompt)}
            className={cn(
              'text-left transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950/20',
              isActive ? 'rounded-3xl ring-2 ring-slate-950/10' : '',
            )}
          >
            <Card className={cn('h-full border-slate-200 bg-white/80', isActive && 'border-slate-950/20')}>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle>{template.name}</CardTitle>
                  {isActive ? <Badge>Selected</Badge> : null}
                </div>
                <CardDescription>{template.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm leading-6 text-slate-600">{template.prompt}</p>
                <div className="flex flex-wrap gap-2">
                  {template.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </button>
        );
      })}
    </div>
  );
}