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

import {
  ALL_BOOKS,
  BIBLE_BOOKS,
  CODEX_BOOKS,
  NT_BOOKS,
  OT_BOOKS,
  exegesisPath,
  ntvPath,
  parsePassage
} from '../src/data/exegesis.js';
import { recordsFromIndex, runSearch } from '../src/lib/bibleSearch.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'public/textos/exegesis');
const OUT = path.join(process.env.TEMP || '/tmp', 'opencode', 'crux');
const BASE = process.env.CRUX_BASE || 'http://localhost:5173';
// En GitHub Pages el sitio vive en un subpath (/crux): los enlaces internos lo
// llevan delante, así que la QA lo tiene en cuenta al auditar lo publicado.
const PREFIX = process.env.CRUX_BASE ? new URL(BASE).pathname.replace(/\/$/, '') : '';
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

check(
  'El índice lista los 73 libros (66 NTV + 7 solo Codex)',
  index.books.length === ALL_BOOKS.length && index.books.length === 73,
  `${index.books.length}`
);
check(
  'El índice separa 39 libros del AT y 27 del NT',
  index.books.filter(b => b.testament === 'AT' && b.ntv.verses).length === OT_BOOKS.length &&
    index.books.filter(b => b.testament === 'NT' && b.ntv.verses).length === NT_BOOKS.length,
  `${OT_BOOKS.length} + ${NT_BOOKS.length}`
);
check('El índice declara los dos testigos', index.witnesses?.length === 2, index.witnesses?.map(w => w.short).join(', '));
check('La NTV cubre la Biblia completa', index.totals.ntvBooks === 66 && index.totals.ntvVerses === 31021, `${index.totals.ntvVerses} versículos`);
check(
  'El Codex cubre 59 libros (32 AT + 27 NT)',
  index.totals.codexBooks === 59 && index.totals.codexOtBooks === 32 && index.totals.codexNtBooks === 27,
  `${index.totals.codexBooks} libros · ${index.totals.codexVerses} versículos`
);
check('Hay 7 libros solo en el Codex', index.totals.codexOnlyBooks === 7, `${index.totals.codexOnlyBooks}`);
check('Hay 708 capítulos en paralelo', index.totals.parallels === 708, `${index.totals.parallels}`);

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

for (const meta of BIBLE_BOOKS) {
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
}

for (const meta of CODEX_BOOKS) {
  /* Codex */
  let codex = null;
  let ntv = null;
  try {
    codex = await readJson(path.join(DIR, 'codex', `${meta.id}.json`));
  } catch {
    issues.emptyVerse.push(`Falta codex/${meta.id}.json`);
  }
  if (meta.ntv) {
    try {
      ntv = await readJson(path.join(DIR, 'ntv', `${meta.id}.json`));
    } catch { /* ya se informó arriba */ }
  }
  if (codex) checkCodex(codex, ntv, meta);
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

function checkCodex(codex, ntv, meta) {
  const ntvChapters =
    meta.testament === 'NT' && ntv
      ? new Map(ntv.chapters.map(c => [c.num, Math.max(...c.verses.map(v => v.n))]))
      : null;
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
      const max = ntvChapters?.get(c.num);
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
for (const meta of BIBLE_BOOKS) {
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
      if (book.order >= 40 && /[.!?\u2026\u00bb]$/.test(s.title.trim())) badSections.push(`${book.id} ${c.num}: ${s.title}`);
    }
  }
  for (const [id, body] of Object.entries(book.notes || {})) {
    noteCount += 1;
    if (/[<>\u2039\u203A]\s*$/.test(body)) dirtyNotes.push(`${book.id} ${id}`);
  }
}

check(
  'NTV: 2368 secciones y las del NT no cierran frase',
  sectionCount === 2368 && badSections.length === 0,
  `${sectionCount} secciones · ${badSections.slice(0, 2).join(' · ')}`
);
check('NTV: 4744 notas sin restos de maquetado', noteCount === 4744 && dirtyNotes.length === 0, `${noteCount} notas`);

const expectedChapters = [
  ['genesis', 50],
  ['exodo', 40],
  ['esdras', 10],
  ['nehemias', 13],
  ['salmos', 150],
  ['abdias', 1],
  ['malaquias', 4]
];
const wrongChapters = expectedChapters.filter(([id, n]) => ntvBooks.get(id)?.chapters.length !== n);
check(
  'NTV: los libros especiales tienen el número de capítulos correcto',
  wrongChapters.length === 0,
  wrongChapters.map(([id, n]) => `${id}: ${ntvBooks.get(id)?.chapters.length} (esperado ${n})`).join(' · ')
);

const esdras2 = ntvBooks.get('esdras').chapters.find(c => c.num === 2);
const nehemias7 = ntvBooks.get('nehemias').chapters.find(c => c.num === 7);
const nehemias8 = ntvBooks.get('nehemias').chapters.find(c => c.num === 8);
check(
  'NTV: las listas de Esdras 2 y Nehemías 7 no se cortan',
  esdras2?.verses.length === 70 && nehemias7?.verses.length === 73,
  `Esd 2: ${esdras2?.verses.length} · Neh 7: ${nehemias7?.verses.length}`
);
check(
  'NTV: Nehemías 8:1 recupera el texto anterior al número de versículo',
  /^En octubre/.test(nehemias8?.verses.find(v => v.n === 1)?.text || ''),
  (nehemias8?.verses.find(v => v.n === 1)?.text || '').slice(0, 70)
);

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

const psalms = ntvBooks.get('salmos');
const psalmTitle = n =>
  psalms.chapters.find(c => c.num === n)?.sections?.find(s => s.verse === 1)?.title || '';
const expectedPsalmTitles = {
  3: 'Salmo de David, acerca de cuando huía de su hijo Absalón.',
  4: 'Para el director del coro: salmo de David; acompáñese con instrumentos de cuerda.',
  5: 'Para el director del coro: salmo de David; acompáñese con flauta.',
  7: 'Salmo de David, quien lo cantó al SEÑOR acerca de Cus, de la tribu de Benjamín.',
  8: 'Para el director del coro: salmo de David; acompáñese con instrumento de cuerda[j].',
  9: 'Para el director del coro: salmo de David; cántese con la melodía de Muerte del hijo.',
  22: 'Para el director del coro: salmo de David; cántese con la melodía de Cierva de la aurora.',
  36: 'Para el director del coro: salmo de David, el siervo del Señor.'
};
const wrongPsalmTitles = Object.entries(expectedPsalmTitles).filter(
  ([n, title]) => psalmTitle(Number(n)) !== title
);
const psalm5v1 = psalms.chapters.find(c => c.num === 5)?.verses.find(v => v.n === 1)?.text || '';
const brokenPsalmTitles = psalms.chapters.flatMap(c =>
  (c.sections || [])
    .filter(s => s.verse === 1 && ['cuerda.', 'Benjamín.', 'del hijo.', 'de la aurora.'].includes(s.title))
    .map(s => `${c.num}: ${s.title}`)
);
check(
  'NTV: las sobrescrituras de los Salmos quedan enteras',
  wrongPsalmTitles.length === 0 && brokenPsalmTitles.length === 0 && !/^Para el director/.test(psalm5v1),
  `${wrongPsalmTitles.map(([n]) => n).join(', ') || 'títulos OK'} · ${brokenPsalmTitles.slice(0, 2).join(' · ')}`
);

const lucas3 = ntvBooks.get('lucas').chapters.find(c => c.num === 3);
check(
  'NTV: la genealogía no se pierde (Lc 3:26-27)',
  /Nagai era hijo de Maat/.test(lucas3.verses.find(v => v.n === 26)?.text || '') &&
    /Jud\u00e1 era hijo de Joana/.test(lucas3.verses.find(v => v.n === 27)?.text || ''),
  (lucas3.verses.find(v => v.n === 27)?.text || '').slice(0, 60)
);

/* Buscador: índices separados por testamento, con NTV y Codex. */
let atIndex = null;
let ntIndex = null;
try {
  atIndex = await readJson(path.join(DIR, 'buscar-at.json'));
  ntIndex = await readJson(path.join(DIR, 'buscar-nt.json'));
} catch {
  atIndex = null;
  ntIndex = null;
}
const countIndexed = (index, witness) => {
  let n = 0;
  for (const chapters of Object.values(index?.[witness] || {})) {
    for (const verses of Object.values(chapters)) {
      for (const text of verses) if (text) n += 1;
    }
  }
  return n;
};
check(
  'Buscador: el AT tiene 39 libros NTV y 32 del Codex',
  Object.keys(atIndex?.ntv || {}).length === 39 && Object.keys(atIndex?.codex || {}).length === 32,
  `${Object.keys(atIndex?.ntv || {}).length} NTV · ${Object.keys(atIndex?.codex || {}).length} Codex`
);
check(
  'Buscador: el NT tiene 27 libros NTV y 27 del Codex',
  Object.keys(ntIndex?.ntv || {}).length === 27 && Object.keys(ntIndex?.codex || {}).length === 27,
  `${Object.keys(ntIndex?.ntv || {}).length} NTV · ${Object.keys(ntIndex?.codex || {}).length} Codex`
);
check(
  'Buscador: indexa todos los versículos de los dos testamentos',
  countIndexed(atIndex, 'ntv') + countIndexed(ntIndex, 'ntv') === ntvVerses &&
    countIndexed(atIndex, 'codex') + countIndexed(ntIndex, 'codex') === codexVerses,
  `NTV ${countIndexed(atIndex, 'ntv') + countIndexed(ntIndex, 'ntv')} · Codex ${countIndexed(atIndex, 'codex') + countIndexed(ntIndex, 'codex')}`
);

const atRecords = recordsFromIndex(atIndex || { ntv: {}, codex: {} }, OT_BOOKS);
const genesis = runSearch(atRecords, 'en el principio');
check(
  'Buscador: «en el principio» encuentra Génesis 1:1',
  genesis.hits.some(h => h.bookId === 'genesis' && h.chapter === 1 && h.verse === 1),
  `${genesis.total} coincidencias · ${genesis.hits.slice(0, 2).map(h => `${h.bookId} ${h.chapter}:${h.verse}`).join(', ')}`
);

const atAllRecords = recordsFromIndex(atIndex || { ntv: {}, codex: {} }, [
  ...OT_BOOKS,
  ...ALL_BOOKS.filter(b => b.codexOnly)
]);
const tobit = runSearch(atAllRecords, 'τωβειθ');
check(
  'Buscador: los libros solo-Codex entran en la búsqueda del AT',
  tobit.hits.some(h => h.witness === 'codex' && h.bookId === 'tobit' && h.chapter === 1),
  `${tobit.total} coincidencias`
);

const ntRecords = recordsFromIndex(ntIndex || { ntv: {}, codex: {} }, NT_BOOKS);
const spanish = runSearch(ntRecords, 'nacer de nuevo');
check(
  'Buscador: «nacer de nuevo» encuentra Juan 3',
  spanish.hits.some(h => h.bookId === 'juan' && h.chapter === 3),
  `${spanish.total} coincidencias · ${spanish.hits.slice(0, 3).map(h => `${h.bookId} ${h.chapter}:${h.verse}`).join(', ')}`
);
const greek = runSearch(ntRecords, 'ηγαπησεν');
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
  ['Génesis 1:1', 'genesis', 1, 1],
  ['Cantar de los Cantares 2:1', 'cantares', 2, 1],
  ['Hechos de los Apóstoles 2:1', 'hechos', 2, 1],
  ['Tobit 1:1', 'tobit', 1, 1],
  ['Joel 2:28-29 / Hechos 2:16-18', 'hechos', 2, 16]
];
const badPassages = passages.filter(([text, bookId, chapter, verse]) => {
  const parsed = parsePassage(text);
  return !parsed || parsed.bookId !== bookId || parsed.chapter !== chapter || parsed.verse !== verse;
});
check('CTAs: las citas de los estudios se traducen a libro, capítulo y versículo', badPassages.length === 0, `${badPassages.length} fallos`);
check(
  'CTAs: una cita del AT se queda en el AT y Tobit va al Codex',
  parsePassage('Génesis 1:1')?.testament === 'AT' &&
    ntvPath('Génesis 1:1') === '/biblia/ntv?libro=genesis&cap=1&v=1' &&
    ntvPath('Tobit 1:1') === '/exegesis?libro=tobit&cap=1&v=1',
  `${ntvPath('Génesis 1:1')} · ${ntvPath('Tobit 1:1')}`
);
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

  /* --- la divisoria del Codex: cabecera y filas al mismo ancho -------------- */
  const rule = await page.evaluate(() => {
    const head = document.querySelector('.exg-grid__witness--codex');
    const cell = document.querySelector('.exg-row__cell--codex');
    const body = document.querySelector('.exg-grid__body');
    const header = document.querySelector('.exg-grid__head');
    if (!head || !cell || !body || !header) return null;
    const right = el => Math.round(el.getBoundingClientRect().right * 100) / 100;
    return {
      head: right(head),
      cell: right(cell),
      delta: Math.round(Math.abs(right(head) - right(cell)) * 100) / 100,
      position: getComputedStyle(header).position,
      gutter: getComputedStyle(body).scrollbarGutter || '',
      scrolls: body.scrollHeight > body.clientHeight + 2
    };
  });
  check(
    'Divisoria del Codex: la cabecera cae justo sobre la columna de las filas',
    Boolean(rule) && rule.delta <= 1 && rule.position === 'sticky' && rule.scrolls,
    JSON.stringify(rule)
  );

  /* --- marcar texto no fija versículo ------------------------------------- */
  await page.select('#exg-verse', '16');
  await wait(600);
  await page.evaluate(() => {
    const cell = document.querySelector('.exg-row[data-v="16"] .exg-row__cell--ntv');
    const range = document.createRange();
    range.selectNodeContents(cell);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  });
  await page.evaluate(() => document.querySelector('.exg-row[data-v="10"]').click());
  await wait(500);
  const kept = await page.evaluate(() => window.location.search);
  check('Marcar texto no cambia el versículo fijado', /(^|[?&])v=16(&|$)/.test(kept), kept);

  await page.evaluate(() => window.getSelection().removeAllRanges());
  await page.evaluate(() => document.querySelector('.exg-row[data-v="10"]').click());
  await wait(700);
  const movedTo = await alignment();
  check('Sin selección, pulsar la fila sí fija el versículo', movedTo?.n === '10', JSON.stringify(movedTo));

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

  /* --- diccionario y ficha léxica ------------------------------------------ */
  await visit(`${BASE}/exegesis?libro=juan&cap=3&v=16`, 'exegesis-juan3-lexico');
  const wordClicked = await page.evaluate(() => {
    const word = [...document.querySelectorAll('.exg-row[data-v="16"] .exg-word')].find(el =>
      el.textContent.includes('ηγαπηϲεν')
    );
    if (!word) return false;
    word.click();
    return true;
  });
  check('Diccionario: las palabras del Codex son interactivas', wordClicked);
  await page.waitForSelector('.vpop', { timeout: 4000 });
  const wordCard = await text('.vpop');
  check(
    'Diccionario: la ficha muestra lema, glosa y Strong',
    /ἀγαπάω/.test(wordCard) && /amar/.test(wordCard) && /G0025/.test(wordCard),
    wordCard.slice(0, 100)
  );
  await page.screenshot({ path: path.join(OUT, 'exegesis-palabra.png') });
  await page.click('.vpop__lex-link');
  await page.waitForSelector('.lex__dialog', { timeout: 4000 });
  check(
    'Diccionario: el enlace abre la entrada y la lista completa',
    (await page.$$eval('.lex__item', els => els.length)) === 250 && /ἀγαπάω/.test(await text('.lex-entry__lemma')),
    `${await page.$$eval('.lex__item', els => els.length)} entradas`
  );
  await page.click('#lex-q');
  await page.type('#lex-q', 'λογος');
  await wait(300);
  check('Diccionario: busca griego sin acentos', (await page.$$eval('.lex__item', els => els.length)) === 1, `${await page.$$eval('.lex__item', els => els.length)} resultados`);
  await page.click('.lex__item');
  await wait(300);
  check('Diccionario: la ficha cambia a λόγος', (await text('.lex-entry__lemma')) === 'λόγος', await text('.lex-entry__lemma'));
  await page.screenshot({ path: path.join(OUT, 'exegesis-lexico.png') });
  await page.keyboard.press('Escape');
  await wait(250);
  check('Diccionario: Escape cierra el panel', (await page.$('.lex')) === null);

  await visit(`${BASE}/exegesis?libro=juan&cap=3&dic=G3056`, 'exegesis-lexico');
  check('Diccionario: el enlace directo abre la entrada', (await text('.lex-entry__lemma')) === 'λόγος', await text('.lex-entry__lemma'));

  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await visit(`${BASE}/exegesis?libro=juan&cap=3&dic=G3056`, 'exegesis-lexico-movil');
  const mobileLex = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
    browse: getComputedStyle(document.querySelector('.lex__browse')).display,
    detail: getComputedStyle(document.querySelector('.lex__detail')).display
  }));
  check(
    'Diccionario (móvil): ficha a pantalla completa',
    mobileLex.scroll <= mobileLex.client + 1 && mobileLex.browse === 'none' && mobileLex.detail === 'block',
    JSON.stringify(mobileLex)
  );
  await page.click('.lex-entry__back');
  await wait(300);
  const mobileList = await page.evaluate(() => ({
    browse: getComputedStyle(document.querySelector('.lex__browse')).display,
    detail: getComputedStyle(document.querySelector('.lex__detail')).display
  }));
  check(
    'Diccionario (móvil): «Volver» regresa a la lista',
    mobileList.browse !== 'none' && mobileList.detail === 'none',
    JSON.stringify(mobileList)
  );
  await page.keyboard.press('Escape');
  await wait(250);
  check('Diccionario (móvil): Escape cierra el panel', (await page.$('.lex')) === null);

  await page.setViewport({ width: 1440, height: 950 });
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
    ctaExegesis.length === 2 && ctaExegesis.some(c => c.href === `${PREFIX}/biblia/ntv?libro=juan&cap=3&v=16`),
    JSON.stringify(ctaExegesis.map(c => c.href))
  );

  await visit(`${BASE}/biblia/ntv?libro=juan&cap=3`, 'ntv-cta');
  const ctaNtv = await page.$$eval('.bcta__card', els => els.map(el => el.getAttribute('href')));
  check(
    'CTAs: la NTV ofrece la exégesis del capítulo abierto',
    ctaNtv.length === 2 && ctaNtv.some(href => href === `${PREFIX}/exegesis?libro=juan&cap=3`),
    JSON.stringify(ctaNtv)
  );

  await visit(`${BASE}/estudio/01-fundamentos--33-resurreccion-de-cristo`, 'estudio-cta');
  const ctaEstudio = await page.$$eval('.bcta__card', els => els.map(el => el.getAttribute('href')));
  check(
    'CTAs: un estudio enlaza su pasaje (1 Corintios 15:17) en los tres lectores',
    ctaEstudio.length === 3 && ctaEstudio.some(href => href === `${PREFIX}/exegesis?libro=1-corintios&cap=15&v=17`),
    JSON.stringify(ctaEstudio)
  );
  check('CTAs: el estudio dice qué pasaje abre', /1 Corintios 15:17/.test(await text('.bcta__lead')), (await text('.bcta__lead')).slice(0, 60));
  const ctaShot = await page.$('.bcta');
  await ctaShot.screenshot({ path: path.join(OUT, 'estudio-cta.png') });

  /* --- /biblia/ntv: rejilla por defecto, igual que /exegesis ---------------- */
  await visit(`${BASE}/biblia/ntv?libro=juan&cap=3`, 'ntv-juan3');
  const gridRows = await page.$$eval('.ntv-grid .exg-row', els => els.length);
  const gridCells = await page.$$eval('.ntv-grid .exg-row__cell--ntv', els => els.length);
  const gridSections = await page.$$eval('.ntv-grid .exg-grid__section', els => els.length);
  check(
    'NTV: rejilla por versículo por defecto',
    gridRows >= 36 && gridCells === gridRows,
    `${gridRows} filas, ${gridSections} secciones`
  );
  check(
    'NTV: la cabecera de la rejilla es el testigo',
    /Nueva Traducción Viviente/.test(await text('.ntv-grid .exg-grid__witness')),
    (await text('.ntv-grid .exg-grid__witness')).slice(0, 60)
  );

  await page.evaluate(() => document.querySelector('.ntv-fn').click());
  await page.waitForSelector('.vpop', { timeout: 4000 });
  check('NTV: la marca de nota abre su ficha', Boolean(await page.$('.vpop')), (await text('.vpop')).slice(0, 50));
  await page.keyboard.press('Escape');
  await wait(200);

  await page.select('#ntv-verse', '16');
  await wait(800);
  const ntvActive = await page.$eval('.exg-row.is-active', el => el.dataset.v).catch(() => null);
  check('NTV: el selector de versículo lo fija', ntvActive === '16', `${ntvActive}`);

  await page.evaluate(() => {
    const cell = document.querySelector('.exg-row[data-v="16"] .exg-row__cell--ntv');
    const range = document.createRange();
    range.selectNodeContents(cell);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  });
  await page.evaluate(() => document.querySelector('.exg-row[data-v="10"]').click());
  await wait(500);
  const ntvKept = await page.evaluate(() => window.location.search);
  check('NTV: marcar texto no cambia el versículo fijado', /(^|[?&])v=16(&|$)/.test(ntvKept), ntvKept);
  await page.evaluate(() => window.getSelection().removeAllRanges());

  // Conmutador: el pliego de dos páginas sigue disponible.
  await page.click('button[aria-label^="Ver como libro"]');
  await page.waitForSelector('.ntv-page', { timeout: 6000 });
  const pages = await page.$$eval('.ntv-page', els => els.length);
  const ntvVersesDom = await page.$$eval('.ntv-page .ntv-v', els => els.length);
  check('NTV: el conmutador abre el pliego de dos páginas', pages === 2 && ntvVersesDom >= 15, `${pages} pliegos, ${ntvVersesDom} versículos`);
  await page.screenshot({ path: path.join(OUT, 'ntv-pliego.png') });

  await page.click('button[aria-label^="Ver en rejilla"]');
  await page.waitForSelector('.ntv-grid', { timeout: 6000 });
  check('NTV: y vuelve a la rejilla', (await page.$$eval('.ntv-grid .exg-row', els => els.length)) >= 36);

  await page.click('#ntv-search');
  await page.type('#ntv-search', 'vida eterna');
  await page.waitForSelector('.bsearch__hit', { timeout: 4000 });
  check('NTV: buscador por palabras en el libro', (await page.$$eval('.bsearch__hit', els => els.length)) >= 2);
  await page.keyboard.press('Escape');

  /* Salmos: la sobrescritura va entera en un título, con sus notas. */
  await visit(`${BASE}/biblia/ntv?libro=salmos&cap=4`, 'ntv-salmos4');
  await page.waitForSelector('.ntv-grid', { timeout: 8000 });
  const psalm4 = await page.evaluate(() => ({
    sections: [...document.querySelectorAll('.ntv-grid .exg-grid__section')].map(el => el.textContent.trim()),
    verse1: document.querySelector('.exg-row[data-v="1"] .exg-row__cell--ntv')?.textContent.trim() || ''
  }));
  check(
    'Salmos: la sobrescritura partida se une en un solo título',
    psalm4.sections[0] === 'Para el director del coro: salmo de David; acompáñese con instrumentos de cuerda.' &&
      !/^Para el director/.test(psalm4.verse1),
    psalm4.sections[0]
  );

  await visit(`${BASE}/biblia/ntv?libro=salmos&cap=8`, 'ntv-salmos8');
  await page.waitForSelector('.ntv-grid', { timeout: 8000 });
  await page.click('.exg-grid__section .ntv-fn');
  await page.waitForSelector('.vpop', { timeout: 4000 });
  check(
    'Salmos: la nota de la sobrescritura sigue disponible',
    /Gitit/.test(await text('.vpop')),
    (await text('.vpop')).slice(0, 50)
  );
  await page.keyboard.press('Escape');

  /* --- Antiguo Testamento: NTV de 66 libros --------------------------------- */
  await visit(`${BASE}/biblia/ntv?libro=genesis&cap=1`, 'ntv-genesis1');
  await page.waitForSelector('.ntv-grid', { timeout: 8000 });
  const atSelect = await page.evaluate(() => {
    const select = document.querySelector('#ntv-book');
    return {
      groups: [...select.querySelectorAll('optgroup')].map(g => g.label),
      selected: select.value,
      chapters: document.querySelectorAll('#ntv-chapter option').length,
      rows: document.querySelectorAll('.ntv-grid .exg-row').length,
      text: document.querySelector('.ntv-grid')?.textContent || ''
    };
  });
  check(
    'AT: la NTV ofrece los 39 libros del AT y los 27 del NT',
    atSelect.groups.includes('Antiguo Testamento (39)') && atSelect.groups.includes('Nuevo Testamento (27)'),
    atSelect.groups.join(' · ')
  );
  check(
    'AT: Génesis 1 tiene 50 capítulos y 31 versículos',
    atSelect.selected === 'genesis' && atSelect.chapters === 50 && atSelect.rows === 31,
    `${atSelect.chapters} capítulos · ${atSelect.rows} filas`
  );
  check('AT: el texto de Génesis 1 se lee en la NTV', /En el principio, Dios creó/.test(atSelect.text));

  await visit(`${BASE}/exegesis?libro=genesis&cap=1`, 'exegesis-genesis1');
  await page.waitForSelector('.exg-grid', { timeout: 8000 });
  const genesis1 = await page.evaluate(() => ({
    notice: document.querySelector('.exg__notice')?.textContent || '',
    witnesses: document.querySelectorAll('.exg-grid__witness').length,
    ntvCells: document.querySelectorAll('.exg-row__cell--ntv').length,
    codexCells: document.querySelectorAll('.exg-row__cell--codex').length,
    parallel: Boolean(document.querySelector('[aria-label="Las dos columnas, versículo a versículo"]')),
    codexMode: Boolean(document.querySelector('[aria-label="Solo el Codex Sinaiticus"]')),
    chapters: document.querySelectorAll('#exg-chapter option').length
  }));
  check(
    'AT: Génesis 1 sin fragmento del Codex se lee solo en la NTV',
    genesis1.witnesses === 1 && genesis1.ntvCells > 25 && genesis1.codexCells === 0 && !genesis1.parallel && !genesis1.codexMode,
    JSON.stringify(genesis1)
  );
  check(
    'AT: el aviso explica que el Codex no conserva ese capítulo',
    /no conserva Génesis 1/i.test(genesis1.notice),
    genesis1.notice
  );

  await visit(`${BASE}/exegesis?libro=genesis&cap=21`, 'exegesis-genesis21');
  await page.waitForSelector('.exg-grid', { timeout: 8000 });
  const genesis21 = await page.evaluate(() => ({
    notice: document.querySelector('.exg__notice')?.textContent || '',
    witnesses: document.querySelectorAll('.exg-grid__witness').length,
    codex: document.querySelector('.exg-row[data-v="26"] .exg-row__cell--codex')?.textContent || '',
    ntv: document.querySelector('.exg-row[data-v="26"] .exg-row__cell--ntv')?.textContent || ''
  }));
  check(
    'AT: en un capítulo con fragmento, Génesis 21 vuelve a las dos columnas',
    genesis21.witnesses === 2 && !/no conserva Génesis 21/i.test(genesis21.notice),
    `${genesis21.witnesses} testigos · ${genesis21.notice}`
  );
  check(
    'AT: el fragmento griego de Génesis 21 se alinea con la NTV',
    /αβιμελεχ/.test(genesis21.codex) && /Abi/.test(genesis21.ntv),
    `${genesis21.codex.slice(0, 32)} · ${genesis21.ntv.slice(0, 32)}`
  );

  await visit(`${BASE}/exegesis?libro=tobit&cap=1`, 'exegesis-tobit1');
  await page.waitForSelector('.exg-grid', { timeout: 8000 });
  const tobit = await page.evaluate(() => ({
    notice: document.querySelector('.exg__notice')?.textContent || '',
    witnesses: document.querySelectorAll('.exg-grid__witness').length,
    codexCells: document.querySelectorAll('.exg-row__cell--codex').length,
    ntvCells: document.querySelectorAll('.exg-row__cell--ntv').length,
    ntvMode: Boolean(document.querySelector('[aria-label="Solo la NTV · Nueva Traducción Viviente"]')),
    text: document.querySelector('.exg-row__cell--codex')?.textContent || ''
  }));
  check(
    'Codex: Tobit es un libro solo-Codex y no muestra la NTV',
    tobit.witnesses === 1 && tobit.codexCells > 10 && tobit.ntvCells === 0 && !tobit.ntvMode,
    JSON.stringify({ ...tobit, text: tobit.text.slice(0, 30) })
  );
  check('Codex: Tobit 1:1 abre el texto griego', /τωβειθ/.test(tobit.text), tobit.text.slice(0, 42));

  await visit(`${BASE}/biblia/ntv?libro=tobit&cap=1`, 'ntv-tobit');
  const ntvTobit = await page.evaluate(() => ({
    h1: document.querySelector('h1')?.textContent.trim(),
    link: document.querySelector('.empty-state a')?.getAttribute('href')
  }));
  check(
    'AT: la NTV remite al Codex cuando el libro no está en español',
    ntvTobit.h1 === 'Tobit solo está en el Codex' && ntvTobit.link === `${PREFIX}/exegesis?libro=tobit`,
    JSON.stringify(ntvTobit)
  );

  await visit(`${BASE}/exegesis?libro=salmos&cap=151`, 'exegesis-salmos151');
  await page.waitForSelector('.exg-grid', { timeout: 8000 });
  const psalm151 = await page.evaluate(() => ({
    notice: [...document.querySelectorAll('.exg__notice')].map(el => el.textContent.trim()),
    witnesses: document.querySelectorAll('.exg-grid__witness').length,
    codexCells: document.querySelectorAll('.exg-row__cell--codex').length,
    ntvCells: document.querySelectorAll('.exg-row__cell--ntv').length,
    chapter151: Boolean(document.querySelector('#exg-chapter option[value="151"]'))
  }));
  check(
    'AT: el Salmo 151 solo existe en el Codex y se puede abrir',
    psalm151.chapter151 && psalm151.witnesses === 1 && psalm151.codexCells > 5 && psalm151.ntvCells === 0,
    JSON.stringify(psalm151)
  );
  check(
    'AT: Salmos avisa de la numeración de la Septuaginta',
    psalm151.notice.some(n => /Salmo 151/.test(n)),
    psalm151.notice.join(' · ')
  );

  await visit(`${BASE}/exegesis?libro=2-esdras&cap=1`, 'exegesis-2esdras1');
  await page.waitForSelector('.exg-grid', { timeout: 8000 });
  check(
    'AT: 2 Esdras avisa de que reúne Esdras y Nehemías',
    /reúne Esdras y Nehemías/.test(await text('.exg__notice')),
    (await text('.exg__notice')).slice(0, 80)
  );

  /* Buscador global del AT desde el lector NTV. */
  await visit(`${BASE}/biblia/ntv?libro=genesis&cap=1`, 'ntv-genesis-buscar');
  await page.waitForSelector('.ntv-grid', { timeout: 8000 });
  await page.click('#ntv-search');
  await page.type('#ntv-search', 'principio');
  await page.waitForSelector('.bsearch__hit', { timeout: 4000 });
  check('Buscador AT: encuentra en el libro abierto', (await page.$$eval('.bsearch__hit', els => els.length)) >= 2);
  await page.click('.bsearch__more');
  await page.waitForFunction(
    () => /Todo el Antiguo Testamento/.test(document.querySelector('.bsearch__scope')?.textContent || ''),
    { timeout: 60000 }
  );
  const atGlobal = await page.$$eval('.bsearch__hit', els => els.slice(0, 3).map(el => el.textContent.replace(/\s+/g, ' ').trim()));
  check(
    'Buscador AT: la búsqueda global incluye Génesis 1:1',
    atGlobal.some(hit => /^Gn 1:1/.test(hit)),
    atGlobal.join(' · ').slice(0, 100)
  );
  const atOther = await text('.bsearch__more');
  check('Buscador AT: ofrece saltar al Nuevo Testamento', /Nuevo Testamento/.test(atOther), atOther);
  await page.evaluate(() => document.querySelector('.bsearch__more').click());
  await page.waitForFunction(
    () => /Todo el Nuevo Testamento/.test(document.querySelector('.bsearch__scope')?.textContent || ''),
    { timeout: 60000 }
  );
  const ntGlobal = await page.$$eval('.bsearch__hit', els => els.slice(0, 3).map(el => el.textContent.replace(/\s+/g, ' ').trim()));
  check(
    'Buscador AT: el salto al NT cambia el índice y devuelve resultados',
    ntGlobal.length > 0 && ntGlobal.every(hit => !/^Gn /.test(hit)),
    ntGlobal.join(' · ').slice(0, 100)
  );
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

  const genesisMobile = await noOverflow(`${BASE}/biblia/ntv?libro=genesis&cap=1`, 'ntv-genesis1-movil');
  check(
    'AT (móvil): Génesis 1 sin desbordamiento horizontal',
    genesisMobile.scroll <= genesisMobile.client + 1,
    `${genesisMobile.scroll}px vs ${genesisMobile.client}px`
  );

  const tobitMobile = await noOverflow(`${BASE}/exegesis?libro=tobit&cap=1`, 'exegesis-tobit1-movil');
  check(
    'Codex (móvil): Tobit se lee a una columna sin desbordamiento',
    tobitMobile.scroll <= tobitMobile.client + 1 && tobitMobile.cells > 5,
    `${tobitMobile.scroll}px vs ${tobitMobile.client}px · ${tobitMobile.cells} celdas`
  );

  await browser.close();
}

/* -------------------------------------------------------------------------- */

const failed = results.filter(r => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} comprobaciones superadas`);
await writeFile(path.join(OUT, 'qa-exegesis.json'), JSON.stringify(results, null, 2), 'utf8').catch(() => {});
if (failed.length) process.exitCode = 1;
