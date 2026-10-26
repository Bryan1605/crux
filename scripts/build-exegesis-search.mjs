/**
 * Genera los índices de búsqueda por palabras de la exégesis, partidos por
 * testamento.
 *
 *   node scripts/build-exegesis-search.mjs [--report]
 *
 * Lee `public/textos/exegesis/ntv/<libro>.json` y `.../codex/<libro>.json` y
 * escribe:
 *
 *   public/textos/exegesis/buscar-at.json
 *   public/textos/exegesis/buscar-nt.json
 *
 * Cada uno tiene la forma:
 *
 *   { "ntv": { "genesis": { "1": ["…v1…", "…v2…"] } }, "codex": { … } }
 *
 * El array de cada capítulo está indexado por número de versículo menos uno, de
 * modo que los huecos (versículos que un testigo no trae) quedan como `null`.
 * El navegador carga solo el testamento en el que se está buscando y se encarga
 * del plegado (acentos, mayúsculas, sigma final) en `src/lib/bibleSearch.js`.
 */
import { readFile, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { CODEX_EXTRA_BOOKS, NT_BOOKS, OT_BOOKS } from '../src/data/exegesis.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'public/textos/exegesis');
const REPORT = process.argv.includes('--report');

const readJson = async file => {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch {
    return null;
  }
};

async function build(books, name) {
  const index = { ntv: {}, codex: {} };
  const counts = { ntv: 0, codex: 0 };

  for (const meta of books) {
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

  const file = path.join(DIR, `buscar-${name}.json`);
  await writeFile(file, JSON.stringify(index));
  const size = (await stat(file)).size;
  console.log(
    `Búsqueda ${name.toUpperCase()} → ${Object.keys(index.ntv).length} libros NTV · ${Object.keys(index.codex).length} Codex · NTV ${counts.ntv} vers. · Codex ${counts.codex} vers. · ${(size / 1024 / 1024).toFixed(2)} MB`
  );
  return { index, counts };
}

const at = await build([...OT_BOOKS, ...CODEX_EXTRA_BOOKS], 'at');
const nt = await build(NT_BOOKS, 'nt');

if (REPORT) {
  for (const [name, { index }] of [['AT', at], ['NT', nt]]) {
    for (const witness of ['ntv', 'codex']) {
      const books = Object.keys(index[witness]);
      console.log(`  ${name} ${witness}: ${books.length} libros — ${books.slice(0, 6).join(', ')}…`);
    }
  }
}
