/**
 * QA de la vista de exégesis (Codex Sinaiticus × NTV).
 *
 *   node scripts/qa-exegesis.mjs            # comprobaciones de datos
 *   node scripts/qa-exegesis.mjs --browser  # + lector real en Chrome (dev server)
 *
 * Con --browser requiere el servidor de desarrollo (http://localhost:5173) y
 * deja capturas en %TEMP%\opencode\crux.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { NT_BOOKS, exegesisPath, ntvPath, parsePassage } from '../src/data/exegesis.js';
import { recordsFromIndex, runSearch } from '../src/lib/bibleSearch.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'public/textos/exegesis');
const OUT = path.join(process.env.TEMP || '/tmp', 'opencode', 'crux');
const BASE = process.env.CRUX_BASE || 'http://localhost:5173';
const WITH_BROWSER = process.argv.includes('--browser');

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok: Boolean(ok), detail });
  const mark = ok ? '\u001b[32mOK  \u001b[0m' : '\u001b[31mFALLA\u001b[0m';
  console.log(`${mark} ${name}${detail ? ` — ${detail}` : ''}`);
};

const readJson = async file => JSON.parse(await readFile(file, 'utf8'));
const strip = s => s.replace(/[\u2039\u203a\u00a7\d]/g, '');

/* -------------------------------------------------------------------------- */
/* 1) Índice                                                                  */
/* -------------------------------------------------------------------------- */

const index = await readJson(path.join(DIR, 'index.json'));

check('El índice lista los 27 libros del NT', index.books.length === 27, `${index.books.length}`);
check('El índice declara los dos testigos', index.witnesses?.length === 2, index.witnesses?.map(w => w.short).join(', '));
check('La NTV cubre el NT completo', index.totals.ntvVerses > 7900, `${index.totals.ntvVerses} versículos`);
check('El Codex cubre los 27 libros', index.books.every(b => b.codex.verses > 0), `${index.totals.codexVerses} versículos`);
check('Hay 260 capítulos en paralelo', index.totals.parallels === 260, `${index.totals.parallels}`);

/* -------------------------------------------------------------------------- */
/* 2) Recorrido de los JSON por libro                                         */
/* -------------------------------------------------------------------------- */

const NOISE = /(www\.lectulandia\.com|^```)|Página \d{3,}/;
const MOJI = /\uFFFD/;

let ntvVerses = 0;
let codexVerses = 0;
let codexVariants = 0;
const issues = {
  noise: [],
  moji: [],
  html: [],
  order: [],
  emptyVerse: [],
  range: []
};

for (const meta of NT_BOOKS) {
  /* NTV */
  let ntv = null;
  try {
    ntv = await readJson(path.join(DIR, 'ntv', `${meta.id}.json`));
  } catch {
    issues.emptyVerse.push(`Falta ntv/${meta.id}.json`);
  }
  if (ntv) {
    checkNTv(ntv);
  }

  /* Codex */
  let codex = null;
  try {
    codex = await readJson(path.join(DIR, 'codex', `${meta.id}.json`));
  } catch {
    issues.emptyVerse.push(`Falta codex/${meta.id}.json`);
  }
  if (codex && ntv) checkCodex(codex, ntv);
}

function checkNTv(book) {
  if (!book.chapters.length) issues.emptyVerse.push(`ntv/${book.id} sin capítulos`);
  for (const c of book.chapters) {
    let last = 0;
    for (const v of c.verses) {
      ntvVerses += 1;
      if (v.n <= last) issues.order.push(`ntv ${book.id} ${c.num}: ${last} → ${v.n}`);
      last = v.n;
      if (!v.text || v.text.length < 2) issues.emptyVerse.push(`ntv ${book.id} ${c.num}:${v.n}`);
      if (NOISE.test(v.text)) issues.noise.push(`ntv ${book.id} ${c.num}:${v.n}`);
      if (MOJI.test(v.text)) issues.moji.push(`ntv ${book.id} ${c.num}:${v.n}`);
      if (/[<>]/.test(v.text)) issues.html.push(`ntv ${book.id} ${c.num}:${v.n}`);
    }
  }
}

function checkCodex(codex, ntv) {
  const ntvChapters = new Map(ntv.chapters.map(c => [c.num, Math.max(...c.verses.map(v => v.n))]));
  for (const c of codex.chapters) {
    let last = 0;
    for (const v of c.verses) {
      codexVerses += 1;
      codexVariants += v.apparatus?.length || 0;
      if (v.n <= last) issues.order.push(`codex ${codex.id} ${c.num}: ${last} → ${v.n}`);
      last = v.n;
      if (!v.grc) issues.emptyVerse.push(`codex ${codex.id} ${c.num}:${v.n}`);
      if (MOJI.test(v.grc)) issues.moji.push(`codex ${codex.id} ${c.num}:${v.n}`);
      if (/<[^>]*>|&[a-z]+;/.test(v.grc)) issues.html.push(`codex ${codex.id} ${c.num}:${v.n}`);
      const max = ntvChapters.get(c.num);
      if (max && v.n > max) issues.range.push(`codex ${codex.id} ${c.num}:${v.n} > ntv ${max}`);
      for (const a of v.apparatus || []) {
        if (!a.w || typeof a.t !== 'string') issues.html.push(`aparato codex ${codex.id} ${c.num}:${v.n}`);
      }
    }
  }
}

check('NTV: sin ruido del PDF', issues.noise.length === 0, issues.noise.slice(0, 3).join(' · '));
check('NTV: sin caracteres de reemplazo', issues.moji.length === 0, issues.moji.slice(0, 3).join(' · '));
check('NTV: sin HTML residual', issues.html.filter(x => x.startsWith('ntv')).length === 0);
check('Numeración de versículos creciente', issues.order.length === 0, issues.order.slice(0, 3).join(' · '));
check('Ningún versículo vacío', issues.emptyVerse.length === 0, issues.emptyVerse.slice(0, 3).join(' · '));
check('Codex: griego limpio (sin HTML)', issues.html.length === 0, issues.html.slice(0, 3).join(' · '));
check('Codex: versículos dentro del rango de la NTV', issues.range.length === 0, issues.range.slice(0, 3).join(' · '));

check('NTV: recuento de versículos', ntvVerses === index.totals.ntvVerses, `${ntvVerses} vs ${index.totals.ntvVerses}`);
check('Codex: recuento de versículos', codexVerses === index.totals.codexVerses, `${codexVerses} vs ${index.totals.codexVerses}`);
check('Codex: aparato crítico poblado', codexVariants > 5000, `${codexVariants} variantes`);

/* Muestra representativa: Jn 3:16 en los dos testigos. */
const juan = await readJson(path.join(DIR, 'ntv', 'juan.json'));
const codexJuan = await readJson(path.join(DIR, 'codex', 'juan.json'));
const ntv316 = juan.chapters.find(c => c.num === 3)?.verses.find(v => v.n === 16);
const codex316 = codexJuan.chapters.find(c => c.num === 3)?.verses.find(v => v.n === 16);
check('Juan 3:16 existe en la NTV', Boolean(ntv316), ntv316?.text?.slice(0, 40));
check('Juan 3:16 existe en el Codex', Boolean(codex316), strip(codex316?.grc || '').slice(0, 40));
check(
  'Juan 3:16 del Codex conserva nomina sacra',
  /\u2039[^\u203a]+\u203a/.test(codex316?.grc || ''),
  (codex316?.grc || '').match(/\u2039[^\u203a]*\u203a/g)?.join(' ') || ''
);

/* -------------------------------------------------------------------------- */
/* 3) Integridad del parser de la NTV y del buscador                          */
/* -------------------------------------------------------------------------- */

const ntvBooks = new Map();
for (const meta of NT_BOOKS) {
  ntvBooks.set(meta.id, await readJson(path.join(DIR, 'ntv', `${meta.id}.json`)));
}

const badSections = [];
const dirtyNotes = [];
let sectionCount = 0;
let noteCount = 0;
for (const book of ntvBooks.values()) {
  for (const c of book.chapters) {
    for (const s of c.sections || []) {
      sectionCount += 1;
      if (/[.!?\u2026\u00bb]$/.test(s.title.trim())) badSections.push(`${book.id} ${c.num}: ${s.title}`);
    }
  }
  for (const [id, body] of Object.entries(book.notes || {})) {
    noteCount += 1;
    if (/[<>\u2039\u203A]\s*$/.test(body)) dirtyNotes.push(`${book.id} ${id}`);
  }
}

check(
  'NTV: 744 secciones y ninguna cierra frase',
  sectionCount === 744 && badSections.length === 0,
  `${sectionCount} secciones · ${badSections.slice(0, 2).join(' · ')}`
);
check('NTV: notas sin restos de maquetado', noteCount === 1642 && dirtyNotes.length === 0, `${noteCount} notas`);

const juan5 = ntvBooks.get('juan').chapters.find(c => c.num === 5);
check(
  'NTV: el versículo partido en dos líneas se recompone (Jn 5:45)',
  /Mois\u00e9s los acusar\u00e1! S\u00ed, Mois\u00e9s/.test(juan5.verses.find(v => v.n === 45)?.text || ''),
  (juan5.verses.find(v => v.n === 45)?.text || '').slice(-60)
);

const hechos9 = ntvBooks.get('hechos').chapters.find(c => c.num === 9);
const hechos919 = hechos9.verses.find(v => v.n === 19)?.text || '';
check(
  'NTV: el título dentro del versículo se separa (Hch 9:19)',
  (hechos9.sections || []).some(s => s.verse === 19 && /Damasco/.test(s.title)) && !/Damasco y Jerusal\u00e9n/.test(hechos919),
  hechos919.slice(0, 70)
);

const lucas3 = ntvBooks.get('lucas').chapters.find(c => c.num === 3);
check(
  'NTV: la genealogía no se pierde (Lc 3:26-27)',
  /Nagai era hijo de Maat/.test(lucas3.verses.find(v => v.n === 26)?.text || '') &&
    /Jud\u00e1 era hijo de Joana/.test(lucas3.verses.find(v => v.n === 27)?.text || ''),
  (lucas3.verses.find(v => v.n === 27)?.text || '').slice(0, 60)
);

/* Buscador: el índice tiene que cubrir el NT y encontrar por palabras. */
let searchIndex = null;
try {
  searchIndex = await readJson(path.join(DIR, 'buscar.json'));
} catch {
  searchIndex = null;
}
const searchBooks = searchIndex ? Object.keys(searchIndex.ntv).length : 0;
const countIndexed = witness => {
  let n = 0;
  for (const chapters of Object.values(searchIndex?.[witness] || {})) {
    for (const verses of Object.values(chapters)) {
      for (const text of verses) if (text) n += 1;
    }
  }
  return n;
};
check('Buscador: índice de los 27 libros', searchBooks === 27 && Object.keys(searchIndex?.codex || {}).length === 27, `${searchBooks} libros`);
check(
  'Buscador: indexa todos los versículos',
  countIndexed('ntv') === ntvVerses && countIndexed('codex') === codexVerses,
  `NTV ${countIndexed('ntv')} · Codex ${countIndexed('codex')}`
);

const globalRecords = recordsFromIndex(searchIndex || { ntv: {}, codex: {} }, NT_BOOKS);
const spanish = runSearch(globalRecords, 'nacer de nuevo');
check(
  'Buscador: «nacer de nuevo» encuentra Juan 3',
  spanish.hits.some(h => h.bookId === 'juan' && h.chapter === 3),
  `${spanish.total} coincidencias · ${spanish.hits.slice(0, 3).map(h => `${h.bookId} ${h.chapter}:${h.verse}`).join(', ')}`
);
const greek = runSearch(globalRecords, '\u03b7\u03b3\u03b1\u03c0\u03b7\u03c3\u03b5\u03bd');
check(
  'Buscador: el griego se busca sin diacríticos ni sigma final',
  greek.hits.some(h => h.witness === 'codex' && h.bookId === 'juan' && h.chapter === 3 && h.verse === 16),
  `${greek.total} coincidencias`
);

/* Citas de los estudios → lectores. */
const passages = [
  ['1 Juan 1:9', '1-juan', 1, 9],
  ['Mateo 26:26-29', 'mateo', 26, 26],
  ['Apocalipsis 12-13', 'apocalipsis', 12, null],
  ['Ro 8', 'romanos', 8, null],
  ['Jn 3:16', 'juan', 3, 16],
  ['Joel 2:28-29 / Hechos 2:16-18', 'hechos', 2, 16]
];
const badPassages = passages.filter(([text, bookId, chapter, verse]) => {
  const parsed = parsePassage(text);
  return !parsed || parsed.bookId !== bookId || parsed.chapter !== chapter || parsed.verse !== verse;
});
check('CTAs: las citas de los estudios se traducen a libro, capítulo y versículo', badPassages.length === 0, `${badPassages.length} fallos`);
check('CTAs: la cita del Antiguo Testamento no se fuerza al NT', parsePassage('Génesis 1:1') === null);
check(
  'CTAs: la ruta del lector lleva al pasaje exacto',
  ntvPath('Jn 3:16') === '/biblia/ntv?libro=juan&cap=3&v=16' && exegesisPath('Mateo 26:26-29') === '/exegesis?libro=mateo&cap=26&v=26',
  `${ntvPath('Jn 3:16')} · ${exegesisPath('Mateo 26:26-29')}`
);

/* -------------------------------------------------------------------------- */
/* 4) Navegador (opcional)                                                    */
/* -------------------------------------------------------------------------- */

if (WITH_BROWSER) {
  const { default: puppeteer } = await import('puppeteer-core');
  await mkdir(OUT, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 950 });
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

  const visit = async (url, name) => {
    await page.goto(url, { waitUntil: 'networkidle2' });
    await page.screenshot({ path: path.join(OUT, `${name}.png`) });
    return page;
  };
  const text = sel => page.$eval(sel, el => el.textContent.replace(/\s+/g, ' ').trim());
  const alignment = () =>
    page.evaluate(() => {
      const body = document.querySelector('.exg-grid__body');
      const row = document.querySelector('.exg-row.is-active');
      if (!body || !row) return null;
      const box = body.getBoundingClientRect();
      const top = row.getBoundingClientRect().top;
      return {
        n: row.dataset.v,
        visible: top >= box.top - 4 && top < box.bottom - 4,
        bounded: box.height > 0
      };
    });

  /* --- /exegesis: rejilla por versículo --- */
  await visit(`${BASE}/exegesis?libro=juan&cap=3`, 'exegesis-juan3');
  check('Rejilla: las dos columnas de testigos', (await page.$$eval('.exg-grid__witness', els => els.length)) === 2);
  check('Rejilla: una fila por versículo', (await page.$$eval('.exg-row', els => els.length)) >= 33, `${await page.$$eval('.exg-row', els => els.length)} filas`);
  check('Rejilla: los títulos de sección van dentro', (await page.$$eval('.exg-grid__section', els => els.length)) >= 1, `${await page.$$eval('.exg-grid__section', els => els.length)} secciones`);
  check('Rejilla: sigilos del aparato en línea', (await page.$$eval('.exg-sigil', els => els.length)) >= 20);

  const row16 = await page.$eval('.exg-row[data-v="16"]', el => ({
    codex: el.querySelector('.exg-row__cell--codex')?.textContent || '',
    ntv: el.querySelector('.exg-row__cell--ntv')?.textContent || ''
  }));
  check(
    'Alineación: Jn 3:16 casa griego y español en la misma fila',
    /\u03b7\u03b3\u03b1\u03c0\u03b7/.test(row16.codex) && /am\u00f3 tanto al mundo/.test(row16.ntv),
    row16.ntv.slice(0, 48)
  );

  await page.select('#exg-verse', '20');
  await wait(700);
  const afterSelect = await alignment();
  check('Selector de versículo: fija el 20 y lo deja a la vista', afterSelect?.n === '20' && afterSelect.visible, JSON.stringify(afterSelect));

  await page.evaluate(() => document.querySelector('.exg-row[data-v="30"] .exg-row__n').click());
  await wait(700);
  const afterClick = await alignment();
  check('Pulsar un versículo lo fija en las dos columnas', afterClick?.n === '30' && afterClick.visible, JSON.stringify(afterClick));

  await page.select('#exg-verse', '16');
  await wait(700);
  await page.evaluate(() => document.querySelector('.exg-row[data-v="16"] .exg-sigil').click());
  await page.waitForSelector('.vpop', { timeout: 4000 });
  const apparatus = await text('.vpop');
  check('Aparato: el sigilo abre la ficha con la variante', apparatus.length > 12, apparatus.slice(0, 60));
  await page.screenshot({ path: path.join(OUT, 'exegesis-popover.png') });
  await page.keyboard.press('Escape');
  await wait(250);
  check('Fichas: Escape cierra el aparato', (await page.$('.vpop')) === null);

  const fnVerse = await page.$eval('.exg-fn', el => el.closest('.exg-row').dataset.v);
  await page.select('#exg-verse', fnVerse);
  await wait(600);
  await page.evaluate(verse => document.querySelector(`.exg-row[data-v="${verse}"] .exg-fn`).click(), fnVerse);
  await page.waitForSelector('.vpop', { timeout: 4000 });
  const noteText = await text('.vpop');
  check(
    'Notas: la marca abre la nota con su etiqueta',
    /(Griego|Otra lectura|Variante textual|Referencia)/.test(noteText),
    `v.${fnVerse} · ${noteText.slice(0, 60)}`
  );
  await page.screenshot({ path: path.join(OUT, 'exegesis-nota.png') });
  await page.keyboard.press('Escape');
  await wait(250);

  await page.click('#exg-search');
  await page.type('#exg-search', 'nacer de nuevo');
  await page.waitForSelector('.bsearch__hit', { timeout: 4000 });
  const localHits = await page.$$eval('.bsearch__hit', els => els.length);
  check('Buscador: encuentra en el libro abierto', localHits >= 2 && /Jn 3:/.test(await text('.bsearch__hit')), `${localHits} resultados`);
  await page.screenshot({ path: path.join(OUT, 'exegesis-buscar.png') });
  await page.click('.bsearch__hit');
  await wait(600);
  check('Buscador: el resultado lleva al versículo', /cap=3/.test(decodeURIComponent(page.url())) && /v=/.test(page.url()), page.url().slice(-36));

  await page.click('#exg-search');
  await page.type('#exg-search', 'melquisedec');
  await wait(400);
  check('Buscador: ofrece ampliar a todo el Nuevo Testamento', Boolean(await page.$('.bsearch__more')));
  await page.click('.bsearch__more');
  await page.waitForSelector('.bsearch__hit', { timeout: 40000 });
  check('Buscador global: encuentra Hebreos 5 en todo el NT', /He 5/.test(await text('.bsearch__hit')), (await text('.bsearch__hit')).slice(0, 40));
  await page.click('.bsearch__hit');
  await wait(900);
  check(
    'Buscador global: al elegir, abre Hebreos 5 en la rejilla',
    (await page.url()).includes('libro=hebreos') && (await page.$$eval('.exg-row', els => els.length)) > 5,
    page.url().slice(-40)
  );

  /* Conmutador de columnas */
  await visit(`${BASE}/exegesis?libro=juan&cap=3`, 'exegesis-juan3');
  await page.click('[aria-label="Solo el Codex Sinaiticus"]');
  await wait(300);
  const onlyCodex = await page.evaluate(() => ({
    ntv: document.querySelectorAll('.exg-row__cell--ntv').length,
    codex: document.querySelectorAll('.exg-row__cell--codex').length,
    witnesses: document.querySelectorAll('.exg-grid__witness').length
  }));
  check('Conmutador: «solo el Codex» deja una columna', onlyCodex.ntv === 0 && onlyCodex.codex > 30 && onlyCodex.witnesses === 1, JSON.stringify(onlyCodex));
  await page.click('[aria-label="Las dos columnas, versículo a versículo"]');
  await wait(300);

  const chips = await text('.exg__witness');
  check('Exégesis: cabecera del testigo con folio', /folio/i.test(chips), chips.slice(0, 70));

  /* CTAs entre lectores */
  await visit(`${BASE}/exegesis?libro=juan&cap=3&v=16`, 'exegesis-cta');
  const ctaExegesis = await page.$$eval('.bcta__card', els => els.map(el => ({ href: el.getAttribute('href'), text: el.textContent })));
  check(
    'CTAs: la exégesis ofrece la NTV en el mismo versículo',
    ctaExegesis.length === 2 && ctaExegesis.some(c => c.href === '/biblia/ntv?libro=juan&cap=3&v=16'),
    JSON.stringify(ctaExegesis.map(c => c.href))
  );

  await visit(`${BASE}/biblia/ntv?libro=juan&cap=3`, 'ntv-cta');
  const ctaNtv = await page.$$eval('.bcta__card', els => els.map(el => el.getAttribute('href')));
  check(
    'CTAs: la NTV ofrece la exégesis del capítulo abierto',
    ctaNtv.length === 2 && ctaNtv.some(href => href === '/exegesis?libro=juan&cap=3'),
    JSON.stringify(ctaNtv)
  );

  await visit(`${BASE}/estudio/01-fundamentos--33-resurreccion-de-cristo`, 'estudio-cta');
  const ctaEstudio = await page.$$eval('.bcta__card', els => els.map(el => el.getAttribute('href')));
  check(
    'CTAs: un estudio enlaza su pasaje (1 Corintios 15:17) en los tres lectores',
    ctaEstudio.length === 3 && ctaEstudio.some(href => href === '/exegesis?libro=1-corintios&cap=15&v=17'),
    JSON.stringify(ctaEstudio)
  );
  check('CTAs: el estudio dice qué pasaje abre', /1 Corintios 15:17/.test(await text('.bcta__lead')), (await text('.bcta__lead')).slice(0, 60));
  const ctaShot = await page.$('.bcta');
  await ctaShot.screenshot({ path: path.join(OUT, 'estudio-cta.png') });

  /* --- /biblia/ntv --- */
  await visit(`${BASE}/biblia/ntv?libro=juan&cap=3`, 'ntv-juan3');
  const pages = await page.$$eval('.ntv-page', els => els.length);
  const ntvVersesDom = await page.$$eval('.ntv-page .ntv-v', els => els.length);
  check('NTV: páginas del pliego', pages === 2, `${pages}`);
  check('NTV: versículos visibles', ntvVersesDom >= 15, `${ntvVersesDom}`);

  await page.evaluate(() => document.querySelector('.ntv-fn').click());
  await page.waitForSelector('.vpop', { timeout: 4000 });
  check('NTV: la marca de nota abre su ficha', Boolean(await page.$('.vpop')), (await text('.vpop')).slice(0, 50));
  await page.keyboard.press('Escape');
  await wait(200);

  await page.select('#ntv-verse', '16');
  await wait(800);
  const ntvActive = await page.$eval('.ntv-vs.is-active', el => el.dataset.v).catch(() => null);
  check('NTV: el selector de versículo lo fija', ntvActive === '16', `${ntvActive}`);

  await page.click('#ntv-search');
  await page.type('#ntv-search', 'vida eterna');
  await page.waitForSelector('.bsearch__hit', { timeout: 4000 });
  check('NTV: buscador por palabras en el libro', (await page.$$eval('.bsearch__hit', els => els.length)) >= 2);
  await page.keyboard.press('Escape');

  /* --- móvil --- */
  const noOverflow = async (url, name) => {
    await page.setViewport({ width: 400, height: 880 });
    await visit(url, name);
    return page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
      cells: document.querySelectorAll('.exg-row__cell').length,
      tags: document.querySelectorAll('.exg-cell__tag').length
    }));
  };

  const exgMobile = await noOverflow(`${BASE}/exegesis?libro=juan&cap=3&v=16`, 'exegesis-juan3-movil');
  check(
    'Exégesis (móvil): sin desbordamiento horizontal',
    exgMobile.scroll <= exgMobile.client + 1,
    `${exgMobile.scroll}px vs ${exgMobile.client}px`
  );
  check('Exégesis (móvil): las dos celdas se apilan con su etiqueta', exgMobile.cells > 30 && exgMobile.tags > 30, `${exgMobile.cells} celdas`);

  const ntvMobile = await noOverflow(`${BASE}/biblia/ntv?libro=juan&cap=3`, 'ntv-juan3-movil');
  check(
    'NTV (móvil): sin desbordamiento horizontal',
    ntvMobile.scroll <= ntvMobile.client + 1,
    `${ntvMobile.scroll}px vs ${ntvMobile.client}px`
  );

  await browser.close();
}

/* -------------------------------------------------------------------------- */

const failed = results.filter(r => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} comprobaciones superadas`);
await writeFile(path.join(OUT, 'qa-exegesis.json'), JSON.stringify(results, null, 2), 'utf8').catch(() => {});
if (failed.length) process.exitCode = 1;
