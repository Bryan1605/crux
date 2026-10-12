/**
 * QA de datos de la línea de tiempo (sin navegador).
 *
 *   node scripts/check-timeline.mjs
 *
 * Verifica:
 *  1. que toda fecha display de los personajes se convierte a número (parseAnio);
 *  2. que content/timeline.json cumple el esquema y sus destinos resuelven a rutas reales;
 *  3. que la fusión (personajes + curated) queda ordenada, con ids únicos y eras coherentes.
 * Sale con código 1 si algo falla.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { validate } from './validate-content.mjs';
import { buildTimeline, checkTimelineLabels, centuryBands, conciliosToEvents, TIPO_LABELS } from '../src/lib/timeline.js';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const CONTENT = path.join(ROOT, 'content');

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok });
  console.log(`${ok ? 'OK ' : 'NO '} ${name}${detail ? ` — ${detail}` : ''}`);
};

const read = f => JSON.parse(fs.readFileSync(path.join(CONTENT, f), 'utf8'));

const personajes = fs
  .readdirSync(path.join(CONTENT, 'personajes'))
  .filter(f => f.endsWith('.json'))
  .map(f => read(`personajes/${f}`));

const timeline = fs.existsSync(path.join(CONTENT, 'timeline.json')) ? read('timeline.json') : [];
const concilios = fs.existsSync(path.join(CONTENT, 'concilios.json')) ? read('concilios.json') : [];
const estudios = read('estudios.json');

// 1 · Fechas display de los personajes convertibles.
const { broken } = checkTimelineLabels(personajes);
check(
  'Fechas display convertibles (personajes)',
  broken.length === 0,
  broken.length
    ? broken.slice(0, 3).map(b => `${b.slug}: "${b.anio}"`).join(' · ')
    : `${personajes.length} fichas, ${personajes.reduce((n, p) => n + (p.timeline || []).length, 0)} hitos`
);

// 2 · Esquema de content/timeline.json + destinos reales.
const studySlugs = new Set((estudios.studies || []).map(s => s.slug));
const personajeSlugs = new Set(personajes.map(p => p.slug));
let schemaErr = null;
try {
  validate('timeline', timeline, undefined, { routes: { studies: studySlugs, personajes: personajeSlugs } });
} catch (e) {
  schemaErr = e.message;
}
check('Esquema timeline.json + destinos reales', !schemaErr, schemaErr || `${timeline.length} eventos curated`);

// 2b · Esquema de content/concilios.json (concilios + herejías, referencias cruzadas).
let conciliosErr = null;
try {
  validate('concilios', concilios);
} catch (e) {
  conciliosErr = e.message;
}
const nConcilios = concilios.filter(c => c.tipo === 'concilio').length;
const nHerejias = concilios.filter(h => h.tipo === 'herejia').length;
check('Esquema concilios.json', !conciliosErr, conciliosErr || `${nConcilios} concilios · ${nHerejias} herejías`);

// 3 · Fusión: orden, ids únicos, eras y tipos válidos.
const merged = buildTimeline(personajes, [...timeline, ...conciliosToEvents(concilios)]);
const sinAnio = merged.filter(ev => ev.anio === null);
const desorden = merged.find(
  (ev, i) => i > 0 && ev.anio !== null && merged[i - 1].anio !== null && merged[i - 1].anio > ev.anio
);
const ids = new Set();
let dup = null;
for (const ev of merged) {
  if (ids.has(ev.id)) {
    dup = ev.id;
    break;
  }
  ids.add(ev.id);
}
const tipoInvalido = merged.find(ev => !(ev.tipo in TIPO_LABELS));
const sinEra = merged.find(ev => ev.anio !== null && !ev.era);
const personasSinHito = personajes.filter(p => (p.timeline || []).length === 0);
const eventosConcilio = merged.filter(ev => ev.tipo === 'concilio');
const eventosHerejia = merged.filter(ev => ev.tipo === 'herejia');
const herejiasSinAnio = concilios.filter(h => h.tipo === 'herejia' && !!h.condenada_en && !eventosHerejia.find(ev => ev.id === `herejia-${h.id}`)?.anio);

check('Fusión ordenada por año', !desorden, desorden ? `desorden en "${desorden.id}" (${desorden.anio})` : `${merged.length} hitos`); 
check('Sin hitos sin año numérico', sinAnio.length === 0, sinAnio.length ? sinAnio.slice(0, 3).map(e => e.id).join(' · ') : '');
check('Ids únicos', !dup, dup || `${merged.length} ids`);
check('Eras presentes en cada hito', !sinEra, sinEra ? sinEra.id : `${new Set(merged.map(e => e.era)).size} eras`);
check('Tipos válidos', !tipoInvalido, '');
check('Todo personaje con timeline[] aporta hitos', personasSinHito.length === 0, personasSinHito.length ? `${personasSinHito.map(p => p.slug).join(', ')} sin timeline` : `${personajes.length} personajes`);
check('Cada concilio aporta un evento en su año', eventosConcilio.length === nConcilios, `${eventosConcilio.length}/${nConcilios}`);
check('Herejías condenadas heredan el año del concilio', herejiasSinAnio.length === 0, herejiasSinAnio.length ? herejiasSinAnio.map(h => h.id).join(', ') : `${eventosHerejia.length} eventos herejía`);

// 3b · Bandas del eje de eras: etiquetas únicas (un mismo siglo no se pinta dos veces).
const conAnio = merged.filter(e => e.anio !== null);
const bMin = Math.min(...conAnio.map(e => e.anio));
const bMax = Math.max(...conAnio.map(e => e.anio));
const bandas = centuryBands(bMin, bMax);
const bandasDup = bandas.filter((b, i) => bandas.findIndex(x => x.label === b.label) !== i);
check('Bandas del eje con etiquetas únicas', bandasDup.length === 0, bandasDup.length ? bandasDup.map(b => b.label).join(', ') : `${bandas.length} bandas (${bandas[0]?.label} → ${bandas[bandas.length - 1]?.label})`);

// Panorama resumido.
const porTipo = merged.reduce((acc, ev) => {
  acc[ev.tipo] = (acc[ev.tipo] || 0) + 1;
  return acc;
}, {});
const span = merged.filter(e => e.anio !== null);
const min = Math.min(...span.map(e => e.anio));
const max = Math.max(...span.map(e => e.anio));
console.log(`\nLínea: ${merged.length} hitos · ${Object.entries(porTipo).map(([t, n]) => `${TIPO_LABELS[t]}: ${n}`).join(' · ')}`);
console.log(`Rango: ${min} → ${max} (${new Set(span.map(e => e.era)).size} siglos)`);

const fails = results.filter(r => !r.ok).length;
console.log(`\n${results.length - fails}/${results.length} checks OK`);
process.exit(fails ? 1 : 0);