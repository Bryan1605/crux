/**
 * Genera los mapas de lemas del Codex (palabra a palabra).
 *
 * Para cada versículo alinea las palabras del Codex con MorphGNT (lema,
 * morfología y categoría) y añade el número Strong de TBESG. El resultado se
 * publica en `public/textos/exegesis/lemas/<libro>.json`; el informe de
 * cobertura queda en la caché (ignorada por git).
 *
 * Uso:
 *   node scripts/build-lemas.mjs
 *   node scripts/build-lemas.mjs --book=juan
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  parseTbesg,
  indexTbesg,
  parseMorphGnt,
  prepareCodexWords,
  mapVerse,
  indexMorphForms,
  collectStats,
  topLemmas
} from './lexico-lib.mjs';
import { greekWords, foldGreek } from '../src/lib/greek.js';
import {
  CACHE,
  LEMAS_DIR,
  MORPH_DIR,
  MORPHGNT_FILES,
  TBESG_PATH
} from './lexico-files.mjs';

const only = process.argv.find(arg => arg.startsWith('--book='))?.split('=')[1];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

const tbesg = indexTbesg(parseTbesg(fs.readFileSync(TBESG_PATH, 'utf8')));
const morphByBook = new Map();
for (const [file, book] of MORPHGNT_FILES) {
  morphByBook.set(book, parseMorphGnt(fs.readFileSync(path.join(MORPH_DIR, file), 'utf8')));
}
const formIndex = indexMorphForms([...morphByBook.values()]);
const books = [];
const unmatched = new Map();
const strongless = new Map();
let totalVerses = 0;
let totalTokens = 0;
let totalMapped = 0;
let totalStrong = 0;
let totalNs = 0;

for (const [file, book] of MORPHGNT_FILES) {
  if (only && book !== only) continue;
  const codexPath = path.join('public/textos/exegesis/codex', `${book}.json`);
  if (!fs.existsSync(codexPath)) {
    console.warn(`· ${book}: sin Codex, se omite`);
    continue;
  }
  const codex = readJson(codexPath);
  const morph = morphByBook.get(book);
  const verses = {};
  let tokens = 0;
  let mapped = 0;
  let strong = 0;
  let ns = 0;
  let versesCount = 0;
  const missedVerses = [];

  for (const chapter of codex.chapters) {
    for (const verse of chapter.verses) {
      versesCount += 1;
      const key = `${chapter.num}:${verse.n}`;
      const words = prepareCodexWords(greekWords(verse.grc));
      const morphWords = morph.get(key) || [];
      const map = mapVerse(words, morphWords, tbesg, formIndex);
      verses[key] = map;
      let verseMapped = 0;
      for (let i = 0; i < words.length; i += 1) {
        tokens += 1;
        const entry = map[i];
        if (!entry) {
          const missKey = `${book}|${words[i].plain}`;
          const item = unmatched.get(missKey) || {
            book,
            chapter: chapter.num,
            verse: verse.n,
            word: words[i].plain,
            count: 0
          };
          item.count += 1;
          unmatched.set(missKey, item);
          continue;
        }
        mapped += 1;
        verseMapped += 1;
        if (entry[1]) strong += 1;
        if (entry[3]) ns += 1;
        if (!entry[1]) {
          const item = strongless.get(foldGreek(entry[0])) || {
            lemma: entry[0],
            pos: entry[4] || '',
            count: 0
          };
          item.count += 1;
          strongless.set(foldGreek(entry[0]), item);
        }
      }
      if (words.length && !verseMapped) missedVerses.push(key);
    }
  }

  fs.mkdirSync(LEMAS_DIR, { recursive: true });
  const outPath = path.join(LEMAS_DIR, `${book}.json`);
  fs.writeFileSync(outPath, JSON.stringify({ version: 1, book, verses }));
  const coverage = tokens ? mapped / tokens : 0;
  const strongCoverage = tokens ? strong / tokens : 0;
  books.push({
    book,
    verses: versesCount,
    tokens,
    mapped,
    coverage: Number(coverage.toFixed(4)),
    strong,
    strongCoverage: Number(strongCoverage.toFixed(4)),
    ns,
    bytes: fs.statSync(outPath).size,
    missedVerses
  });
  totalVerses += versesCount;
  totalTokens += tokens;
  totalMapped += mapped;
  totalStrong += strong;
  totalNs += ns;
  console.log(
    `· ${book.padEnd(20)} ${String(versesCount).padStart(4)} v. ` +
      `${String(tokens).padStart(6)} pal. ` +
      `${(coverage * 100).toFixed(1).padStart(5)}% mapa ` +
      `${(strongCoverage * 100).toFixed(1).padStart(5)}% Strong` +
      (missedVerses.length ? `  ⚠ ${missedVerses.length} versículos sin mapa` : '')
  );
}

const report = {
  source: {
    codex: 'public/textos/exegesis/codex',
    morphology: 'MorphGNT (CC BY-SA 3.0)',
    strong: 'TBESG / STEPBible (CC BY 4.0)'
  },
  totals: {
    books: books.length,
    verses: totalVerses,
    tokens: totalTokens,
    mapped: totalMapped,
    coverage: totalTokens ? Number((totalMapped / totalTokens).toFixed(4)) : 0,
    strong: totalStrong,
    strongCoverage: totalTokens ? Number((totalStrong / totalTokens).toFixed(4)) : 0,
    ns: totalNs
  },
  books,
  unmatched: [...unmatched.values()].sort((a, b) => b.count - a.count),
  strongless: [...strongless.values()].sort((a, b) => b.count - a.count),
  topLemmas: topLemmas(collectStats(books.map(b => ({
    codex: readJson(path.join('public/textos/exegesis/codex', `${b.book}.json`)),
    map: readJson(path.join(LEMAS_DIR, `${b.book}.json`))
  }))), 300)
};
fs.mkdirSync(CACHE, { recursive: true });
fs.writeFileSync(path.join(CACHE, 'alignment-report.json'), JSON.stringify(report, null, 2));

console.log(
  `\nTotal: ${report.totals.books} libros, ${totalVerses} versículos, ${totalTokens} palabras, ` +
    `${(report.totals.coverage * 100).toFixed(2)}% con lema, ` +
    `${(report.totals.strongCoverage * 100).toFixed(2)}% con Strong, ${totalNs} nomina sacra.`
);
console.log(`Informe: ${path.relative(process.cwd(), path.join(CACHE, 'alignment-report.json'))}`);
