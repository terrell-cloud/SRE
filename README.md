# Southern Roofing & Exteriors — Website

High-converting marketing site for **Southern Roofing and Exteriors, LLC** (Dalton, GA).
Built with [Astro 5](https://astro.build) + Tailwind 4, statically generated, with the
existing WordPress kept alive as a headless blog backend (Openclaw publishes weekly posts
there; this site pulls them at build time).

## Commands

```bash
npm install        # once
npm run dev        # local dev server
npm run build      # prebuild (WP fetch + redirects) + static build to dist/
npm run preview    # serve the built site
npm test           # data validation + route-count tests
```

The build works fully offline: if WordPress is unreachable, the committed cache at
`src/content/wp-cache/posts.json` is used and the build continues.

## How the site is wired

| Thing | Where |
| --- | --- |
| Business identity (NAP, phone, hours, GHL embeds) | `src/data/siteConfig.ts` + env vars |
| Services (6) | `src/data/services.ts` |
| Cities (12) + local facts | `src/data/cities.ts` |
| City×service SEO pages (curated ~36) | `src/data/cityServices.ts` |
| Team roster | `src/data/team.ts` |
| Reviews | `src/data/reviews.json` |
| FAQs | `src/data/faqs.ts` |
| Blog cache (from WordPress) | `src/content/wp-cache/posts.json` |
| Photos | `src/assets/images/{hero,team,projects,services,cities}/` |
| WP → new-site 301s | `redirects/wp-redirects.csv` → generated `vercel.json` |

Every data file validates through zod schemas (`src/data/types.ts`) at build time — a bad
entry fails the build with a clear error instead of shipping a broken page.

**Adding a city** = one entry in `cities.ts` (+ optional rows in `cityServices.ts`).
Pages, sitemap, footer links, and schema all derive automatically. Same idea for
services, team members, reviews, and FAQs.

## Launch checklist (in order)

1. **Photos (no stock!).** Ingest real photos from the Google Drive "pictures and video"
   folder into `src/assets/images/`:
   - `team/first-last.jpg` — set each member's `photo` key in `team.ts`
   - `projects/service-city-st-01.jpg` — gallery picks these up automatically; the
     filename becomes the alt text, so make it descriptive
   - `hero/home.jpg`, `services/<slug>.jpg`, `cities/<slug>.jpg` — hero backgrounds
   - Downscale before committing: `node scripts/optimize-source-images.mjs <dir>`
     (max 2400px, ~80% quality JPEG)
2. **Logo + brand colors.** Drop the real logo at `src/assets/images/brand/`, swap the
   text-mark in `src/components/Logo.astro` for it, and update the three `--color-brand-*`
   / `--color-cta-*` hues in `src/styles/global.css` to match.
3. **GoHighLevel embeds.** Copy `.env.example` → host env vars and fill in:
   `PUBLIC_GHL_CALENDAR_URL` (booking calendar), `PUBLIC_GHL_CHAT_SRC` +
   `PUBLIC_GHL_CHAT_WIDGET_ID` (chat widget), `PUBLIC_GHL_REVIEWS_SRC` (reviews widget).
   Until these are set, every CTA falls back to click-to-call — nothing breaks.
4. **Real reviews.** Replace the placeholder entries in `src/data/reviews.json` with real
   exported Google/Facebook reviews (`isPlaceholder: false`). The placeholders are marked
   in the text and MUST NOT ship.
5. **Team.** Replace the placeholder roster in `src/data/team.ts` with real names, roles,
   bios, and photo keys.
6. **Confirm NAP.** Phone/address/hours in `siteConfig.ts` came from BBB/Yelp listings —
   verify, and add the license number to the footer if desired.
7. **Privacy policy.** Replace the placeholder text in `src/pages/privacy-policy.astro`.

## WordPress migration (do BEFORE pointing the domain here)

1. Move WordPress to `wp.southernroofingandexteriors.com` (update `WP_HOME`/`WP_SITEURL`).
2. Point Openclaw at the subdomain so weekly posts keep publishing.
3. Set `WP_API_BASE=https://wp.southernroofingandexteriors.com` in the host env.
4. Noindex the subdomain (`X-Robots-Tag: noindex` or a plugin) to avoid duplicate content.
5. Complete `redirects/wp-redirects.csv` from the old WP sitemap, then deploy.
6. Point the apex DNS at the new deploy (Vercel/Netlify).

## Deploys

Recommended: Vercel (the generated `vercel.json` carries redirects + headers).
Create a **Deploy Hook** and save it as the `DEPLOY_HOOK_URL` GitHub secret — the
`.github/workflows/daily-rebuild.yml` cron pings it every morning (~6 AM ET) so new
Openclaw posts appear on `/blog/` automatically. Netlify works too: use a Build Hook and
convert the redirects to `public/_redirects` (see `scripts/generate-redirects.mjs`).
