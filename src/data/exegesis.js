/**
 * Exégesis — modelo canónico compartido (navegador y Node).
 *
 * Aquí vive la tabla de libros del Nuevo Testamento con sus dos identidades:
 *
 *   id       → slug estable de la web (`1-corintios`, `apocalipsis`)
 *   codexNo  → número de libro en el visor del Codex Sinaiticus (33 = Mateo … 59 = Apocalipsis)
 *
 * El módulo es puro (no importa nada de Vite ni de Node) para que lo usen tanto
 * las páginas de React como los scripts que generan los JSON de `public/`.
 */

/* -------------------------------------------------------------------------- */
/* Libros del Nuevo Testamento                                                */
/* -------------------------------------------------------------------------- */

/**
 * @typedef {{ id:string, name:string, abbr:string, order:number, codexNo:number }} Book
 */

/** @type {Book[]} */
export const NT_BOOKS = [
  { id: 'mateo',            name: 'Mateo',            abbr: 'Mt', order: 40, codexNo: 33 },
  { id: 'marcos',           name: 'Marcos',           abbr: 'Mc', order: 41, codexNo: 34 },
  { id: 'lucas',            name: 'Lucas',            abbr: 'Lc', order: 42, codexNo: 35 },
  { id: 'juan',             name: 'Juan',             abbr: 'Jn', order: 43, codexNo: 36 },
  { id: 'hechos',           name: 'Hechos',           abbr: 'Hch', order: 44, codexNo: 51 },
  { id: 'romanos',          name: 'Romanos',          abbr: 'Ro', order: 45, codexNo: 37 },
  { id: '1-corintios',      name: '1 Corintios',      abbr: '1 Co', order: 46, codexNo: 38 },
  { id: '2-corintios',      name: '2 Corintios',      abbr: '2 Co', order: 47, codexNo: 39 },
  { id: 'galatas',          name: 'Gálatas',          abbr: 'Gá', order: 48, codexNo: 40 },
  { id: 'efesios',          name: 'Efesios',          abbr: 'Ef', order: 49, codexNo: 41 },
  { id: 'filipenses',       name: 'Filipenses',       abbr: 'Fil', order: 50, codexNo: 42 },
  { id: 'colosenses',       name: 'Colosenses',       abbr: 'Col', order: 51, codexNo: 43 },
  { id: '1-tesalonicenses', name: '1 Tesalonicenses', abbr: '1 Ts', order: 52, codexNo: 44 },
  { id: '2-tesalonicenses', name: '2 Tesalonicenses', abbr: '2 Ts', order: 53, codexNo: 45 },
  { id: '1-timoteo',        name: '1 Timoteo',        abbr: '1 Ti', order: 54, codexNo: 47 },
  { id: '2-timoteo',        name: '2 Timoteo',        abbr: '2 Ti', order: 55, codexNo: 48 },
  { id: 'tito',             name: 'Tito',             abbr: 'Tit', order: 56, codexNo: 49 },
  { id: 'filemon',          name: 'Filemón',          abbr: 'Flm', order: 57, codexNo: 50 },
  { id: 'hebreos',          name: 'Hebreos',          abbr: 'He', order: 58, codexNo: 46 },
  { id: 'santiago',         name: 'Santiago',         abbr: 'Stg', order: 59, codexNo: 52 },
  { id: '1-pedro',          name: '1 Pedro',          abbr: '1 P', order: 60, codexNo: 53 },
  { id: '2-pedro',          name: '2 Pedro',          abbr: '2 P', order: 61, codexNo: 54 },
  { id: '1-juan',           name: '1 Juan',           abbr: '1 Jn', order: 62, codexNo: 55 },
  { id: '2-juan',           name: '2 Juan',           abbr: '2 Jn', order: 63, codexNo: 56 },
  { id: '3-juan',           name: '3 Juan',           abbr: '3 Jn', order: 64, codexNo: 57 },
  { id: 'judas',            name: 'Judas',            abbr: 'Jud', order: 65, codexNo: 58 },
  { id: 'apocalipsis',      name: 'Apocalipsis',      abbr: 'Ap', order: 66, codexNo: 59 }
];

export const BOOK_BY_ID = new Map(NT_BOOKS.map(b => [b.id, b]));
export const BOOK_BY_NAME = new Map(NT_BOOKS.map(b => [b.name, b]));
export const BOOK_BY_CODEX_NO = new Map(NT_BOOKS.map(b => [b.codexNo, b]));

/* -------------------------------------------------------------------------- */
/* Testigos (para el aparato crítico)                                         */
/* -------------------------------------------------------------------------- */

/** Fuente oficial de la tabla de siglas (Codex Sinaiticus Project). */
export const WITNESS_SOURCE =
  'https://codexsinaiticus.org/en/project/transcription_detailed.aspx';

/** Atribución literal que pide el proyecto para reutilizar su transcripción. */
export const WITNESS_ATTRIBUTION =
  'Codex Sinaiticus by The Codex Sinaiticus Project (http://www.codexsinaiticus.org) is licensed under a Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License. Based on a work at www.codexsinaiticus.org.';

/**
 * Siglas del aparato del Codex Sinaiticus Project, con la descripción que da el
 * propio proyecto (no se inventa ninguna mano que la fuente no documente).
 *
 *   grupo `base`      → el texto tal como salió de la primera mano
 *   grupo `escriba`   → los escribas que copiaron el códice
 *   grupo `corrector` → las correcciones posteriores (siglos IV–VII)
 *
 * `ol2` marca el texto sobrelineado (nomina sacra y abreviaturas) en la
 * transcripción, pero no es un testigo: no entra en esta tabla.
 */
export const WITNESSES = {
  '*': { label: 'escriba original', group: 'base', note: 'el texto escrito en primer lugar por el escriba' },
  A: { label: 'escriba A', group: 'escriba', note: 'uno de los escribas del códice' },
  B: { label: 'escriba B', group: 'escriba', note: 'uno de los escribas del códice' },
  B1: { label: 'escriba B1', group: 'escriba', note: 'responsable de la mayor parte del trabajo del escriba B' },
  B2: { label: 'escriba B2', group: 'escriba', note: 'copió los Profetas Menores y el Pastor de Hermas' },
  D: { label: 'escriba D', group: 'escriba', note: 'uno de los escribas del códice' },
  S1: { label: 'corrector del proceso de copia', group: 'corrector', note: 'revisión hecha al copiar, o por el propio escriba' },
  // `S2` no aparece en la leyenda del proyecto (sí en su XML). Se etiqueta sin
  // inventarle una mano: el proyecto no lo documenta.
  S2: { label: 'corrector «S2»', group: 'corrector', note: 'sigla usada por el proyecto; su leyenda no la describe' },
  ca: { label: 'corrector «a»', group: 'corrector', note: 'corrección de los siglos V–VII (grupo «c»)' },
  cb: { label: 'corrector «b»', group: 'corrector', note: 'corrección de los siglos V–VII (grupo «c»)' },
  cb1: { label: 'corrector «b1»', group: 'corrector', note: 'mano del corrector «b»' },
  cb2: { label: 'corrector «b2»', group: 'corrector', note: 'mano del corrector «b»' },
  cb3: { label: 'corrector «b3»', group: 'corrector', note: 'mano del corrector «b»' },
  cc: { label: 'corrector «c»', group: 'corrector', note: 'corrección de los siglos V–VII (grupo «c»)' },
  'cc*': { label: 'corrector «c*»', group: 'corrector', note: 'mano del grupo «c» que trabaja solo en Apocalipsis' },
  c: { label: 'corrector del grupo «c»', group: 'corrector', note: 'corrección que no se puede asignar a una mano concreta' },
  cpamph: { label: 'corrector «cpamph»', group: 'corrector', note: 'mano del grupo «c»' },
  d: { label: 'mano que reescribe lo desvaído', group: 'corrector', note: 'reescribió porciones desvaídas y corrigió de vez en cuando' },
  e: { label: 'mano de unas pocas correcciones', group: 'corrector', note: 'Proverbios, Mateo, 1 Timoteo y Hechos' },
  corr: { label: 'corrector sin asignar', group: 'corrector', note: 'cambio que no puede atribuirse a un corrector concreto' }
};

/** Ficha completa de una sigla (con respaldo para códigos desconocidos). */
export function witnessInfo(sigla) {
  return WITNESSES[sigla] || { label: sigla, group: 'otro', note: '' };
}

/** Presenta una sigla legible a partir del código del aparato. */
export function witnessLabel(sigla) {
  return witnessInfo(sigla).label;
}

/**
 * Leyenda ordenada para las siglas que realmente aparecen en un pasaje.
 * @param {string[]} siglas
 */
export function witnessLegend(siglas) {
  const order = { base: 0, escriba: 1, corrector: 2, otro: 3 };
  return [...new Set(siglas)]
    .filter(Boolean)
    .sort((a, b) => {
      const ia = witnessInfo(a);
      const ib = witnessInfo(b);
      return order[ia.group] - order[ib.group] || ia.label.localeCompare(ib.label, 'es');
    })
    .map(sigla => ({ sigla, ...witnessInfo(sigla) }));
}

/* -------------------------------------------------------------------------- */
/* Notas del traductor (NTV)                                                  */
/* -------------------------------------------------------------------------- */

/**
 * La NTV abre sus notas con un marcador: «En griego…» (la palabra original),
 * «O…» (otra lectura), «Algunos manuscritos…» (variante textual) o, si no, una
 * simple referencia cruzada. Aquí se separa la etiqueta del cuerpo.
 */
export function parseNote(text) {
  const raw = String(text || '').trim();
  let m;
  if ((m = /^En griego[,:]?\s*/i.exec(raw))) {
    return { kind: 'griego', label: 'Griego', text: raw.slice(m[0].length) };
  }
  if ((m = /^O\s+/.exec(raw))) {
    return { kind: 'otra', label: 'Otra lectura', text: raw.slice(m[0].length) };
  }
  if (/^Algunos\b/.test(raw)) {
    return { kind: 'variante', label: 'Variante textual', text: raw };
  }
  return { kind: 'ref', label: 'Referencia', text: raw };
}

/* -------------------------------------------------------------------------- */
/* Utilidades                                                                 */
/* -------------------------------------------------------------------------- */

/** `mateo 1:1` → `mateo.1.1` (clave de alineación). */
export const verseKey = (bookId, chapter, verse) => `${bookId}.${chapter}.${verse}`;

/** Abreviatura + capítulo:versículo, p. ej. `Jn 3:16`. */
export const refLabel = (book, chapter, verse) => {
  const id = typeof book === 'string' ? book : book.id;
  const meta = BOOK_BY_ID.get(id);
  return `${meta ? meta.abbr : id} ${chapter}:${verse}`;
};

/* -------------------------------------------------------------------------- */
/* Referencias bíblicas                                                       */
/* -------------------------------------------------------------------------- */

const plain = value =>
  String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.\s]/g, '');

/** Nombre o abreviatura normalizados → id del libro (`1corintios` → `1-corintios`). */
const PASSAGE_ALIASES = new Map();
for (const book of NT_BOOKS) {
  PASSAGE_ALIASES.set(plain(book.name), book.id);
  PASSAGE_ALIASES.set(plain(book.abbr), book.id);
}

/**
 * Interpreta una referencia del Nuevo Testamento —«1 Juan 1:9», «Mateo
 * 11:28-30», «Romanos 8», «Joel 2:28-29 / Hechos 2:16-18»— y devuelve
 * `{ bookId, chapter, verse, label }`, donde `verse` es `null` si la cita no lo
 * precisa. Devuelve `null` cuando ninguna parte de la cita es del Nuevo
 * Testamento (p. ej. «Génesis 1:1»), para no inventar un destino.
 *
 * De los rangos se toma el punto de entrada (`Mateo 26:26-29` → cap. 26, v. 26).
 */
export function parsePassage(text) {
  const raw = String(text || '').trim();
  if (!raw) return null;
  // Una cita puede encadenar referencias; vale la primera que sea del NT.
  const parts = raw.split(/\s*(?:\/|;|·|\by\b|\be\b)\s*/i).filter(Boolean);
  for (const part of parts) {
    const parsed = parseOnePassage(part);
    if (parsed) return parsed;
  }
  return null;
}

function parseOnePassage(part) {
  const text = String(part).trim();
  // El capítulo es obligatorio; sin él, solo se admite un nombre de libro suelto.
  let m = /^(?:([1-3])\s*)?([^\d:]+?)\s*(\d+)\s*(?:[:.,]\s*(\d+))?/.exec(text);
  if (!m) m = /^(?:([1-3])\s*)?([^\d:]+)$/.exec(text);
  if (!m) return null;
  const [, series = '', words, chapter, verse] = m;
  const bookId = PASSAGE_ALIASES.get(plain(`${series}${words}`));
  if (!bookId) return null;
  const book = BOOK_BY_ID.get(bookId);
  const cap = Number(chapter) || 1;
  const ver = verse ? Number(verse) : null;
  return {
    bookId,
    chapter: cap,
    verse: ver,
    label: `${book.name} ${cap}${ver ? `:${ver}` : ''}`
  };
}

/** Ruta al lector de la NTV para una referencia: `/biblia/ntv?libro=…&cap=…&v=…`. */
export const ntvPath = passage => {
  const parsed = typeof passage === 'string' ? parsePassage(passage) : passage;
  if (!parsed) return '/biblia/ntv';
  const query = new URLSearchParams({ libro: parsed.bookId, cap: String(parsed.chapter) });
  if (parsed.verse) query.set('v', String(parsed.verse));
  return `/biblia/ntv?${query.toString()}`;
};

/** Ruta a la exégesis comparada para una referencia. */
export const exegesisPath = passage => {
  const parsed = typeof passage === 'string' ? parsePassage(passage) : passage;
  if (!parsed) return '/exegesis';
  const query = new URLSearchParams({ libro: parsed.bookId, cap: String(parsed.chapter) });
  if (parsed.verse) query.set('v', String(parsed.verse));
  return `/exegesis?${query.toString()}`;
};

export default NT_BOOKS;
