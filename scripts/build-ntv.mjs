/**
 * Genera los datos de la NTV para la vista de exégesis.
 *
 *   node scripts/build-ntv.mjs [--report]
 *
 * Lee el volcado de la NTV (`src/assets/texts/nueva-traduccion-viviente.md`),
 * extrae los 66 libros de la Biblia y escribe un JSON por libro en
 * `public/textos/exegesis/ntv/<libro>.json`.
 */
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseNtv } from './exegesis-lib.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src/assets/texts/nueva-traduccion-viviente.md');
const OUT = path.join(ROOT, 'public/textos/exegesis/ntv');
const REPORT = process.argv.includes('--report');

const raw = await readFile(SRC, 'utf8');
const { books, notes, stats } = parseNtv(raw);

// Adjunta a cada versículo la lista de ids de nota que cita en su texto.
const NOTE_RE = /\[([a-z]{1,2})\]/g;
for (const book of books) {
  book.notes = Object.fromEntries(notes.get(book.id) || []);
  for (const chap of book.chapters) {
    for (const v of chap.verses) {
      const found = [...v.text.matchAll(NOTE_RE)].map(m => m[1]).filter(id => book.notes[id]);
      if (found.length) v.notes = [...new Set(found)];
    }
  }
}

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

for (const book of books) {
  const payload = {
    id: book.id,
    name: book.name,
    abbr: book.abbr,
    order: book.order,
    codexNo: book.codexNo,
    chapters: book.chapters,
    notes: book.notes
  };
  await writeFile(path.join(OUT, `${book.id}.json`), JSON.stringify(payload) + '\n', 'utf8');
}

console.log(`NTV → ${books.length} libros · ${stats.chapters} capítulos · ${stats.verses} versículos · ${stats.sections} secciones · ${stats.notes} notas`);

if (REPORT) {
  console.log('\nLibros detectados:');
  console.log(books.map(b => `${b.abbr}(${b.chapters.length})`).join('  '));

  const juan = books.find(b => b.id === 'juan');
  if (juan) {
    const c3 = juan.chapters.find(c => c.num === 3);
    console.log('\nJuan 3 · secciones:', c3.sections.map(s => `v${s.verse} «${s.title}»`).join(' | '));
    for (const v of c3.verses.filter(v => v.n >= 16 && v.n <= 21)) {
      console.log(`  ${v.n}. ${v.text}`);
    }
    console.log('  notas de Juan:', Object.keys(juan.notes).join(','));
  }

  const vv = books.flatMap(b => b.chapters.flatMap(c => c.verses.map(v => ({ b: b.abbr, c: c.num, v, len: v.text.length }))));
  const short = vv.filter(x => x.len < 12);
  console.log(`\nVersículos sospechosamente cortos (<12): ${short.length}`);
  console.log(short.slice(0, 8).map(x => `${x.b} ${x.c}:${x.v.n} «${x.v.text}»`).join('\n'));

  const headingish = vv.filter(x => x.v.text.length <= 64 && /^[A-ZÁÉÍÓÚÑ][^.!?]*$/.test(x.v.text) && x.v.text.split(' ').length <= 6);
  console.log(`\nVersículos con pinta de encabezado: ${headingish.length}`);
  console.log(headingish.slice(0, 10).map(x => `${x.b} ${x.c}:${x.v.n} «${x.v.text}»`).join('\n'));
}
