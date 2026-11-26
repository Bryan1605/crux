/**
 * Construye el léxico curado hebreo/arameo (`public/textos/hebreo/lexico.json`)
 * y el respaldo completo TBESH (`public/textos/hebreo/lexico-hebreo-base.json`).
 *
 * Lee las glosas curadas desde `content/lexico/hebreo.json` y cruza con los
 * conteos de `src/assets/texts/.cache-hebreo/hebreo-lemas-report.json`.
 *
 * Uso:
 *   node scripts/build-hebreo-lexico.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { foldHebrew } from '../src/lib/hebrew.js';
import { cleanDefinition } from './lexico-lib.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = path.join(ROOT, 'src', 'assets', 'texts', '.cache-hebreo');
const REPORT_PATH = path.join(CACHE, 'hebreo-lemas-report.json');
const SOURCE_PATH = path.join(ROOT, 'content', 'lexico', 'hebreo.json');
const LEXICO_PATH = path.join(ROOT, 'public', 'textos', 'hebreo', 'lexico.json');
const LEXICO_BASE_PATH = path.join(ROOT, 'public', 'textos', 'hebreo', 'lexico-hebreo-base.json');

if (!fs.existsSync(REPORT_PATH)) {
  console.error('Falta hebreo-lemas-report.json. Ejecuta antes: node scripts/build-hebreo-lemas.mjs');
  process.exit(1);
}
if (!fs.existsSync(SOURCE_PATH)) {
  console.error('Falta content/lexico/hebreo.json.');
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf8'));
const source = JSON.parse(fs.readFileSync(SOURCE_PATH, 'utf8'));

/** Ajustes puntuales cuando TBESH indexa un homónimo menos común primero o etiqueta distinto. */
const ENTRY_OVERRIDES = {
  H0116: { pos: 'D', posLabel: 'adverbio (arameo)' },
  H0310: { pos: 'P', posLabel: 'preposición' },
  H0341: { pos: 'N', posLabel: 'sustantivo masculino' },
  H0410: { translit: 'el', pos: 'N', posLabel: 'sustantivo masculino' },
  H0899: { pos: 'N', posLabel: 'sustantivo masculino' },
  H0905: { pos: 'N', posLabel: 'sustantivo / adverbio' },
  H0996: { pos: 'P', posLabel: 'preposición' },
  H1004: { pos: 'N', posLabel: 'sustantivo masculino' },
  H1571: { pos: 'D', posLabel: 'adverbio / conjunción' },
  H1768: { pos: 'RP', posLabel: 'pronombre / partícula (arameo)' },
  H2416: { pos: 'A', posLabel: 'adjetivo / sustantivo' },
  H3651: { pos: 'D', posLabel: 'adverbio' },
  H3966: { pos: 'D', posLabel: 'adverbio' },
  H4057: { pos: 'N', posLabel: 'sustantivo masculino' },
  H4325: { lemma: 'מַיִם', translit: 'mayim', pos: 'N', posLabel: 'sustantivo masculino' },
  H5705: { pos: 'P', posLabel: 'preposición (arameo)' },
  H5750: { pos: 'D', posLabel: 'adverbio' },
  H5892: { pos: 'N', posLabel: 'sustantivo femenino' },
  H5922: { pos: 'P', posLabel: 'preposición (arameo)' },
  H6030: { lemma: 'עָנָה', translit: 'anah', pos: 'V', posLabel: 'verbo' },
  H6903: { pos: 'P', posLabel: 'preposición / conjunción (arameo)' },
  H7227: { pos: 'A', posLabel: 'adjetivo' },
  H7563: { pos: 'A', posLabel: 'adjetivo' },
  H8478: { pos: 'P', posLabel: 'preposición' },
  H9011: { pos: 'X', posLabel: 'sufijo direccional' },
  H9012: { pos: 'X', posLabel: 'sufijo paragógico' },
  H9013: { pos: 'X', posLabel: 'sufijo paragógico' }
};

const RELATED_GROUPS = [
  ['H3068', 'H3069', 'H0430', 'H0410', 'H0136', 'H0426'],
  ['H7225', 'H1254', 'H7307', 'H0216', 'H2822', 'H8414', 'H0922', 'H8415', 'H7549', 'H0914'],
  ['H8064', 'H8065', 'H0776', 'H0127', 'H0772', 'H3220', 'H4325'],
  ['H0376', 'H0120', 'H0802', 'H0001', 'H0517', 'H1121', 'H1247', 'H1323', 'H0251'],
  ['H4428', 'H4430', 'H4427', 'H4437', 'H3548', 'H5030', 'H5650'],
  ['H1285', 'H2617', 'H8451', 'H6666', 'H6664', 'H6662', 'H7965', 'H0530', 'H0571'],
  ['H2403', 'H2398', 'H5771', 'H7563', 'H3722', 'H3467', 'H3444', 'H1350'],
  ['H5315', 'H3820', 'H3824', 'H1320', 'H1818', 'H2416', 'H2421', 'H4191'],
  ['H1697', 'H1696', 'H0559', 'H0560', 'H8085', 'H3045', 'H3046', 'H2142'],
  ['H3117', 'H3915', 'H1242', 'H8141', 'H2320', 'H4150', 'H5769', 'H5957'],
  ['H0853', 'H0854', 'H5973', 'H0413', 'H5921', 'H4480']
];

function hebrewLetter(lemma) {
  const ch = foldHebrew(lemma).replace(/[^\u05D0-\u05EA]/g, '')[0] || '';
  if (!ch) return '';
  const finals = { ך: 'כ', ם: 'מ', ן: 'נ', ף: 'פ', ץ: 'צ' };
  return finals[ch] || ch;
}

const sourceKeys = Object.keys(source.glosas || {});
const sourceSet = new Set(sourceKeys);

const allItems = (report.topStrongs || []).map(item => {
  const ov = ENTRY_OVERRIDES[item.strong] || {};
  return {
    strong: item.strong,
    lemma: ov.lemma || item.lemma,
    translit: ov.translit || item.translit || '',
    pos: ov.pos || item.pos || 'X',
    posLabel: ov.posLabel || item.posLabel || '',
    en: cleanDefinition(item.glossEn || ''),
    count: item.count || 0,
    aramaicCount: item.aramaicCount || 0,
    forms: (item.forms || []).slice(0, 6),
    refs: (item.samples || []).slice(0, 5)
  };
});

const missingInCorpus = sourceKeys.filter(k => !allItems.some(i => i.strong === k));
if (missingInCorpus.length) {
  console.error(`Glosas en content/lexico/hebreo.json sin correspondencia en el AT: ${missingInCorpus.join(', ')}`);
  process.exit(1);
}

const curated = allItems.filter(item => sourceSet.has(item.strong));
const publishedSet = new Set(curated.map(item => item.strong));

const relatedMap = new Map();
for (const group of RELATED_GROUPS) {
  const present = group.filter(s => publishedSet.has(s));
  if (present.length < 2) continue;
  for (const s of present) {
    const cur = relatedMap.get(s) || new Set();
    for (const other of present) {
      if (other !== s) cur.add(other);
    }
    relatedMap.set(s, cur);
  }
}

const entries = curated.map(item => {
  const note = String(source.notas?.[item.strong] || '').trim() || undefined;
  const related = [...(relatedMap.get(item.strong) || [])];
  const out = {
    strong: item.strong,
    lang: 'heb',
    lemma: item.lemma,
    translit: item.translit,
    pos: item.pos,
    posLabel: item.posLabel,
    gloss: String(source.glosas[item.strong]).trim(),
    count: item.count,
    arc: item.aramaicCount > 0,
    aramaicCount: item.aramaicCount,
    forms: item.forms,
    refs: item.refs
  };
  if (note) out.note = note;
  if (related.length) out.related = related;
  return out;
});

const letters = [...new Set(entries.map(e => hebrewLetter(e.lemma)).filter(Boolean))].sort(
  (a, b) => a.codePointAt(0) - b.codePointAt(0)
);

const totalMorphemes = allItems.reduce((sum, item) => sum + item.count, 0);
const curatedMorphemes = entries.reduce((sum, entry) => sum + entry.count, 0);

const payload = {
  version: 2,
  lang: 'heb',
  scope: 'AT',
  count: entries.length,
  words: report.totalWords,
  tokens: totalMorphemes,
  coverage: Number((curatedMorphemes / Math.max(1, totalMorphemes)).toFixed(4)),
  letters,
  entries,
  source: {
    glosses: 'TBESH / STEPBible (CC BY 4.0; léxico base BDB abreviado / Tyndale House)',
    morphology: 'OSHB — Open Scriptures Hebrew Bible (CC BY 4.0)',
    note: 'Glosas y decodificación morfológica en español: adaptación propia.'
  }
};

fs.mkdirSync(path.dirname(LEXICO_PATH), { recursive: true });
fs.writeFileSync(LEXICO_PATH, JSON.stringify(payload));

const baseEntries = {};
for (const item of allItems) {
  if (publishedSet.has(item.strong)) continue;
  baseEntries[item.strong] = [
    item.lemma,
    item.translit,
    item.posLabel || item.pos,
    item.en
  ];
}

const basePayload = {
  version: 2,
  lang: 'heb',
  count: Object.keys(baseEntries).length,
  source: 'TBESH / STEPBible (CC BY 4.0)',
  entries: baseEntries
};
fs.writeFileSync(LEXICO_BASE_PATH, JSON.stringify(basePayload));

console.log(
  `Léxico Hebreo V2: ${entries.length} entradas curadas (${(payload.coverage * 100).toFixed(1)}% de los morfemas del AT) → ` +
    path.relative(process.cwd(), LEXICO_PATH)
);
console.log(
  `Respaldo base TBESH: ${basePayload.count} entradas adicionales → ` +
    path.relative(process.cwd(), LEXICO_BASE_PATH)
);
