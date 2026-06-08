import {
  buildReferenceImageUrl,
  REFERENCE_IMAGE_SOURCE,
  REFERENCE_IMAGE_SOURCE_PEXELS,
  REFERENCE_IMAGE_SOURCE_UNSPLASH,
  type ReferenceImageInput,
} from '@/lib/reference-images';
import { getPexelsApiKey, searchPexelsImage } from '@/lib/pexels';
import { getUnsplashAccessKey, searchUnsplashImage } from '@/lib/unsplash';

export type ResolvedReferenceImage = {
  imageUrl: string;
  source: string;
  notice?: string;
};

export async function resolveReferenceImage(
  input: ReferenceImageInput,
): Promise<ResolvedReferenceImage> {
  const pexelsUrl = await searchPexelsImage(input);
  if (pexelsUrl) {
    return { imageUrl: pexelsUrl, source: REFERENCE_IMAGE_SOURCE_PEXELS };
  }

  const unsplashUrl = await searchUnsplashImage(input);
  if (unsplashUrl) {
    return { imageUrl: unsplashUrl, source: REFERENCE_IMAGE_SOURCE_UNSPLASH };
  }

  const hasPexels = Boolean(getPexelsApiKey());
  const hasUnsplash = Boolean(getUnsplashAccessKey());

  let notice = 'Set PEXELS_API_KEY or UNSPLASH_ACCESS_KEY for stock photos, or save the demo placeholder.';
  if (hasPexels || hasUnsplash) {
    notice = 'No matching stock photo found. Using demo placeholder instead.';
  }

  return {
    imageUrl: buildReferenceImageUrl(input),
    source: REFERENCE_IMAGE_SOURCE,
    notice,
  };
}
