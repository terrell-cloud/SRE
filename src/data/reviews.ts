import { ReviewSchema, type Review } from './types';
import raw from './reviews.json';

export const reviews: Review[] = raw.reviews.map((r) => ReviewSchema.parse(r));

if (reviews.some((r) => r.isPlaceholder)) {
  console.warn('[data/reviews] Placeholder reviews present — replace with real exported reviews before launch (see README handoff checklist).');
}

export const aggregateRating = {
  ratingValue: Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(2)),
  reviewCount: reviews.length,
};

export function reviewsFor(opts: { citySlug?: string; serviceSlug?: string; limit?: number }): Review[] {
  const { citySlug, serviceSlug, limit } = opts;
  // Prefer matching city/service, then backfill with the rest so sections are never empty.
  const scored = [...reviews].sort((a, b) => score(b) - score(a));
  function score(r: Review): number {
    let s = 0;
    if (citySlug && r.citySlug === citySlug) s += 2;
    if (serviceSlug && r.serviceSlug === serviceSlug) s += 1;
    return s;
  }
  return limit ? scored.slice(0, limit) : scored;
}
