import { readdirSync, statSync, existsSync, mkdirSync } from 'node:fs';
import { join, relative, dirname, extname } from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const IMG = join(ROOT, 'src', 'assets', 'imgs');
const OUT = join(ROOT, 'public', 'img');

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp']);

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (IMAGE_EXT.has(extname(name).toLowerCase())) out.push(full);
  }
  return out;
}

async function convert(src, dest, width, quality = 78) {
  if (existsSync(dest) && statSync(dest).mtimeMs >= statSync(src).mtimeMs) return 0;
  mkdirSync(dirname(dest), { recursive: true });
  const info = await sharp(src).resize({ width, withoutEnlargement: true }).webp({ quality }).toFile(dest);
  return info.size;
}

const jobs = [];

// Personajes → public/img/personajes/<Rel>/<Archivo>.webp
const pjRoot = join(IMG, 'Personajes');
for (const src of walk(pjRoot)) {
  const rel = relative(pjRoot, src).replace(/\\/g, '/').replace(/\.(jpe?g|png)$/i, '.webp');
  jobs.push([src, join(OUT, 'personajes', rel), 1100, 70]);
}

// Banners → public/img/banners/<name>.webp
const bannerSources = [
  [join(IMG, 'HeroBanner1.jpg'), join(OUT, 'banners', 'herobanner1.webp')],
  [join(IMG, 'HeroBanner2Patristica.jpg'), join(OUT, 'banners', 'herobanner2-patristica.webp')],
  [join(IMG, 'HeroBanner3Reforma.jpg'), join(OUT, 'banners', 'herobanner3-reforma.webp')],
];
for (const [src, dest] of bannerSources) jobs.push([src, dest, 1600, 72]);

// Portada Biblia Patrística (fuente local; se puede indicar con PORTADA_BIBLIA)
const portadaBiblia = process.env.PORTADA_BIBLIA || 'D:/Biblia/PortadaBibliaPatristica.png';
if (existsSync(portadaBiblia)) {
  jobs.push([portadaBiblia, join(OUT, 'biblia', 'portada.webp'), 1400, 80]);
}

let converted = 0;
let bytes = 0;
for (const [src, dest, width, quality] of jobs) {
  if (!existsSync(src)) {
    console.log('SKIP (no existe):', src);
    continue;
  }
  try {
    const size = await convert(src, dest, width, quality);
    if (size > 0) {
      converted += 1;
      bytes += size;
      console.log(`${relative(ROOT, dest)}  ${(size / 1024).toFixed(0)}KB`);
    }
  } catch (err) {
    console.log('ERROR', src, err.message);
  }
}
console.log(`\n${converted} imágenes convertidas · ${(bytes / 1024 / 1024).toFixed(2)}MB escritos`);
