import type { MetadataRoute } from 'next';
import { fetchPublicBoards } from '@/lib/public-boards';
import { absoluteUrl, getSiteUrl } from '@/lib/site-metadata';

const STATIC_ROUTES: Array<{ path: string; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']; priority: number }> = [
  { path: '/', changeFrequency: 'weekly', priority: 1 },
  { path: '/discover', changeFrequency: 'daily', priority: 0.9 },
  { path: '/templates', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/help', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/changelog', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/sign-in', changeFrequency: 'yearly', priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();
  const siteUrl = getSiteUrl();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  let shareEntries: MetadataRoute.Sitemap = [];

  try {
    const boards = await fetchPublicBoards();
    shareEntries = boards.map((board) => ({
      url: `${siteUrl}/share/${board.id}`,
      lastModified: board.updatedAt ? new Date(board.updatedAt) : lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));
  } catch {
    // Supabase may be unavailable during CI build — static routes still ship.
  }

  return [...staticEntries, ...shareEntries];
}
