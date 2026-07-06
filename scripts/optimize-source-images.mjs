/**
 * One-time ingest helper for photos coming out of the Google Drive
 * "pictures and video" folder: downscales to a sane source size before
 * committing (Astro generates the responsive/AVIF variants at build).
 *
 *   node scripts/optimize-source-images.mjs <input-dir> [output-dir]
 *
 * Writes JPEGs (max 2400px long edge, q80) to output-dir (defaults to
 * overwriting alongside input). Keeps the repo well under control:
 * ~60–100 photos ≈ 25–40 MB.
 */
import { readdir, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const [, , inputDir, outputDir = inputDir] = process.argv;
if (!inputDir) {
  console.error('usage: node scripts/optimize-source-images.mjs <input-dir> [output-dir]');
  process.exit(1);
}

const exts = new Set(['.jpg', '.jpeg', '.png', '.webp', '.heic', '.tiff']);
await mkdir(outputDir, { recursive: true });

const entries = await readdir(inputDir);
let done = 0;
for (const entry of entries) {
  if (!exts.has(path.extname(entry).toLowerCase())) continue;
  const src = path.join(inputDir, entry);
  const base = path.basename(entry, path.extname(entry)).toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const dest = path.join(outputDir, `${base}.jpg`);
  const before = (await stat(src)).size;
  await sharp(src)
    .rotate() // respect EXIF orientation
    .resize(2400, 2400, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80, mozjpeg: true })
    .toFile(dest === src ? `${dest}.tmp` : dest);
  const after = (await stat(dest === src ? `${dest}.tmp` : dest)).size;
  console.log(`${entry} → ${path.basename(dest)}  ${(before / 1e6).toFixed(1)}MB → ${(after / 1e6).toFixed(1)}MB`);
  done += 1;
}
console.log(`optimized ${done} images into ${outputDir}`);
