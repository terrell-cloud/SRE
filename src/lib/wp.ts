import { z } from 'zod';
import { WpPostSchema, type WpPost } from '@data/types';
import cache from '../content/wp-cache/posts.json';

const CacheSchema = z.object({
  fetchedAt: z.string(),
  source: z.string(),
  posts: z.array(WpPostSchema),
});

const parsed = CacheSchema.parse(cache);

export const posts: WpPost[] = [...parsed.posts].sort(
  (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
);

export const isFixture = parsed.source === 'fixture';

export function getPost(slug: string): WpPost | undefined {
  return posts.find((p) => p.slug === slug);
}

export function formatPostDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}
