import { siteConfig } from '@data/siteConfig';
import { aggregateRating, reviews } from '@data/reviews';
import type { City, Faq, Review, Service, WpPost } from '@data/types';

const BUSINESS_ID = `${siteConfig.domain}/#business`;

type JsonLd = Record<string, unknown>;

export function businessSchema(cityNames: string[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'RoofingContractor',
    '@id': BUSINESS_ID,
    name: siteConfig.name,
    legalName: siteConfig.legalName,
    url: siteConfig.domain,
    telephone: siteConfig.phone.e164,
    email: siteConfig.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: siteConfig.address.street,
      addressLocality: siteConfig.address.city,
      addressRegion: siteConfig.address.state,
      postalCode: siteConfig.address.zip,
      addressCountry: 'US',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: siteConfig.address.geo.lat,
      longitude: siteConfig.address.geo.lng,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        opens: '09:00',
        closes: '21:00',
      },
    ],
    areaServed: cityNames.map((name) => ({ '@type': 'City', name })),
    sameAs: Object.values(siteConfig.social),
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: aggregateRating.ratingValue,
      reviewCount: aggregateRating.reviewCount,
    },
  };
}

export function serviceSchema(service: Service, opts?: { city?: City }): JsonLd {
  const areaServed = opts?.city
    ? [{ '@type': 'City', name: `${opts.city.name}, ${opts.city.state}` }]
    : [{ '@type': 'AdministrativeArea', name: siteConfig.serviceRegion }];
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: service.schemaServiceType,
    name: opts?.city ? `${service.name} in ${opts.city.name}, ${opts.city.state}` : service.name,
    provider: { '@id': BUSINESS_ID },
    areaServed,
  };
}

export function faqSchema(faqs: Faq[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

export function reviewsSchema(items: Review[] = reviews): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'RoofingContractor',
    '@id': BUSINESS_ID,
    name: siteConfig.name,
    review: items.map((r) => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: r.author },
      reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5 },
      reviewBody: r.text,
      datePublished: r.date,
    })),
  };
}

export function blogPostSchema(post: WpPost, path: string): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    datePublished: post.date,
    dateModified: post.modified,
    url: new URL(path, siteConfig.domain).href,
    author: { '@type': 'Organization', name: siteConfig.name },
    publisher: { '@id': BUSINESS_ID },
  };
}

export function breadcrumbSchema(crumbs: { name: string; path: string }[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: new URL(c.path, siteConfig.domain).href,
    })),
  };
}
