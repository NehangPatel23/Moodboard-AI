import type { Board, ReferenceItem } from '@/types/board';
import { createId } from '@/lib/utils';

export const BOARD_REFERENCE_COUNT = 6;

const LEGACY_UNSPLASH_HOST = 'images.unsplash.com';
const LEGACY_POLLINATIONS_HOST = 'image.pollinations.ai';
const PEXELS_HOST = 'images.pexels.com';

export const REFERENCE_IMAGE_SOURCE = 'Generated';
export const REFERENCE_IMAGE_SOURCE_PEXELS = 'Pexels';

export type ReferenceImageInput = {
  title: string;
  category?: string;
  mood?: string;
  prompt?: string;
  palette?: Array<{ hex: string; label?: string }>;
  seed?: string | number;
};

type BoardImageContext = {
  prompt?: string;
  mood?: string;
  palette?: Array<{ hex: string; label?: string }>;
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function normalizeHex(hex: string | undefined, fallback: string): string {
  const trimmed = hex?.trim() ?? '';
  return /^#[0-9a-fA-F]{6}$/.test(trimmed) ? trimmed : fallback;
}

export function isInlineReferenceImage(url?: string): boolean {
  return Boolean(url?.startsWith('data:image/'));
}

export function isPexelsImageUrl(url?: string): boolean {
  return Boolean(url?.includes(PEXELS_HOST));
}

export function isSupabaseStorageImageUrl(url?: string): boolean {
  return Boolean(url?.includes('/storage/v1/object/public/reference-images/'));
}

export function needsReferenceImageUpgrade(reference: {
  imageUrl?: string;
  source?: string;
}): boolean {
  const url = reference.imageUrl?.trim();
  if (!url) return true;
  if (isPexelsImageUrl(url)) return false;
  if (isSupabaseStorageImageUrl(url)) return false;
  if (url.includes(LEGACY_UNSPLASH_HOST)) return true;
  if (url.includes(LEGACY_POLLINATIONS_HOST)) return true;
  if (isInlineReferenceImage(url)) return true;
  if (reference.source?.toLowerCase() === 'unsplash') return true;
  if (reference.source === REFERENCE_IMAGE_SOURCE) return true;
  return false;
}

const REFERENCE_FILLERS: { title: string; category: string }[] = [
  { title: 'Hero composition', category: 'Campaign' },
  { title: 'Material texture study', category: 'Detail' },
  { title: 'Environmental context', category: 'Interior' },
  { title: 'Product focus frame', category: 'Product' },
  { title: 'Editorial lighting', category: 'Editorial' },
  { title: 'Lifestyle atmosphere', category: 'Portrait' },
];

export function padReferencesToCount(
  references: ReferenceItem[],
  board: BoardImageContext & { prompt: string },
): ReferenceItem[] {
  const capped = references.slice(0, BOARD_REFERENCE_COUNT);
  if (capped.length >= BOARD_REFERENCE_COUNT) {
    return capped;
  }

  const result = [...capped];
  const existingTitles = new Set(result.map((reference) => reference.title.toLowerCase()));

  for (const filler of REFERENCE_FILLERS) {
    if (result.length >= BOARD_REFERENCE_COUNT) break;
    if (existingTitles.has(filler.title.toLowerCase())) continue;

    const index = result.length;
    result.push({
      id: createId('ref'),
      title: filler.title,
      imageUrl: buildReferenceImageUrl({
        title: filler.title,
        category: filler.category,
        mood: board.mood,
        prompt: board.prompt,
        palette: board.palette,
        seed: `${board.prompt}-${filler.title}-${index}`,
      }),
      category: filler.category,
      source: REFERENCE_IMAGE_SOURCE,
    });
    existingTitles.add(filler.title.toLowerCase());
  }

  return result;
}

export function buildReferenceImageUrl(input: ReferenceImageInput): string {
  const colors = [
    normalizeHex(input.palette?.[0]?.hex, '#ebe6df'),
    normalizeHex(input.palette?.[1]?.hex, '#cfc6ba'),
    normalizeHex(input.palette?.[2]?.hex, '#8f8578'),
  ];

  const title = escapeXml((input.title || 'Reference').slice(0, 52));
  const category = escapeXml((input.category || 'Visual').slice(0, 24));
  const mood = escapeXml((input.mood || '').slice(0, 36));

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${colors[0]}"/>
      <stop offset="52%" stop-color="${colors[1]}"/>
      <stop offset="100%" stop-color="${colors[2]}"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="800" fill="url(#bg)"/>
  <rect x="72" y="72" width="1056" height="656" rx="36" fill="rgba(255,255,255,0.14)" stroke="rgba(255,255,255,0.28)" stroke-width="2"/>
  <text x="600" y="352" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="44" fill="rgba(18,18,18,0.62)">${title}</text>
  ${mood ? `<text x="600" y="412" text-anchor="middle" font-family="system-ui, sans-serif" font-size="22" fill="rgba(18,18,18,0.38)">${mood}</text>` : ''}
  <rect x="500" y="468" width="200" height="40" rx="20" fill="rgba(255,255,255,0.22)"/>
  <text x="600" y="495" text-anchor="middle" font-family="system-ui, sans-serif" font-size="13" letter-spacing="0.16em" fill="rgba(18,18,18,0.45)">${category.toUpperCase()}</text>
</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function sanitizeReferenceItem(
  reference: ReferenceItem,
  board: BoardImageContext,
  index = 0,
): ReferenceItem {
  if (!needsReferenceImageUpgrade(reference)) {
    return reference;
  }

  return {
    ...reference,
    imageUrl: buildReferenceImageUrl({
      title: reference.title,
      category: reference.category,
      mood: board.mood,
      prompt: board.prompt,
      palette: board.palette,
      seed: `${board.prompt ?? 'board'}-${reference.title}-${index}`,
    }),
    source: REFERENCE_IMAGE_SOURCE,
  };
}

export function sanitizeBoardReferences(board: Board): Board {
  const padded = padReferencesToCount(board.references, board);
  const references = padded.map((reference, index) =>
    sanitizeReferenceItem(reference, board, index),
  );

  const changed = references.some(
    (reference, index) =>
      reference.imageUrl !== board.references[index]?.imageUrl ||
      reference.source !== board.references[index]?.source,
  );

  if (!changed) {
    return board;
  }

  return { ...board, references };
}

export function resolveReferenceImageUrl(
  reference: { title: string; category: string; imageUrl?: string; source?: string },
  board?: BoardImageContext,
  index = 0,
): string {
  if (!needsReferenceImageUpgrade(reference)) {
    return reference.imageUrl!.trim();
  }

  return buildReferenceImageUrl({
    title: reference.title,
    category: reference.category,
    mood: board?.mood,
    prompt: board?.prompt,
    palette: board?.palette,
    seed: `${board?.prompt ?? 'board'}-${reference.title}-${index}`,
  });
}
