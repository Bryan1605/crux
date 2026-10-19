/**
 * QA de enlaces.
 *
 *   node scripts/qa-enlaces.mjs
 *   CRUX_BASE=https://bryan1605.github.io/crux node scripts/qa-enlaces.mjs
 *
 * Requiere el servidor de desarrollo en http://localhost:5173 (o CRUX_BASE).
 *
 * Tres bloques:
 *
 *   1. Páginas: las rutas públicas (`scripts/routes-lib.mjs`) cargan su propia
 *      página y no la de «Página no encontrada».
 *   2. Enlaces internos: todo lo que enlazan esas páginas apunta a una ruta que
 *      existe de verdad (estudio, personaje, categoría, libro del NT, ancla…) y
 *      ningún enlace se queda sin texto para lectores de pantalla.
 *   3. Enlaces externos: los que citan los estudios responden, se abren en
 *      pestaña nueva y llevan `rel="noopener noreferrer"`.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { mkdir, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import puppeteer from 'puppeteer-core';

import { estudiosIndex, siteRoutes } from './routes-lib.mjs';
import { NT_BOOKS } from '../src/data/exegesis.js';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = (process.env.CRUX_BASE || 'http://localhost:5173').replace(/\/$/, '');
const BASE_PATH = new URL(BASE).pathname.replace(/\/$/, '');
const OUT = join(process.env.TEMP || tmpdir(), 'opencode', 'crux');
const ESPERA = 1800;

/** Páginas que se recorren: las fijas + una muestra de cada familia de ficha. */
const PAGINAS = [
  '/',
  '/estudio',
  '/estudio?cat=01-fundamentos',
  '/biblia',
  '/biblia/ntv?libro=juan&cap=3',
  '/exegesis?libro=juan&cap=3&vv=16-21',
  '/videos',
  '/concilios',
  '/temas',
  '/buscar?q=nicea',
  '/estudio/01-fundamentos--01-perdon',
  '/estudio/03-personajes--apostoles--09-tomas',
  '/estudio/06-apologetica--origenes-usa--01-testigos-de-jehova',
  '/estudio/personajes/apostol-pedro',
  '/estudio/personajes/juan-crisostomo'
];

const rutas = siteRoutes();
const RUTAS = new Set(rutas.map(r => r.path));
const CATEGORIAS = new Set(estudiosIndex().categories.map(c => c.id));
const LIBROS = new Set(NT_BOOKS.map(b => b.id));
const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok: Boolean(ok), detail });
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
};

await mkdir(OUT, { recursive: true });
const userDataDir = await mkdtemp(join(tmpdir(), 'crux-enlaces-'));
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  userDataDir,
  args: ['--disable-gpu', '--enable-unsafe-swiftshader', '--hide-scrollbars', '--no-first-run']
});

/** Quita el subpath del sitio y decodifica: /crux/estudio%20x → /estudio x */
const rutaDe = pathname => {
  const limpio = BASE_PATH && pathname.startsWith(BASE_PATH) ? pathname.slice(BASE_PATH.length) : pathname;
  const conBarra = limpio === '' ? '/' : limpio;
  try {
    return decodeURIComponent(conBarra);
  } catch {
    return conBarra;
  }
};

try {
  // ------------------------------------------------------------- 1 · páginas
  const pagina = await browser.newPage();
  await pagina.setViewport({ width: 1280, height: 900 });
  const caidas = [];
  const enlaces = [];

  for (const ruta of PAGINAS) {
    try {
      const res = await pagina.goto(`${BASE}${ruta}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await new Promise(r => setTimeout(r, ESPERA));
      const info = await pagina.evaluate(() => ({
        notFound: document.body.innerText.includes('Página no encontrada'),
        hayMain: Boolean(document.querySelector('main#main')),
        vacio: (document.querySelector('main#main')?.innerText || '').trim().length < 60,
        enlaces: [...document.querySelectorAll('a[href]')].map(a => ({
          raw: a.getAttribute('href'),
          href: a.href,
          target: a.getAttribute('target'),
          rel: a.getAttribute('rel') || '',
          texto: (a.textContent || '').trim(),
          etiqueta: (a.getAttribute('aria-label') || '').trim(),
          imagen: Boolean(a.querySelector('img'))
        }))
      }));
      if (!info.hayMain || info.notFound || info.vacio) {
        caidas.push(`${ruta} → ${res?.status()}${info.notFound ? ' (no encontrada)' : info.vacio ? ' (vacía)' : ''}`);
      }
      for (const e of info.enlaces) enlaces.push({ ...e, pagina: ruta });
    } catch (error) {
      caidas.push(`${ruta} → ${error.message}`);
    }
  }
  check(`las ${PAGINAS.length} páginas cargan su contenido`, caidas.length === 0, caidas.join(' | ') || 'todas OK');

  // ------------------------------------------------------ 2 · enlaces internos
  const internos = new Map();
  const externos = new Map();
  const sinTexto = [];
  const sinRel = [];

  for (const e of enlaces) {
    if (!e.texto && !e.etiqueta && !e.imagen) sinTexto.push(`${e.pagina} → ${e.raw}`);
    let url;
    try {
      url = new URL(e.href, BASE);
    } catch {
      sinTexto.push(`${e.pagina} → href inválido: ${e.raw}`);
      continue;
    }
    if (url.origin === new URL(BASE).origin) {
      const ruta = rutaDe(url.pathname) + url.search + url.hash;
      if (!internos.has(ruta)) internos.set(ruta, new Set());
      internos.get(ruta).add(e.pagina);
    } else if (/^https?:/.test(url.protocol)) {
      const clave = url.origin + url.pathname;
      if (!externos.has(clave)) externos.set(clave, []);
      const enStudy = e.pagina.startsWith('/estudio/') && !e.pagina.startsWith('/estudio?');
      if (enStudy && (e.target !== '_blank' || !/noopener/.test(e.rel))) {
        sinRel.push(`${e.pagina} → ${clave}`);
      }
      externos.get(clave).push(e.pagina);
    }
  }

  const desconocidos = [];
  for (const [ruta, desde] of internos) {
    const url = new URL(`${BASE}${ruta}`);
    const pathname = rutaDe(url.pathname);
    const params = url.searchParams;
    const categoria = params.get('cat');
    const libro = params.get('libro');
    let ok = RUTAS.has(pathname);
    // El índice del estudio acepta categorías reales o una consulta libre.
    if (!ok && pathname === '/estudio') ok = Boolean(params.get('q')) || CATEGORIAS.has(categoria);
    // El lector de la Patrística acepta cualquier parte por su identificador.
    if (!ok && pathname === '/biblia') ok = Boolean(params.get('pag'));
    if (!ok) desconocidos.push(`${[...desde][0]} → ${ruta}`);
    else if (libro && !LIBROS.has(libro)) desconocidos.push(`${[...desde][0]} → ${ruta} (libro desconocido)`);
    else if (categoria && !CATEGORIAS.has(categoria)) desconocidos.push(`${[...desde][0]} → ${ruta} (categoría desconocida)`);
  }
  check(
    `los ${internos.size} destinos internos existen`,
    desconocidos.length === 0,
    desconocidos.slice(0, 6).join(' | ') || 'todos OK'
  );

  // Anclas: #id tiene que existir en la página de destino.
  const anclas = [...internos.keys()].filter(r => r.includes('#'));
  const anclasRotas = [];
  for (const ruta of anclas) {
    const [camino, hash] = ruta.split('#');
    await pagina.goto(`${BASE}${camino}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await new Promise(r => setTimeout(r, ESPERA));
    const existe = await pagina.evaluate(id => Boolean(document.getElementById(id)), hash);
    if (!existe) anclasRotas.push(ruta);
  }
  check(`las ${anclas.length} anclas encuentran su destino`, anclasRotas.length === 0, anclasRotas.join(' | ') || 'todas OK');
  check('ningún enlace se queda sin texto', sinTexto.length === 0, sinTexto.slice(0, 5).join(' | ') || 'todos con texto');
  await pagina.close();

  // ------------------------------------------------------ 3 · enlaces externos
  /*
   * Dos pasadas con el mismo criterio:
   *   a) los que aparecen en las páginas recorridas (aquí sí miramos `rel` y
   *      `target`), y
   *   b) todas las citas externas de las 188 fichas del estudio, leídas del
   *      markdown: ninguna fuente puede quedar caída sin que la QA lo diga.
   * 401/403/429 se anotan como «bloquea el rastreo» y no cuentan como rotas.
   */
  const revisar = async url => {
    try {
      const res = await fetch(url, {
        redirect: 'follow',
        headers: { 'user-agent': 'Mozilla/5.0 (compatible; crux-qa/1.0; +https://bryan1605.github.io/crux/)' },
        signal: AbortSignal.timeout(20000)
      });
      if (res.status >= 400 && ![403, 429].includes(res.status)) return { rota: `${url} → ${res.status}` };
      if ([403, 429].includes(res.status)) return { bloqueada: `${url} → ${res.status}` };
      return {};
    } catch (error) {
      const detalle = error.name === 'TimeoutError' ? 'sin respuesta en 20 s' : (error.cause?.code || error.message);
      return { rota: `${url} → ${detalle}` };
    }
  };

  const enTandas = async lista => {
    const salida = { caidas: [], bloqueadas: [] };
    for (let i = 0; i < lista.length; i += 6) {
      const tanda = await Promise.all(lista.slice(i, i + 6).map(revisar));
      for (const r of tanda) {
        if (r.rota) salida.caidas.push(r.rota);
        if (r.bloqueada) salida.bloqueadas.push(r.bloqueada);
      }
    }
    return salida;
  };

  const listaExternos = [...externos.keys()];
  const externosPagina = await enTandas(listaExternos);
  check(
    `los ${listaExternos.length} enlaces externos de las páginas responden`,
    externosPagina.caidas.length === 0,
    externosPagina.caidas.slice(0, 4).join(' | ') || 'todos OK'
  );

  // ------------------------------------------------- 3b · citas de las fichas
  const citas = new Map();
  for (const archivo of readdirSync('content/estudios').filter(f => f.endsWith('.md'))) {
    const texto = readFileSync(join('content/estudios', archivo), 'utf8');
    for (const m of texto.matchAll(/https?:\/\/[^\s"'`)<>\]]+/g)) {
      const url = m[0].replace(/[.,;)]+$/, '');
      if (/bryan1605\.github\.io/.test(url)) continue;
      if (!citas.has(url)) citas.set(url, new Set());
      citas.get(url).add(archivo.replace(/\.md$/, ''));
    }
  }
  const citasExternas = await enTandas([...citas.keys()]);
  const conOrigen = citasExternas.caidas.map(t => `${t}  ⟵ ${[...(citas.get(t.split(' → ')[0]) || [])].join(', ')}`);
  check(
    `las ${citas.size} citas externas del contenido responden`,
    citasExternas.caidas.length === 0,
    conOrigen.slice(0, 3).join(' | ') || 'todas OK'
  );
  const bloqueadas = [...externosPagina.bloqueadas, ...citasExternas.bloqueadas];
  if (bloqueadas.length) {
    console.log(`     ${bloqueadas.length} bloquean el rastreo automático (no cuentan como rotas): ${bloqueadas.slice(0, 3).join(' | ')}`);
  }

  check(
    'los enlaces externos de las fichas abren en pestaña nueva con rel',
    sinRel.length === 0,
    sinRel.slice(0, 4).join(' | ') || 'todos con target y rel'
  );
} catch (error) {
  console.error('ERROR', error);
  process.exitCode = 1;
} finally {
  await browser.close();
  const failed = results.filter(r => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} comprobaciones OK`);
  if (failed.length) process.exitCode = 1;
}
