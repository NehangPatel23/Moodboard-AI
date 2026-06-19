import type {
  Board,
  BoardActivityChange,
  NoteItem,
  PaletteItem,
  ReferenceItem,
  TypographyItem,
} from '@/types/board';

function truncate(value: string, max = 120): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

function joinList(values: string[]): string {
  return values.map((value) => value.trim()).filter(Boolean).join(', ');
}

function brandStrategySignature(strategy: Board['brandStrategy']): string {
  if (!strategy) return '';
  return JSON.stringify({
    positioning: strategy.positioning.trim(),
    voice: strategy.voice.trim(),
    messaging: strategy.messaging.map((item) => item.trim()).filter(Boolean),
  });
}

function pushFieldChange(
  changes: BoardActivityChange[],
  input: {
    section: string;
    label: string;
    summary: string;
    before?: string | null;
    after?: string | null;
  },
) {
  changes.push({
    kind: 'field',
    action: 'updated',
    section: input.section,
    label: input.label,
    summary: input.summary,
    before: input.before ?? null,
    after: input.after ?? null,
  });
}

function diffPaletteItem(before: PaletteItem, after: PaletteItem): string[] {
  const parts: string[] = [];
  if (before.label !== after.label) parts.push('name');
  if (before.hex !== after.hex) parts.push('color');
  if (before.usage !== after.usage) parts.push('usage note');
  return parts;
}

function diffTypographyItem(before: TypographyItem, after: TypographyItem): string[] {
  const parts: string[] = [];
  if (before.role !== after.role) parts.push('role');
  if (before.fontName !== after.fontName) parts.push('font');
  if (before.note !== after.note) parts.push('usage note');
  return parts;
}

function diffReferenceItem(before: ReferenceItem, after: ReferenceItem): string[] {
  const parts: string[] = [];
  if (before.title !== after.title) parts.push('title');
  if (before.category !== after.category) parts.push('type');
  if ((before.source ?? '') !== (after.source ?? '')) parts.push('source');
  if (before.imageUrl !== after.imageUrl) parts.push('image');
  return parts;
}

function diffNoteItem(before: NoteItem, after: NoteItem): string[] {
  const parts: string[] = [];
  if (before.type !== after.type) parts.push('type');
  if (before.text !== after.text) parts.push('text');
  return parts;
}

export function summarizeBoardChanges(changes: BoardActivityChange[]): string {
  if (changes.length === 0) return 'Saved board changes';
  if (changes.length <= 3) {
    return changes.map((change) => change.summary).join(', ');
  }

  const head = changes
    .slice(0, 2)
    .map((change) => change.summary)
    .join(', ');
  return `${head}, and ${changes.length - 2} more`;
}

export function diffBoards(before: Board, after: Board): BoardActivityChange[] {
  const changes: BoardActivityChange[] = [];

  if (before.title !== after.title) {
    pushFieldChange(changes, {
      section: 'overview',
      label: 'Title',
      summary: 'Updated title',
      before: before.title,
      after: after.title,
    });
  }

  if (before.mood !== after.mood) {
    pushFieldChange(changes, {
      section: 'overview',
      label: 'Mood',
      summary: 'Updated mood',
      before: before.mood,
      after: after.mood,
    });
  }

  if (before.summary !== after.summary) {
    pushFieldChange(changes, {
      section: 'overview',
      label: 'Creative summary',
      summary: 'Updated creative summary',
      before: truncate(before.summary),
      after: truncate(after.summary),
    });
  }

  if (joinList(before.tone) !== joinList(after.tone)) {
    pushFieldChange(changes, {
      section: 'overview',
      label: 'Tone descriptors',
      summary: 'Updated tone descriptors',
      before: joinList(before.tone) || '(empty)',
      after: joinList(after.tone) || '(empty)',
    });
  }

  if (joinList(before.tags) !== joinList(after.tags)) {
    pushFieldChange(changes, {
      section: 'overview',
      label: 'Tags',
      summary: 'Updated tags',
      before: joinList(before.tags) || '(empty)',
      after: joinList(after.tags) || '(empty)',
    });
  }

  const beforeBrand = brandStrategySignature(before.brandStrategy);
  const afterBrand = brandStrategySignature(after.brandStrategy);
  if (beforeBrand !== afterBrand) {
    pushFieldChange(changes, {
      section: 'overview',
      label: 'Brand strategy',
      summary: afterBrand ? 'Updated brand strategy' : 'Removed brand strategy',
      before: beforeBrand ? 'Previous brand strategy' : '(empty)',
      after: afterBrand ? 'Updated brand strategy' : '(empty)',
    });
  }

  if (before.visibility !== after.visibility) {
    pushFieldChange(changes, {
      section: 'settings',
      label: 'Visibility',
      summary: `Changed visibility to ${after.visibility}`,
      before: before.visibility,
      after: after.visibility,
    });
  }

  if (before.isFavorite !== after.isFavorite) {
    changes.push({
      kind: 'field',
      action: 'updated',
      section: 'settings',
      label: 'Favorite',
      summary: after.isFavorite ? 'Marked as favorite' : 'Removed from favorites',
      before: before.isFavorite ? 'Favorite' : 'Not favorite',
      after: after.isFavorite ? 'Favorite' : 'Not favorite',
    });
  }

  const beforePalette = new Map(before.palette.map((item) => [item.id, item]));
  const afterPalette = new Map(after.palette.map((item) => [item.id, item]));

  for (const item of after.palette) {
    const previous = beforePalette.get(item.id);
    if (!previous) {
      changes.push({
        kind: 'palette',
        action: 'added',
        section: 'palette',
        label: item.label || 'Color',
        summary: `Added color "${item.label || item.hex}"`,
        before: null,
        after: `${item.label} (${item.hex})`,
      });
      continue;
    }

    const parts = diffPaletteItem(previous, item);
    if (parts.length > 0) {
      changes.push({
        kind: 'palette',
        action: 'updated',
        section: 'palette',
        label: item.label || previous.label || 'Color',
        summary: `Updated color "${item.label || previous.label}" (${parts.join(', ')})`,
        before: `${previous.label} (${previous.hex})`,
        after: `${item.label} (${item.hex})`,
      });
    }
  }

  for (const item of before.palette) {
    if (!afterPalette.has(item.id)) {
      changes.push({
        kind: 'palette',
        action: 'removed',
        section: 'palette',
        label: item.label || 'Color',
        summary: `Removed color "${item.label || item.hex}"`,
        before: `${item.label} (${item.hex})`,
        after: null,
      });
    }
  }

  const beforeTypography = new Map(before.typography.map((item) => [item.id, item]));
  const afterTypography = new Map(after.typography.map((item) => [item.id, item]));

  for (const item of after.typography) {
    const previous = beforeTypography.get(item.id);
    if (!previous) {
      changes.push({
        kind: 'typography',
        action: 'added',
        section: 'typography',
        label: item.role,
        summary: `Added ${item.role} typography (${item.fontName})`,
        before: null,
        after: `${item.fontName} — ${item.note || 'No usage note'}`,
      });
      continue;
    }

    const parts = diffTypographyItem(previous, item);
    if (parts.length > 0) {
      changes.push({
        kind: 'typography',
        action: 'updated',
        section: 'typography',
        label: item.role,
        summary: `Updated ${item.role} typography (${parts.join(', ')})`,
        before: `${previous.fontName} — ${previous.note || 'No usage note'}`,
        after: `${item.fontName} — ${item.note || 'No usage note'}`,
      });
    }
  }

  for (const item of before.typography) {
    if (!afterTypography.has(item.id)) {
      changes.push({
        kind: 'typography',
        action: 'removed',
        section: 'typography',
        label: item.role,
        summary: `Removed ${item.role} typography (${item.fontName})`,
        before: `${item.fontName} — ${item.note || 'No usage note'}`,
        after: null,
      });
    }
  }

  const beforeReferences = new Map(before.references.map((item) => [item.id, item]));
  const afterReferences = new Map(after.references.map((item) => [item.id, item]));

  for (const item of after.references) {
    const previous = beforeReferences.get(item.id);
    if (!previous) {
      changes.push({
        kind: 'reference',
        action: 'added',
        section: 'references',
        label: item.title || 'Reference',
        summary: `Added reference "${truncate(item.title, 60)}"`,
        before: null,
        after: `${item.title} (${item.category})`,
      });
      continue;
    }

    const parts = diffReferenceItem(previous, item);
    if (parts.length > 0) {
      changes.push({
        kind: 'reference',
        action: 'updated',
        section: 'references',
        label: item.title || previous.title || 'Reference',
        summary: `Updated reference "${truncate(item.title || previous.title, 60)}" (${parts.join(', ')})`,
        before: `${previous.title} (${previous.category})`,
        after: `${item.title} (${item.category})`,
      });
    }
  }

  for (const item of before.references) {
    if (!afterReferences.has(item.id)) {
      changes.push({
        kind: 'reference',
        action: 'removed',
        section: 'references',
        label: item.title || 'Reference',
        summary: `Deleted reference "${truncate(item.title, 60)}"`,
        before: `${item.title} (${item.category})`,
        after: null,
      });
    }
  }

  const beforeReferenceIds = before.references.map((item) => item.id);
  const afterReferenceIds = after.references.map((item) => item.id);
  const sameReferenceSet =
    beforeReferenceIds.length === afterReferenceIds.length &&
    beforeReferenceIds.length > 0 &&
    beforeReferenceIds.every((id) => afterReferenceIds.includes(id));
  const referencesReordered =
    sameReferenceSet && beforeReferenceIds.some((id, index) => afterReferenceIds[index] !== id);

  if (referencesReordered) {
    changes.push({
      kind: 'reference',
      action: 'updated',
      section: 'references',
      label: 'References',
      summary: 'Reordered inspiration references',
      before: null,
      after: null,
    });
  }

  const beforeNotes = new Map(before.notes.map((item) => [item.id, item]));
  const afterNotes = new Map(after.notes.map((item) => [item.id, item]));

  for (const item of after.notes) {
    const previous = beforeNotes.get(item.id);
    if (!previous) {
      changes.push({
        kind: 'note',
        action: 'added',
        section: 'notes',
        label: item.type,
        summary: `Added ${item.type} note`,
        before: null,
        after: truncate(item.text),
      });
      continue;
    }

    const parts = diffNoteItem(previous, item);
    if (parts.length > 0) {
      changes.push({
        kind: 'note',
        action: 'updated',
        section: 'notes',
        label: item.type,
        summary: `Updated ${item.type} note (${parts.join(', ')})`,
        before: truncate(previous.text),
        after: truncate(item.text),
      });
    }
  }

  for (const item of before.notes) {
    if (!afterNotes.has(item.id)) {
      changes.push({
        kind: 'note',
        action: 'removed',
        section: 'notes',
        label: item.type,
        summary: `Deleted ${item.type} note`,
        before: truncate(item.text),
        after: null,
      });
    }
  }

  return changes;
}
