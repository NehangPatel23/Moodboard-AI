'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

type CreativeDirectionPanelProps = {
  summary: string;
  mood: string;
  toneText: string;
  tagsText: string;
  onSummaryChange: (value: string) => void;
  onMoodChange: (value: string) => void;
  onToneChange: (value: string) => void;
  onTagsChange: (value: string) => void;
};

export function CreativeDirectionPanel({
  summary,
  mood,
  toneText,
  tagsText,
  onSummaryChange,
  onMoodChange,
  onToneChange,
  onTagsChange,
}: CreativeDirectionPanelProps) {
  return (
    <Card className="border-slate-200 bg-white/85">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Badge variant="outline">Creative direction</Badge>
        </div>
        <CardTitle>Direction, tone, and summary</CardTitle>
        <CardDescription>Adjust the core idea before refining palette, type, and references.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">Mood</label>
          <Input value={mood} onChange={(e) => onMoodChange(e.target.value)} placeholder="calm luxury" />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">Creative summary</label>
          <Textarea value={summary} onChange={(e) => onSummaryChange(e.target.value)} className="min-h-35" />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">Tone descriptors</label>
            <Input
              value={toneText}
              onChange={(e) => onToneChange(e.target.value)}
              placeholder="minimal, warm, premium"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">Tags</label>
            <Input
              value={tagsText}
              onChange={(e) => onTagsChange(e.target.value)}
              placeholder="wellness, editorial, soft contrast"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}