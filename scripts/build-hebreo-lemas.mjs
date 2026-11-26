/**
 * Genera los 39 mapas de lemas hebreo/arameos palabra a palabra (formato V2
 * compacto) en `public/textos/hebreo/lemas/<libro>.json` y el informe de
 * estadísticas en `src/assets/texts/.cache-hebreo/hebreo-lemas-report.json`.
 *
 * REGLA: usa exactamente `parseOsisVerse` de `hebreo-lib.mjs`, garantizando
 * alineación 1:1 por índice con cada token de `public/textos/hebreo/<libro>.json`.
 *
 * Uso:
 *   node scripts/build-hebreo-lemas.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { HEBREW_BOOKS } from '../src/lib/hebrew.js';
import { parseOsisVerse } from './hebreo-lib.mjs';
import { indexTbesh, parseTbesh, resolveOshbMorphemes } from './hebreo-lexico-lib.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = path.join(ROOT, 'src', 'assets', 'texts', '.cache-hebreo');
const WLC_DIR = path.join(CACHE, 'wlc');
const TBESH_PATH = path.join(CACHE, 'tbesh.txt');
const LEMAS_DIR = path.join(ROOT, 'public', 'textos', 'hebreo', 'lemas');

if (!fs.existsSync(TBESH_PATH)) {
  console.error('Falta tbesh.txt en caché. Ejecuta antes: node scripts/fetch-hebreo-lexico.mjs');
  process.exit(1);
}

const tbesh = indexTbesh(parseTbesh(fs.readFileSync(TBESH_PATH, 'utf8')));
fs.mkdirSync(LEMAS_DIR, { recursive: true });

const lemmaCounts = new Map();
const strongForms = new Map();
const strongSamples = new Map();
const strongMorphs = new Map();
let totalWords = 0;
let totalMapped = 0;
let totalBytes = 0;
const missingStrongs = new Map();

function bumpStat(strong, surface, bookId, ch, v, pos, isAramaic) {
  if (!strong) return;
  const cur = lemmaCounts.get(strong) || {
    strong,
    count: 0,
    aramaicCount: 0,
    posCounts: new Map()
  };
  cur.count += 1;
  if (isAramaic) cur.aramaicCount += 1;
  cur.posCounts.set(pos, (cur.posCounts.get(pos) || 0) + 1);
  lemmaCounts.set(strong, cur);

  if (!strongForms.has(strong)) strongForms.set(strong, new Set());
  const forms = strongForms.get(strong);
  if (forms.size < 16 && surface) forms.add(surface);

  if (!strongSamples.has(strong)) strongSamples.set(strong, []);
  const samples = strongSamples.get(strong);
  if (samples.length < 6 && !samples.some(s => s[0] === bookId && s[1] === ch && s[2] === v)) {
    samples.push([bookId, ch, v]);
  }
}

for (const meta of HEBREW_BOOKS) {
  const xmlPath = path.join(WLC_DIR, `${meta.osis}.xml`);
  const hebreoJsonPath = path.join(ROOT, 'public', 'textos', 'hebreo', `${meta.id}.json`);
  if (!fs.existsSync(xmlPath) || !fs.existsSync(hebreoJsonPath)) {
    console.error(`Falta ${xmlPath} o ${hebreoJsonPath}`);
    process.exit(1);
  }
  const xml = fs.readFileSync(xmlPath, 'utf8');
  const hebreoBook = JSON.parse(fs.readFileSync(hebreoJsonPath, 'utf8'));

  const dictMap = new Map();
  const dict = [];
  const encodeMorpheme = m => {
    const key = `${m.lemma}\u0000${m.strong || ''}\u0000${m.pos || ''}`;
    let idx = dictMap.get(key);
    if (idx === undefined) {
      idx = dict.length;
      dictMap.set(key, idx);
      dict.push([m.lemma, m.strong || '', m.pos || '']);
    }
    return m.parse ? [idx, m.parse] : [idx];
  };

  const versesOut = {};
  const chapRe = /<chapter\s+osisID="[^."]+\.(\d+)"[^>]*>([\s\S]*?)<\/chapter>/g;
  let cm;
  while ((cm = chapRe.exec(xml))) {
    const chNum = Number(cm[1]);
    const chBook = hebreoBook.chapters.find(c => c.num === chNum);
    const verseRe = /<verse\s+osisID="([^"]+)"[^>]*>([\s\S]*?)<\/verse>/g;
    let vm;
    while ((vm = verseRe.exec(cm[2]))) {
      const osisID = vm[1];
      const vNum = Number(osisID.split('.')[2]);
      const parsed = parseOsisVerse(vNum, vm[2], osisID);
      const bookVerse = chBook?.verses?.find(v => v.n === vNum);
      if (!bookVerse || bookVerse.t.length !== parsed.tokens.length) {
        throw new Error(`Desalineación en ${meta.id} ${chNum}:${vNum}`);
      }

      const row = [];
      for (let i = 0; i < parsed.lemmas.length; i += 1) {
        const rawEntry = parsed.lemmas[i];
        if (!rawEntry) {
          row.push(null);
          continue;
        }
        totalWords += 1;
        const morphemes = resolveOshbMorphemes(rawEntry.lemma, rawEntry.morph, tbesh);
        if (!morphemes.length) {
          row.push(null);
          continue;
        }
        totalMapped += 1;
        const tok = parsed.tokens[i];
        const surface = typeof tok === 'string' ? tok : tok.a || '';
        const isAramaic = rawEntry.morph?.startsWith('A');
        for (const m of morphemes) {
          if (m.strong && !tbesh.has(m.strong) && !/^H90\d\d$/.test(m.strong)) {
            missingStrongs.set(m.strong, (missingStrongs.get(m.strong) || 0) + 1);
          }
          bumpStat(m.strong, surface, meta.id, chNum, vNum, m.pos, isAramaic);
        }
        row.push(morphemes.length === 1 ? encodeMorpheme(morphemes[0]) : morphemes.map(encodeMorpheme));
      }
      versesOut[`${chNum}:${vNum}`] = row;
    }
  }

  const outPath = path.join(LEMAS_DIR, `${meta.id}.json`);
  const serialized = JSON.stringify({
    version: 2,
    book: meta.id,
    dict,
    verses: versesOut
  });
  fs.writeFileSync(outPath, serialized, 'utf8');
  totalBytes += Buffer.byteLength(serialized, 'utf8');
}

const topStrongs = [...lemmaCounts.values()]
  .sort((a, b) => b.count - a.count)
  .map(entry => {
    const dominantPos = [...entry.posCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || '';
    const tb = tbesh.get(entry.strong);
    return {
      strong: entry.strong,
      lemma: tb?.lemma || '',
      translit: tb?.translit || '',
      pos: dominantPos || tb?.pos || '',
      posLabel: tb?.posLabel || '',
      glossEn: tb?.gloss || '',
      count: entry.count,
      aramaicCount: entry.aramaicCount,
      forms: [...(strongForms.get(entry.strong) || [])],
      samples: strongSamples.get(entry.strong) || []
    };
  });

const report = {
  generatedAt: new Date().toISOString().slice(0, 10),
  totalWords,
  totalMapped,
  coveragePct: Number(((totalMapped / Math.max(1, totalWords)) * 100).toFixed(2)),
  totalBytes,
  totalMB: Number((totalBytes / (1024 * 1024)).toFixed(2)),
  uniqueStrongs: topStrongs.length,
  missingInTbesh: [...missingStrongs.entries()].sort((a, b) => b[1] - a[1]),
  topStrongs
};

fs.writeFileSync(path.join(CACHE, 'hebreo-lemas-report.json'), JSON.stringify(report, null, 2), 'utf8');
console.log(
  `OK  39 mapas generados en public/textos/hebreo/lemas/ (${report.totalMB} MB · ${totalMapped}/${totalWords} palabras = ${report.coveragePct}% · ${topStrongs.length} Strongs · sin TBESH: ${missingStrongs.size})`
);
