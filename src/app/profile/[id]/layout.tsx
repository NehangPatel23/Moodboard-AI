import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { fetchPublicProfile, isValidProfileId } from '@/lib/public-profile';
import {
  SITE_NAME,
  absoluteUrl,
  buildDefaultOpenGraph,
  buildDefaultTwitter,
} from '@/lib/site-metadata';

type ProfileLayoutProps = {
  children: ReactNode;
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: ProfileLayoutProps): Promise<Metadata> {
  const { id } = await params;

  if (!isValidProfileId(id)) {
    return {
      title: `Profile | ${SITE_NAME}`,
      description: 'Creator profile on MoodBoard AI.',
    };
  }

  const result = await fetchPublicProfile(id);

  if (!result) {
    return {
      title: `Profile not found | ${SITE_NAME}`,
      description: 'This creator profile is unavailable.',
    };
  }

  const { profile, boards } = result;
  const title = `${profile.name} | ${SITE_NAME}`;
  const description =
    profile.workspaceTagline?.trim() ||
    `${profile.name} shares ${boards.length} public moodboard${boards.length === 1 ? '' : 's'} on Discover.`;

  const coverImage = boards.find((board) =>
    board.references.some((reference) => reference.imageUrl),
  )?.references.find((reference) => reference.imageUrl)?.imageUrl;

  const openGraph = {
    ...buildDefaultOpenGraph(),
    title: profile.name,
    description,
    url: absoluteUrl(`/profile/${id}`),
    ...(coverImage ? { images: [{ url: coverImage, alt: `${profile.name} on ${SITE_NAME}` }] } : {}),
  };

  const twitter = {
    ...buildDefaultTwitter(),
    title: profile.name,
    description,
    ...(coverImage ? { images: [coverImage], card: 'summary_large_image' as const } : {}),
  };

  return {
    title,
    description,
    openGraph,
    twitter,
  };
}

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return children;
}
