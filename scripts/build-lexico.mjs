/**
 * Construye el diccionario griego → español.
 *
 *   node scripts/build-lexico.mjs --draft   # genera el borrador para traducir
 *   node scripts/build-lexico.mjs           # publica lexico.json
 *
 * La selección son los 250 lemas más frecuentes del Codex (con Strong único).
 * Las glosas españolas se editan en `content/lexico/griego.json`; el resto de
 * los datos (lema, transcripción, categoría, frecuencia) sale de TBESG y del
 * informe de alineación.
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  parseTbesg,
  indexTbesg,
  pickTbesg,
  pickTbesgByStrong,
  posEs,
  cleanTranslit,
  greekSortKey
} from './lexico-lib.mjs';
import { foldGreek } from '../src/lib/greek.js';
import { CACHE, LEXICO_PATH, SOURCE_PATH, TBESG_PATH } from './lexico-files.mjs';

const args = process.argv.slice(2);
const draft = args.includes('--draft');
const limitArg = args.find(arg => arg.startsWith('--limit='));
const limit = limitArg ? Number(limitArg.split('=')[1]) : 250;
const reportPath = path.join(CACHE, 'alignment-report.json');

if (!fs.existsSync(reportPath)) {
  console.error('Falta el informe de alineación. Ejecuta antes: node scripts/build-lemas.mjs');
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
const tbesg = indexTbesg(parseTbesg(fs.readFileSync(TBESG_PATH, 'utf8')));
const source = fs.existsSync(SOURCE_PATH)
  ? JSON.parse(fs.readFileSync(SOURCE_PATH, 'utf8'))
  : { version: 1, glosas: {}, notas: {} };

/** La forma media no coincide con la transcripción de TBESG (lema activo). */
const TRANSLIT_OVERRIDES = {
  G0611: 'apokrinomai',
  G4198: 'poreuomai',
  G5399: 'phobeomai',
  G0622: 'apollumi',
  G3779: 'houtōs'
};

/** Categorías que TBESG deja sin género o abrevia de forma ambigua. */
const POS_OVERRIDES = {
  G5547: 'sustantivo masculino',
  G0281: 'interjección'
};

const selected = [];
const seen = new Set();
for (const item of report.topLemmas) {
  if (selected.length >= limit) break;
  if (!item.strong || seen.has(item.strong)) continue;
  seen.add(item.strong);
  const entry = pickTbesg(item.lemma, item.pos, tbesg) || pickTbesgByStrong(item.strong, tbesg);
  selected.push({
    rank: selected.length + 1,
    strong: item.strong,
    lemma: item.lemma,
    translit: TRANSLIT_OVERRIDES[item.strong] || cleanTranslit(entry?.translit || ''),
    pos: item.pos || entry?.pos || '',
    posLabel: POS_OVERRIDES[item.strong] || posEs(entry?.posRaw || item.pos || '', ''),
    count: item.count,
    ns: item.ns > 0,
    forms: item.forms.map(form => form.form),
    en: entry?.gloss || '',
    definition: entry?.definition || '',
    tbesgStrong: entry?.strongFull || ''
  });
}

if (draft) {
  fs.mkdirSync(CACHE, { recursive: true });
  fs.writeFileSync(path.join(CACHE, 'draft.json'), JSON.stringify({ limit, entries: selected }, null, 2));
  const lines = [
    '# Borrador del léxico (250 lemas más frecuentes)',
    '',
    '| # | Strong | Lema | Transcripción | Cat. | N | Glosa TBESG | Formas |',
    '|---|--------|------|---------------|------|---|-------------|--------|'
  ];
  for (const entry of selected) {
    lines.push(
      `| ${entry.rank} | ${entry.strong} | ${entry.lemma} | ${entry.translit} | ` +
        `${entry.posLabel || entry.pos} | ${entry.count} | ${entry.en.replace(/\|/g, '/')} | ` +
        `${entry.forms.slice(0, 4).join(', ')} |`
    );
  }
  lines.push('', '## Definiciones (recortadas)', '');
  for (const entry of selected) {
    const definition = entry.definition.replace(/\s+/g, ' ').slice(0, 700);
    lines.push(`### ${entry.strong} · ${entry.lemma} · ${entry.translit}`, '', definition, '');
  }
  fs.writeFileSync(path.join(CACHE, 'draft.md'), lines.join('\n'));
  console.log(`Borrador: ${selected.length} entradas → ${path.relative(process.cwd(), path.join(CACHE, 'draft.json'))}`);
  console.log(`           ${path.relative(process.cwd(), path.join(CACHE, 'draft.md'))}`);
  process.exit(0);
}

const missing = selected.filter(entry => !String(source.glosas?.[entry.strong] || '').trim());
if (missing.length) {
  console.error(`Faltan glosas para ${missing.length} entradas:`);
  for (const entry of missing) console.error(`  ${entry.strong} ${entry.lemma} (${entry.count})`);
  process.exit(1);
}

const entries = selected.map(entry => ({
  strong: entry.strong,
  lemma: entry.lemma,
  translit: entry.translit,
  pos: entry.pos,
  posLabel: entry.posLabel,
  gloss: String(source.glosas[entry.strong]).trim(),
  note: String(source.notas?.[entry.strong] || '').trim() || undefined,
  count: entry.count,
  ns: entry.ns,
  forms: entry.forms.slice(0, 6)
}));

const letters = [...new Set(entries.map(entry => foldGreek(entry.lemma)[0]).filter(Boolean))].sort(
  (a, b) => greekSortKey(a).localeCompare(greekSortKey(b))
);

const sourceKeys = Object.keys(source.glosas || {});
const unknown = sourceKeys.filter(key => !seen.has(key));

const payload = {
  version: 1,
  count: entries.length,
  tokens: report.totals.tokens,
  coverage: Number(
    (entries.reduce((sum, entry) => sum + entry.count, 0) / report.totals.tokens).toFixed(4)
  ),
  letters,
  entries,
  source: {
    glosses: 'TBESG / STEPBible (CC BY 4.0; Abbott-Smith 1922, dominio público)',
    morphology: 'MorphGNT (CC BY-SA 3.0)',
    note: 'Glosas españolas: traducción y adaptación propia.'
  }
};
fs.mkdirSync(path.dirname(LEXICO_PATH), { recursive: true });
fs.writeFileSync(LEXICO_PATH, JSON.stringify(payload));

console.log(
  `Léxico: ${entries.length} entradas, ${(payload.coverage * 100).toFixed(1)}% de las palabras del Codex → ` +
    path.relative(process.cwd(), LEXICO_PATH)
);
if (unknown.length) console.warn(`Aviso: ${unknown.length} glosas fuera de la selección actual: ${unknown.join(', ')}`);
