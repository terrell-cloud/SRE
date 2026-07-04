/**
 * Single source of truth for business identity + third-party embeds.
 * NAP values sourced from the company's BBB/Yelp listings — confirm with
 * Terrell before launch (marked in README handoff checklist).
 */

const env = import.meta.env;

export const siteConfig = {
  name: 'Southern Roofing & Exteriors',
  legalName: 'Southern Roofing and Exteriors, LLC',
  domain: 'https://southernroofingandexteriors.com',
  tagline: 'Northwest Georgia’s trusted roofing & exteriors team',

  phone: {
    display: '(678) 348-0273',
    e164: '+16783480273',
  },
  email: 'Contact@srande.com',

  address: {
    street: '1225 Coronet Dr, Unit 2',
    city: 'Dalton',
    state: 'GA',
    zip: '30720',
    geo: { lat: 34.7554, lng: -84.9394 },
  },

  hours: [
    { days: 'Monday – Saturday', opens: '09:00', closes: '21:00', display: '9:00 AM – 9:00 PM' },
    { days: 'Sunday', opens: null, closes: null, display: 'Closed' },
  ],

  social: {
    facebook: 'https://www.facebook.com/SouthernRoofingandexteriors/',
  },

  serviceRegion: 'Northwest Georgia & the Chattanooga area',

  /** A percentage of proceeds from every job is donated to a charity chosen by the homeowner. */
  givesBack: true,

  ghl: {
    calendarUrl: env.PUBLIC_GHL_CALENDAR_URL ?? '',
    chatSrc: env.PUBLIC_GHL_CHAT_SRC ?? '',
    chatWidgetId: env.PUBLIC_GHL_CHAT_WIDGET_ID ?? '',
    reviewsSrc: env.PUBLIC_GHL_REVIEWS_SRC ?? '',
  },
} as const;

export type SiteConfig = typeof siteConfig;
