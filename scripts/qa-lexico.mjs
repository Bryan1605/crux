/**
 * QA del diccionario griego → español y de los mapas de lemas del Codex.
 *
 *   node scripts/qa-lexico.mjs
 *
 * Comprueba que el léxico publicado sea coherente con su fuente editable y que
 * cada palabra del Codex tenga exactamente una entrada en el mapa de su libro,
 * en el mismo orden que usa el tokenizador de la web.
 */
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { NT_BOOKS } from '../src/data/exegesis.js';
import { greekLetter, greekWords } from '../src/lib/greek.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'public/textos/exegesis');
const LEMAS = path.join(DIR, 'lemas');
const SOURCE = path.join(ROOT, 'content/lexico/griego.json');

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok: Boolean(ok), detail });
  const mark = ok ? '\u001b[32mOK  \u001b[0m' : '\u001b[31mFALLA\u001b[0m';
  console.log(`${mark} ${name}${detail ? ` — ${detail}` : ''}`);
};

const readJson = async file => JSON.parse(await readFile(file, 'utf8'));

/* -------------------------------------------------------------------------- */
/* 1) Diccionario compilado                                                   */
/* -------------------------------------------------------------------------- */

const lex = await readJson(path.join(DIR, 'lexico.json'));
const entries = Array.isArray(lex.entries) ? lex.entries : [];

check('Diccionario: 250 entradas', lex.count === 250 && entries.length === 250, `${entries.length}`);
check('Diccionario: versión y cobertura', lex.version === 1 && lex.coverage > 0.7, `v${lex.version} · ${(lex.coverage * 100).toFixed(2)} %`);

const strongs = entries.map(entry => entry.strong);
const lemmas = entries.map(entry => entry.lemma);
check('Diccionario: Strong únicos', new Set(strongs).size === strongs.length);
check('Diccionario: lemas únicos', new Set(lemmas).size === lemmas.length);

const malformed = entries.filter(
  entry =>
    !/^G\d{4}$/.test(entry.strong) ||
    !entry.lemma ||
    !entry.translit ||
    !entry.gloss ||
    !entry.posLabel ||
    !Number.isInteger(entry.count) ||
    entry.count <= 0
);
check('Diccionario: todas las fichas están completas', malformed.length === 0, malformed.slice(0, 3).map(e => e.strong).join(' · '));

const sorted = entries.every((entry, i) => i === 0 || entries[i - 1].count >= entry.count);
check('Diccionario: ordenado por frecuencia', sorted, `${entries[0]?.count} → ${entries.at(-1)?.count}`);

const countSum = entries.reduce((sum, entry) => sum + entry.count, 0);
check(
  'Diccionario: la cobertura cuadra con las apariciones',
  Math.abs(countSum / lex.tokens - lex.coverage) < 0.0001,
  `${countSum} de ${lex.tokens} palabras`
);

const letters = [...new Set(entries.map(entry => greekLetter(entry.lemma)))].sort();
check(
  'Diccionario: el índice de letras cubre todos los lemas',
  lex.letters.join('') === letters.join('') && letters.every(letter => lex.letters.includes(letter)),
  `${len(lex.letters)} letras`
);

function len(value) {
  return [...(value || '')].length;
}

const source = await readJson(SOURCE);
const glossKeys = Object.keys(source.glosas || {});
const noteKeys = Object.keys(source.notas || {});
const missingGloss = entries.filter(entry => !source.glosas?.[entry.strong]);
const changedGloss = entries.filter(entry => source.glosas?.[entry.strong] !== entry.gloss);
check('Fuente: una glosa por entrada', glossKeys.length === 250 && missingGloss.length === 0, `${glossKeys.length} glosas`);
check('Fuente: las glosas publicadas son las editadas', changedGloss.length === 0, changedGloss.slice(0, 3).map(e => e.strong).join(' · '));
check(
  'Fuente: las notas apuntan a Strong publicados',
  noteKeys.every(key => glossKeys.includes(key)),
  `${noteKeys.length} notas`
);
check(
  'Diccionario: sin glosas vacías ni restos de marcado',
  entries.every(entry => !/[<>]|\uFFFD|\bG\d{4}\b/.test(entry.gloss)),
  entries.filter(entry => /[<>]|\uFFFD|\bG\d{4}\b/.test(entry.gloss)).slice(0, 3).map(e => e.strong).join(' · ')
);
check(
  'Diccionario: fuentes y licencias declaradas',
  Boolean(lex.source?.glosses && lex.source?.morphology && lex.source?.note),
  lex.source?.glosses
);

/* -------------------------------------------------------------------------- */
/* 2) Mapas de lemas y alineación con el Codex                                */
/* -------------------------------------------------------------------------- */

const files = (await readdir(LEMAS)).filter(file => file.endsWith('.json')).sort();
check('Lemas: un mapa por libro del NT', files.length === 27 && NT_BOOKS.every(book => files.includes(`${book.id}.json`)), `${files.length} ficheros`);

let words = 0;
let lemmaAligned = 0;
let strongAligned = 0;
let nsCount = 0;
const badMaps = [];

for (const meta of NT_BOOKS) {
  const [map, codex] = await Promise.all([
    readJson(path.join(LEMAS, `${meta.id}.json`)),
    readJson(path.join(DIR, 'codex', `${meta.id}.json`))
  ]);

  if (map.version !== 1 || map.book !== meta.id) {
    badMaps.push(`${meta.id}: cabecera`);
    continue;
  }

  const seen = new Set();
  for (const chapter of codex.chapters) {
    for (const verse of chapter.verses) {
      const key = `${chapter.num}:${verse.n}`;
      const expected = greekWords(verse.grc).length;
      const row = map.verses[key];
      seen.add(key);
      if (!Array.isArray(row)) {
        badMaps.push(`${meta.id} ${key}: falta`);
        continue;
      }
      if (row.length !== expected) {
        badMaps.push(`${meta.id} ${key}: ${row.length} vs ${expected}`);
        continue;
      }
      for (const entry of row) {
        words += 1;
        if (entry === null) continue;
        if (!Array.isArray(entry) || entry.length !== 5) {
          badMaps.push(`${meta.id} ${key}: entrada`);
          continue;
        }
        const [lemma, strong, parse, ns, pos] = entry;
        if (lemma) lemmaAligned += 1;
        else badMaps.push(`${meta.id} ${key}: sin lema`);
        if (strong) strongAligned += 1;
        if (strong && !/^G\d{4,5}$/.test(strong)) badMaps.push(`${meta.id} ${key}: Strong ${strong}`);
        if (ns) nsCount += 1;
        if (parse && parse.length !== 8) badMaps.push(`${meta.id} ${key}: parse ${parse}`);
        if (!pos) badMaps.push(`${meta.id} ${key}: categoría`);
      }
    }
  }

  const extra = Object.keys(map.verses).filter(key => !seen.has(key));
  if (extra.length) badMaps.push(`${meta.id}: ${extra.length} versículos de más`);
}

check('Lemas: los índices coinciden con el tokenizador', badMaps.length === 0, badMaps.slice(0, 4).join(' · '));
check('Lemas: todas las palabras tienen lema', lemmaAligned / words > 0.99, `${((lemmaAligned / words) * 100).toFixed(2)} %`);
check('Lemas: todas las palabras tienen Strong', strongAligned / words > 0.99, `${((strongAligned / words) * 100).toFixed(2)} %`);
check('Lemas: el total coincide con el diccionario', words === lex.tokens, `${words} palabras`);
check('Lemas: nomina sacra contabilizados', nsCount > 4000, `${nsCount}`);

/* -------------------------------------------------------------------------- */
/* 3) Resultado                                                               */
/* -------------------------------------------------------------------------- */

const failed = results.filter(result => !result.ok);
console.log('');
if (failed.length) {
  console.error(`Diccionario: ${failed.length} comprobación(es) fallida(s) de ${results.length}.`);
  process.exitCode = 1;
} else {
  console.log(`Diccionario: ${results.length} comprobaciones correctas · ${lex.count} lemas · ${((lemmaAligned / words) * 100).toFixed(2)} % alineado.`);
}
