import type { Board, BoardTemplate } from '@/types/board';
import { REFERENCE_IMAGE_SOURCE } from '@/lib/reference-images';
import { createBoardFromPrompt } from '@/lib/board-store';
import { createId } from '@/lib/utils';

export function boardToTemplate(board: Board, options?: { name?: string; description?: string }): BoardTemplate {
  const name = options?.name?.trim() || board.title.trim() || 'Untitled template';
  const description = options?.description?.trim() || board.summary.trim() || 'Saved from a board.';

  return {
    id: `template-${board.id}`,
    name,
    description,
    prompt: board.prompt,
    tags: [...board.tags],
    mood: board.mood,
    summary: board.summary,
    tone: [...board.tone],
    palette: board.palette.map(({ label, hex, usage }) => ({ label, hex, usage })),
    typography: board.typography.map(({ role, fontName, note }) => ({ role, fontName, note })),
    references: board.references.map(({ title, category, imageUrl, source }) => ({
      title,
      category,
      imageUrl,
      source: source ?? REFERENCE_IMAGE_SOURCE,
    })),
    notes: board.notes.map(({ text, type }) => ({ text, type })),
  };
}

export function templateJsonFromBoard(board: Board, options?: { name?: string; description?: string }): BoardTemplate {
  return boardToTemplate(board, options);
}

export function templateToBoard(template: BoardTemplate): Board {
  const base = createBoardFromPrompt({ prompt: template.prompt, title: template.name });
  return {
    ...base,
    title: template.name,
    prompt: template.prompt,
    summary: template.summary ?? base.summary,
    mood: template.mood ?? base.mood,
    tone: template.tone?.length ? [...template.tone] : base.tone,
    tags: template.tags.length ? [...template.tags] : base.tags,
    palette: template.palette?.length
      ? template.palette.map((item, index) => ({
          id: `${base.id}-template-palette-${index}`,
          label: item.label,
          hex: item.hex,
          usage: item.usage,
        }))
      : base.palette,
    typography: template.typography?.length
      ? template.typography.map((item, index) => ({
          id: `${base.id}-template-typography-${index}`,
          role: item.role,
          fontName: item.fontName,
          note: item.note,
        }))
      : base.typography,
    notes: template.notes?.length
      ? template.notes.map((item) => ({
          id: createId('note'),
          text: item.text,
          type: item.type,
          position: { x: 0, y: 0 },
        }))
      : base.notes,
    references: template.references?.length
      ? template.references.map((item, index) => ({
          id: `${base.id}-template-reference-${index}`,
          title: item.title,
          imageUrl: item.imageUrl ?? '',
          category: item.category,
          source: item.source ?? REFERENCE_IMAGE_SOURCE,
        }))
      : base.references,
  };
}
