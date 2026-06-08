import type { ReferenceImageInput } from '@/lib/reference-images';
import { buildPexelsSearchQuery } from '@/lib/pexels';

const UNSPLASH_SEARCH_URL = 'https://api.unsplash.com/search/photos';

type UnsplashPhoto = {
  urls?: {
    regular?: string;
    full?: string;
    raw?: string;
  };
};

type UnsplashSearchResponse = {
  results?: UnsplashPhoto[];
};

export function getUnsplashAccessKey(): string | undefined {
  return process.env.UNSPLASH_ACCESS_KEY?.trim() || undefined;
}

export async function searchUnsplashImage(
  input: ReferenceImageInput,
): Promise<string | null> {
  const accessKey = getUnsplashAccessKey();
  if (!accessKey) return null;

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
    const response = await fetch(`${UNSPLASH_SEARCH_URL}?${params.toString()}`, {
      headers: { Authorization: `Client-ID ${accessKey}` },
      next: { revalidate: 60 * 60 * 24 },
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as UnsplashSearchResponse;
    const photo = data.results?.[0];
    if (!photo?.urls) return null;

    return photo.urls.regular ?? photo.urls.full ?? photo.urls.raw ?? null;
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
