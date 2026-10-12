/**
 * QA del índice de búsqueda (sin navegador).
 *
 *   node scripts/check-search.mjs
 *
 * Verifica content/busquedas.json: que esté actualizado, que cada entrada tenga
 * esquema correcto y haystack plegado, que cubra todo el contenido, que sus
 * destinos resuelvan a rutas reales y que las consultas de ejemplo devuelvan lo
 * esperado. Sale con código 1 si algo falla.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildSearchIndex } from './content-lib.mjs';
import { MIN_QUERY, searchItems } from '../src/lib/search.js';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const CONTENT = path.join(ROOT, 'content');

const read = f => JSON.parse(fs.readFileSync(path.join(CONTENT, f), 'utf8'));

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok: Boolean(ok) });
  console.log(`${ok ? 'OK ' : 'NO '} ${name}${detail ? ` — ${detail}` : ''}`);
};

const index = read('busquedas.json');
const estudios = read('estudios.json');
const concilios = read('concilios.json');
const videos = fs.existsSync(path.join(CONTENT, 'videos.json')) ? read('videos.json') : [];
const personajes = fs
  .readdirSync(path.join(CONTENT, 'personajes'))
  .filter(f => f.endsWith('.json'))
  .map(f => read(`personajes/${f}`));

const TIPOS_OK = new Set(['estudio', 'personaje', 'concilio', 'herejia', 'video']);
const FOLD_OK = /^[^A-ZÁÀÄÂÃÅÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛÑÇÝŸÆŒØß]*$/;

// 1 · El archivo en disco está al día (mismo contenido que una regeneración).
const fresh = `${JSON.stringify(buildSearchIndex(CONTENT), null, 2)}\n`;
const onDisk = fs.readFileSync(path.join(CONTENT, 'busquedas.json'), 'utf8');
check('El índice en disco está actualizado', fresh === onDisk, fresh === onDisk ? '' : 'regenera con npm run build');

// 2 · Esquema de cada entrada.
const items = Array.isArray(index.items) ? index.items : [];
const schemaErrors = [];
const seen = new Set();
for (const it of items) {
  if (!it || typeof it !== 'object') {
    schemaErrors.push('entrada no objeto');
    continue;
  }
  const where = `${it.tipo}:${it.id}`;
  if (!TIPOS_OK.has(it.tipo)) schemaErrors.push(`${where}: tipo inválido`);
  if (!it.id || typeof it.id !== 'string' || !/^[\p{L}\p{N}_.-]+$/u.test(it.id)) schemaErrors.push(`${where}: id inválido`);
  if (typeof it.href !== 'string' || !it.href.startsWith('/')) schemaErrors.push(`${where}: href inválido`);
  if (typeof it.title !== 'string' || !it.title.trim()) schemaErrors.push(`${where}: title vacío`);
  if (typeof it.fold !== 'string' || !it.fold.trim()) schemaErrors.push(`${where}: fold vacío`);
  else if (!FOLD_OK.test(it.fold)) schemaErrors.push(`${where}: fold con mayúsculas o acentos`);
  if (!Array.isArray(it.tags)) schemaErrors.push(`${where}: tags no es array`);
  if (it.tipo && it.id) {
    if (seen.has(`${it.tipo}:${it.id}`)) schemaErrors.push(`${where}: id duplicado`);
    seen.add(`${it.tipo}:${it.id}`);
  }
}
check('Esquema de las entradas', schemaErrors.length === 0, schemaErrors.slice(0, 3).join(' · ') || `${items.length} entradas`);

// 3 · Cobertura: exactamente una entrada por estudio, personaje, concilio, herejía y video.
const count = t => items.filter(it => it.tipo === t).length;
const expected = {
  estudio: (estudios.studies || []).length,
  personaje: personajes.length,
  concilio: concilios.filter(c => c.tipo === 'concilio').length,
  herejia: concilios.filter(c => c.tipo === 'herejia').length,
  video: videos.length
};
const coverage = Object.entries(expected)
  .filter(([t, n]) => count(t) !== n)
  .map(([t, n]) => `${t} ${count(t)}/${n}`);
check(
  'Cobertura de todo el contenido',
  coverage.length === 0,
  coverage.join(' · ') || Object.entries(expected).map(([t, n]) => `${t}:${n}`).join(' · ')
);
check(
  'Recuento index.tipos coherente',
  Object.entries(expected).every(([t, n]) => (n === 0 ? index.tipos?.[t] === undefined : index.tipos?.[t] === n)),
  JSON.stringify(index.tipos || {})
);

// 4 · Los destinos resuelven a rutas reales.
const studySlugs = new Set((estudios.studies || []).map(s => s.slug));
const personajeSlugs = new Set(personajes.map(p => p.slug));
const concilioIds = new Set(concilios.map(c => c.id));
const videoIds = new Set(videos.map(v => v.id));
const badHref = [];
for (const it of items) {
  const pathname = it.href.split('#')[0];
  const hash = it.href.split('#')[1] || '';
  if (it.tipo === 'estudio') {
    if (!studySlugs.has(pathname.replace('/estudio/', ''))) badHref.push(`${it.id} → ${it.href}`);
  } else if (it.tipo === 'personaje') {
    const ok = pathname.startsWith('/estudio/personajes/')
      ? personajeSlugs.has(pathname.replace('/estudio/personajes/', ''))
      : studySlugs.has(pathname.replace('/estudio/', ''));
    if (!ok) badHref.push(`${it.id} → ${it.href}`);
  } else if (it.tipo === 'concilio' || it.tipo === 'herejia') {
    if (pathname !== '/concilios' || !concilioIds.has(hash)) badHref.push(`${it.id} → ${it.href}`);
  } else if (it.tipo === 'video') {
    if (!videoIds.has(it.id)) badHref.push(`${it.id} → ${it.href}`);
  }
}
check('Destinos resuelven a rutas reales', badHref.length === 0, badHref.slice(0, 3).join(' · ') || `${items.length} destinos`);

// 5 · Consultas de ejemplo.
const q = s => searchItems(index, s);
const has = (list, tipo, id) => list.some(it => it.tipo === tipo && it.id === id);
const top = list => (list[0] ? `${list[0].tipo}:${list[0].id}` : 'nada');

check('«nicea» encuentra el Concilio de Nicea', has(q('nicea'), 'concilio', 'nicea'), top(q('nicea')));
check('«jerusalen» encuentra el Concilio de Jerusalén', has(q('jerusalen'), 'concilio', 'jerusalen'), top(q('jerusalen')));
check('«arrianismo» encuentra la herejía', has(q('arrianismo'), 'herejia', 'arrianismo'), top(q('arrianismo')));
check('«pablo» encuentra el personaje', has(q('pablo'), 'personaje', 'apostol-pablo'), top(q('pablo')));
check('«perdon» encuentra el estudio Perdón', has(q('perdon'), 'estudio', '01-fundamentos--01-perdon'), top(q('perdon')));
check(
  '«perdón» (con tilde) da el mismo resultado',
  JSON.stringify(q('perdón').map(i => `${i.tipo}:${i.id}`)) === JSON.stringify(q('perdon').map(i => `${i.tipo}:${i.id}`)),
  ''
);
check('un título exacto va primero', q('justificacion')[0]?.id === '01-fundamentos--02-justificacion', top(q('justificacion')));
check(
  `menos de ${MIN_QUERY} letras no busca`,
  q('').length === 0 && q(' ').length === 0 && q('a').length === 0,
  ''
);
check('un pasaje encuentra estudios', q('juan 3:16').length > 0 || q('romanos').length > 0, `${q('romanos').length} por «romanos»`);

// 6 · La navegación y el pie enlazan las páginas nuevas.
const site = read('site.json');
const siteHrefs = [
  ...site.nav.flatMap(n => n.links.map(l => l.href)),
  ...site.footer.links.map(l => l.href)
];
check('nav/pie enlazan /buscar y /temas', siteHrefs.includes('/buscar') && siteHrefs.includes('/temas'), '');

console.log(
  `\nÍndice: ${items.length} entradas · ${Object.entries(index.tipos || {}).map(([t, n]) => `${t}: ${n}`).join(' · ')}`
);
const fails = results.filter(r => !r.ok).length;
console.log(`\n${results.length - fails}/${results.length} checks OK`);
process.exit(fails ? 1 : 0);
