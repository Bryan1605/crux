/**
 * Compone el índice de la vista de exégesis a partir de los JSON ya generados.
 *
 *   node scripts/build-exegesis-index.mjs
 *
 * Lee `public/textos/exegesis/ntv/<libro>.json` y `.../codex/<libro>.json` y
 * escribe `public/textos/exegesis/index.json` con:
 *   - los testigos (Codex + NTV) y su atribución,
 *   - por libro: capítulos de la NTV y capítulos presentes en el Codex.
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { NT_BOOKS } from '../src/data/exegesis.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'public/textos/exegesis');

const readJson = async file => JSON.parse(await readFile(file, 'utf8'));

const books = [];
let codexTotal = 0;
let ntvTotal = 0;

for (const meta of NT_BOOKS) {
  let ntv = null;
  let codex = null;
  try {
    ntv = await readJson(path.join(DIR, 'ntv', `${meta.id}.json`));
  } catch { /* sin NTV */ }
  try {
    codex = await readJson(path.join(DIR, 'codex', `${meta.id}.json`));
  } catch { /* el Codex no conserva este libro */ }

  const ntvChapters = ntv ? ntv.chapters.map(c => c.num) : [];
  const codexChapters = codex ? codex.chapters.map(c => c.num) : [];
  const ntvVerses = ntv ? ntv.chapters.reduce((a, c) => a + c.verses.length, 0) : 0;
  const codexVerses = codex ? codex.chapters.reduce((a, c) => a + c.verses.length, 0) : 0;

  ntvTotal += ntvVerses;
  codexTotal += codexVerses;

  books.push({
    id: meta.id,
    name: meta.name,
    abbr: meta.abbr,
    order: meta.order,
    codexNo: meta.codexNo,
    ntv: { chapters: ntvChapters, verses: ntvVerses },
    codex: { chapters: codexChapters, verses: codexVerses },
    // Capítulos que se pueden leer en paralelo (están en los dos testigos).
    shared: ntvChapters.filter(n => codexChapters.includes(n))
  });
}

const index = {
  generatedAt: new Date().toISOString().slice(0, 10),
  witnesses: [
    {
      id: 'codex',
      name: 'Codex Sinaiticus',
      short: 'Codex',
      language: 'griego',
      date: 's. IV (c. 330–360)',
      kind: 'Transcripción diplomática con aparato crítico',
      source: 'Codex Sinaiticus Project — codexsinaiticus.org',
      credit: 'British Library · Universität Leipzig · St. Catherine’s Monastery (Sinaí) · National Library of Russia',
      license: 'Uso personal, educativo y no comercial, con atribución.'
    },
    {
      id: 'ntv',
      name: 'Nueva Traducción Viviente',
      short: 'NTV',
      language: 'español',
      date: '2009',
      kind: 'Traducción con notas del traductor',
      source: 'NTV (Tyndale House)'
    }
  ],
  books,
  totals: {
    books: books.filter(b => b.ntv.verses).length,
    ntvVerses: ntvTotal,
    codexVerses: codexTotal,
    parallels: books.reduce((a, b) => a + b.shared.length, 0)
  }
};

await writeFile(path.join(DIR, 'index.json'), JSON.stringify(index) + '\n', 'utf8');

const withCodex = books.filter(b => b.codex.verses);
console.log(`Índice → ${books.length} libros · NTV ${ntvTotal} vers. · Codex ${codexTotal} vers.`);
console.log(`Libros con Codex: ${withCodex.map(b => `${b.abbr}(${b.codex.chapters.length})`).join(' ') || '—'}`);
console.log(`Capítulos en paralelo: ${index.totals.parallels}`);
