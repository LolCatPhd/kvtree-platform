// Single source of truth for site-wide SEO/business data. Used by the root
// metadata, sitemap, robots, and the LocalBusiness structured data.
//
// SITE_URL is the canonical production origin. Override per environment with
// NEXT_PUBLIC_SITE_URL (e.g. the Netlify deploy preview) — falls back to the
// live www domain, which is the canonical host we keep for SEO continuity.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://www.kvtree.co.za'
).replace(/\/$/, '');

export const BUSINESS = {
  name: 'KV Tree',
  legalName: 'KV Tree',
  description:
    'Certified, fully-insured tree felling, stump grinding, site clearing, pruning and 24/7 emergency tree care across Kempton Park and the greater East Rand.',
  phone: '+27 83 302 2877',
  phoneE164: '+27833022877',
  email: 'info@kvtree.co.za',
  streetAddress: 'Aston Manor',
  locality: 'Kempton Park',
  region: 'Gauteng',
  country: 'ZA',
  areasServed: [
    'Kempton Park',
    'Benoni',
    'Boksburg',
    'Edenvale',
    'Germiston',
    'Modderfontein',
  ],
} as const;

// Public, indexable routes. Admin/portal/login are intentionally excluded
// (they're gated and add no SEO value). Keep in sync with the sitemap.
export const PUBLIC_ROUTES = [
  { path: '/', priority: 1.0, changeFrequency: 'weekly' as const },
  { path: '/services', priority: 0.9, changeFrequency: 'monthly' as const },
  { path: '/about', priority: 0.7, changeFrequency: 'monthly' as const },
  { path: '/portfolio', priority: 0.7, changeFrequency: 'monthly' as const },
  { path: '/blog', priority: 0.6, changeFrequency: 'weekly' as const },
  { path: '/contact', priority: 0.8, changeFrequency: 'monthly' as const },
];

// schema.org LocalBusiness — helps Google show the business in local results
// and rich snippets. Rendered as JSON-LD in the root layout.
export function localBusinessJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${SITE_URL}/#business`,
    name: BUSINESS.name,
    description: BUSINESS.description,
    url: SITE_URL,
    telephone: BUSINESS.phoneE164,
    email: BUSINESS.email,
    image: `${SITE_URL}/opengraph-image`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: BUSINESS.streetAddress,
      addressLocality: BUSINESS.locality,
      addressRegion: BUSINESS.region,
      addressCountry: BUSINESS.country,
    },
    areaServed: BUSINESS.areasServed.map((name) => ({ '@type': 'City', name })),
    priceRange: 'R',
  };
}
