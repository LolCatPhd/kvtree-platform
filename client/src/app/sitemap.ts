import type { MetadataRoute } from 'next';
import { SITE_URL, PUBLIC_ROUTES } from '@/lib/site';

// Generates /sitemap.xml from the canonical list of public routes. Submit this
// URL in Google Search Console after the domain cutover.
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return PUBLIC_ROUTES.map((r) => ({
    url: `${SITE_URL}${r.path === '/' ? '' : r.path}`,
    lastModified,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
