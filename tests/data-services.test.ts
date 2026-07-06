import { describe, it, expect } from 'vitest';
// Importing these modules runs ServiceSchema.parse / FaqSchema.parse on every
// entry, so a successful import already proves the data passes validation.
import { services, getService } from '../src/data/services';
import { globalFaqs } from '../src/data/faqs';

describe('services data', () => {
  it('contains exactly 6 services', () => {
    expect(services.length).toBe(6);
  });

  it('has unique slugs', () => {
    const slugs = services.map((s) => s.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('has menuOrder 1..6 matching array order', () => {
    expect(services.map((s) => s.menuOrder)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('getService finds by slug and misses unknown slugs', () => {
    expect(getService('roof-repair')?.name).toBe('Roof Repair');
    expect(getService('not-a-service')).toBeUndefined();
  });
});

describe('global FAQs', () => {
  it('has 8-10 entries', () => {
    expect(globalFaqs.length).toBeGreaterThanOrEqual(8);
    expect(globalFaqs.length).toBeLessThanOrEqual(10);
  });
});
