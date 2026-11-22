/**
 * Construye el diccionario griego → español (V2) y el respaldo base del NT.
 *
 *   node scripts/build-lexico.mjs --draft   # genera el borrador para traducir
 *   node scripts/build-lexico.mjs           # publica lexico.json y lexico-griego-base.json
 *
 * En modo normal publica todos los Strong traducidos en `content/lexico/griego.json`
 * (ordenados por frecuencia en el Codex, sin techo rígido de 250) más un índice
 * ligero `lexico-griego-base.json` con los demás Strong del NT (TBESG).
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
import { CACHE, LEXICO_BASE_PATH, LEXICO_PATH, SOURCE_PATH, TBESG_PATH } from './lexico-files.mjs';

const args = process.argv.slice(2);
const draft = args.includes('--draft');
const limitArg = args.find(arg => arg.startsWith('--limit='));
const limit = limitArg ? Number(limitArg.split('=')[1]) : null;
const reportPath = path.join(CACHE, 'alignment-report.json');

if (!fs.existsSync(reportPath)) {
  console.error('Falta el informe de alineación. Ejecuta antes: node scripts/build-lemas.mjs');
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
const tbesg = indexTbesg(parseTbesg(fs.readFileSync(TBESG_PATH, 'utf8')));
const source = fs.existsSync(SOURCE_PATH)
  ? JSON.parse(fs.readFileSync(SOURCE_PATH, 'utf8'))
  : { version: 2, glosas: {}, notas: {} };

/** La forma media no coincide con la transcripción de TBESG (lema activo). */
const TRANSLIT_OVERRIDES = {
  G0611: 'apokrinomai',
  G4198: 'poreuomai',
  G5399: 'phobeomai',
  G0622: 'apollumi',
  G3779: 'houtōs'
};

/** Categorías que TBESG abrevia de forma ambigua o discordante con MorphGNT. */
const POS_OVERRIDES = {
  G5547: 'sustantivo masculino',
  G0281: 'interjección',
  G5613: 'conjunción/adverbio',
  G2504: 'conjunción + pronombre',
  G0302: 'partícula',
  G2316: 'sustantivo masculino',
  G2453: 'adjetivo/sustantivo propio',
  G4245: 'adjetivo/sustantivo'
};

/** Familias léxicas y pares doctrinales para navegar entre entradas relacionadas. */
const RELATED_GROUPS = [
  ['G0025', 'G0026'],
  ['G4100', 'G4102', 'G4103'],
  ['G1342', 'G1343'],
  ['G0932', 'G0935'],
  ['G3004', 'G3056', 'G2980', 'G4487'],
  ['G1519', 'G1520'],
  ['G5100', 'G5101'],
  ['G2198', 'G2222'],
  ['G1410', 'G1411', 'G1849'],
  ['G0649', 'G0652', 'G3992'],
  ['G0165', 'G0166'],
  ['G3614', 'G3624'],
  ['G2064', 'G1525', 'G1831', 'G4334'],
  ['G0305', 'G2597'],
  ['G0599', 'G2288', 'G3498'],
  ['G0450', 'G1453'],
  ['G0240', 'G0243', 'G2087'],
  ['G1473', 'G1699'],
  ['G3756', 'G3761', 'G3762'],
  ['G3361', 'G3367'],
  ['G2424', 'G5547', 'G2962', 'G2316'],
  ['G3962', 'G3384', 'G5207', 'G5043', 'G0080'],
  ['G0018', 'G2570', 'G4190'],
  ['G0906', 'G1544'],
  ['G2250', 'G5610', 'G2540'],
  ['G3708', 'G0991', 'G1492', 'G1097'],
  ['G0040', 'G2413'],
  ['G4982', 'G0622'],
  ['G0615', 'G2288'],
  ['G2250', 'G5457']
];

function resolveTbesgForItem(item) {
  const byLemma = pickTbesg(item.lemma, item.pos, tbesg);
  if (byLemma && byLemma.strong === item.strong) return byLemma;
  return pickTbesgByStrong(item.strong, tbesg, item.lemma, item.pos) || byLemma;
}

const sourceKeys = Object.keys(source.glosas || {});
const sourceSet = new Set(sourceKeys);

const allItems = [];
const seenAll = new Set();
for (const item of report.topLemmas) {
  if (!item.strong || seenAll.has(item.strong)) continue;
  seenAll.add(item.strong);
  const entry = resolveTbesgForItem(item);
  allItems.push({
    rank: allItems.length + 1,
    strong: item.strong,
    lemma: item.lemma,
    translit: TRANSLIT_OVERRIDES[item.strong] || cleanTranslit(entry?.translit || '', item.lemma),
    pos: item.pos || entry?.pos || '',
    posLabel: POS_OVERRIDES[item.strong] || posEs(entry?.posRaw || item.pos || '', ''),
    count: item.count,
    ns: item.ns > 0,
    forms: (item.forms || []).map(form => form.form),
    refs: item.refs || [],
    en: entry?.gloss || '',
    definition: entry?.definition || '',
    tbesgStrong: entry?.strongFull || ''
  });
}

if (draft) {
  const draftLimit = limit || 250;
  const selected = allItems.slice(0, draftLimit);
  fs.mkdirSync(CACHE, { recursive: true });
  fs.writeFileSync(path.join(CACHE, 'draft.json'), JSON.stringify({ limit: draftLimit, entries: selected }, null, 2));
  const lines = [
    `# Borrador del léxico (${selected.length} lemas más frecuentes)`,
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

const curated = allItems.filter(entry => sourceSet.has(entry.strong));
const missingInCorpus = sourceKeys.filter(key => !curated.some(entry => entry.strong === key));
if (missingInCorpus.length) {
  console.error(`Glosas en griego.json sin correspondencia en el corpus NT: ${missingInCorpus.join(', ')}`);
  process.exit(1);
}

const missingGloss = curated.filter(entry => !String(source.glosas?.[entry.strong] || '').trim());
if (missingGloss.length) {
  console.error(`Faltan glosas para ${missingGloss.length} entradas:`);
  for (const entry of missingGloss) console.error(`  ${entry.strong} ${entry.lemma} (${entry.count})`);
  process.exit(1);
}

const publishedSet = new Set(curated.map(e => e.strong));
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

const entries = curated.map(entry => {
  const note = String(source.notas?.[entry.strong] || '').trim() || undefined;
  const related = [...(relatedMap.get(entry.strong) || [])];
  const out = {
    strong: entry.strong,
    lang: 'grc',
    lemma: entry.lemma,
    translit: entry.translit,
    pos: entry.pos,
    posLabel: entry.posLabel,
    gloss: String(source.glosas[entry.strong]).trim(),
    count: entry.count,
    ns: entry.ns,
    forms: entry.forms.slice(0, 6),
    refs: entry.refs.slice(0, 5)
  };
  if (note) out.note = note;
  if (related.length) out.related = related;
  return out;
});

const letters = [...new Set(entries.map(entry => foldGreek(entry.lemma)[0]).filter(Boolean))].sort(
  (a, b) => greekSortKey(a).localeCompare(greekSortKey(b))
);

const payload = {
  version: 2,
  lang: 'grc',
  scope: 'NT',
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

// Respaldo compacto para todos los Strong del NT fuera de `lexico.json`.
const baseEntries = {};
for (const entry of allItems) {
  if (publishedSet.has(entry.strong)) continue;
  baseEntries[entry.strong] = [
    entry.lemma,
    entry.translit,
    entry.posLabel || entry.pos,
    entry.en
  ];
}
const basePayload = {
  version: 2,
  lang: 'grc',
  count: Object.keys(baseEntries).length,
  source: 'TBESG / STEPBible (CC BY 4.0)',
  entries: baseEntries
};
fs.writeFileSync(LEXICO_BASE_PATH, JSON.stringify(basePayload));

console.log(
  `Léxico V2: ${entries.length} entradas curadas (${(payload.coverage * 100).toFixed(1)}% del NT) → ` +
    path.relative(process.cwd(), LEXICO_PATH)
);
console.log(
  `Respaldo base: ${basePayload.count} entradas adicionales TBESG → ` +
    path.relative(process.cwd(), LEXICO_BASE_PATH)
);
