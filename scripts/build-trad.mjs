/**
 * Publica las traducciones de trabajo de los libros solo-Codex.
 *
 *   node scripts/build-trad.mjs            # valida y escribe public/textos/exegesis/trad/
 *   node scripts/build-trad.mjs --check    # solo valida (no escribe nada)
 *
 * Fuente: `src/assets/texts/trad/<id>.json` (la edita el usuario o el agente
 * con su revisión). Salida: `public/textos/exegesis/trad/<id>.json`.
 *
 * No inventa ni completa texto: copia el original validado y le añade los
 * metadatos del libro de `src/data/exegesis.js` (nombre, abreviatura, orden,
 * número del Codex). Falla si:
 *   - el libro no existe en la tabla canónica o no tiene Codex;
 *   - un capítulo o versículo no está en el Codex (no se renumera);
 *   - un capítulo traducido no cubre todos los versículos del Codex;
 *   - hay texto vacío, marcas del aparato (§ ‹ › > κ(αι)) o griego en el texto;
 *   - la etiqueta, el estado o la licencia no son los del método
 *     (`docs/proyecto-biblico/TRADUCCION.md` §4–5), o la etiqueta dice «NTV».
 *
 * Después: `npm run exegesis:index` (el índice declara la cobertura `trad`).
 */
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { BOOK_BY_ID } from '../src/data/exegesis.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src/assets/texts/trad');
const CODEX = path.join(ROOT, 'public/textos/exegesis/codex');
const OUT = path.join(ROOT, 'public/textos/exegesis/trad');
const CHECK = process.argv.includes('--check');

export const TRAD_LABEL = 'Traducción de trabajo · Borrador';
export const TRAD_LICENSE = 'CC BY-NC-SA 3.0';
const STATUSES = ['borrador', 'revisado'];

const readJson = async file => JSON.parse(await readFile(file, 'utf8'));

/** Errores de un libro traducido frente a su Codex. */
export function validateTrad(trad, codex, meta) {
  const errors = [];
  const where = trad?.id || '?';
  if (!meta) return [`${where}: no está en la tabla canónica (src/data/exegesis.js)`];
  if (!meta.codexNo) errors.push(`${where}: el libro no tiene Codex; no hay base para traducir`);
  if (trad.base !== 'codex') errors.push(`${where}: base debe ser "codex"`);
  if (trad.label !== TRAD_LABEL) errors.push(`${where}: label debe ser «${TRAD_LABEL}»`);
  if (/ntv|nueva traducci/i.test(`${trad.label} ${trad.name || ''}`)) errors.push(`${where}: la etiqueta no puede decir NTV`);
  if (!STATUSES.includes(trad.status)) errors.push(`${where}: status debe ser ${STATUSES.join(' o ')}`);
  if (trad.license !== TRAD_LICENSE) errors.push(`${where}: license debe ser «${TRAD_LICENSE}»`);
  if (!Array.isArray(trad.chapters) || !trad.chapters.length) errors.push(`${where}: no hay capítulos`);

  const seen = new Set();
  for (const ch of trad.chapters || []) {
    if (seen.has(ch.num)) errors.push(`${where} ${ch.num}: capítulo repetido`);
    seen.add(ch.num);
    const base = codex?.chapters.find(c => c.num === ch.num);
    if (!base) {
      errors.push(`${where} ${ch.num}: el Codex no tiene este capítulo`);
      continue;
    }
    const want = base.verses.map(v => v.n);
    const got = (ch.verses || []).map(v => v.n);
    const missing = want.filter(n => !got.includes(n));
    const extra = got.filter(n => !want.includes(n));
    if (missing.length) errors.push(`${where} ${ch.num}: faltan versículos del Codex ${missing.join(', ')}`);
    if (extra.length) errors.push(`${where} ${ch.num}: versículos que el Codex no tiene ${extra.join(', ')}`);
    if (got.join() !== want.filter(n => got.includes(n)).join()) errors.push(`${where} ${ch.num}: orden de versículos distinto al del Codex`);
    for (const v of ch.verses || []) {
      const at = `${where} ${ch.num}:${v.n}`;
      const text = String(v.text || '');
      if (!text.trim()) errors.push(`${at}: texto vacío`);
      if (/[§‹›>]|κ\(αι\)/.test(text)) errors.push(`${at}: lleva marcas del aparato`);
      if (/[Ͱ-Ͽἀ-῿]/.test(text)) errors.push(`${at}: hay griego en el texto (va en las notas)`);
      if (v.note != null && !String(v.note).trim()) errors.push(`${at}: nota vacía`);
    }
  }
  return errors;
}

/** El JSON publicado: metadatos del libro + la traducción validada, sin campos ajenos. */
export function publishTrad(trad, meta) {
  return {
    id: meta.id,
    name: meta.name,
    abbr: meta.abbr,
    order: meta.order,
    codexNo: meta.codexNo,
    base: 'codex',
    label: trad.label,
    status: trad.status,
    license: trad.license,
    scope: trad.scope || null,
    chapters: trad.chapters.map(ch => ({
      num: ch.num,
      verses: ch.verses.map(v => (v.note ? { n: v.n, text: v.text, note: v.note } : { n: v.n, text: v.text }))
    }))
  };
}

async function main() {
  let files = [];
  try {
    files = (await readdir(SRC)).filter(f => f.endsWith('.json')).sort();
  } catch {
    console.log('No hay traducciones en src/assets/texts/trad/.');
    return;
  }

  const errors = [];
  const out = [];
  for (const file of files) {
    const trad = await readJson(path.join(SRC, file));
    if (trad.id !== file.replace(/\.json$/, '')) errors.push(`${file}: el id «${trad.id}» no coincide con el nombre del archivo`);
    const meta = BOOK_BY_ID.get(trad.id);
    let codex = null;
    try {
      codex = await readJson(path.join(CODEX, `${trad.id}.json`));
    } catch {
      errors.push(`${file}: no existe public/textos/exegesis/codex/${trad.id}.json`);
    }
    errors.push(...validateTrad(trad, codex, meta));
    if (meta) out.push(publishTrad(trad, meta));
  }

  if (errors.length) {
    console.error(`✗ ${errors.length} problema(s):\n  - ${errors.join('\n  - ')}`);
    process.exit(1);
  }

  for (const book of out) {
    const verses = book.chapters.reduce((a, c) => a + c.verses.length, 0);
    console.log(`✓ ${book.id}: caps. ${book.chapters.map(c => c.num).join(', ')} · ${verses} vers. · ${book.status}`);
  }
  if (CHECK) return;

  await mkdir(OUT, { recursive: true });
  for (const book of out) await writeFile(path.join(OUT, `${book.id}.json`), JSON.stringify(book) + '\n', 'utf8');
  console.log(`→ public/textos/exegesis/trad/ (${out.length} libro${out.length === 1 ? '' : 's'}). Ahora: npm run exegesis:index`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
