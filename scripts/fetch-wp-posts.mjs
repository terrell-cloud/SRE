/**
 * Prebuild step: pull posts from the WordPress REST API (where Openclaw
 * publishes weekly) into src/content/wp-cache/posts.json and mirror the
 * featured images locally so Astro can optimize them.
 *
 * Resilient by design: any network failure logs a warning and leaves the
 * committed cache in place — the build NEVER fails because WordPress is
 * unreachable (this dev environment has no route to it at all).
 */
import { writeFile, mkdir, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

const WP_API_BASE = (process.env.WP_API_BASE ?? 'https://southernroofingandexteriors.com').replace(/\/$/, '');
const CACHE_DIR = new URL('../src/content/wp-cache/', import.meta.url).pathname;
const IMAGES_DIR = path.join(CACHE_DIR, 'images');
const CACHE_FILE = path.join(CACHE_DIR, 'posts.json');
const TIMEOUT_MS = 10_000;

function decodeEntities(s) {
  return s
    .replaceAll('&amp;', '&')
    .replaceAll('&#038;', '&')
    .replaceAll('&#8217;', '’')
    .replaceAll('&#8216;', '‘')
    .replaceAll('&#8220;', '“')
    .replaceAll('&#8221;', '”')
    .replaceAll('&hellip;', '…')
    .replaceAll('&nbsp;', ' ');
}

async function fetchJson(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return { data: await res.json(), totalPages: Number(res.headers.get('x-wp-totalpages') ?? '1') };
}

async function fetchAllPosts() {
  const posts = [];
  let page = 1;
  let totalPages = 1;
  do {
    const url = `${WP_API_BASE}/wp-json/wp/v2/posts?per_page=100&page=${page}&_embed=1&status=publish`;
    const { data, totalPages: tp } = await fetchJson(url);
    totalPages = tp;
    posts.push(...data);
    page += 1;
  } while (page <= totalPages);
  return posts;
}

async function mirrorImage(url) {
  const ext = (path.extname(new URL(url).pathname) || '.jpg').toLowerCase();
  const name = createHash('sha1').update(url).digest('hex').slice(0, 16) + ext;
  const dest = path.join(IMAGES_DIR, name);
  try {
    await access(dest);
  } catch {
    const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) throw new Error(`image ${res.status} for ${url}`);
    await writeFile(dest, Buffer.from(await res.arrayBuffer()));
  }
  return `images/${name}`;
}

function normalizeContent(html) {
  return html
    // internal links: keep readers on the new site
    .replaceAll(/https?:\/\/(?:www\.|wp\.)?southernroofingandexteriors\.com\/(?!wp-content)/g, '/')
    .replaceAll('<img ', '<img loading="lazy" decoding="async" ');
}

async function main() {
  await mkdir(IMAGES_DIR, { recursive: true });
  let rawPosts;
  try {
    rawPosts = await fetchAllPosts();
  } catch (err) {
    console.warn(`[fetch-wp-posts] WP unreachable (${err.message}) — keeping committed cache.`);
    return;
  }

  const posts = [];
  for (const p of rawPosts) {
    const media = p._embedded?.['wp:featuredmedia']?.[0];
    let featuredImage = null;
    if (media?.source_url) {
      try {
        featuredImage = {
          url: await mirrorImage(media.source_url),
          alt: media.alt_text || decodeEntities(p.title?.rendered ?? ''),
          width: media.media_details?.width,
          height: media.media_details?.height,
        };
      } catch (err) {
        console.warn(`[fetch-wp-posts] featured image failed for ${p.slug}: ${err.message}`);
      }
    }
    posts.push({
      slug: p.slug,
      title: decodeEntities(p.title?.rendered ?? ''),
      excerpt: decodeEntities((p.excerpt?.rendered ?? '').replace(/<[^>]+>/g, '').trim()),
      contentHtml: normalizeContent(p.content?.rendered ?? ''),
      date: p.date,
      modified: p.modified,
      featuredImage,
      categories: (p._embedded?.['wp:term']?.[0] ?? []).map((t) => t.name),
    });
  }

  await writeFile(CACHE_FILE, JSON.stringify({ fetchedAt: new Date().toISOString(), source: WP_API_BASE, posts }, null, 2));
  console.log(`[fetch-wp-posts] cached ${posts.length} posts from ${WP_API_BASE}`);
}

main();
