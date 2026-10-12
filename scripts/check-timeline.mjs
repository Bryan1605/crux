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
import { buildTimeline, checkTimelineLabels, TIPO_LABELS } from '../src/lib/timeline.js';

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

// 3 · Fusión: orden, ids únicos, eras y tipos válidos.
const merged = buildTimeline(personajes, timeline);
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

check('Fusión ordenada por año', !desorden, desorden ? `desorden en "${desorden.id}" (${desorden.anio})` : `${merged.length} hitos`); 
check('Sin hitos sin año numérico', sinAnio.length === 0, sinAnio.length ? sinAnio.slice(0, 3).map(e => e.id).join(' · ') : '');
check('Ids únicos', !dup, dup || `${merged.length} ids`);
check('Eras presentes en cada hito', !sinEra, sinEra ? sinEra.id : `${new Set(merged.map(e => e.era)).size} eras`);
check('Tipos válidos', !tipoInvalido, '');
check('Todo personaje con timeline[] aporta hitos', personasSinHito.length === 0, personasSinHito.length ? `${personasSinHito.map(p => p.slug).join(', ')} sin timeline` : `${personajes.length} personajes`);

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