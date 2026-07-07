import { readdir, readFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const RESULTS = '/root/.claude/projects/-home-user-SRE/ac33192c-9233-5403-a10e-5ed660d55b6b/tool-results';
const OUT = '/home/user/SRE/src/assets/images';
const MAP = JSON.parse(await readFile('/tmp/claude-0/-home-user-SRE/ac33192c-9233-5403-a10e-5ed660d55b6b/scratchpad/photo-map.json', 'utf8'));

/** DJI drones write files where the main 4K JPEG stream lacks its SOI marker.
 *  Find the largest SOF, then the earliest DQT whose segment chain lands
 *  exactly on that SOF, and rebuild a valid JPEG from there. */
function extractMainJpeg(buf) {
  const sofs = [];
  for (let i = 0; i < buf.length - 10; i++) {
    if (buf[i] === 0xff && (buf[i + 1] === 0xc0 || buf[i + 1] === 0xc2)) {
      const h = buf.readUInt16BE(i + 5);
      const w = buf.readUInt16BE(i + 7);
      if (w > 100 && h > 100 && w < 20000 && h < 20000) sofs.push({ i, w, h });
    }
  }
  if (!sofs.length) return null;
  const main = sofs.reduce((a, b) => (a.w * a.h >= b.w * b.h ? a : b));
  const windowStart = Math.max(0, main.i - 20000);
  let dqt = buf.indexOf(Buffer.from([0xff, 0xdb]), windowStart);
  while (dqt !== -1 && dqt < main.i) {
    let j = dqt;
    while (j < main.i && buf[j] === 0xff && buf[j + 1] !== 0xd8 && buf[j + 1] !== 0xd9) {
      j += 2 + buf.readUInt16BE(j + 2);
    }
    if (j === main.i) {
      return Buffer.concat([Buffer.from([0xff, 0xd8]), buf.subarray(dqt)]);
    }
    dqt = buf.indexOf(Buffer.from([0xff, 0xdb]), dqt + 1);
  }
  return null;
}

for (const f of await readdir(RESULTS)) {
  if (!(f.startsWith('mcp-') && f.includes('download_file_content'))) continue;
  const p = path.join(RESULTS, f);
  try {
    const { title, content } = JSON.parse(await readFile(p, 'utf8'));
    const target = MAP[title];
    if (!target) { console.log('skip (unmapped):', title); await unlink(p); continue; }
    const raw = Buffer.from(content, 'base64');
    let best = null;
    for (const candidate of [raw, extractMainJpeg(raw)].filter(Boolean)) {
      try {
        const meta = await sharp(candidate).metadata();
        if (!best || meta.width * meta.height > best.pixels) {
          best = { buf: candidate, pixels: meta.width * meta.height, w: meta.width, h: meta.height };
        }
      } catch { /* try next candidate */ }
    }
    if (!best) throw new Error('no decodable JPEG stream');
    if (best.w < 1200 && best.h < 1200) throw new Error(`only small stream found (${best.w}x${best.h})`);
    const dest = path.join(OUT, target + '.jpg');
    const info = await sharp(best.buf, { failOn: 'none' })
      .rotate()
      .resize(2400, 2400, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80, mozjpeg: true })
      .toFile(dest);
    console.log(`${title} -> ${target}.jpg (${info.width}x${info.height}, ${Math.round(info.size / 1024)}KB)`);
    await unlink(p);
  } catch (err) {
    console.error(`FAILED ${f}: ${err.message}`);
  }
}
