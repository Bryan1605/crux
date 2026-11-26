/**
 * Núcleo compartido del léxico V2 (Node y React, sin dependencias externas).
 *
 * Soporta mapas de lemas tanto V1 (`[lemma, strong, parse, ns, pos]`) como V2
 * (`dict` por libro + tuplas compactas `[dictIdx, parse?, ns?]` o arrays de
 * morfemas `[[dictIdx, parse?, ns?], …]` preparados para prefijos/sufijos
 * hebreos). También centraliza los adaptadores de idioma y la búsqueda con
 * ordenación por relevancia.
 */
import { describeMorph, foldGreek, foldText, greekLetter, posLabel } from './greek.js';
import {
  describeHebrewMorph,
  foldHebrew,
  hebrewLetter,
  hebrewPosLabel,
  hebrewSortKey
} from './hebrew.js';

const GREEK_ORDER = 'αβγδεζηθικλμνξοπρστυφχψω';

export function greekSortKey(value) {
  return [...foldGreek(value)]
    .map(ch => {
      const index = GREEK_ORDER.indexOf(ch);
      return String(index < 0 ? 99 : index).padStart(2, '0');
    })
    .join('');
}

/**
 * Registro de adaptadores de idioma para el diccionario compartido.
 * Al añadir el diccionario hebreo/arameo basta registrar aquí la clave `heb`.
 */
export const LEXICON_LANGS = {
  grc: {
    id: 'grc',
    label: 'Griego koiné (NT)',
    title: 'Diccionario griego → español',
    dir: 'ltr',
    langAttr: 'el',
    strongPrefix: 'G',
    placeholder: 'λόγος, logos, fe, G3056, 25',
    fold: foldGreek,
    letterOf: greekLetter,
    sortKey: greekSortKey,
    formatMorph: describeMorph,
    posLabel
  },
  heb: {
    id: 'heb',
    label: 'Hebreo y arameo (AT)',
    title: 'Diccionario hebreo y arameo → español',
    dir: 'rtl',
    langAttr: 'he',
    strongPrefix: 'H',
    placeholder: 'בְּרֵאשִׁית, reshit, pacto, H7225, 430',
    fold: foldHebrew,
    letterOf: hebrewLetter,
    sortKey: hebrewSortKey,
    formatMorph: describeHebrewMorph,
    posLabel: hebrewPosLabel
  }
};

function decodeSingleTuple(tuple, dict) {
  if (!Array.isArray(tuple) || !tuple.length) return null;
  // Formato V1 heredado: [lemma, strong, parse, ns, pos]
  if (typeof tuple[0] === 'string') {
    return {
      lemma: tuple[0],
      strong: tuple[1] || null,
      parse: tuple[2] || null,
      ns: Boolean(tuple[3]),
      pos: tuple[4] || ''
    };
  }
  // Formato V2 compacto: [dictIndex, parse?, ns?]
  if (typeof tuple[0] === 'number') {
    const def = dict?.[tuple[0]];
    if (!def) return null;
    const [lemma, strong, pos] = def;
    return {
      lemma: lemma || '',
      strong: strong || null,
      parse: tuple[1] || null,
      ns: Boolean(tuple[2]),
      pos: pos || ''
    };
  }
  return null;
}

/**
 * Decodifica la entrada de un token en el mapa de lemas (V1 o V2 simple/multi-morfema)
 * devolviendo siempre un array de morfemas normalizados `{ lemma, strong, parse, ns, pos }`.
 */
export function decodeToken(raw, dict = null) {
  if (!raw || !Array.isArray(raw) || raw.length === 0) return [];
  if (Array.isArray(raw[0])) {
    return raw.map(part => decodeSingleTuple(part, dict)).filter(Boolean);
  }
  const single = decodeSingleTuple(raw, dict);
  return single ? [single] : [];
}

/** Decodifica todas las palabras de un versículo a arrays de morfemas. */
export function decodeVerseLemmas(lemaFile, chapter, verse) {
  const row = lemaFile?.verses?.[`${chapter}:${verse}`];
  if (!Array.isArray(row)) return [];
  const dict = lemaFile.dict || null;
  return row.map(raw => decodeToken(raw, dict));
}

/**
 * Normaliza una consulta de Strong para admitir tanto `G0025`, `g25` o `25`
 * (o prefijo `H` en hebreo). Devuelve cadena en minúsculas o `''` si no es Strong.
 */
export function normalizeStrongQuery(raw, prefix = 'G') {
  const clean = String(raw || '').trim();
  const match = new RegExp(`^([gh])?0*(\\d{1,5})([a-z])?$`, 'i').exec(clean);
  if (!match) return '';
  if (match[1] && match[1].toUpperCase() !== prefix.toUpperCase()) {
    // Permite buscar G... o H... explícitamente aunque difiera del prefijo por defecto.
    return `${match[1].toLowerCase()}${match[2].padStart(4, '0')}${(match[3] || '').toLowerCase()}`;
  }
  const p = (match[1] || prefix).toLowerCase();
  return `${p}${match[2].padStart(4, '0')}${(match[3] || '').toLowerCase()}`;
}

/** Agrupación didáctica de categorías gramaticales para filtros del diccionario. */
export function posBucket(pos) {
  const clean = String(pos || '').replace(/-$/, '');
  if (clean === 'V') return 'V';
  if (clean === 'N') return 'N';
  if (clean === 'A') return 'A';
  return 'func';
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Puntúa una entrada frente a la consulta de búsqueda (0 = no coincide).
 * Prioriza coincidencia exacta de Strong / lema / palabra en glosa sobre subcadenas.
 */
export function scoreLexiconEntry(item, { raw, folded, scriptQuery, strongQuery, adapter }) {
  if (!raw) return 1;
  const itemStrong = String(item.strong || '').toLowerCase();
  const itemLemmaFolded = adapter.fold(item.lemma);
  const itemTranslit = foldText(item.translit);
  const itemGloss = foldText(item.gloss);
  const itemNote = foldText(item.note || '');
  const itemForms = Array.isArray(item.forms) ? item.forms : [];

  let best = 0;
  if (strongQuery && itemStrong === strongQuery) best = Math.max(best, 100);
  else if (strongQuery && itemStrong.startsWith(strongQuery)) best = Math.max(best, 80);
  else if (folded && itemStrong.includes(folded)) best = Math.max(best, 72);

  if (scriptQuery) {
    if (itemLemmaFolded === scriptQuery) best = Math.max(best, 95);
    else if (itemLemmaFolded.startsWith(scriptQuery)) best = Math.max(best, 80);
    else if (itemLemmaFolded.includes(scriptQuery)) best = Math.max(best, 65);
    if (itemForms.some(f => adapter.fold(f) === scriptQuery)) best = Math.max(best, 78);
    else if (itemForms.some(f => adapter.fold(f).includes(scriptQuery))) best = Math.max(best, 58);
  }

  if (folded) {
    if (itemTranslit === folded) best = Math.max(best, 88);
    else if (itemTranslit.startsWith(folded)) best = Math.max(best, 74);
    else if (itemTranslit.includes(folded)) best = Math.max(best, 52);

    const primaryWordRe = new RegExp(`^${escapeRegExp(folded)}(?=$|[^\\p{L}])`, 'u');
    const exactWordRe = new RegExp(`(^|[^\\p{L}])${escapeRegExp(folded)}(?=$|[^\\p{L}])`, 'u');
    if (primaryWordRe.test(itemGloss)) best = Math.max(best, 93);
    else if (exactWordRe.test(itemGloss)) best = Math.max(best, 90);
    else {
      const prefixWordRe = new RegExp(`(^|[^\\p{L}])${escapeRegExp(folded)}`, 'u');
      if (prefixWordRe.test(itemGloss)) best = Math.max(best, 75);
      else if (itemGloss.includes(folded)) best = Math.max(best, 45);
    }

    if (foldText(item.lemma).includes(folded)) best = Math.max(best, 60);
    if (itemNote && itemNote.includes(folded)) best = Math.max(best, 30);
    if (itemForms.some(f => foldText(f).includes(folded))) best = Math.max(best, 54);
  }

  return best;
}

/** Filtra y ordena entradas del diccionario por relevancia o criterio elegido. */
export function searchLexiconEntries(
  entries,
  { query = '', letter = '', filter = 'all', sort = 'freq', lang = 'grc' } = {}
) {
  const adapter = LEXICON_LANGS[lang] || LEXICON_LANGS.grc;
  const raw = String(query || '').trim();
  const folded = foldText(raw);
  const scriptQuery = /[\u0370-\u03ff\u1f00-\u1fff\u0590-\u05ff]/.test(raw) ? adapter.fold(raw) : '';
  const strongQuery = normalizeStrongQuery(raw, adapter.strongPrefix);

  const matched = [];
  for (const item of entries || []) {
    if (letter && adapter.letterOf(item.lemma) !== letter) continue;
    if (filter === 'notes' && !item.note) continue;
    if (filter === 'ns' && !item.ns) continue;
    if (filter === 'arc' && !item.arc && !item.aramaicCount) continue;
    if ((filter === 'V' || filter === 'N' || filter === 'A' || filter === 'func') && posBucket(item.pos) !== filter) {
      continue;
    }

    const score = scoreLexiconEntry(item, { raw, folded, scriptQuery, strongQuery, adapter });
    if (raw && score <= 0) continue;
    matched.push({ item, score });
  }

  matched.sort((a, b) => {
    if (raw && b.score !== a.score) return b.score - a.score;
    if (sort === 'alpha') {
      return (
        adapter.sortKey(a.item.lemma).localeCompare(adapter.sortKey(b.item.lemma)) ||
        (b.item.count || 0) - (a.item.count || 0)
      );
    }
    if (sort === 'strong') {
      return String(a.item.strong || '').localeCompare(String(b.item.strong || ''));
    }
    return (b.item.count || 0) - (a.item.count || 0) || adapter.sortKey(a.item.lemma).localeCompare(adapter.sortKey(b.item.lemma));
  });

  return matched.map(m => m.item);
}

/**
 * Selecciona el morfema léxico principal de un token (en hebreo/arameo omite
 * prefijos inseparables `H9001–H9019` cuando van seguidos de una raíz léxica).
 */
export function pickPrimaryMorpheme(morphemes, lang = 'grc') {
  const list = Array.isArray(morphemes) ? morphemes.filter(Boolean) : [];
  if (!list.length) return null;
  if (lang === 'heb') {
    return (
      list.find(m => m.strong && !/^H90(0[1-9]|1[0-9])$/.test(m.strong)) ||
      list.find(m => m.strong) ||
      list[0]
    );
  }
  return list[0];
}
