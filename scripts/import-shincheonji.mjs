/**
 * Importa «100 preguntas de ortodoxia para Shincheonji» desde el wiki del
 * usuario a `content/apologetica/shincheonji-preguntas.json`.
 *
 *   node scripts/import-shincheonji.mjs            → simulación (no escribe)
 *   node scripts/import-shincheonji.mjs --write    → escribe el JSON
 *   --file <ruta>                                  → otra copia del .md
 *
 * Qué hace:
 *   - Lee los 10 bloques y las 100 preguntas con su «Clave».
 *   - Saca las referencias bíblicas de cada pregunta y de su clave
 *     («Juan 5:18 y 10:30-33», «Mateo 13:30 y 40-43», «(v. 29)»).
 *   - Comprueba que cada versículo existe en la NTV y si lo conserva el Codex.
 *   - Quita los enlaces internos del wiki ([[...]]): la página es pública.
 *
 * No inventa nada: el texto de preguntas y claves se copia tal cual.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ALL_BOOKS, BOOK_BY_ID } from '../src/data/exegesis.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const WRITE = args.includes('--write');
const fileArg = args.indexOf('--file');
const SOURCE =
  fileArg >= 0
    ? args[fileArg + 1]
    : 'D:/Biblia/SegundoCerebroBiblico/wiki/06-apologetica/shincheonji/100-preguntas-de-ortodoxia.md';
const OUT = join(ROOT, 'content', 'apologetica', 'shincheonji-preguntas.json');
const TEXTOS = join(ROOT, 'public', 'textos', 'exegesis');

if (!existsSync(SOURCE)) {
  console.error(`No existe ${SOURCE}`);
  process.exit(1);
}

const raw = readFileSync(SOURCE, 'utf8').replace(/\r\n/g, '\n');
const [, front = '', body = raw] = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(raw) || [];
const actualizado = /^updated:\s*(\S+)/m.exec(front)?.[1] || '';

/** Quita los enlaces del wiki: «(ver [[x|Y]] §1)» desaparece; «[[x|Y]]» → «Y». */
const clean = text =>
  String(text)
    .replace(/\s*\((?:ver|véase)[^()]*\[\[[^\]]*\]\][^()]*\)/gi, '')
    .replace(/\[\[[^\]|]*\|([^\]]*)\]\]/g, '$1')
    .replace(/\[\[([^\]]*)\]\]/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();

/* ----------------------------------------------------------- referencias */

const plain = v =>
  String(v)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.\s]/g, '');

const ALIAS = new Map();
for (const b of ALL_BOOKS) {
  ALIAS.set(plain(b.name), b.id);
  ALIAS.set(plain(b.abbr), b.id);
}
// Formas abreviadas del wiki que no están en la tabla.
ALIAS.set('gl', 'galatas');
ALIAS.set('ap', 'apocalipsis');
ALIAS.set('dt', 'deuteronomio');
ALIAS.set('ex', 'exodo');

const names = [...new Set(ALL_BOOKS.flatMap(b => [b.name, b.abbr]).concat(['Gl', 'Ap', 'Dt', 'Ex']))]
  .sort((a, b) => b.length - a.length)
  .map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
const REF = new RegExp(`(?<![\\p{L}\\d])(${names.join('|')})\\.?\\s+(\\d+):(\\d+)(?:-(\\d+))?`, 'gu');

const label = r => `${BOOK_BY_ID.get(r.libro).name} ${r.cap}:${r.desde}${r.hasta > r.desde ? `-${r.hasta}` : ''}`;
/**
 * Versículos que el griego numera distinto que la NTV. Solo los comprobados a
 * mano contra el JSON del Codex; la página muestra la nota.
 */
const NUMERACION = [
  {
    libro: '2-corintios',
    cap: 13,
    desde: 14,
    codex: { cap: 13, desde: 13, hasta: 13 },
    nota: 'En el griego es el 13:13: las biblias en español parten en dos el versículo 12.'
  }
];

const mk = (libro, cap, desde, hasta) => {
  const r = { libro, cap: Number(cap), desde: Number(desde), hasta: Number(hasta || desde) };
  const eq = NUMERACION.find(e => e.libro === libro && e.cap === r.cap && e.desde === r.desde && r.hasta === r.desde);
  return { ...r, label: label(r), ...(eq ? { codex: eq.codex, nota: eq.nota } : {}) };
};

/** Referencias de un texto, en orden. `base` resuelve «(v. 29)». */
function extractRefs(text, base = null) {
  const out = [];
  REF.lastIndex = 0;
  let m;
  while ((m = REF.exec(text))) {
    const libro = ALIAS.get(plain(m[1]));
    if (!libro) continue;
    let cap = m[2];
    out.push(mk(libro, cap, m[3], m[4]));
    // Continuaciones del mismo libro: «y 10:30-33», «, 14», «y 40-43».
    let rest = text.slice(REF.lastIndex);
    for (;;) {
      const c = /^\s*(?:y|,|;)\s*(\d+):(\d+)(?:-(\d+))?/.exec(rest) || /^\s*(?:y|,)\s*(\d+)(?:-(\d+))?(?!\d)(?!:\d)/.exec(rest);
      if (!c) break;
      if (c.length === 4) {
        cap = c[1];
        out.push(mk(libro, cap, c[2], c[3]));
      } else {
        out.push(mk(libro, cap, c[1], c[2]));
      }
      rest = rest.slice(c[0].length);
      REF.lastIndex += c[0].length;
    }
  }
  // Libros de un solo capítulo: «Judas 3», «Filemón 10».
  for (const s1 of text.matchAll(/(?<![\p{L}\d])(Judas|Filemón|2 Juan|3 Juan|Abdías)\s+(\d+)(?:-(\d+))?(?!\d)(?!:\d)/gu)) {
    const libro = ALIAS.get(plain(s1[1]));
    if (libro) out.push(mk(libro, 1, s1[2], s1[3]));
  }
  if (base) {
    for (const v of text.matchAll(/\bv\.\s*(\d+)(?:-(\d+))?/g)) out.push(mk(base.libro, base.cap, v[1], v[2]));
  }
  const seen = new Set();
  return out.filter(r => !seen.has(r.label) && seen.add(r.label));
}

/* ----------------------------------------------------------- disponibilidad */

const cache = new Map();
const load = (dir, id) => {
  const key = `${dir}/${id}`;
  if (!cache.has(key)) {
    const f = join(TEXTOS, dir, `${id}.json`);
    cache.set(key, existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : null);
  }
  return cache.get(key);
};
const hasVerses = (dir, r) => {
  const ch = load(dir, r.libro)?.chapters?.find(c => (c.num ?? c.n) === r.cap);
  if (!ch) return 0;
  let n = 0;
  for (let v = r.desde; v <= r.hasta; v++) if (ch.verses.some(x => x.n === v)) n++;
  return n;
};

/**
 * Copia en la referencia los versículos que la página muestra: la NTV y, si el
 * Codex los conserva todos, el griego con su página del manuscrito. Así la
 * página no descarga 26 libros ni salta mientras carga, y el HTML prerenderizado
 * ya lleva el texto. qa:shincheonji comprueba que siguen iguales a los JSON
 * de public/textos/exegesis/.
 */
const withTexts = r => {
  const pick = (dir, ref) =>
    (load(dir, ref.libro)?.chapters?.find(c => (c.num ?? c.n) === ref.cap)?.verses || []).filter(
      v => v.n >= ref.desde && v.n <= ref.hasta
    );
  const g = r.codex ? { ...r, ...r.codex } : r;
  const grc = BOOK_BY_ID.get(r.libro)?.codexNo ? pick('codex', g) : [];
  const complete = grc.length === g.hasta - g.desde + 1;
  return {
    ...r,
    ntv: pick('ntv', r).map(v => ({ n: v.n, text: v.text.replace(/\[[a-z]{1,2}\]/g, '') })),
    grc: complete ? grc.map(v => ({ n: v.n, grc: v.grc })) : [],
    pagina: complete ? grc[0].pages?.[0] || '' : ''
  };
};

/* ----------------------------------------------------------- parseo */

const lines = body.split('\n');
const bloques = [];
const reglas = [];
let bloque = null;
let section = '';
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const h2 = /^##\s+(.+)$/.exec(line);
  if (h2) {
    section = h2[1].trim();
    const b = /^([IVX]+)\.\s+(.+?)\s*\((\d+)-(\d+)\)$/.exec(section);
    bloque = b ? { id: b[1], titulo: clean(b[2]), desde: Number(b[3]), hasta: Number(b[4]), preguntas: [] } : null;
    if (bloque) bloques.push(bloque);
    continue;
  }
  if (section === 'Por qué 100 preguntas') {
    const r = /^\d+\.\s+(.+)$/.exec(line);
    if (r && reglas.length < 10 && /Reglas del examen/.test(lines.slice(0, i).join('\n'))) {
      if (!/Cómo usarlas/.test(lines.slice(0, i).join('\n'))) reglas.push(clean(r[1].replace(/\*\*/g, '')));
    }
    continue;
  }
  if (!bloque) continue;
  const q = /^(\d+)\.\s+\*\*(.+)\*\*\s*$/.exec(line);
  if (!q) continue;
  const k = /^\s+\*Clave:\*\s*(.+)$/.exec(lines[i + 1] || '');
  const texto = clean(q[2]);
  const clave = clean(k ? k[1] : '');
  const refs = extractRefs(texto);
  const claveRefs = extractRefs(clave, refs[0]).filter(r => !refs.some(x => x.label === r.label));
  bloque.preguntas.push({ n: Number(q[1]), texto, clave, refs: refs.map(withTexts), claveRefs });
}

/* ----------------------------------------------------------- informe */

const preguntas = bloques.flatMap(b => b.preguntas);
const problemas = [];
if (bloques.length !== 10) problemas.push(`bloques: ${bloques.length} (se esperaban 10)`);
if (preguntas.length !== 100) problemas.push(`preguntas: ${preguntas.length} (se esperaban 100)`);
preguntas.forEach((p, i) => {
  if (p.n !== i + 1) problemas.push(`numeración: pregunta ${p.n} en la posición ${i + 1}`);
  if (!p.clave) problemas.push(`pregunta ${p.n}: sin clave`);
  if (!p.refs.length) problemas.push(`pregunta ${p.n}: sin referencia bíblica en la pregunta`);
});

let ntvOk = 0;
let ntvTotal = 0;
let codex = 0;
const faltan = [];
const sinCodex = [];
const libros = new Map();
for (const p of preguntas) {
  for (const r of [...p.refs, ...p.claveRefs]) {
    const want = r.hasta - r.desde + 1;
    const got = hasVerses('ntv', r);
    ntvTotal += want;
    ntvOk += got;
    if (got < want) faltan.push(`${p.n}: ${r.label} (NTV ${got}/${want})`);
    if (hasVerses('codex', r.codex ? { ...r, ...r.codex } : r) === want) codex++;
    else sinCodex.push(`${p.n}: ${r.label} (${hasVerses('codex', r)}/${want})`);
    libros.set(r.libro, (libros.get(r.libro) || 0) + 1);
  }
}
const totalRefs = preguntas.reduce((n, p) => n + p.refs.length + p.claveRefs.length, 0);

console.log(`Fuente: ${SOURCE} (actualizado ${actualizado || '¿?'})`);
console.log(`Bloques: ${bloques.length} · preguntas: ${preguntas.length} · reglas: ${reglas.length}`);
console.log(`Referencias: ${totalRefs} (${preguntas.reduce((n, p) => n + p.refs.length, 0)} en preguntas, ${preguntas.reduce((n, p) => n + p.claveRefs.length, 0)} en claves) · ${libros.size} libros`);
console.log(`Versículos en la NTV: ${ntvOk}/${ntvTotal} · referencias completas en el Codex: ${codex}/${totalRefs}`);
for (const n of [1, 3, 14, 43, 73, 89]) {
  const p = preguntas.find(x => x.n === n);
  if (p) console.log(`  ${n}. ${p.refs.map(r => r.label).join(' · ')}${p.claveRefs.length ? `  | clave: ${p.claveRefs.map(r => r.label).join(' · ')}` : ''}`);
}
if (sinCodex.length) console.log(`Sin texto completo en el Codex (se muestra solo la NTV con un aviso):\n  ${sinCodex.join('\n  ')}`);
if (faltan.length) console.log(`Versículos que la NTV no tiene:\n  ${faltan.join('\n  ')}`);
if (problemas.length) {
  console.log(`Problemas:\n  ${problemas.join('\n  ')}`);
  process.exit(1);
}

const data = {
  version: 1,
  fuente: { archivo: 'wiki/06-apologetica/shincheonji/100-preguntas-de-ortodoxia.md', actualizado },
  // Fuentes del registro (content/libros/fuentes.json) que respaldan los datos
  // del recuadro «¿Qué es el Codex Sinaiticus?» de la página.
  fuentes: ['csp-acerca-del-codex', 'csp-codex-sinaiticus'],
  reglas,
  bloques
};

if (!WRITE) {
  console.log(`\nSimulación: no se escribe nada. Con --write se crea ${OUT.replace(ROOT, '.')}`);
} else {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`\nEscrito ${OUT.replace(ROOT, '.')}`);
}
