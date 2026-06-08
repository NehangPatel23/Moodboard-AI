'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  editorFieldClass,
  editorLabelClass,
  editorSettingsCardClass,
} from '@/components/board/board-editor-styles';

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
    <Card className={editorSettingsCardClass}>
      <CardHeader>
        <CardTitle>Direction, tone, and summary</CardTitle>
        <CardDescription>Adjust the core idea before refining palette, type, and references.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className={editorLabelClass}>Mood</label>
          <Input
            value={mood}
            onChange={(e) => onMoodChange(e.target.value)}
            placeholder="calm luxury"
            className={editorFieldClass}
          />
        </div>

        <div className="space-y-2">
          <label className={editorLabelClass}>Creative summary</label>
          <Textarea
            value={summary}
            onChange={(e) => onSummaryChange(e.target.value)}
            className={`min-h-35 ${editorFieldClass}`}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className={editorLabelClass}>Tone descriptors</label>
            <Input
              value={toneText}
              onChange={(e) => onToneChange(e.target.value)}
              placeholder="minimal, warm, premium"
              className={editorFieldClass}
            />
          </div>

          <div className="space-y-2">
            <label className={editorLabelClass}>Tags</label>
            <Input
              value={tagsText}
              onChange={(e) => onTagsChange(e.target.value)}
              placeholder="wellness, editorial, soft contrast"
              className={editorFieldClass}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
