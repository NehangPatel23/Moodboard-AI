import {
  REFERENCE_IMAGE_SOURCE,
  REFERENCE_IMAGE_SOURCE_CUSTOM,
  REFERENCE_IMAGE_SOURCE_PEXELS,
  REFERENCE_IMAGE_SOURCE_UNSPLASH,
  REFERENCE_IMAGE_SOURCE_UPLOAD,
  isCustomReferenceImage,
  isInlineReferenceImage,
  isPexelsImageUrl,
  isUnsplashImageUrl,
  isUploadedReferenceImageUrl,
} from '@/lib/reference-images';

export function getReferenceSourceLabel(source?: string, imageUrl?: string): string {
  if (isPexelsImageUrl(imageUrl) || source === REFERENCE_IMAGE_SOURCE_PEXELS) {
    return 'Pexels photo';
  }

  if (isUnsplashImageUrl(imageUrl) && source === REFERENCE_IMAGE_SOURCE_UNSPLASH) {
    return 'Unsplash photo';
  }

  if (isUploadedReferenceImageUrl(imageUrl) || source === REFERENCE_IMAGE_SOURCE_UPLOAD) {
    return 'Uploaded photo';
  }

  if (isCustomReferenceImage(source)) {
    return 'Custom URL';
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

export function isUnsplashReference(source?: string, imageUrl?: string): boolean {
  return (
    (isUnsplashImageUrl(imageUrl) && source === REFERENCE_IMAGE_SOURCE_UNSPLASH) ||
    source === REFERENCE_IMAGE_SOURCE_UNSPLASH
  );
}
