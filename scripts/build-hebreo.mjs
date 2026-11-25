/**
 * Construye los JSON estáticos del Antiguo Testamento hebreo/arameo en
 * `public/textos/hebreo/` desde la caché local de OSHB (`openscriptures/morphhb`).
 *
 *   node scripts/build-hebreo.mjs
 *
 * Salidas:
 *   - `public/textos/hebreo/<id>.json` (39 libros, sin normalizar NFC/NFD)
 *   - `public/textos/hebreo/index.json` (metadatos, licencias, totales verificados)
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { HEBREW_ATTRIBUTION, HEBREW_BOOKS, HEBREW_SOURCE_URL } from '../src/lib/hebrew.js';
import { parseOsisBook, parseVerseMapDiffs } from './hebreo-lib.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = path.join(ROOT, 'src', 'assets', 'texts', '.cache-hebreo');
const WLC_DIR = path.join(CACHE, 'wlc');
const NTV_DIR = path.join(ROOT, 'public', 'textos', 'exegesis', 'ntv');
const OUT_DIR = path.join(ROOT, 'public', 'textos', 'hebreo');

await mkdir(OUT_DIR, { recursive: true });

let meta;
try {
  meta = JSON.parse(await readFile(path.join(CACHE, 'meta.json'), 'utf8'));
} catch {
  throw new Error('Falta la caché de OSHB. Ejecuta primero: node scripts/fetch-hebreo.mjs');
}

const verseMapXml = await readFile(path.join(WLC_DIR, 'VerseMap.xml'), 'utf8');
const { diffChapters: vmDiffChapters } = parseVerseMapDiffs(verseMapXml);

const totals = {
  books: 0,
  chapters: 0,
  verses: 0,
  words: 0,
  aramaicBooks: 0,
  aramaicVerses: 0,
  aramaicWords: 0,
  ketivQere: 0,
  ketivPlusQere: 0,
  ketivOnly: 0,
  qereOnly: 0,
  ntvAlignedChapters: 0,
  bytes: 0
};

const indexBooks = [];

for (const b of HEBREW_BOOKS) {
  const xmlPath = path.join(WLC_DIR, `${b.osis}.xml`);
  const ntvPath = path.join(NTV_DIR, `${b.id}.json`);
  const [xml, ntvRaw] = await Promise.all([
    readFile(xmlPath, 'utf8'),
    readFile(ntvPath, 'utf8')
  ]);
  const ntvBook = JSON.parse(ntvRaw);
  const { book, stats } = parseOsisBook(xml, b, ntvBook, vmDiffChapters);

  const json = JSON.stringify(book);
  const outPath = path.join(OUT_DIR, `${b.id}.json`);
  await writeFile(outPath, json, 'utf8');
  const bytes = Buffer.byteLength(json, 'utf8');

  totals.books += 1;
  totals.chapters += stats.chapters;
  totals.verses += stats.verses;
  totals.words += stats.words;
  if (stats.aramaicVerses > 0) totals.aramaicBooks += 1;
  totals.aramaicVerses += stats.aramaicVerses;
  totals.aramaicWords += stats.aramaicWords;
  totals.ketivQere += stats.ketivQere;
  totals.ketivPlusQere += stats.ketivPlusQere;
  totals.ketivOnly += stats.ketivOnly;
  totals.qereOnly += stats.qereOnly;
  totals.ntvAlignedChapters += stats.ntvAlignedChapters;
  totals.bytes += bytes;

  indexBooks.push({
    id: b.id,
    osis: b.osis,
    name: b.name,
    hebrewName: b.hebrewName,
    abbr: b.abbr,
    order: b.order,
    chapters: book.chapters.map(c => c.num),
    verses: stats.verses,
    words: stats.words,
    aramaicVerses: stats.aramaicVerses,
    aramaicWords: stats.aramaicWords,
    ketivQere: stats.ketivQere,
    ntvAlignedChapters: stats.ntvAlignedChapters,
    ntvDiffChapters: stats.ntvDiffChapters,
    bytes
  });
}

const index = {
  generated: new Date().toISOString().slice(0, 10),
  phase: 1,
  normalization: 'none',
  source: {
    project: 'Open Scriptures Hebrew Bible (OSHB)',
    baseText: 'Westminster Leningrad Codex (WLC, dominio público)',
    markupLicense: 'CC BY 4.0',
    font: 'Ezra SIL 2.51 (SIL Open Font License 1.1)',
    repo: meta.repo || 'openscriptures/morphhb',
    url: HEBREW_SOURCE_URL,
    commit: meta.sha,
    commitDate: meta.date,
    attribution: HEBREW_ATTRIBUTION
  },
  totals,
  books: indexBooks
};

const indexJson = `${JSON.stringify(index, null, 2)}\n`;
await writeFile(path.join(OUT_DIR, 'index.json'), indexJson, 'utf8');

console.log(
  `Hebreo: ${totals.books} libros · ${totals.chapters} caps · ${totals.verses.toLocaleString('es')} vv · ` +
    `${totals.words.toLocaleString('es')} palabras · ${(totals.bytes / 1024 / 1024).toFixed(2)} MB`
);
console.log(
  `Arameo: ${totals.aramaicBooks} libros · ${totals.aramaicVerses} vv · ${totals.aramaicWords} palabras`
);
console.log(
  `Ketiv/Qere: ${totals.ketivQere} casos (${totals.ketivPlusQere} K+Q, ${totals.ketivOnly} solo K, ${totals.qereOnly} solo Q)`
);
console.log(
  `Alineación NTV exacta: ${totals.ntvAlignedChapters}/${totals.chapters} capítulos`
);
