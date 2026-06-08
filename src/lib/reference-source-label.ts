import {
  REFERENCE_IMAGE_SOURCE,
  REFERENCE_IMAGE_SOURCE_PEXELS,
  isInlineReferenceImage,
  isPexelsImageUrl,
} from '@/lib/reference-images';

export function getReferenceSourceLabel(source?: string, imageUrl?: string): string {
  if (isPexelsImageUrl(imageUrl) || source === REFERENCE_IMAGE_SOURCE_PEXELS) {
    return 'Pexels photo';
  }

  if (
    isInlineReferenceImage(imageUrl) ||
    source === REFERENCE_IMAGE_SOURCE ||
    source?.toLowerCase() === 'generated'
  ) {
    return 'Demo placeholder';
  }

  return source?.trim() || 'Unknown source';
}

export function isPexelsReference(source?: string, imageUrl?: string): boolean {
  return isPexelsImageUrl(imageUrl) || source === REFERENCE_IMAGE_SOURCE_PEXELS;
}
