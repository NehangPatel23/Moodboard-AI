import type { Metadata } from 'next';

export const SITE_NAME = 'MoodBoard AI';

export const SITE_DESCRIPTION =
  'AI-assisted moodboard and creative direction workspace — palette, typography, references, and brand guidance in minutes.';

export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, '');
  }

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    return `https://${vercel.replace(/\/$/, '')}`;
  }

  return 'http://localhost:3000';
}

export function absoluteUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${getSiteUrl()}${normalized}`;
}

export const DEFAULT_OG_IMAGE_PATH = '/opengraph-image';

export function buildDefaultOpenGraph(): NonNullable<Metadata['openGraph']> {
  const url = getSiteUrl();
  const imageUrl = absoluteUrl(DEFAULT_OG_IMAGE_PATH);

  return {
    siteName: SITE_NAME,
    type: 'website',
    url,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [{ url: imageUrl, width: 1200, height: 630, alt: SITE_NAME }],
  };
}

export function buildDefaultTwitter(): NonNullable<Metadata['twitter']> {
  const imageUrl = absoluteUrl(DEFAULT_OG_IMAGE_PATH);

  return {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [imageUrl],
  };
}
