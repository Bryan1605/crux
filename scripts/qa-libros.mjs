/**
 * QA de las fichas de libros (`content/libros/`).
 *
 *   node scripts/qa-libros.mjs             # datos
 *   node scripts/qa-libros.mjs --browser   # datos + páginas reales (necesita `npm run dev`)
 *
 * Datos: cada ficha pasa `validateLibro` (tabla canónica, siete secciones,
 * 600–900 palabras, 3–5 fuentes del registro), el registro pasa
 * `validateFuentes` y tiene alguna fuente pública y alguna de estudio, y las
 * rutas de `routes-lib` son exactamente el índice + una por ficha.
 *
 * Navegador (`CRUX_BASE`): el índice lista los 73 libros y enlaza las fichas; la
 * ficha tiene un solo h1, sus secciones, el aviso de neutralidad y sus fuentes;
 * un id inexistente da 404; el panel aparece en /exegesis y /biblia/ntv (con
 * «en preparación» si no hay ficha); móvil sin scroll horizontal; sin errores.
 */
import { readFile, readdir, mkdir, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ALL_BOOKS, BOOK_BY_ID } from '../src/data/exegesis.js';
import { LIBRO_SECCIONES, palabrasLibro, validate } from './validate-content.mjs';
import { siteRoutes } from './routes-lib.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'content/libros');
const BASE = process.env.CRUX_BASE || 'http://localhost:5173';
const OUT = 'C:\\Users\\PC\\AppData\\Local\\Temp\\opencode\\crux';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const WITH_BROWSER = process.argv.includes('--browser');

const readJson = async file => JSON.parse(await readFile(file, 'utf8'));
const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok: Boolean(ok), detail });
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
};
const attempt = fn => {
  try {
    fn();
    return '';
  } catch (e) {
    return e.message;
  }
};

/* -------------------------------------------------------------------------- */
/* 1. Datos                                                                   */
/* -------------------------------------------------------------------------- */

const registro = await readJson(path.join(DIR, 'fuentes.json'));
check('El registro de fuentes es válido', !attempt(() => validate('fuentes', registro)), attempt(() => validate('fuentes', registro)));
const tipos = new Set(Object.values(registro.fuentes).map(f => f.tipo));
check('El registro tiene fuentes públicas y de estudio', tipos.has('publica') && tipos.has('estudio'), [...tipos].join(', '));

const files = (await readdir(DIR)).filter(f => f.endsWith('.json') && f !== 'fuentes.json').sort();
check('Hay al menos una ficha', files.length > 0, files.join(', '));
const fuentes = new Set(Object.keys(registro.fuentes));
const usadas = new Set();
const fichas = [];
for (const file of files) {
  const id = file.replace(/\.json$/, '');
  const ficha = await readJson(path.join(DIR, file));
  const err = attempt(() => validate('libro', ficha, id, { book: BOOK_BY_ID.get(id) || null, fuentes }));
  check(`${id}: ficha válida (tabla canónica, secciones, fuentes del registro)`, !err, err || `${palabrasLibro(ficha)} palabras`);
  check(`${id}: las siete secciones en orden`, ficha.sections.map(s => s.id).join() === LIBRO_SECCIONES.join());
  check(
    `${id}: canon judío, católico, ortodoxo y protestante declarados`,
    ['judio', 'catolico', 'ortodoxo', 'protestante'].every(k => ficha.canon?.[k]?.trim())
  );
  for (const k of ficha.sources) usadas.add(k);
  fichas.push(ficha);
}
const sobrantes = [...fuentes].filter(k => !usadas.has(k));
check('Todas las fuentes del registro se citan en alguna ficha', sobrantes.length === 0, sobrantes.join(', ') || 'todas');

const rutas = siteRoutes().map(r => r.path).filter(p => p.startsWith('/biblia/libros'));
const esperadas = ['/biblia/libros', ...fichas.map(f => `/biblia/libros/${f.id}`)];
check('Rutas: el índice y una por ficha, ni más ni menos', rutas.sort().join() === esperadas.sort().join(), rutas.join(', '));

/* -------------------------------------------------------------------------- */
/* 2. Páginas                                                                 */
/* -------------------------------------------------------------------------- */

if (WITH_BROWSER && fichas.length) {
  const { default: puppeteer } = await import('puppeteer-core');
  await mkdir(OUT, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    userDataDir: await mkdtemp(path.join(tmpdir(), 'crux-libros-')),
    args: ['--disable-gpu', '--hide-scrollbars', '--no-first-run']
  });
  const errors = [];
  const page = await browser.newPage();
  page.on('pageerror', e => errors.push(String(e)));
  // En GitHub Pages una ruta profunda inexistente llega por 404.html con código 404 y
  // el SPA la recompone (la usamos a propósito para la ficha inexistente): ese 404 del
  // documento no es un fallo. Se apuntan las rutas para no confundirlo con otros.
  const docs404 = new Set();
  page.on('response', r => {
    if (r.status() === 404 && r.request().isNavigationRequest()) docs404.add(r.url());
  });
  page.on('console', m => {
    if (m.type() !== 'error') return;
    if (/status of 404/.test(m.text()) && docs404.has(m.location()?.url)) return;
    errors.push(m.text());
  });
  await page.setViewport({ width: 1280, height: 900 });
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const go = async url => {
    await page.goto(`${BASE}${url}`, { waitUntil: 'networkidle2', timeout: 60000 });
    await wait(500);
  };

  await go('/biblia/libros');
  const indice = await page.evaluate(() => ({
    items: document.querySelectorAll('.libros__item').length,
    enlaces: [...document.querySelectorAll('.libros__item a')].map(a => a.getAttribute('href')),
    h1: document.querySelectorAll('h1').length,
    title: document.title
  }));
  check(`El índice lista los ${ALL_BOOKS.length} libros`, indice.items === ALL_BOOKS.length && indice.h1 === 1, `${indice.items} · h1 ${indice.h1}`);
  check(
    'El índice enlaza solo las fichas que existen',
    indice.enlaces.length === fichas.length && fichas.every(f => indice.enlaces.some(h => h.endsWith(`/biblia/libros/${f.id}`))),
    indice.enlaces.join(', ')
  );
  await page.screenshot({ path: path.join(OUT, 'libros-indice.png') });

  for (const ficha of fichas) {
    await go(`/biblia/libros/${ficha.id}`);
    const f = await page.evaluate(() => ({
      h1: [...document.querySelectorAll('h1')].map(h => h.textContent.trim()),
      secciones: [...document.querySelectorAll('.ficha__seccion')].map(s => s.id),
      neutral: document.querySelector('.ficha__neutral')?.textContent || '',
      fuentes: document.querySelectorAll('.ficha__fuentes li').length,
      externos: [...document.querySelectorAll('.ficha__fuentes a')].every(a => a.target === '_blank' && /noopener/.test(a.rel)),
      lectores: [...document.querySelectorAll('.ficha__lectores a')].map(a => a.getAttribute('href')),
      capas: document.querySelectorAll('.ficha-capa').length,
      title: document.title
    }));
    check(`${ficha.id}: un solo h1 con el título`, f.h1.length === 1 && f.h1[0] === ficha.title, f.h1.join(' | '));
    check(
      `${ficha.id}: secciones, debates y fuentes en la página`,
      f.secciones.slice(0, 7).join() === LIBRO_SECCIONES.join() && f.secciones.includes('fuentes') && f.fuentes === ficha.sources.length,
      `${f.secciones.length} secciones · ${f.fuentes} fuentes`
    );
    check(`${ficha.id}: aviso de neutralidad y etiquetas de capa`, /No decide cuestiones de fe/.test(f.neutral) && f.capas > 0, `${f.capas} etiquetas`);
    check(`${ficha.id}: las fuentes abren en pestaña nueva con rel`, f.externos);
    check(`${ficha.id}: enlaza al lector del Codex`, f.lectores.some(h => h.includes(`/exegesis?libro=${ficha.id}`)), f.lectores.join(', '));
    check(`${ficha.id}: el título de la página es el de routes-lib`, siteRoutes().some(r => r.path === `/biblia/libros/${ficha.id}` && r.title === f.title), f.title);
    await page.screenshot({ path: path.join(OUT, `libros-${ficha.id}.png`) });

    await go(`/exegesis?libro=${ficha.id}&cap=1`);
    const panel = await page.evaluate(() => document.querySelector('.book-intro a')?.getAttribute('href'));
    check(`${ficha.id}: /exegesis muestra el panel con enlace a la ficha`, panel?.endsWith(`/biblia/libros/${ficha.id}`), String(panel));
  }

  const sinFicha = ALL_BOOKS.find(b => b.ntv && !fichas.some(f => f.id === b.id));
  await go(`/biblia/ntv?libro=${sinFicha.id}&cap=1`);
  const prep = await page.evaluate(() => document.querySelector('.book-intro')?.textContent || '');
  check(`${sinFicha.name} (sin ficha): el panel de la NTV dice «en preparación»`, /en preparación/.test(prep), prep.trim().slice(0, 80));

  await go('/biblia/libros/no-existe');
  const nf = await page.evaluate(() => document.body.innerText.includes('Página no encontrada'));
  check('Una ficha inexistente da 404', nf);

  const mobile = await browser.newPage();
  mobile.on('pageerror', e => errors.push(String(e)));
  await mobile.setViewport({ width: 390, height: 844 });
  for (const url of ['/biblia/libros', `/biblia/libros/${fichas[0].id}`]) {
    await mobile.goto(`${BASE}${url}`, { waitUntil: 'networkidle2', timeout: 60000 });
    await wait(400);
    const wide = await mobile.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check(`Móvil ${url}: sin scroll horizontal`, wide <= 1, `${wide}px`);
  }
  await mobile.screenshot({ path: path.join(OUT, `libros-${fichas[0].id}-movil.png`) });

  check('Sin errores de consola', errors.length === 0, errors.slice(0, 3).join(' | ') || 'ninguno');
  await browser.close();
}

const failed = results.filter(r => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} comprobaciones superadas`);
process.exit(failed ? 1 : 0);
