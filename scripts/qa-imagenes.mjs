/**
 * QA de imágenes del sitio.
 *
 *   node scripts/qa-imagenes.mjs
 *
 * Dos comprobaciones:
 *   1. Toda ruta `/img/...` referenciada en `content/` (JSON y Markdown) responde
 *      200 con contenido de tipo imagen.
 *   2. Las páginas con imágenes no dejan ningún `<img>` roto (`naturalWidth === 0`).
 *
 * Requiere el servidor de desarrollo en http://localhost:5173 (o `CRUX_BASE`).
 * Deja el informe en C:\Users\PC\AppData\Local\Temp\opencode\crux.
 */
import puppeteer from 'puppeteer-core';
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative, extname } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT = 'C:\\Users\\PC\\AppData\\Local\\Temp\\opencode\\crux';
const BASE = process.env.CRUX_BASE || 'http://localhost:5173';

const ROOT = process.cwd();
const CONTENT = join(ROOT, 'content');
const SKIP_DIRS = new Set(['.history']);

const wait = ms => new Promise(r => setTimeout(r, ms));

mkdirSync(OUT, { recursive: true });

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
};

// ---------------------------------------------------------------- 1. content/
// rutas tipo "/img/..." o '/img/...' o (/img/...) — los nombres pueden llevar espacios
const REF = /["'(](\/img\/[^"'\n\r)>]+)/g;

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(join(dir, entry.name), acc);
    } else {
      acc.push(join(dir, entry.name));
    }
  }
  return acc;
}

const refs = new Map(); // ruta → Set(ficheros que la referencian)
for (const file of walk(CONTENT)) {
  if (!['.json', '.md', '.markdown'].includes(extname(file).toLowerCase())) continue;
  const text = readFileSync(file, 'utf8');
  for (const match of text.matchAll(REF)) {
    const path = match[1].trim();
    if (!refs.has(path)) refs.set(path, new Set());
    refs.get(path).add(relative(ROOT, file).replace(/\\/g, '/'));
  }
}

console.log(`Referencias a imágenes en content/: ${refs.size}\n`);

for (const [path, sources] of [...refs].sort()) {
  let detail = '';
  let ok = false;
  try {
    const res = await fetch(`${BASE}${path}`);
    detail = String(res.status);
    ok = res.ok && /^image\//.test(res.headers.get('content-type') || '');
  } catch (err) {
    detail = err.message;
  }
  check(`imagen ${path}`, ok, ok ? detail : `${detail} · referenciada en ${[...sources].join(', ')}`);
}

// ---------------------------------------------------------------- 2. páginas
const ROUTES = [
  { label: 'portada', path: '/' },
  { label: 'estudio (índice)', path: '/estudio' },
  { label: 'estudio (categoría)', path: '/estudio?cat=03-personajes' },
  { label: 'personaje (Juan el Bautista)', path: '/estudio/personajes/juan-bautista' },
  { label: 'personaje (Pablo)', path: '/estudio/personajes/apostol-pablo' },
  { label: 'videos', path: '/videos' },
  { label: 'biblia (índice)', path: '/biblia' }
];

const userDataDir = await mkdtemp(join(tmpdir(), 'crux-img-'));
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  userDataDir,
  args: ['--disable-gpu', '--enable-unsafe-swiftshader', '--hide-scrollbars', '--no-first-run']
});

try {
  for (const route of ROUTES) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.goto(`${BASE}${route.path}`, { waitUntil: 'domcontentloaded' });
    await wait(2500);

    // Baja hasta el fondo para que se carguen las imágenes con loading="lazy".
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 900) {
        window.scrollTo(0, y);
        await new Promise(r => setTimeout(r, 120));
      }
    });
    await wait(1200);

    const broken = await page.evaluate(() =>
      [...document.images]
        // solo assets del sitio (las miniaturas de YouTube son externas y se
        // comprueban aparte, sin depender de la red de terceros)
        .filter(img => (img.currentSrc || img.src).includes('/img/'))
        .filter(img => img.complete && img.naturalWidth === 0)
        .map(img => img.getAttribute('src'))
    );

    check(`página ${route.label} sin imágenes rotas`, broken.length === 0, broken.join(' | '));
    await page.close();
  }
} catch (err) {
  console.error(err);
  await browser.close().catch(() => {});
  process.exit(1);
}

writeFileSync(join(OUT, 'imagenes-report.json'), JSON.stringify(results, null, 2), 'utf8');

const failed = results.filter(r => !r.ok);
console.log(`\nInforme: ${join(OUT, 'imagenes-report.json')}`);
if (failed.length === 0) {
  console.log(`${results.length}/${results.length} comprobaciones OK`);
  process.exit(0);
}
console.log(`\n${results.length - failed.length}/${results.length} comprobaciones OK · ${failed.length} fallo(s):`);
for (const f of failed) console.log(`  · ${f.name}${f.detail ? ` — ${f.detail}` : ''}`);
process.exit(1);
