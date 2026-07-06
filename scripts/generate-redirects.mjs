/**
 * Prebuild step: emit vercel.json with 301 redirects sourced from
 * redirects/wp-redirects.csv (old WordPress URL → new URL). Netlify users:
 * point this at public/_redirects instead — format is `old new 301` per line.
 */
import { readFile, writeFile } from 'node:fs/promises';

const csvPath = new URL('../redirects/wp-redirects.csv', import.meta.url);
const outPath = new URL('../vercel.json', import.meta.url);

const csv = await readFile(csvPath, 'utf8');
const redirects = csv
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith('#') && !line.startsWith('old_path'))
  .map((line) => {
    const [source, destination] = line.split(',').map((s) => s.trim());
    return { source, destination, permanent: true };
  })
  // Vercel treats /path and /path/ as the same source; drop duplicates.
  .filter((r, i, all) => all.findIndex((o) => o.source.replace(/\/$/, '') === r.source.replace(/\/$/, '')) === i);

const config = {
  $schema: 'https://openapi.vercel.sh/vercel.json',
  cleanUrls: false,
  trailingSlash: true,
  redirects,
  headers: [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      ],
    },
  ],
};

await writeFile(outPath, JSON.stringify(config, null, 2) + '\n');
console.log(`[generate-redirects] wrote vercel.json with ${redirects.length} redirects`);
