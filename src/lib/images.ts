import type { ImageMetadata } from 'astro';

/**
 * Registry over everything in src/assets/images/. Data files reference
 * images by extension-less key (e.g. "projects/roof-replacement-dalton-01")
 * so photos ingested later from Google Drive light up without code changes.
 */
const modules = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/images/**/*.{jpg,jpeg,png,webp,avif,svg}',
  { eager: true },
);

const registry = new Map<string, ImageMetadata>();
for (const [path, mod] of Object.entries(modules)) {
  const key = path
    .replace('/src/assets/images/', '')
    .replace(/\.(jpg|jpeg|png|webp|avif|svg)$/i, '');
  registry.set(key, mod.default);
}

export function findImage(key: string | null | undefined): ImageMetadata | undefined {
  return key ? registry.get(key) : undefined;
}

/** Exact match, else a branded placeholder ("placeholders/hero" | "placeholders/project" | "placeholders/team").
 *  For heroes, a real job-site photo at placeholders/hero-city wins over the illustration. */
export function imageOr(key: string | null | undefined, placeholder: 'hero' | 'project' | 'team'): ImageMetadata {
  const found = findImage(key);
  if (found) return found;
  const fallback =
    (placeholder === 'hero' && registry.get('placeholders/hero-city')) ||
    registry.get(`placeholders/${placeholder}`);
  if (!fallback) throw new Error(`Missing placeholder image: placeholders/${placeholder}`);
  return fallback;
}

/** All images under a directory prefix, sorted by filename — used by galleries. */
export function imagesUnder(prefix: string): { key: string; image: ImageMetadata }[] {
  return [...registry.entries()]
    .filter(([key]) => key.startsWith(`${prefix}/`))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, image]) => ({ key, image }));
}
