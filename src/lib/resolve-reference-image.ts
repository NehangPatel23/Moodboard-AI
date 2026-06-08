import {
  buildReferenceImageUrl,
  REFERENCE_IMAGE_SOURCE,
  REFERENCE_IMAGE_SOURCE_PEXELS,
  type ReferenceImageInput,
} from '@/lib/reference-images';
import { getPexelsApiKey, searchPexelsImage } from '@/lib/pexels';

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

  return {
    imageUrl: buildReferenceImageUrl(input),
    source: REFERENCE_IMAGE_SOURCE,
    notice: getPexelsApiKey()
      ? 'No matching Pexels photo found. Using demo placeholder instead.'
      : 'Set PEXELS_API_KEY for stock photos, or save the demo placeholder.',
  };
}
