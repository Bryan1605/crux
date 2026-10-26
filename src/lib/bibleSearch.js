/**
 * Buscador por palabras para los textos bíblicos (NTV en español y Codex en
 * griego).
 *
 * La idea es la que pidió el equipo: «buscar el versículo exacto conforme uno
 * recuerde palabras». Para que eso funcione sin acentos, sin mayúsculas y sin
 * el aparato crítico de por medio, cada versículo se guarda dos veces: el texto
 * original y una versión normalizada (plegada) sobre la que se busca.
 *
 * Reglas del plegado:
 *   - minúsculas y sin diacríticos (`á` → `a`, `οὐρανόν` → `ουρανον`)
 *   - sigma final y sigma lunate unificadas en `σ` (`ς`, `ϲ` → `σ`)
 *   - fuera las marcas de nota de la NTV (`[z]`), las anclas del aparato (`§3`)
 *     y los corchetes de los *nomina sacra* (`‹ ›`)
 *   - todo lo que no sea letra o número se convierte en un único espacio
 */

const COMBINING = /[\u0300-\u036f]/;
const GREEK = /[0-9a-z\u0370-\u03ff]/;
const NOTE_MARK = /^\[[a-z]{1,2}\]/;

/**
 * Núcleo del plegado. Con `withMap` devuelve además, para cada carácter del
 * resultado, el índice del carácter original del que sale (lo usa el resaltado).
 */
function foldCore(input, withMap) {
  const src = String(input ?? '');
  const map = withMap ? [] : null;
  let out = '';
  let pendingSpace = false;

  const push = (ch, index) => {
    if (pendingSpace && out) {
      out += ' ';
      if (map) map.push(index);
    }
    pendingSpace = false;
    out += ch;
    if (map) map.push(index);
  };

  for (let i = 0; i < src.length; i += 1) {
    const raw = src[i];
    if (raw === '[') {
      const m = NOTE_MARK.exec(src.slice(i, i + 5));
      if (m) i += m[0].length - 1;
      continue;
    }
    if (raw === '\u00a7') {
      while (i + 1 < src.length && src[i + 1] >= '0' && src[i + 1] <= '9') i += 1;
      continue;
    }
    if (raw === '\u2039' || raw === '\u203A') continue;

    let ch = raw.normalize('NFD')[0].toLowerCase();
    if (ch === '\u03c2' || ch === '\u03f2') ch = '\u03c3';
    if (COMBINING.test(ch) || !GREEK.test(ch)) {
      pendingSpace = true;
      continue;
    }
    push(ch, i);
  }

  return withMap ? { folded: out, map } : out;
}

/** Texto normalizado para buscar. */
export const fold = input => foldCore(input, false);

/** Plegado + mapa de índices, para resaltar sobre el texto original. */
export const foldWithMap = input => foldCore(input, true);

/** Términos de una consulta (≥ 3 letras, sin repetir). */
export function queryTerms(query) {
  return [...new Set(fold(query).split(' ').filter(t => t.length >= 3))];
}

/**
 * Construye los registros buscables de un libro.
 * @param {{ witness:'ntv'|'codex', bookId:string, bookName:string, chapters:any[] }} args
 */
export function buildRecords({ witness, bookId, bookName, chapters }) {
  const records = [];
  for (const chapter of chapters || []) {
    for (const verse of chapter.verses || []) {
      const text = witness === 'codex' ? verse.grc || '' : verse.text || '';
      if (!text) continue;
      records.push({
        witness,
        bookId,
        bookName,
        chapter: chapter.num,
        verse: verse.n,
        text,
        fold: fold(text)
      });
    }
  }
  return records;
}

/**
 * Registros de todo un testamento a partir de `buscar-at.json` o `buscar-nt.json`.
 * @param {{ ntv:any, codex:any }} index
 * @param {Array<{id:string,name:string,order:number}>} books
 */
export function recordsFromIndex(index, books) {
  const records = [];
  for (const witness of ['codex', 'ntv']) {
    const byBook = index?.[witness];
    if (!byBook) continue;
    for (const book of books) {
      const chapters = byBook[book.id];
      if (!chapters) continue;
      for (const num of Object.keys(chapters).sort((a, b) => Number(a) - Number(b))) {
        const verses = chapters[num] || [];
        verses.forEach((text, i) => {
          if (!text) return;
          records.push({
            witness,
            bookId: book.id,
            bookName: book.name,
            chapter: Number(num),
            verse: i + 1,
            text,
            fold: fold(text)
          });
        });
      }
    }
  }
  return records;
}

/**
 * Resultados de una búsqueda: todos los términos deben aparecer en el versículo
 * (en cualquier orden), que es como se recuerda un texto.
 */
export function runSearch(records, query, { limit = 60 } = {}) {
  const terms = queryTerms(query);
  if (!terms.length) return { terms, hits: [], total: 0 };
  const hits = [];
  let total = 0;
  for (const record of records) {
    if (!terms.every(term => record.fold.includes(term))) continue;
    total += 1;
    if (hits.length < limit) hits.push(record);
  }
  return { terms, hits, total };
}

/**
 * Recorta el versículo alrededor de la primera coincidencia y devuelve tramos
 * con la marca de acierto, para poder resaltarla sin tocar el texto original.
 */
export function snippet(text, query, { before = 48, length = 168 } = {}) {
  const { folded, map } = foldWithMap(text);
  const terms = queryTerms(query);
  const ranges = [];
  for (const term of terms) {
    let at = folded.indexOf(term);
    while (at >= 0) {
      const start = map[at];
      let end = map[at + term.length - 1] + 1;
      while (end < text.length && COMBINING.test(text[end])) end += 1;
      ranges.push([start, end]);
      at = folded.indexOf(term, at + 1);
    }
  }
  if (!ranges.length) return [{ text, hit: false }];

  ranges.sort((a, b) => a[0] - b[0]);
  const first = ranges[0][0];
  const from = Math.max(0, first - before);
  const to = Math.min(text.length, from + length);

  const segments = [];
  let cursor = from;
  for (const [start, end] of ranges) {
    if (end <= from || start >= to) continue;
    const s = Math.max(start, from);
    const e = Math.min(end, to);
    if (s > cursor) segments.push({ text: text.slice(cursor, s), hit: false });
    if (e > Math.max(s, cursor)) segments.push({ text: text.slice(Math.max(s, cursor), e), hit: true });
    cursor = Math.max(cursor, e);
  }
  if (cursor < to) segments.push({ text: text.slice(cursor, to), hit: false });

  return [
    { text: from > 0 ? '…' : '', hit: false },
    ...segments.filter(seg => seg.text),
    { text: to < text.length ? '…' : '', hit: false }
  ].filter(seg => seg.text);
}
