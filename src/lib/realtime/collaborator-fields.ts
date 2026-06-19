export type CollaboratorCursor = {
  x: number;
  y: number;
};

export type FieldPresenceState = {
  userId: string;
  name: string;
  activeFieldId: string | null;
  cursor?: CollaboratorCursor | null;
  updatedAt: number;
};

export function buildFieldId(kind: 'note' | 'overview-title' | 'overview-summary', id?: string): string {
  if (kind === 'note' && id) return `note:${id}`;
  if (kind === 'overview-title') return 'overview-title';
  return 'overview-summary';
}

export function parseFieldId(fieldId: string): { kind: 'note' | 'overview-title' | 'overview-summary'; noteId?: string } {
  if (fieldId === 'overview-title') return { kind: 'overview-title' };
  if (fieldId === 'overview-summary') return { kind: 'overview-summary' };
  if (fieldId.startsWith('note:')) return { kind: 'note', noteId: fieldId.slice(5) };
  return { kind: 'overview-summary' };
}

export function fieldLabelFromId(fieldId: string): string {
  const parsed = parseFieldId(fieldId);
  if (parsed.kind === 'overview-title') return 'Board title';
  if (parsed.kind === 'overview-summary') return 'Creative summary';
  return 'Notes';
}

export const COLLABORATOR_COLORS = [
  '#6366f1',
  '#ec4899',
  '#14b8a6',
  '#f59e0b',
  '#8b5cf6',
  '#ef4444',
  '#06b6d4',
  '#84cc16',
] as const;

export function collaboratorColorForUser(userId: string): string {
  let hash = 0;
  for (let index = 0; index < userId.length; index += 1) {
    hash = (hash + userId.charCodeAt(index) * (index + 1)) % COLLABORATOR_COLORS.length;
  }
  return COLLABORATOR_COLORS[hash] ?? COLLABORATOR_COLORS[0];
}
