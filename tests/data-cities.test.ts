import { describe, expect, it } from 'vitest';
import { cities, getCity } from '../src/data/cities';
import { cityServices, getCityService, getCityServices } from '../src/data/cityServices';

const KNOWN_SERVICE_SLUGS = [
  'residential-roofing',
  'commercial-roofing',
  'roof-repair',
  'siding',
  'windows',
  'gutters',
] as const;

describe('cities data', () => {
  it('contains exactly 12 cities', () => {
    expect(cities.length).toBe(12);
  });

  it('has unique city slugs', () => {
    const slugs = cities.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('every slug matches the ga/tn pattern and state matches the suffix', () => {
    for (const city of cities) {
      expect(city.slug).toMatch(/^[a-z0-9-]+-(ga|tn)$/);
      const suffix = city.slug.endsWith('-tn') ? 'TN' : 'GA';
      expect(city.state).toBe(suffix);
    }
  });

  it('getCity finds cities by slug and returns undefined for unknowns', () => {
    expect(getCity('dalton-ga')?.name).toBe('Dalton');
    expect(getCity('chattanooga-tn')?.county).toBe('Hamilton');
    expect(getCity('nowhere-al')).toBeUndefined();
  });

  it('Dalton is home base at 0 miles', () => {
    expect(getCity('dalton-ga')?.distanceMiles).toBe(0);
  });
});

describe('cityServices data', () => {
  it('contains exactly 36 combos', () => {
    expect(cityServices.length).toBe(36);
  });

  it('every combo references an existing city', () => {
    const citySlugs = new Set(cities.map((c) => c.slug));
    for (const combo of cityServices) {
      expect(citySlugs.has(combo.citySlug), `unknown citySlug: ${combo.citySlug}`).toBe(true);
    }
  });

  it('every combo uses one of the 6 known service slugs', () => {
    for (const combo of cityServices) {
      expect(
        (KNOWN_SERVICE_SLUGS as readonly string[]).includes(combo.serviceSlug),
        `unknown serviceSlug: ${combo.serviceSlug}`,
      ).toBe(true);
    }
  });

  it('all (city, service) pairs are unique', () => {
    const keys = cityServices.map((cs) => `${cs.citySlug}::${cs.serviceSlug}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('core services cover all 12 cities', () => {
    for (const service of ['residential-roofing', 'roof-repair']) {
      const covered = new Set(
        cityServices.filter((cs) => cs.serviceSlug === service).map((cs) => cs.citySlug),
      );
      expect(covered.size, `${service} should cover all 12 cities`).toBe(12);
    }
  });

  it('every combo intro totals at least 150 words', () => {
    for (const combo of cityServices) {
      const words = combo.intro.join(' ').split(/\s+/).filter(Boolean).length;
      expect(
        words,
        `${combo.citySlug}/${combo.serviceSlug} intro has only ${words} words`,
      ).toBeGreaterThanOrEqual(150);
    }
  });

  it('no sentence is recycled between combos', () => {
    const seen = new Map<string, string>();
    for (const combo of cityServices) {
      const key = `${combo.citySlug}/${combo.serviceSlug}`;
      const sentences = combo.intro
        .join(' ')
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim().toLowerCase())
        .filter((s) => s.length > 25);
      for (const sentence of sentences) {
        const owner = seen.get(sentence);
        expect(
          owner === undefined || owner === key,
          `sentence reused in ${key} (first seen in ${owner}): "${sentence}"`,
        ).toBe(true);
        seen.set(sentence, key);
      }
    }
  });

  it('getCityServices returns all combos for a city', () => {
    const dalton = getCityServices('dalton-ga');
    expect(dalton.map((cs) => cs.serviceSlug).sort()).toEqual(
      ['commercial-roofing', 'gutters', 'residential-roofing', 'roof-repair', 'siding', 'windows'].sort(),
    );
    expect(getCityServices('nowhere-al')).toEqual([]);
  });

  it('getCityService looks up a single combo', () => {
    expect(getCityService('ellijay-ga', 'residential-roofing')).toBeDefined();
    expect(getCityService('ellijay-ga', 'commercial-roofing')).toBeUndefined();
  });
});
