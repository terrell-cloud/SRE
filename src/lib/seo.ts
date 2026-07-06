import { siteConfig } from '@data/siteConfig';

export interface SeoProps {
  title: string;
  description: string;
  /** Path beginning with /, used for canonical + OG url */
  path: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  noindex?: boolean;
}

export function canonicalUrl(path: string): string {
  const normalized = path.endsWith('/') || path.includes('.') ? path : `${path}/`;
  return new URL(normalized, siteConfig.domain).href;
}

/** Append the brand suffix unless the title already carries it. */
export function fullTitle(title: string): string {
  return title.includes(siteConfig.name) ? title : `${title} | ${siteConfig.name}`;
}
