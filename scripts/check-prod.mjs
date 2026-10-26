// check-prod.mjs — verifica el sitio publicado en GitHub Pages con un navegador real.
// Uso: node scripts/check-prod.mjs  (requiere Chrome instalado en la ruta por defecto)
//
// Dos fases:
//   1. navegador real: cada ruta se abre como la abre una persona,
//   2. rastreador: se pide el HTML de TODAS las rutas prerenderizadas y se
//      comprueba que responden 200 con su propio título, canonical y og:image
//      (sin ejecutar JavaScript, que es justo lo que no hacen las redes sociales).
import { mkdir, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { OG_IMAGE, escapeHtml, siteRoutes } from './routes-lib.mjs';

const BASE = (process.env.CRUX_BASE || 'https://bryan1605.github.io/crux').replace(/\/$/, '');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT = join(process.env.TEMP || tmpdir(), 'opencode', 'crux', 'prod');

const { default: puppeteer } = await import('puppeteer-core');
await mkdir(OUT, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  userDataDir: await mkdtemp(join(tmpdir(), 'crux-prod-')),
  args: ['--disable-gpu', '--enable-unsafe-swiftshader', '--no-first-run'],
});

let pass = 0;
let fail = 0;
const check = (name, ok, extra = '') => {
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${extra ? ` — ${extra}` : ''}`);
  ok ? pass++ : fail++;
};

const cases = [
  { url: `${BASE}/`, label: 'portada', selector: 'main, #root *' },
  { url: `${BASE}/estudio`, label: '/estudio', selector: 'main, #root *' },
  { url: `${BASE}/biblia`, label: '/biblia (índice)', selector: '.toc__list, .book' },
  { url: `${BASE}/biblia?pag=p2-4-resumen`, label: 'deep-link p2-4-resumen', selector: '.reader__status, .book-page, .book' },
  { url: `${BASE}/biblia?pag=p9`, label: 'alias legacy p9 → p2-1', selector: '.reader__status, .book-page, .book' },
  { url: `${BASE}/biblia?pag=p133`, label: 'alias legacy p133 → p2-4-resumen', selector: '.reader__status, .book-page, .book' },
  { url: `${BASE}/biblia/ntv?libro=juan&cap=3`, label: '/biblia/ntv (lector NTV)', selector: '.ntv-grid, .ntv-page, main' },
  { url: `${BASE}/biblia/ntv?libro=genesis&cap=1`, label: '/biblia/ntv (AT, Génesis 1)', selector: '.ntv-grid, main' },
  { url: `${BASE}/exegesis?libro=juan&cap=3&vv=16-21`, label: '/exegesis (lectura paralela)', selector: '.exg-grid, main' },
  { url: `${BASE}/exegesis?libro=genesis&cap=1`, label: '/exegesis (AT solo NTV)', selector: '.exg-grid, main' },
  { url: `${BASE}/exegesis?libro=tobit&cap=1`, label: '/exegesis (Tobit solo Codex)', selector: '.exg-grid, main' },
  { url: `${BASE}/exegesis?libro=salmos&cap=151`, label: '/exegesis (Salmo 151 solo Codex)', selector: '.exg-grid, main' },
  { url: `${BASE}/concilios`, label: '/concilios (concilios y herejías)', selector: '.concilios__list, .herejias__list, main' },
  { url: `${BASE}/concilios#nicea`, label: 'ancla #nicea en /concilios', selector: '.concilios__card, main' },
  { url: `${BASE}/temas`, label: '/temas (categorías y temas)', selector: '.temas__cats, .temas__cloud, main' },
  { url: `${BASE}/buscar?q=nicea`, label: '/buscar?q=nicea (búsqueda global)', selector: '.buscar__item, main' },
  { url: `${BASE}/ruta-no-existe`, label: 'ruta inventada → portada (SPA)', selector: 'main, #root *' },
];

for (const { url, label, selector } of cases) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1360, height: 900 });
  const errors = [];
  const http404 = [];
  let realErrors = errors;
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('response', r => { if (r.status() === 404) http404.push(r.url().replace('https://bryan1605.github.io', '')); });

  try {
    await page.goto(url, { waitUntil: 'load', timeout: 60000 });
    // `networkidle2` puede no resolverse en la portada aunque la página ya esté
    // cargada (Chrome deja de emitir el ciclo de vida). Se espera la red como
    // mejor esfuerzo y luego el selector real de la vista.
    await page.waitForNetworkIdle({ idleTime: 500, concurrency: 2, timeout: 10000 }).catch(() => {});
    await page.waitForSelector(selector, { timeout: 30000 });
    await new Promise(r => setTimeout(r, 800));
    // En GitHub Pages una ruta profunda SPA se sirve a traves de 404.html con codigo
    // 404: el unico 404 esperado es el propio documento pedido, que luego se restaura.
    // El hash de un ancla (#nicea) aparece en la URL de la respuesta: se ignora al comparar.
    const u = new URL(url);
    const expectedDoc = u.pathname + u.search;
    const stripHash = p => String(p).split('#')[0];
    const onlyDoc404 = http404.every(p => stripHash(p) === expectedDoc);
    realErrors = errors.filter(e => !(onlyDoc404 && e.includes('404')));
    const info = await page.evaluate(() => ({
      url: location.href,
      title: document.title,
      hasRoot: !!document.getElementById('root'),
      h1: document.querySelector('h1')?.textContent?.trim().slice(0, 60) ?? '',
      bodyLen: document.body.innerText.length,
    }));
    check(label, info.hasRoot && info.bodyLen > 400,
      `url=${info.url} | h1=${info.h1} | texto=${info.bodyLen} | title=${info.title}`);
    // La ruta existe con su propio HTML: el documento no puede llegar por 404.html.
    if (!label.startsWith('ruta inventada')) {
      check(`${label}: servido con 200 (no 404.html)`, http404.length === 0,
        http404.join(',') || 'ningún 404');
    }
    if (label.startsWith('deep-link') || label.startsWith('alias')) {
      check(`${label}: vuelve a la ruta pedida`, info.url.startsWith(url.split('?')[0] + '?') || info.url.includes('pag='),
        `final=${info.url}`);
      const folio = await page.$eval('.reader__status strong', n => n.textContent).catch(() => null);
      check(`${label}: estado/fólio visible`, folio !== null && /^\d+$/.test(folio), `fólio=${folio}`);
    }
  } catch (e) {
    check(label, false, String(e).slice(0, 120));
  }
  check(`${label}: 0 errores de consola`, realErrors.length === 0,
    `${realErrors.slice(0, 2).join(' | ') || 'ninguno'} || http404=${http404.join(',') || '-'}`);
  await page.close();
}

await browser.close();

/* -------------------------------------------------------------------------- */
/* Fase 2 · lo que ve un rastreador: el HTML de cada ruta, sin JavaScript      */
/* -------------------------------------------------------------------------- */

const routes = siteRoutes();
const problemas = [];

/** Descarga el HTML de `route` y comprueba lo que necesita un rastreador. */
async function revisarHtml(route) {
  const ruta = route.path === '/' ? '/' : `${route.path}/`;
  const url = `${BASE}${ruta}`;
  try {
    const res = await fetch(url, { redirect: 'follow' });
    const html = await res.text();
    const faltas = [];
    if (res.status !== 200) faltas.push(`status ${res.status}`);
    if (!html.includes(`<title>${escapeHtml(route.title)}</title>`)) faltas.push('title');
    if (!html.includes(`<link rel="canonical" href="${url}"`)) faltas.push('canonical');
    if (!html.includes(`<meta property="og:image" content="${BASE}${OG_IMAGE}"`)) faltas.push('og:image');
    if (!html.includes(`<meta property="og:title" content="${escapeHtml(route.title)}"`)) faltas.push('og:title');
    if (route.indexable ? html.includes('noindex') : !html.includes('noindex')) {
      faltas.push(route.indexable ? 'noindex inesperado' : 'falta noindex');
    }
    return faltas.length ? `${url} → ${faltas.join(', ')}` : '';
  } catch (e) {
    return `${url} → ${e.message}`;
  }
}

// En tandas para no castigar a GitHub Pages con 214 peticiones a la vez.
for (let i = 0; i < routes.length; i += 8) {
  const tanda = await Promise.all(routes.slice(i, i + 8).map(revisarHtml));
  problemas.push(...tanda.filter(Boolean));
}

check(
  `HTML propio en las ${routes.length} rutas (200 + title + canonical + og:image)`,
  problemas.length === 0,
  problemas.length ? `${problemas.length} con problemas · ${problemas.slice(0, 3).join(' | ')}` : 'todas OK'
);

const og = await fetch(`${BASE}${OG_IMAGE}`);
check(
  'La imagen al compartir se publica como JPEG',
  og.status === 200 && String(og.headers.get('content-type')).includes('image/jpeg'),
  `${og.status} · ${og.headers.get('content-type')} · ${(Number(og.headers.get('content-length')) / 1024).toFixed(0)} KB`
);

const robots = await fetch(`${BASE}/robots.txt`).then(r => r.text());
const sitemap = await fetch(`${BASE}/sitemap.xml`).then(r => r.text());
const indexables = routes.filter(r => r.indexable).length;
check(
  'El sitemap lista solo rutas indexables',
  sitemap.includes(`<loc>${BASE}/estudio/</loc>`) &&
    !sitemap.includes(`<loc>${BASE}/buscar/</loc>`) &&
    !sitemap.includes(`<loc>${BASE}/videos/</loc>`) &&
    (sitemap.match(/<loc>/g) || []).length === indexables,
  `${(sitemap.match(/<loc>/g) || []).length} URLs · ${indexables} indexables`
);
check('robots.txt deja fuera el panel', robots.includes('Disallow: /admin') && robots.includes('Sitemap:'), robots.replace(/\n/g, ' '));

console.log(`\n${pass} OK / ${fail} FAIL`);
process.exit(fail ? 1 : 0);