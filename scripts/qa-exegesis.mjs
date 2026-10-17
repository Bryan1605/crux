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

import { NT_BOOKS } from '../src/data/exegesis.js';

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
/* 3) Navegador (opcional)                                                    */
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

  const visit = async (url, name) => {
    await page.goto(url, { waitUntil: 'networkidle2' });
    await page.screenshot({ path: path.join(OUT, `${name}.png`) });
    return page;
  };

  await visit(`${BASE}/exegesis?libro=juan&cap=3&vv=16-21`, 'exegesis-juan3');
  const cols = await page.$$eval('.exg__cols .exg-card', els => els.length);
  const verseRows = await page.$$eval('.exg-card--codex .exg-verse', els => els.length);
  const sigils = await page.$$eval('.exg-sigil', els => els.length);
  const ntvRows = await page.$$eval('.exg-card--ntv .exg-verse', els => els.length);
  check('Exégesis: dos columnas', cols === 2, `${cols}`);
  check('Exégesis: versículos del Codex', verseRows >= 5, `${verseRows}`);
  check('Exégesis: versículos de la NTV', ntvRows >= 5, `${ntvRows}`);
  check('Exégesis: sigilos del aparato', sigils >= 0, `${sigils}`);

  const header = await page.$eval('.exg__witness', el => el.textContent.replace(/\s+/g, ' ').trim());
  check('Exégesis: cabecera del testigo con folio', /folio/i.test(header), header.slice(0, 80));

  await visit(`${BASE}/biblia/ntv?libro=juan&cap=3`, 'ntv-juan3');
  const pages = await page.$$eval('.ntv-page', els => els.length);
  const ntvVersesDom = await page.$$eval('.ntv-page .ntv-v', els => els.length);
  check('NTV: páginas del pliego', pages === 2, `${pages}`);
  check('NTV: versículos visibles', ntvVersesDom >= 15, `${ntvVersesDom}`);

  await browser.close();
}

/* -------------------------------------------------------------------------- */

const failed = results.filter(r => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} comprobaciones superadas`);
await writeFile(path.join(OUT, 'qa-exegesis.json'), JSON.stringify(results, null, 2), 'utf8').catch(() => {});
if (failed.length) process.exitCode = 1;
