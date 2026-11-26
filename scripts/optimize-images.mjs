import { existsSync, mkdirSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const IMG = join(ROOT, 'src', 'assets', 'imgs');
const OUT = join(ROOT, 'public', 'img');
const FORCE = process.argv.includes('--force');
const FORCE_OBRAS = FORCE || process.argv.includes('--force-obras');

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

async function convert(src, dest, width, quality = 78, force = FORCE) {
  if (!force && existsSync(dest) && statSync(dest).mtimeMs >= statSync(src).mtimeMs) return 0;
  mkdirSync(dirname(dest), { recursive: true });
  const info = await sharp(src).resize({ width, withoutEnlargement: true }).webp({ quality }).toFile(dest);
  return info.size;
}

const jobs = [];

// Portadas de obras (Biblia Patrística) → public/img/obras/<archivo>.webp (640px vertical / 960px horizontal, q80)
const obrasFile = join(ROOT, 'content', 'obras-patristica.json');
const obraFuentes = new Set([
  resolve(IMG, 'Personajes', 'Ignacio de Antioquia', 'Portada_Ignacio_de_Antioquia_Estilo_Crux.jpg').toLowerCase()
]);
if (existsSync(obrasFile)) {
  const obras = JSON.parse(readFileSync(obrasFile, 'utf8'));
  for (const item of obras.items || []) {
    if (!item?.fuente) continue;
    obraFuentes.add(resolve(IMG, item.fuente).toLowerCase());
    if (item.portada) {
      const width = item.width || (item.formato === 'horizontal' ? 960 : 640);
      jobs.push([join(IMG, item.fuente), join(ROOT, 'public', item.portada), width, 80, FORCE_OBRAS]);
    }
  }
}

// Personajes → public/img/personajes/<Rel>/<Archivo>.webp
const pjRoot = join(IMG, 'Personajes');
for (const src of walk(pjRoot)) {
  if (obraFuentes.has(resolve(src).toLowerCase())) continue;
  const rel = relative(pjRoot, src).replace(/\\/g, '/').replace(/\.(jpe?g|png)$/i, '.webp');
  jobs.push([src, join(OUT, 'personajes', rel), 1100, 70]);
}

// Banners → public/img/banners/<name>.webp
const bannerSources = [
  [join(IMG, 'HeroBanner1.jpg'), join(OUT, 'banners', 'herobanner1.webp')],
  [join(IMG, 'HeroBanner2Patristica.jpg'), join(OUT, 'banners', 'herobanner2-patristica.webp')],
  [join(IMG, 'HeroBanner3Reforma.jpg'), join(OUT, 'banners', 'herobanner3-reforma.webp')],
  [join(IMG, 'HeroBanner4JesusconNicodemo.jpg'), join(OUT, 'banners', 'herobanner4-nicodemo.webp')],
];
for (const [src, dest] of bannerSources) jobs.push([src, dest, 1600, 72]);

// Portada Biblia NTV (fuente versionada en src/assets/imgs/)
jobs.push([join(IMG, 'PortadaNTV.png'), join(OUT, 'biblia', 'portada-ntv.webp'), 1080, 80]);

// Portada Biblia Patrística (fuente local; se puede indicar con PORTADA_BIBLIA)
const portadaBiblia = process.env.PORTADA_BIBLIA || 'D:/Biblia/PortadaBibliaPatristica.png';
if (existsSync(portadaBiblia)) {
  jobs.push([portadaBiblia, join(OUT, 'biblia', 'portada.webp'), 1400, 80]);
}

// Portadas e ilustraciones de estudios → public/img/estudios/<Rel>.webp
const estudiosRoot = join(IMG, 'Estudios');
if (existsSync(estudiosRoot)) {
  for (const src of walk(estudiosRoot)) {
    const rel = relative(estudiosRoot, src).replace(/\\/g, '/').replace(/\.(jpe?g|png|webp)$/i, '.webp');
    jobs.push([src, join(OUT, 'estudios', rel), 1400, 78]);
  }
}

// Fundamentos de doctrina — NTV → public/img/estudios/fundamentos/*.webp
const fundDir = join(IMG, 'Fundamentos', '01_Fundamentos_Teología');
const fundSources = [
  ['1_Portada_Estudio.png', 'portada.webp'],
  ['2_Bloque_I_Posición.png', 'bloque-1-posicion.webp'],
  ['3_Bloque_II_Gracia_Irrevocable.png', 'bloque-2-gracia.webp'],
  ['4_Bloque_III_Crecimiento.png', 'bloque-3-crecimiento.webp'],
  ['5_Bloque_IV_Vocación_y_Misión.png', 'bloque-4-vocacion.webp']
];
for (const [srcName, outName] of fundSources) {
  jobs.push([join(fundDir, srcName), join(OUT, 'estudios', 'fundamentos', outName), 1400, 78]);
}

let converted = 0;
let bytes = 0;
for (const [src, dest, width, quality, force] of jobs) {
  if (!existsSync(src)) {
    console.log('SKIP (no existe):', src);
    continue;
  }
  try {
    const size = await convert(src, dest, width, quality, force);
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
