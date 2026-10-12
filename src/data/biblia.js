/**
 * Biblia Patrística — capa de datos.
 *
 * El documento fuente (`/textos/biblia-patristica.md`, ~1,2 MB) es una
 * enciclopedia jerárquica: título, Partes (`## Parte X — …`), secciones
 * (`### …`), subsecciones (`#### …`) y párrafos, listas, tablas y citas.
 *
 * Este módulo lo convierte en un modelo navegable y paginable:
 *
 *   book.parts      → 20 Partes, cada una con sus secciones
 *   book.sections   → 66 secciones (con su Parte)
 *   book.blocks     → flujo lineal de bloques atómicos (para paginar, buscar
 *                     y leer); cada bloque sabe a qué Parte y sección pertenece
 *
 * El módulo es deliberadamente puro: no importa nada del entorno de Vite, así
 * que `scripts/qa-biblia.mjs` puede importarlo directamente con Node.
 *
 * Los ids de página son **estables** e independientes del tamaño de la ventana:
 *
 *   `p2-4`                    → la Parte 2.4
 *   `p2-4.resumen`            → su sección «Resumen»
 *   `p2-4.resumen.3`          → la 3.ª página de esa sección
 *
 * La numeración de folios (1..N) sí depende del reflow: se calcula al paginar.
 */

import { fold, slugify } from '../lib/fold.js';

/* -------------------------------------------------------------------------- */
/* Normalización de texto                                                     */
/* -------------------------------------------------------------------------- */

// `fold` y `slugify` viven en src/lib/fold.js para que el índice de búsqueda
// pre-generado (content/busquedas.json) pliegue el texto igual que el navegador.
// Se reexportan desde aquí porque el resto del sitio los importa de `data/biblia`.
export { fold, slugify };

/* -------------------------------------------------------------------------- */
/* Troceado del markdown en bloques                                           */
/* -------------------------------------------------------------------------- */

const HEADING_RE = /^(#{1,6})\s+(.*)$/;
const PART_RE = /^Parte\s+([\d.]+)\b/i;
const LIST_RE = /^\s{0,3}(?:[-*+]|\d{1,3}[.)])\s+/;
const TABLE_RE = /^\s{0,3}\|/;
const QUOTE_RE = /^\s{0,3}>\s?/;

/**
 * Divide el documento en bloques semánticos: los encabezados son bloques
 * propios y el resto se separa por líneas en blanco (así las tablas, listas y
 * citas de varias líneas quedan enteras).
 */
function toBlocks(lines) {
  const out = [];
  let buf = [];

  const flush = () => {
    if (!buf.length) return;
    const text = buf.join('\n').trim();
    buf = [];
    if (text) out.push({ kind: 'md', text });
  };

  for (const line of lines) {
    if (!line.trim()) {
      flush();
      continue;
    }
    const h = HEADING_RE.exec(line);
    if (h) {
      flush();
      out.push({ kind: 'heading', level: h[1].length, text: h[2].trim() });
      continue;
    }
    buf.push(line);
  }
  flush();
  return out;
}

/* -------------------------------------------------------------------------- */
/* Troceado fino (para que ningún bloque desborde una página)                 */
/* -------------------------------------------------------------------------- */

/** ¿La posición `at` cae dentro de una énfasis o código sin cerrar? */
function inInlineMarkup(text, at) {
  let stars = 0;
  let ticks = 0;
  for (let i = 0; i < at; i += 1) {
    if (text[i] === '*') stars += 1;
    else if (text[i] === '`') ticks += 1;
  }
  return stars % 2 === 1 || ticks % 2 === 1;
}

/** Corta un párrafo por frases, sin romper énfasis ni código inline. */
function splitSentences(text) {
  const out = [];
  let start = 0;
  for (let i = 1; i < text.length; i += 1) {
    const prev = text[i - 1];
    if (!'.!?…»'.includes(prev)) continue;
    const rest = text.slice(i);
    if (!/^[ \t]+[¿¡«"'(A-ZÁÉÍÓÚÜÑ0-9]/.test(rest)) continue;
    if (inInlineMarkup(text, i)) continue;
    out.push(text.slice(start, i).trim());
    start = i;
  }
  out.push(text.slice(start).trim());
  return out.filter(Boolean);
}

/** Agrupa piezas en trozos de como mucho `maxChars`, sin partir ninguna. */
function group(pieces, maxChars) {
  const out = [];
  let buf = [];
  let len = 0;
  for (const piece of pieces) {
    if (buf.length && len + piece.length > maxChars) {
      out.push(buf);
      buf = [];
      len = 0;
    }
    buf.push(piece);
    len += piece.length + 1;
  }
  if (buf.length) out.push(buf);
  return out;
}

/**
 * Trocea un bloque markdown en fragmentos legibles que quepan en una página,
 * respetando la estructura: tablas (repite la cabecera), listas (por ítems),
 * citas (por líneas) y prosa (por frases).
 */
function explode(text, maxChars) {
  if (text.length <= maxChars) return [text];

  const lines = text.split('\n');
  const first = lines[0] || '';

  if (TABLE_RE.test(first) && lines.length > 3) {
    const head = lines[1] && /^\s*\|?[\s:|-]+\|/.test(lines[1]) ? lines.slice(0, 2) : lines.slice(0, 1);
    const header = head.join('\n');
    const chunks = group(lines.slice(head.length), Math.max(maxChars - header.length, 240));
    if (chunks.length > 1) return chunks.map(rows => [header, ...rows].join('\n'));
  }

  if (LIST_RE.test(first)) {
    const chunks = group(lines, maxChars);
    if (chunks.length > 1) return chunks.map(items => items.join('\n'));
  }

  if (QUOTE_RE.test(first)) {
    const chunks = group(lines, maxChars);
    if (chunks.length > 1) return chunks.map(items => items.join('\n'));
  }

  if (!lines.some(line => /^\s{0,3}(?:\||[-*+]\s|\d{1,3}[.)]\s|>)/.test(line))) {
    const chunks = group(splitSentences(text), maxChars);
    if (chunks.length > 1) return chunks.map(sentences => sentences.join(' '));
  }

  return [text];
}

/* -------------------------------------------------------------------------- */
/* Estructura                                                                 */
/* -------------------------------------------------------------------------- */

const TITLE_FALLBACK = 'Biblia Patrística';

/**
 * Convierte el markdown de la obra en el modelo navegable.
 *
 * @param {string} source
 * @param {{ maxChars?: number }} [options] tamaño máximo de bloque (por defecto
 *        620 caracteres: unos 8 renglones de libro).
 * @returns {{
 *   title: string,
 *   parts: Array<object>,
 *   sections: Array<object>,
 *   blocks: Array<object>,
 *   partById: Map<string, object>,
 *   sectionById: Map<string, object>,
 *   stats: object
 * }}
 */
export function parseBook(source, options = {}) {
  const maxChars = options.maxChars ?? 620;
  const clean = String(source).replace(/^\uFEFF/, '');
  const lines = clean.split(/\r?\n/);

  let title = TITLE_FALLBACK;
  let from = 0;
  if (/^#\s+/.test(lines[0] || '')) {
    title = lines[0].replace(/^#+\s*/, '').trim() || TITLE_FALLBACK;
    from = 1;
  }

  const raw = toBlocks(lines.slice(from));

  const parts = [];
  const sections = [];
  const blocks = [];
  const slugsIn = new Map();

  let part = null;
  let section = null;

  const ensurePart = () => {
    if (part) return part;
    part = { id: 'p-intro', label: 'Introducción', num: '', level: 2, sections: [], firstBlock: blocks.length };
    parts.push(part);
    return part;
  };

  for (const item of raw) {
    if (item.kind === 'heading') {
      const match = PART_RE.exec(item.text);

      if (match) {
        const id = `p${match[1].replace(/\./g, '-')}`;
        part = { id, label: item.text, num: match[1], level: item.level, sections: [], firstBlock: blocks.length };
        parts.push(part);
        section = null;
        blocks.push({
          i: blocks.length,
          type: 'part',
          text: item.text,
          level: item.level,
          partId: id,
          sectionId: null
        });
        continue;
      }

      const owner = ensurePart();
      const used = slugsIn.get(owner.id) || new Set();
      const base = slugify(item.text);
      let slug = base;
      let n = 2;
      while (used.has(slug)) {
        slug = `${base}-${n}`;
        n += 1;
      }
      used.add(slug);
      slugsIn.set(owner.id, used);

      // El id lleva delante la Parte: así es único en toda la obra (`p2-4-resumen`)
      // y puede viajar solo en la URL sin ambigüedad.
      const id = `${owner.id}-${slug}`;
      section = { id, slug, partId: owner.id, label: item.text, level: item.level, blockIndex: blocks.length };
      sections.push(section);
      owner.sections.push(id);

      blocks.push({
        i: blocks.length,
        type: 'heading',
        text: item.text,
        level: item.level,
        partId: owner.id,
        sectionId: id
      });
      continue;
    }

    // Separadores sueltos antes de la primera Parte (tras el título) no son
    // contenido: no deben crear una Parte fantasma.
    if (!part && /^([-*_])\1{2,}$/.test(item.text.trim())) continue;

    const owner = ensurePart();
    for (const chunk of explode(item.text, maxChars)) {
      blocks.push({
        i: blocks.length,
        type: 'md',
        text: chunk,
        level: 0,
        partId: owner.id,
        sectionId: section ? section.id : null
      });
    }
  }

  // Índices auxiliares: búsqueda, recuento y contexto de cada bloque.
  let chars = 0;
  let words = 0;
  for (const block of blocks) {
    block.folded = fold(block.text);
    block.words = block.text.split(/\s+/).filter(Boolean).length;
    chars += block.text.length;
    words += block.words;
  }

  const partById = new Map(parts.map(p => [p.id, p]));
  const sectionById = new Map(sections.map(s => [s.id, s]));

  return {
    title,
    parts,
    sections,
    blocks,
    partById,
    sectionById,
    stats: {
      chars,
      words,
      parts: parts.length,
      sections: sections.length,
      blocks: blocks.length,
      charsPerBlock: blocks.length ? Math.round(chars / blocks.length) : 0
    }
  };
}

/* -------------------------------------------------------------------------- */
/* Búsqueda                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Busca en el flujo de la obra y devuelve coincidencias con su contexto.
 *
 * @returns {Array<{ block: object, part: object|null, section: object|null,
 *                   snippet: { before: string, hit: string, after: string } }>}
 */
export function searchBiblia(book, rawQuery, limit = 30) {
  const q = fold(String(rawQuery).trim());
  if (q.length < 2) return [];

  const out = [];
  const seen = new Set();

  for (const block of book.blocks) {
    if (block.type === 'part') continue;
    const at = block.folded.indexOf(q);
    if (at < 0) continue;

    // Evita 20 resultados de la misma página de cabecera.
    const key = `${block.partId}|${block.sectionId}|${block.text.slice(0, 40)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const start = Math.max(0, at - 70);
    const end = Math.min(block.text.length, at + q.length + 120);
    const slice = block.text.slice(start, end);
    const rel = at - start;

    out.push({
      block,
      part: book.partById.get(block.partId) || null,
      section: block.sectionId ? book.sectionById.get(block.sectionId) || null : null,
      snippet: {
        before: (start > 0 ? '…' : '') + slice.slice(0, rel),
        hit: slice.slice(rel, rel + q.length),
        after: slice.slice(rel + q.length) + (end < block.text.length ? '…' : '')
      }
    });

    if (out.length >= limit) break;
  }

  return out;
}

/* -------------------------------------------------------------------------- */
/* Carga                                                                      */
/* -------------------------------------------------------------------------- */

let cache = null;

/**
 * Descarga el documento una sola vez y lo convierte en el modelo navegable.
 *
 * @param {string} url ruta ya resuelta con `assetUrl()` (la resuelve quien
 *        llama, para que este módulo siga siendo puro y testeable con Node).
 */
export function loadBiblia(url) {
  if (cache) return cache;

  cache = (async () => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return parseBook(await res.text());
  })();

  cache.catch(() => {
    cache = null;
  });

  return cache;
}

export default loadBiblia;
