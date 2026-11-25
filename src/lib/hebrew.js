/**
 * Hebreo y arameo bíblico (WLC / OSHB) — módulo puro compartido (navegador y Node).
 *
 * REGLA FUNDAMENTAL: el texto fuente del Westminster Leningrad Codex (WLC) NO
 * debe normalizarse a NFC ni a NFD en ningún paso del parseo ni de la vista:
 * el orden transmitido de los puntos vocálicos (niqqud) y las marcas de
 * cantilación (te'amim) forma parte de la edición masorética.
 */

export const HEBREW_SOURCE_URL = 'https://github.com/openscriptures/morphhb';
export const HEBREW_LICENSE_URL = 'https://creativecommons.org/licenses/by/4.0/';
export const EZRA_SIL_URL = 'https://software.sil.org/ezra/';
export const EZRA_SIL_LICENSE_URL = 'https://scripts.sil.org/OFL';
export const HEBREW_ATTRIBUTION =
  'Texto hebreo y arameo base del Westminster Leningrad Codex (WLC, dominio público); ' +
  'marcado OSIS, arameo, ketiv/qere y mapa de versificación de Open Scriptures Hebrew Bible ' +
  '(OSHB, CC BY 4.0). Tipografía Ezra SIL (SIL Open Font License 1.1).';

/**
 * Los 39 libros del Antiguo Testamento en el orden canónico de la tabla del
 * sitio (`OT_BOOKS`), enlazados con su identificador OSIS en OSHB y su título
 * tradicional hebreo.
 */
export const HEBREW_BOOKS = [
  { id: 'genesis',       osis: 'Gen',   name: 'Génesis',                hebrewName: 'בראשית',       abbr: 'Gn',   order: 1 },
  { id: 'exodo',         osis: 'Exod',  name: 'Éxodo',                  hebrewName: 'שמות',         abbr: 'Éx',   order: 2 },
  { id: 'levitico',      osis: 'Lev',   name: 'Levítico',               hebrewName: 'ויקרא',        abbr: 'Lv',   order: 3 },
  { id: 'numeros',       osis: 'Num',   name: 'Números',                hebrewName: 'במדבר',        abbr: 'Nm',   order: 4 },
  { id: 'deuteronomio',  osis: 'Deut',  name: 'Deuteronomio',           hebrewName: 'דברים',        abbr: 'Dt',   order: 5 },
  { id: 'josue',         osis: 'Josh',  name: 'Josué',                  hebrewName: 'יהושע',        abbr: 'Jos',  order: 6 },
  { id: 'jueces',        osis: 'Judg',  name: 'Jueces',                 hebrewName: 'שופטים',       abbr: 'Jue',  order: 7 },
  { id: 'rut',           osis: 'Ruth',  name: 'Rut',                    hebrewName: 'רות',          abbr: 'Rt',   order: 8 },
  { id: '1-samuel',      osis: '1Sam',  name: '1 Samuel',               hebrewName: 'שמואל א',      abbr: '1 S',  order: 9 },
  { id: '2-samuel',      osis: '2Sam',  name: '2 Samuel',               hebrewName: 'שמואל ב',      abbr: '2 S',  order: 10 },
  { id: '1-reyes',       osis: '1Kgs',  name: '1 Reyes',                hebrewName: 'מלכים א',      abbr: '1 R',  order: 11 },
  { id: '2-reyes',       osis: '2Kgs',  name: '2 Reyes',                hebrewName: 'מלכים ב',      abbr: '2 R',  order: 12 },
  { id: '1-cronicas',    osis: '1Chr',  name: '1 Crónicas',             hebrewName: 'דברי הימים א', abbr: '1 Cr', order: 13 },
  { id: '2-cronicas',    osis: '2Chr',  name: '2 Crónicas',             hebrewName: 'דברי הימים ב', abbr: '2 Cr', order: 14 },
  { id: 'esdras',        osis: 'Ezra',  name: 'Esdras',                 hebrewName: 'עזרא',         abbr: 'Esd',  order: 15 },
  { id: 'nehemias',      osis: 'Neh',   name: 'Nehemías',               hebrewName: 'נחמיה',        abbr: 'Neh',  order: 16 },
  { id: 'ester',         osis: 'Esth',  name: 'Ester',                  hebrewName: 'אסתר',         abbr: 'Est',  order: 17 },
  { id: 'job',           osis: 'Job',   name: 'Job',                    hebrewName: 'איוב',         abbr: 'Job',  order: 18 },
  { id: 'salmos',        osis: 'Ps',    name: 'Salmos',                 hebrewName: 'תהלים',        abbr: 'Sal',  order: 19 },
  { id: 'proverbios',    osis: 'Prov',  name: 'Proverbios',             hebrewName: 'משלי',         abbr: 'Pr',   order: 20 },
  { id: 'eclesiastes',   osis: 'Eccl',  name: 'Eclesiastés',            hebrewName: 'קהלת',         abbr: 'Ec',   order: 21 },
  { id: 'cantares',      osis: 'Song',  name: 'Cantar de los Cantares', hebrewName: 'שיר השירים',   abbr: 'Cnt',  order: 22 },
  { id: 'isaias',        osis: 'Isa',   name: 'Isaías',                 hebrewName: 'ישעיהו',       abbr: 'Is',   order: 23 },
  { id: 'jeremias',      osis: 'Jer',   name: 'Jeremías',               hebrewName: 'ירמיהו',       abbr: 'Jer',  order: 24 },
  { id: 'lamentaciones', osis: 'Lam',   name: 'Lamentaciones',          hebrewName: 'איכה',         abbr: 'Lm',   order: 25 },
  { id: 'ezequiel',      osis: 'Ezek',  name: 'Ezequiel',               hebrewName: 'יחזקאל',       abbr: 'Ez',   order: 26 },
  { id: 'daniel',        osis: 'Dan',   name: 'Daniel',                 hebrewName: 'דניאל',        abbr: 'Dn',   order: 27 },
  { id: 'oseas',         osis: 'Hos',   name: 'Oseas',                  hebrewName: 'הושע',         abbr: 'Os',   order: 28 },
  { id: 'joel',          osis: 'Joel',  name: 'Joel',                   hebrewName: 'יואל',         abbr: 'Jl',   order: 29 },
  { id: 'amos',          osis: 'Amos',  name: 'Amós',                   hebrewName: 'עמוס',         abbr: 'Am',   order: 30 },
  { id: 'abdias',        osis: 'Obad',  name: 'Abdías',                 hebrewName: 'עובדיה',       abbr: 'Abd',  order: 31 },
  { id: 'jonas',         osis: 'Jonah', name: 'Jonás',                  hebrewName: 'יונה',         abbr: 'Jon',  order: 32 },
  { id: 'miqueas',       osis: 'Mic',   name: 'Miqueas',                hebrewName: 'מיכה',         abbr: 'Miq',  order: 33 },
  { id: 'nahum',         osis: 'Nah',   name: 'Nahum',                  hebrewName: 'נחום',         abbr: 'Nah',  order: 34 },
  { id: 'habacuc',       osis: 'Hab',   name: 'Habacuc',                hebrewName: 'חבקוק',        abbr: 'Hab',  order: 35 },
  { id: 'sofonias',      osis: 'Zeph',  name: 'Sofonías',               hebrewName: 'צפניה',        abbr: 'Sof',  order: 36 },
  { id: 'hageo',         osis: 'Hag',   name: 'Hageo',                  hebrewName: 'חגי',          abbr: 'Hag',  order: 37 },
  { id: 'zacarias',      osis: 'Zech',  name: 'Zacarías',               hebrewName: 'זכריה',        abbr: 'Zac',  order: 38 },
  { id: 'malaquias',     osis: 'Mal',   name: 'Malaquías',              hebrewName: 'מלאכי',        abbr: 'Mal',  order: 39 }
];

export const HEBREW_BOOK_BY_ID = new Map(HEBREW_BOOKS.map(b => [b.id, b]));
export const HEBREW_BOOK_BY_OSIS = new Map(HEBREW_BOOKS.map(b => [b.osis, b]));

/* -------------------------------------------------------------------------- */
/* Transformaciones no destructivas para visualización y búsqueda             */
/* -------------------------------------------------------------------------- */

const CANTILLATION_RE = /[\u0591-\u05AF]/g;
const NIQQUD_AND_CANT_RE = /[\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7]/g;

/**
 * Elimina las marcas de cantilación masorética (*te'amim*, U+0591–U+05AF) para
 * facilitar la lectura sin alterar vocales ni consonantes ni el JSON origen.
 */
export function stripCantillation(text) {
  return String(text || '').replace(CANTILLATION_RE, '');
}

/**
 * Elimina vocales masoréticas (*niqqud*) y cantilación, conservando las
 * consonantes, el maqqef (`־`), el paseq (`׀`), el sof pasuq (`׃`) y la nun
 * invertida (`׆`).
 */
export function stripNiqqud(text) {
  return String(text || '').replace(NIQQUD_AND_CANT_RE, '');
}

/**
 * Plega hebreo/arameo para el buscador local (sin vocales, sin acentos y con
 * espacios uniformes en lugar de maqqef).
 */
export function foldHebrew(text) {
  return stripNiqqud(text)
    .replace(/\u05BE/g, ' ')
    .replace(/[\u05C0\u05C3\u05C6.,;:!?()[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Devuelve el texto básico de un token hebreo/arameo de `verse.t`. */
export function tokenText(token, { qere = true } = {}) {
  if (typeof token === 'string') return token;
  if (!token || typeof token !== 'object') return '';
  if (typeof token.a === 'string') return token.a;
  if ('k' in token) {
    if (qere) return token.q || token.k || '';
    return token.k || token.q || '';
  }
  if (typeof token.w === 'string') return token.w;
  if (typeof token.p === 'string') return token.p;
  return '';
}

/** Decide si debe ir espacio tipográfico entre dos piezas consecutivas de `verse.t`. */
export function needsSpaceBefore(prev, curr) {
  if (!prev || !curr) return false;
  const prevStr = typeof prev === 'string' ? prev : tokenText(prev);
  const currStr = typeof curr === 'string' ? curr : tokenText(curr);
  if (prevStr === '\u05BE' || currStr === '\u05BE' || currStr === '\u05C3') return false;
  return true;
}

/**
 * Reconstruye el texto legible completo de un versículo desde sus tokens.
 * @param {(string|object)[]} tokens
 */
export function versePlainText(tokens, { qere = true } = {}) {
  if (!Array.isArray(tokens)) return '';
  let out = '';
  let prev = null;
  for (const tok of tokens) {
    const str = tokenText(tok, { qere });
    if (!str) continue;
    if (prev && needsSpaceBefore(prev, tok)) out += ' ';
    out += str;
    prev = tok;
  }
  return out;
}
