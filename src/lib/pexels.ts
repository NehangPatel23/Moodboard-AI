import type { ReferenceImageInput } from '@/lib/reference-images';

const PEXELS_SEARCH_URL = 'https://api.pexels.com/v1/search';

type PexelsPhoto = {
  src?: {
    large2x?: string;
    large?: string;
    landscape?: string;
    medium?: string;
  };
};

type PexelsSearchResponse = {
  photos?: PexelsPhoto[];
};

export function buildPexelsSearchQuery(input: ReferenceImageInput): string {
  const parts = [
    input.title,
    input.category && input.category !== 'Visual' ? input.category : '',
    input.mood,
  ].filter(Boolean);

  return parts.join(' ').trim().slice(0, 100);
}

export function getPexelsApiKey(): string | undefined {
  return process.env.PEXELS_API_KEY?.trim() || undefined;
}

export async function searchPexelsImage(
  input: ReferenceImageInput,
): Promise<string | null> {
  const apiKey = getPexelsApiKey();
  if (!apiKey) return null;

  const query = buildPexelsSearchQuery(input);
  if (!query) return null;

  const page =
    typeof input.seed === 'number'
      ? (input.seed % 8) + 1
      : (hashString(String(input.seed ?? query)) % 8) + 1;

  const params = new URLSearchParams({
    query,
    per_page: '1',
    page: String(page),
    orientation: 'landscape',
  });

  try {
    const response = await fetch(`${PEXELS_SEARCH_URL}?${params.toString()}`, {
      headers: { Authorization: apiKey },
      next: { revalidate: 60 * 60 * 24 },
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as PexelsSearchResponse;
    const photo = data.photos?.[0];
    if (!photo?.src) return null;

    return (
      photo.src.large2x ??
      photo.src.large ??
      photo.src.landscape ??
      photo.src.medium ??
      null
    );
  } catch {
    return null;
  }
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}
