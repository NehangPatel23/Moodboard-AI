import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site-metadata';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/discover', '/templates', '/help', '/changelog', '/about', '/share/'],
        disallow: ['/app', '/settings', '/api/', '/invite/'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
