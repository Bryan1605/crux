/**
 * QA del diccionario griego → español (V2), respaldo base y mapas de lemas del Codex.
 *
 *   node scripts/qa-lexico.mjs
 *
 * Comprueba que el léxico V2 publicado sea coherente con su fuente editable,
 * que los homógrafos clave (εἰς/εἷς, τίς/τις) estén separados, que existan
 * citas válidas y respaldo base del NT, y que cada palabra del Codex coincida
 * en orden con el tokenizador de la web.
 */
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { BOOK_BY_ID, NT_BOOKS } from '../src/data/exegesis.js';
import { greekLetter, greekWords } from '../src/lib/greek.js';
import { decodeVerseLemmas } from '../src/lib/lexicon.js';

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
/* 1) Diccionario compilado (V2)                                              */
/* -------------------------------------------------------------------------- */

const lex = await readJson(path.join(DIR, 'lexico.json'));
const entries = Array.isArray(lex.entries) ? lex.entries : [];
const byStrong = new Map(entries.map(e => [e.strong, e]));

check('Diccionario V2: metadatos e idioma', lex.version === 2 && lex.lang === 'grc' && lex.scope === 'NT', `v${lex.version} · ${lex.lang} · ${lex.scope}`);
check('Diccionario V2: ≥ 250 entradas curadas', entries.length >= 250 && lex.count === entries.length, `${entries.length}`);
check('Diccionario V2: cobertura sobre el NT', lex.coverage > 0.7 && lex.tokens === 136612, `${(lex.coverage * 100).toFixed(2)} % de ${lex.tokens}`);

const strongs = entries.map(entry => entry.strong);
const lemmas = entries.map(entry => entry.lemma);
check('Diccionario: Strong únicos', new Set(strongs).size === strongs.length);
check('Diccionario: lemas únicos', new Set(lemmas).size === lemmas.length);

check(
  'Diccionario: homógrafos clave separados (εἰς/εἷς, τίς/τις)',
  ['G1519', 'G1520', 'G5101', 'G5100'].every(s => byStrong.has(s)),
  `${byStrong.get('G1519')?.lemma}/${byStrong.get('G1520')?.lemma} · ${byStrong.get('G5101')?.lemma}/${byStrong.get('G5100')?.lemma}`
);

const malformed = entries.filter(
  entry =>
    !/^[GH]\d{4,5}[A-Z]?$/.test(entry.strong) ||
    !entry.lemma ||
    !entry.translit ||
    !entry.gloss ||
    !entry.posLabel ||
    !Number.isInteger(entry.count) ||
    entry.count <= 0
);
check('Diccionario: todas las fichas están completas', malformed.length === 0, malformed.slice(0, 3).map(e => e.strong).join(' · '));

const badRefs = [];
const badRelated = [];
for (const entry of entries) {
  for (const ref of entry.refs || []) {
    if (!Array.isArray(ref) || ref.length !== 3 || !BOOK_BY_ID.has(ref[0]) || ref[1] < 1 || ref[2] < 1) {
      badRefs.push(`${entry.strong}:${JSON.stringify(ref)}`);
    }
  }
  for (const rel of entry.related || []) {
    if (!byStrong.has(rel)) badRelated.push(`${entry.strong}->${rel}`);
  }
}
check('Diccionario: citas de concordancia válidas', entries.every(e => Array.isArray(e.refs) && e.refs.length >= 1) && badRefs.length === 0, badRefs.slice(0, 3).join(' · '));
check('Diccionario: familia léxica apunta a Strong publicados', badRelated.length === 0, badRelated.slice(0, 3).join(' · '));

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
  `${[...(lex.letters || '')].length} letras`
);

const source = await readJson(SOURCE);
const glossKeys = Object.keys(source.glosas || {});
const noteKeys = Object.keys(source.notas || {});
const missingGloss = entries.filter(entry => !source.glosas?.[entry.strong]);
const changedGloss = entries.filter(entry => source.glosas?.[entry.strong] !== entry.gloss);
check('Fuente: una glosa por entrada curada', glossKeys.length === entries.length && missingGloss.length === 0, `${glossKeys.length} glosas`);
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
/* 2) Respaldo base del resto del NT (TBESG)                                  */
/* -------------------------------------------------------------------------- */

const lexBase = await readJson(path.join(DIR, 'lexico-griego-base.json'));
const baseMap = lexBase.entries || {};
const baseKeys = Object.keys(baseMap);
check(
  'Respaldo base: V2 poblado con entradas fuera de las curadas',
  lexBase.version === 2 &&
    lexBase.lang === 'grc' &&
    baseKeys.length > 4500 &&
    baseKeys.every(k => !byStrong.has(k) && Array.isArray(baseMap[k]) && baseMap[k].length === 4),
  `${baseKeys.length} entradas`
);

/* -------------------------------------------------------------------------- */
/* 3) Mapas de lemas V2 y alineación con el Codex                             */
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

  if (map.version !== 2 || map.lang !== 'grc' || map.book !== meta.id || !Array.isArray(map.dict)) {
    badMaps.push(`${meta.id}: cabecera V2`);
    continue;
  }

  const seen = new Set();
  for (const chapter of codex.chapters) {
    for (const verse of chapter.verses) {
      const key = `${chapter.num}:${verse.n}`;
      const expected = greekWords(verse.grc).length;
      const rawRow = map.verses[key];
      seen.add(key);
      if (!Array.isArray(rawRow)) {
        badMaps.push(`${meta.id} ${key}: falta`);
        continue;
      }
      if (rawRow.length !== expected) {
        badMaps.push(`${meta.id} ${key}: ${rawRow.length} vs ${expected}`);
        continue;
      }
      const decoded = decodeVerseLemmas(map, chapter.num, verse.n);
      for (const morphemes of decoded) {
        words += 1;
        if (!morphemes.length) continue;
        const m = morphemes[0];
        if (m.lemma) lemmaAligned += 1;
        else badMaps.push(`${meta.id} ${key}: sin lema`);
        if (m.strong) strongAligned += 1;
        if (m.strong && !/^G\d{4,5}$/.test(m.strong)) badMaps.push(`${meta.id} ${key}: Strong ${m.strong}`);
        if (m.ns) nsCount += 1;
        if (m.parse && m.parse.length !== 8) badMaps.push(`${meta.id} ${key}: parse ${m.parse}`);
        if (!m.pos) badMaps.push(`${meta.id} ${key}: categoría`);
      }
    }
  }

  const extra = Object.keys(map.verses).filter(key => !seen.has(key));
  if (extra.length) badMaps.push(`${meta.id}: ${extra.length} versículos de más`);
}

check('Lemas V2: los índices coinciden con el tokenizador', badMaps.length === 0, badMaps.slice(0, 4).join(' · '));
check('Lemas V2: palabras alineadas con lema', lemmaAligned / words > 0.99, `${((lemmaAligned / words) * 100).toFixed(2)} %`);
check('Lemas V2: palabras con Strong', strongAligned / words > 0.998, `${((strongAligned / words) * 100).toFixed(2)} %`);
check('Lemas V2: el total coincide con el diccionario', words === lex.tokens, `${words} palabras`);
check('Lemas V2: nomina sacra contabilizados', nsCount > 3500, `${nsCount}`);

/* -------------------------------------------------------------------------- */
/* 4) Resultado                                                               */
/* -------------------------------------------------------------------------- */

const failed = results.filter(result => !result.ok);
console.log('');
if (failed.length) {
  console.error(`Diccionario: ${failed.length} comprobación(es) fallida(s) de ${results.length}.`);
  process.exitCode = 1;
} else {
  console.log(`Diccionario: ${results.length} comprobaciones correctas · ${lex.count} lemas · ${((lemmaAligned / words) * 100).toFixed(2)} % alineado.`);
}
