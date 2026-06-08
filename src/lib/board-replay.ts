import type { BoardActivityChange } from '@/types/board';

export const EDITOR_SECTION_ORDER = [
  'overview',
  'palette',
  'typography',
  'references',
  'notes',
] as const;

export type EditorSectionName = (typeof EDITOR_SECTION_ORDER)[number];

export function findChangeByLabel(
  changes: BoardActivityChange[],
  label: string,
): BoardActivityChange | undefined {
  return changes.find((change) => change.label === label);
}

export function getSectionChanges(
  changes: BoardActivityChange[],
  section: string,
): BoardActivityChange[] {
  return changes.filter((change) => change.section === section);
}

export function getHeaderChanges(changes: BoardActivityChange[]): BoardActivityChange[] {
  return changes.filter((change) => change.label === 'Title');
}

export function getSettingsChanges(changes: BoardActivityChange[]): BoardActivityChange[] {
  return getSectionChanges(changes, 'settings');
}

export function sectionHasReplayChanges(
  changes: BoardActivityChange[],
  section: EditorSectionName,
): boolean {
  if (getSectionChanges(changes, section).length > 0) return true;
  if (section === 'overview') {
    return (
      getSettingsChanges(changes).length > 0 ||
      getSectionChanges(changes, 'overview').length > 0 ||
      getHeaderChanges(changes).length > 0
    );
  }
  return false;
}

export function getReplaySectionIndices(changes: BoardActivityChange[]): number[] {
  return EDITOR_SECTION_ORDER.flatMap((section, index) =>
    sectionHasReplayChanges(changes, section) ? [index] : [],
  );
}

export function getReplayChangesForEditorSection(
  section: EditorSectionName,
  changes: BoardActivityChange[],
): BoardActivityChange[] {
  const sectionChanges = getSectionChanges(changes, section);
  if (section === 'overview') {
    return [...getSettingsChanges(changes), ...sectionChanges];
  }
  return sectionChanges;
}

export function getFirstReplaySectionIndex(changes: BoardActivityChange[]): number {
  const indices = getReplaySectionIndices(changes);
  return indices[0] ?? 0;
}

export function getReplayNavigationIndex(
  changes: BoardActivityChange[],
  activeSectionIndex: number,
): number {
  const replaySections = getReplaySectionIndices(changes);
  const directIndex = replaySections.indexOf(activeSectionIndex);
  if (directIndex >= 0) return directIndex;
  return snapToReplaySectionIndex(changes, activeSectionIndex);
}

export function snapToReplaySectionIndex(
  changes: BoardActivityChange[],
  activeSectionIndex: number,
): number {
  const replaySections = getReplaySectionIndices(changes);
  if (replaySections.length === 0) return 0;

  const directIndex = replaySections.indexOf(activeSectionIndex);
  if (directIndex >= 0) return directIndex;

  const nextIndex = replaySections.find((index) => index >= activeSectionIndex);
  if (nextIndex !== undefined) return nextIndex;

  return replaySections[replaySections.length - 1];
}

export function getPreviousReplaySectionIndex(
  changes: BoardActivityChange[],
  activeSectionIndex: number,
): number | null {
  const replaySections = getReplaySectionIndices(changes);
  const navIndex = getReplayNavigationIndex(changes, activeSectionIndex);
  if (navIndex <= 0) return null;
  return replaySections[navIndex - 1] ?? null;
}

export function getNextReplaySectionIndex(
  changes: BoardActivityChange[],
  activeSectionIndex: number,
): number | null {
  const replaySections = getReplaySectionIndices(changes);
  const navIndex = getReplayNavigationIndex(changes, activeSectionIndex);
  if (navIndex >= replaySections.length - 1) return null;
  return replaySections[navIndex + 1] ?? null;
}

export function getReplayStepLabel(
  changes: BoardActivityChange[],
  sectionIndex: number,
): string | null {
  const section = EDITOR_SECTION_ORDER[sectionIndex];
  if (!section || !sectionHasReplayChanges(changes, section)) return null;

  const sectionChanges = [
    ...getSectionChanges(changes, section),
    ...(section === 'overview' ? [...getHeaderChanges(changes), ...getSettingsChanges(changes)] : []),
  ];

  return `${sectionChanges.length} change${sectionChanges.length === 1 ? '' : 's'} in ${section}`;
}
