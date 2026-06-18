import type { Board } from '@/types/board';

function normalizeText(value: string): string {
  return value.toLowerCase().trim();
}

export function moodToSlug(mood: string): string {
  return normalizeText(mood).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export function formatDiscoverMoodLabel(mood: string, maxLength = 28): string {
  const trimmed = mood.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength - 1).trimEnd()}…`;
}

export function extractDiscoverMoods(boards: Board[]): string[] {
  const moods = new Map<string, string>();

  for (const board of boards) {
    const mood = board.mood?.trim();
    if (!mood) continue;

    const slug = moodToSlug(mood);
    if (!slug || moods.has(slug)) continue;
    moods.set(slug, mood);
  }

  if (moods.size >= 2) {
    return [...moods.values()].sort((a, b) => a.localeCompare(b));
  }

  const tagCounts = new Map<string, number>();
  for (const board of boards) {
    for (const tag of board.tags) {
      const trimmed = tag.trim();
      if (trimmed) {
        tagCounts.set(trimmed, (tagCounts.get(trimmed) ?? 0) + 1);
      }
    }
  }

  return [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 8)
    .map(([tag]) => tag);
}

export function findMoodBySlug(boards: Board[], slug: string | null): string | null {
  if (!slug) return null;

  const normalizedSlug = normalizeText(slug);
  const moods = extractDiscoverMoods(boards);
  return moods.find((mood) => moodToSlug(mood) === normalizedSlug) ?? null;
}

export function boardMatchesMood(board: Board, mood: string | null): boolean {
  if (!mood) return true;

  const normalizedMood = normalizeText(mood);

  if (normalizeText(board.mood) === normalizedMood) {
    return true;
  }

  const relatedValues = [...board.tags, ...board.tone].map(normalizeText);
  return relatedValues.some(
    (value) => value === normalizedMood || value.includes(normalizedMood) || normalizedMood.includes(value),
  );
}
