/**
 * QA de la página /concilios y su integración con la línea de tiempo.
 *
 *   node scripts/qa-concilios.mjs
 *
 * Requiere el servidor de desarrollo en http://localhost:5173.
 * Deja capturas en C:\Users\PC\AppData\Local\Temp\opencode\crux.
 */
import puppeteer from 'puppeteer-core';
import { mkdir, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT = 'C:\\Users\\PC\\AppData\\Local\\Temp\\opencode\\crux';
const BASE = process.env.CRUX_BASE || 'http://localhost:5173';

const wait = ms => new Promise(r => setTimeout(r, ms));

await mkdir(OUT, { recursive: true });

const userDataDir = await mkdtemp(join(tmpdir(), 'crux-concilios-'));
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

try {
  // ---------------------------------------------------------------- escritorio
  let page = await makePage();
  await page.goto(`${BASE}/concilios`, { waitUntil: 'domcontentloaded' });
  await wait(2200);

  const head = await page.evaluate(() => ({
    h1: document.querySelector('.page-head h1')?.textContent.trim(),
    lead: Boolean(document.querySelector('.page-head .lead')),
    councils: document.querySelectorAll('.concilios__list .concilios__card').length,
    heresies: document.querySelectorAll('.herejias__list .herejia__card').length
  }));
  check('título de la página', head.h1 === 'Concilios y herejías', head.h1);
  check('lead presente', head.lead);
  check('tarjetas de concilios', head.councils === 8, `${head.councils}`);
  check('tarjetas de herejías', head.heresies === 9, `${head.heresies}`);

  // Cada concilio: fecha, nombre, resumen y pie (estudio o «próximamente»).
  const cards = await page.$$eval('.concilios__card', els =>
    els.map(c => ({
      date: c.querySelector('.concilios__date')?.textContent.trim() || '',
      name: c.querySelector('.concilios__nombre')?.textContent.trim() || '',
      resumen: Boolean(c.querySelector('.concilios__resumen')?.textContent.trim()),
      soon: Boolean(c.querySelector('.concilios__soon')),
      estudio: c.querySelector('.concilios__estudio')?.getAttribute('href') || null
    }))
  );
  const sinFecha = cards.filter(c => !c.date);
  const sinNombre = cards.filter(c => !c.name);
  const sinResumen = cards.filter(c => !c.resumen);
  check('todo concilio tiene fecha, nombre y resumen',
    sinFecha.length === 0 && sinNombre.length === 0 && !sinResumen.some(Boolean),
    `fechas: ${cards.map(c => c.date).join(' · ')}`);
  check('fechas visibles válidas', sinFecha.length === 0 && cards.every(c => /\d/.test(c.date)), '');

  const soonCount = await page.$$eval('.concilios__soon', els => els.length);
  check('«Estudio próximamente» en fichas sin estudio', soonCount >= 15, `${soonCount} píldoras`);

  // El estudio real de judaizantes enlaza a /estudio/06-apologetica--judaizantes.
  const estudioLink = await page.$$eval('.herejia__estudio, .concilios__estudio', els =>
    els.map(e => e.getAttribute('href'))
  );
  check('judaizantes enlaza su estudio real', estudioLink.includes('/estudio/06-apologetica--judaizantes'),
    estudioLink.join(', ') || 'ninguno');

  // Anclas: /concilios#nicea deja marcada la tarjeta del concilio.
  await page.goto(`${BASE}/concilios#nicea`, { waitUntil: 'domcontentloaded' });
  await wait(1800);
  const target = await page.evaluate(() => ({
    id: document.querySelector(':target')?.id || null,
    top: document.querySelector('#nicea')?.getBoundingClientRect().top ?? null
  }));
  check('ancla #nicea navega a la tarjeta', target.id === 'nicea' && target.top >= 0,
    `:target=${target.id} · top=${target.top}`);

  await page.goto(`${BASE}/concilios#arrianismo`, { waitUntil: 'domcontentloaded' });
  await wait(1800);
  const targetH = await page.evaluate(() => document.querySelector(':target')?.id || null);
  check('ancla #arrianismo navega a la herejía', targetH === 'arrianismo', `:target=${targetH}`);

  await page.goto(`${BASE}/concilios`, { waitUntil: 'domcontentloaded' });
  await wait(1800);
  await page.screenshot({ path: join(OUT, 'concilios-desktop.png') });
  checkNoOverflow(page, 'concilios escritorio');

  // ---------------------------------------------------------------- móvil
  const mob = await makePage(390, 844);
  await mob.goto(`${BASE}/concilios`, { waitUntil: 'domcontentloaded' });
  await wait(2200);
  await mob.screenshot({ path: join(OUT, 'concilios-mobile.png') });
  checkNoOverflow(mob, 'concilios móvil (390px)');
  const cols = await mob.evaluate(() => getComputedStyle(document.querySelector('.concilios__list')).gridTemplateColumns);
  check('una sola columna en móvil', cols.split(' ').length === 1, cols);

  // Navegación: el enlace «Concilios» existe en nav o pie.
  const navLink = await mob.$$eval('a[href="/concilios"]', els => els.length);
  check('enlace Concilios en navegación', navLink >= 1, `${navLink} enlaces`);

  // ---------------------------------------------------------------- integración
  // La línea de tiempo de /estudio incluye los concilios y herejías.
  const tl = await browser.newPage();
  await tl.setViewport({ width: 1280, height: 900 });
  await tl.goto(`${BASE}/estudio`, { waitUntil: 'domcontentloaded' });
  await tl.evaluate(() => localStorage.clear());
  await tl.reload({ waitUntil: 'domcontentloaded' });
  await wait(2500);

  const tlState = await tl.evaluate(() => ({
    total: document.querySelectorAll('.timeline__card').length,
    concilios: document.querySelectorAll(".timeline__badge[data-tipo='concilio']").length,
    herejias: document.querySelectorAll(".timeline__badge[data-tipo='herejia']").length,
    chips: [...document.querySelectorAll('.chips .timeline__chip, .chips .chip')].map(c => c.textContent.trim())
  }));
  check('línea de tiempo con hitos de concilios', tlState.concilios === 8, `${tlState.concilios} concilios`);
  check('línea de tiempo con hitos de herejías', tlState.herejias === 7, `${tlState.herejias} herejías`);
  check('total de hitos crece con concilios', tlState.total >= 40, `${tlState.total} hitos`);
  check('chips de filtro incluyen Concilio y Herejía',
    tlState.chips.some(c => c.includes('Concilio')) && tlState.chips.some(c => c.includes('Herejía')),
    tlState.chips.join(' | ').slice(0, 120));

  // Click en el chip «Concilio» filtra la línea a los 8 concilios.
  await tl.evaluate(() => {
    const chip = [...document.querySelectorAll('.chips .chip')].find(c => c.textContent.includes('Concilio'));
    if (chip) chip.click();
  });
  await wait(1200);
  const filtered = await tl.evaluate(() => ({
    cards: document.querySelectorAll('.timeline__card').length,
    all: [...document.querySelectorAll('.timeline__badge')].every(b => b.dataset.tipo === 'concilio')
  }));
  check('filtro Concilio muestra solo concilios',
    filtered.cards === 8 && filtered.all,
    `${filtered.cards} tarjetas · todos concilio=${filtered.all}`);

  await browser.close();
} catch (e) {
  console.error(e);
  await browser.close().catch(() => {});
  process.exit(1);
}

const fails = results.filter(r => !r.ok).length;
console.log(`\n${results.length - fails}/${results.length} checks OK`);
process.exit(fails ? 1 : 0);