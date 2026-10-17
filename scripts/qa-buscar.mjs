/**
 * QA de la búsqueda global (/buscar) y del índice por temas (/temas).
 *
 *   node scripts/qa-buscar.mjs
 *
 * Requiere el servidor de desarrollo en http://localhost:5173.
 * Deja capturas en C:\\Users\\PC\\AppData\\Local\\Temp\\opencode\\crux.
 */
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import { mkdir, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT = 'C:\\Users\\PC\\AppData\\Local\\Temp\\opencode\\crux';
const BASE = process.env.CRUX_BASE || 'http://localhost:5173';

// El índice solo lista categorías con estudios: se compara contra el JSON real.
const INDEX = JSON.parse(
  fs.readFileSync(new URL('../content/estudios.json', import.meta.url), 'utf8')
);
const N_CATEGORIAS = (INDEX.categories || []).length;

const wait = ms => new Promise(r => setTimeout(r, ms));

await mkdir(OUT, { recursive: true });

const userDataDir = await mkdtemp(join(tmpdir(), 'crux-buscar-'));
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  userDataDir,
  args: ['--disable-gpu', '--enable-unsafe-swiftshader', '--hide-scrollbars', '--no-first-run']
});

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok: Boolean(ok), detail });
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
};

async function makePage(width = 1280, height = 900) {
  const page = await browser.newPage();
  await page.setViewport({ width, height });
  page.on('pageerror', e => console.log('  [pageerror]', e.message));
  page.on('console', m => {
    if (m.type() === 'error') console.log('  [console.error]', m.text());
  });
  return page;
}

async function checkNoOverflow(page, label) {
  const m = await page.evaluate(() => ({
    doc: document.documentElement.scrollWidth,
    win: document.documentElement.clientWidth
  }));
  check(`sin desbordamiento horizontal (${label})`, m.doc <= m.win + 1, `${m.doc}px vs ${m.win}px`);
}

/** Escribe en el cuadro de búsqueda como lo haría el usuario (evento input). */
const setQuery = (page, text) =>
  page.evaluate(t => {
    const el = document.getElementById('buscar-global');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(el, t);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, text);

const readResults = page =>
  page.evaluate(() => ({
    status: document.querySelector('.buscar__status')?.textContent.trim() || '',
    groups: [...document.querySelectorAll('.buscar__group-title')].map(t =>
      t.childNodes[0].textContent.trim()
    ),
    items: [...document.querySelectorAll('.buscar__item')].map(a => ({
      href: a.getAttribute('href'),
      title: a.querySelector('.buscar__item-title')?.textContent.trim() || '',
      tag: a.tagName
    })),
    suggests: document.querySelectorAll('.buscar__suggest .chip').length
  }));

try {
  // ---------------------------------------------------------------- escritura
  let page = await makePage();
  await page.goto(`${BASE}/buscar`, { waitUntil: 'domcontentloaded' });
  await wait(2200);

  const head = await page.evaluate(() => ({
    h1: document.querySelector('.page-head h1')?.textContent.trim(),
    input: Boolean(document.getElementById('buscar-global')),
    label: Boolean(document.querySelector('label[for="buscar-global"]')),
    live: document.querySelector('.buscar__status')?.getAttribute('aria-live')
  }));
  check('título de la página', head.h1 === 'Buscar', head.h1);
  check('cuadro con etiqueta accesible', head.input && head.label, JSON.stringify(head));
  check('recuento anunciado a lectores (aria-live)', head.live === 'polite', String(head.live));

  const initial = await readResults(page);
  check('sugerencias de temas al entrar', initial.suggests >= 10, `${initial.suggests} chips`);
  check('sin consulta no hay resultados', initial.items.length === 0, `${initial.items.length}`);
  await checkNoOverflow(page, 'buscar vacío');
  await page.screenshot({ path: join(OUT, 'buscar-vacio.png') });

  // --- «nicea» encuentra el concilio.
  await setQuery(page, 'nicea');
  await wait(500);
  const nicea = await readResults(page);
  check('«nicea» devuelve resultados', nicea.items.length > 0, `${nicea.items.length}`);
  check(
    'encuentra el Concilio de Nicea (ancla /concilios#nicea)',
    nicea.items.some(i => i.href === '/concilios#nicea'),
    nicea.items.map(i => i.href).slice(0, 4).join(', ')
  );
  check('agrupa bajo «Concilios»', nicea.groups.some(g => /Concilios/i.test(g)), nicea.groups.join(' | '));
  check('los resultados son enlaces', nicea.items.every(i => i.tag === 'A'), '');
  check('el recuento habla de resultados', /resultado/i.test(nicea.status), nicea.status);
  await page.screenshot({ path: join(OUT, 'buscar-nicea.png') });

  // --- acentos: «perdón» encuentra el estudio Perdón.
  await setQuery(page, 'perdón');
  await wait(500);
  const perdon = await readResults(page);
  check(
    '«perdón» (con tilde) encuentra el estudio',
    perdon.items.some(i => i.href === '/estudio/01-fundamentos--01-perdon'),
    perdon.items.map(i => i.href).slice(0, 4).join(', ')
  );

  // --- un personaje.
  await setQuery(page, 'pablo');
  await wait(500);
  const pablo = await readResults(page);
  // La entrada de un personaje apunta a su ficha o, si tiene estudio enlazado, al
  // estudio que lo cubre (ver `buildSearchIndex` en scripts/content-lib.mjs).
  const fichaPablo = JSON.parse(
    fs.readFileSync(new URL('../content/personajes/apostol-pablo.json', import.meta.url), 'utf8')
  );
  const pabloHrefs = [
    `/estudio/personajes/${fichaPablo.slug}`,
    fichaPablo.estudio ? `/estudio/${fichaPablo.estudio}` : null
  ].filter(Boolean);
  check(
    '«pablo» encuentra su ficha (o el estudio que la cubre)',
    pablo.items.some(i => pabloHrefs.includes(i.href)),
    `${pabloHrefs.join(' | ')} → ${pablo.items.map(i => i.href).slice(0, 5).join(', ')}`
  );

  // --- sin resultados.
  await setQuery(page, 'zzzzqqq');
  await wait(500);
  const none = await readResults(page);
  check('consulta sin resultados avisa', /Sin resultados/i.test(none.status), none.status);
  check('vuelve a ofrecer temas', none.suggests >= 10, `${none.suggests} chips`);

  // --- botón limpiar.
  const cleared = await page.evaluate(() => {
    const btn = document.querySelector('.buscar__clear');
    if (!btn) return null;
    btn.click();
    return true;
  });
  await wait(500);
  const afterClear = await page.evaluate(() => ({
    value: document.getElementById('buscar-global')?.value,
    suggests: document.querySelectorAll('.buscar__suggest .chip').length
  }));
  check('el botón limpiar vacía la consulta', cleared && afterClear.value === '', JSON.stringify(afterClear));

  // ---------------------------------------------------------------- navegar
  await page.goto(`${BASE}/buscar?q=nicea`, { waitUntil: 'domcontentloaded' });
  await wait(2200);
  const href = await page.evaluate(() => {
    const link = [...document.querySelectorAll('.buscar__item')].find(a => a.getAttribute('href') === '/concilios#nicea');
    if (!link) return null;
    link.click();
    return link.getAttribute('href');
  });
  await wait(1600);
  const landed = await page.evaluate(() => ({
    url: location.href,
    hash: location.hash,
    top: document.getElementById('nicea')?.getBoundingClientRect().top ?? null
  }));
  check(
    'clic en un resultado navega al ancla',
    href === '/concilios#nicea' && landed.hash === '#nicea' && landed.top !== null && landed.top >= 0 && landed.top < 300,
    `hash=${landed.hash} top=${landed.top}`
  );

  // ---------------------------------------------------------------- /temas
  const temas = await makePage();
  await temas.goto(`${BASE}/temas`, { waitUntil: 'domcontentloaded' });
  await wait(2200);
  const temasState = await temas.evaluate(() => ({
    h1: document.querySelector('.page-head h1')?.textContent.trim(),
    cats: [...document.querySelectorAll('.temas__cat')].map(a => a.getAttribute('href')),
    chips: [...document.querySelectorAll('.temas__cloud .chip')].map(a => a.getAttribute('href'))
  }));
  check('título de /temas', temasState.h1 === 'Temas', temasState.h1);
  check('una tarjeta por categoría', temasState.cats.length === N_CATEGORIAS, `${temasState.cats.length}/${N_CATEGORIAS}`);
  check(
    'cada categoría enlaza al índice filtrado',
    temasState.cats.every(h => h && h.startsWith('/estudio?cat=')),
    temasState.cats.slice(0, 3).join(', ')
  );
  check('nube de temas poblada', temasState.chips.length >= 100, `${temasState.chips.length} temas`);
  check(
    'cada tema enlaza al índice por consulta',
    temasState.chips.every(h => h && h.startsWith('/estudio?q=')),
    temasState.chips.slice(0, 3).join(', ')
  );
  await temas.screenshot({ path: join(OUT, 'temas.png') });
  await checkNoOverflow(temas, 'temas');

  // Un tema lleva al índice ya filtrado.
  const firstTag = temasState.chips[0];
  await temas.evaluate(() => document.querySelector('.temas__cloud .chip').click());
  await wait(2200);
  const filtered = await temas.evaluate(() => ({
    url: location.href,
    value: document.getElementById('buscador-estudio')?.value || '',
    cards: document.querySelectorAll('.study-card, .row-card').length
  }));
  check(
    'un tema abre el estudio ya filtrado',
    filtered.url.includes('/estudio?q=') && filtered.value.length > 0 && filtered.cards > 0,
    `${firstTag} → ${filtered.value} (${filtered.cards} fichas)`
  );

  // ---------------------------------------------------------------- integración nav
  const nav = await temas.evaluate(() => ({
    buscar: document.querySelectorAll('a[href="/buscar"]').length,
    temas: document.querySelectorAll('a[href="/temas"]').length
  }));
  check('enlaces Buscar y Temas en navegación/pie', nav.buscar >= 1 && nav.temas >= 1, JSON.stringify(nav));

  // El panel de navegación tiene altura fija: ningún grupo debe recortar enlaces.
  await temas.evaluate(() => document.querySelector('.hamburger-menu')?.click());
  await wait(900);
  const navFit = await temas.evaluate(() => {
    const navBottom = document.querySelector('.card-nav')?.getBoundingClientRect().bottom ?? 0;
    return [...document.querySelectorAll('.nav-card')].map(card => ({
      label: card.querySelector('.nav-card-label')?.textContent.trim(),
      overflow: card.scrollHeight - card.clientHeight,
      lastBottom: Math.round(card.querySelector('.nav-card-link:last-child')?.getBoundingClientRect().bottom ?? 0),
      navBottom: Math.round(navBottom)
    }));
  });
  check(
    'el menú no recorta enlaces',
    navFit.length > 0 && navFit.every(c => c.overflow <= 1 && c.lastBottom <= c.navBottom + 1),
    JSON.stringify(navFit)
  );

  // ---------------------------------------------------------------- móvil
  const mob = await makePage(390, 844);
  await mob.goto(`${BASE}/buscar?q=nicea`, { waitUntil: 'domcontentloaded' });
  await wait(2200);
  await mob.screenshot({ path: join(OUT, 'buscar-mobile.png') });
  await checkNoOverflow(mob, 'buscar móvil (390px)');

  await mob.goto(`${BASE}/temas`, { waitUntil: 'domcontentloaded' });
  await wait(2200);
  await mob.screenshot({ path: join(OUT, 'temas-mobile.png') });
  await checkNoOverflow(mob, 'temas móvil (390px)');

  await browser.close();
} catch (e) {
  console.error(e);
  await browser.close().catch(() => {});
  process.exit(1);
}

const fails = results.filter(r => !r.ok).length;
console.log(`\n${results.length - fails}/${results.length} checks OK`);
process.exit(fails ? 1 : 0);
