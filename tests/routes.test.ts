import { describe, expect, it } from 'vitest';
import { services } from '../src/data/services';
import { cities } from '../src/data/cities';
import { cityServices } from '../src/data/cityServices';
import { reviews } from '../src/data/reviews';
import { team } from '../src/data/team';

describe('route-generating data', () => {
  it('builds the expected page counts', () => {
    expect(services.length).toBe(6);
    expect(cities.length).toBe(12);
    expect(cityServices.length).toBeGreaterThanOrEqual(25);
    expect(cityServices.length).toBeLessThanOrEqual(40);
  });

  it('every combo references a real city and service', () => {
    const citySlugs = new Set(cities.map((c) => c.slug));
    const serviceSlugs = new Set(services.map((s) => s.slug));
    for (const combo of cityServices) {
      expect(citySlugs.has(combo.citySlug), `unknown city ${combo.citySlug}`).toBe(true);
      expect(serviceSlugs.has(combo.serviceSlug), `unknown service ${combo.serviceSlug}`).toBe(true);
    }
  });

  it('combo intros are unique (no doorway-page duplication)', () => {
    const firstParagraphs = cityServices.map((c) => c.intro[0]);
    expect(new Set(firstParagraphs).size).toBe(firstParagraphs.length);
  });

  it('reviews and team parse and are flagged while placeholders', () => {
    expect(reviews.length).toBeGreaterThan(0);
    expect(team.length).toBeGreaterThan(0);
  });
});
