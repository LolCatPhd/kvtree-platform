import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

// Allow crawling of public pages; keep the gated app areas out of the index.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/portal', '/login'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
