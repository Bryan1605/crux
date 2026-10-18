/**
 * Genera el índice de búsqueda por palabras de la exégesis.
 *
 *   node scripts/build-exegesis-search.mjs [--report]
 *
 * Lee `public/textos/exegesis/ntv/<libro>.json` y `.../codex/<libro>.json` y
 * escribe `public/textos/exegesis/buscar.json` con el texto de cada versículo
 * indexado por libro y capítulo:
 *
 *   { "ntv": { "juan": { "3": ["…v1…", "…v2…", null, "…v4…"] } }, "codex": { … } }
 *
 * El array de cada capítulo está indexado por número de versículo menos uno, de
 * modo que los huecos (versículos que un testigo no trae) quedan como `null`.
 * El navegador lo carga solo cuando se busca en todo el Nuevo Testamento y se
 * encarga del plegado (acentos, mayúsculas, sigma final) en `src/lib/bibleSearch.js`.
 */
import { readFile, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { NT_BOOKS } from '../src/data/exegesis.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'public/textos/exegesis');
const OUT = path.join(DIR, 'buscar.json');
const REPORT = process.argv.includes('--report');

const readJson = async file => {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch {
    return null;
  }
};

const index = { ntv: {}, codex: {} };
const counts = { ntv: 0, codex: 0 };

for (const meta of NT_BOOKS) {
  for (const witness of ['ntv', 'codex']) {
    const book = await readJson(path.join(DIR, witness, `${meta.id}.json`));
    if (!book || !book.chapters?.length) continue;
    const chapters = {};
    for (const chapter of book.chapters) {
      const verses = [];
      for (const verse of chapter.verses) {
        const text = witness === 'codex' ? verse.grc : verse.text;
        if (!text) continue;
        verses[verse.n - 1] = text;
        counts[witness] += 1;
      }
      if (verses.length) chapters[String(chapter.num)] = verses;
    }
    if (Object.keys(chapters).length) index[witness][meta.id] = chapters;
  }
}

await writeFile(OUT, JSON.stringify(index));
const size = (await stat(OUT)).size;

console.log(
  `Búsqueda → ${Object.keys(index.ntv).length} libros · NTV ${counts.ntv} vers. · Codex ${counts.codex} vers. · ${(size / 1024 / 1024).toFixed(2)} MB`
);

if (REPORT) {
  for (const witness of ['ntv', 'codex']) {
    const books = Object.keys(index[witness]);
    console.log(`  ${witness}: ${books.length} libros — ${books.slice(0, 6).join(', ')}…`);
  }
}
