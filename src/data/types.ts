import { z } from 'zod';

/**
 * Contracts for every data file in src/data/. Each data module parses its
 * raw content through these schemas at import time, so a bad entry fails
 * the build loudly instead of shipping a broken page.
 */

export const FaqSchema = z.object({
  q: z.string().min(8),
  a: z.string().min(20),
});
export type Faq = z.infer<typeof FaqSchema>;

export const ServiceSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  /** Short label for nav / cards, e.g. "Roof Repair" */
  shortName: z.string(),
  menuOrder: z.number().int(),
  audience: z.enum(['residential', 'commercial', 'both']),
  /** Key into the image registry, e.g. "services/roof-repair" (extension-less) */
  heroImage: z.string(),
  /** Icon id rendered by ServiceIcon.astro */
  icon: z.enum(['roof', 'building', 'hammer', 'siding', 'window', 'gutter']),
  metaDescription: z.string().min(70).max(165),
  /** One-liner used on cards and hubs */
  summary: z.string().min(40).max(220),
  /** Body paragraphs for the service page */
  intro: z.array(z.string().min(60)).min(2),
  /** "What's included / what we handle" bullets */
  features: z.array(z.object({ title: z.string(), body: z.string().min(30) })).min(3),
  /** Our process, numbered */
  process: z.array(z.object({ title: z.string(), body: z.string().min(30) })).min(3),
  faqs: z.array(FaqSchema).min(2),
  /** schema.org Service.serviceType value */
  schemaServiceType: z.string(),
});
export type Service = z.infer<typeof ServiceSchema>;

export const CitySchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+-(ga|tn)$/),
  name: z.string(),
  state: z.enum(['GA', 'TN']),
  county: z.string(),
  geo: z.object({ lat: z.number(), lng: z.number() }),
  /** Approx. driving distance from the Dalton shop, for "minutes away" copy */
  distanceMiles: z.number().int().nonnegative(),
  metaDescription: z.string().min(70).max(165),
  /** 2–3 genuinely city-specific paragraphs — the doorway-page defense */
  intro: z.array(z.string().min(80)).min(2),
  localFacts: z.object({
    /** Only well-known, real areas/landmarks — never invented names */
    landmarks: z.array(z.string()).min(1),
    weatherRisks: z.array(z.string()).min(1),
    housingStock: z.string().min(40),
  }),
});
export type City = z.infer<typeof CitySchema>;

export const CityServiceSchema = z.object({
  citySlug: z.string(),
  serviceSlug: z.string(),
  metaDescription: z.string().min(70).max(165),
  /** Unique local intro, ≥150 words across paragraphs — combos without one don't build */
  intro: z.array(z.string().min(80)).min(2),
});
export type CityService = z.infer<typeof CityServiceSchema>;

export const TeamMemberSchema = z.object({
  slug: z.string(),
  name: z.string(),
  role: z.string(),
  bio: z.string().min(40),
  certifications: z.array(z.string()).default([]),
  /** Image registry key, e.g. "team/first-last" — null until Drive photos land */
  photo: z.string().nullable(),
  /** True until replaced with a real person from the Drive folder */
  isPlaceholder: z.boolean().default(false),
});
export type TeamMember = z.infer<typeof TeamMemberSchema>;

export const ReviewSchema = z.object({
  id: z.string(),
  author: z.string(),
  rating: z.number().int().min(1).max(5),
  text: z.string().min(30),
  source: z.enum(['Google', 'Facebook', 'BBB']),
  date: z.string().regex(/^\d{4}-\d{2}(-\d{2})?$/),
  citySlug: z.string().optional(),
  serviceSlug: z.string().optional(),
  /** MUST be replaced with the customer's real exported reviews before launch */
  isPlaceholder: z.boolean().default(false),
});
export type Review = z.infer<typeof ReviewSchema>;

export const WpPostSchema = z.object({
  slug: z.string(),
  title: z.string(),
  excerpt: z.string(),
  contentHtml: z.string(),
  date: z.string(),
  modified: z.string(),
  featuredImage: z
    .object({ url: z.string(), alt: z.string(), width: z.number().optional(), height: z.number().optional() })
    .nullable(),
  categories: z.array(z.string()).default([]),
});
export type WpPost = z.infer<typeof WpPostSchema>;
