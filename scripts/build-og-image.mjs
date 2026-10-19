/**
 * Imagen de previsualización al compartir (og:image / twitter:image).
 *
 *   node scripts/build-og-image.mjs
 *
 * Genera `public/img/og/crux.jpg` (1200×630, JPEG) a partir del banner de
 * portada y el logotipo. JPEG y no WebP: WhatsApp, Facebook, X y LinkedIn no
 * pintan de forma fiable un WebP como imagen de tarjeta.
 *
 * El resultado se versiona (como los JSON de la exégesis) para que el build, el
 * servidor de desarrollo y la QA vean siempre el mismo archivo.
 */
import { mkdir, stat } from 'node:fs/promises';
import path from 'node:path';

import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const SOURCE = path.join(ROOT, 'public/img/banners/herobanner1.webp');
const LOGO = path.join(ROOT, 'public/img/cruxlogoBlanco.png');
const OUT_DIR = path.join(ROOT, 'public/img/og');
const OUT = path.join(OUT_DIR, 'crux.jpg');

const WIDTH = 1200;
const HEIGHT = 630;

await mkdir(OUT_DIR, { recursive: true });

const base = sharp(SOURCE).resize(WIDTH, HEIGHT, { fit: 'cover', position: 'centre' });

const logo = await sharp(LOGO)
  .resize({ height: 84, fit: 'inside' })
  .png()
  .toBuffer();

// Banda inferior con degradado para que el logotipo se lea sobre la foto.
const band = Buffer.from(
  `<svg width="${WIDTH}" height="200" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#0a0a0b" stop-opacity="0" />
        <stop offset="1" stop-color="#0a0a0b" stop-opacity="0.82" />
      </linearGradient>
    </defs>
    <rect width="${WIDTH}" height="200" y="0" fill="url(#g)" />
  </svg>`
);

const { width: logoWidth = 0, height: logoHeight = 0 } = await sharp(logo).metadata();

await base
  .composite([
    { input: band, top: HEIGHT - 200, left: 0 },
    { input: logo, top: HEIGHT - 64 - logoHeight, left: 64 }
  ])
  .jpeg({ quality: 84, mozjpeg: true })
  .toFile(OUT);

const info = await stat(OUT);
console.log(
  `✓ ${path.relative(ROOT, OUT)} — ${WIDTH}×${HEIGHT} · ${(info.size / 1024).toFixed(1)} KB · logo ${logoWidth}×${logoHeight}`
);
