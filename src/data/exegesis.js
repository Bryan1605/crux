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

/**
 * Siglas del aparato del Codex Sinaiticus Project.
 * `ol2` marca el texto sobrelineado (nomina sacra y abreviaturas).
 */
export const WITNESSES = {
  '*': 'escriba original',
  ca: 'corrector «a» (contemporáneo)',
  cb: 'corrector «b»',
  cc: 'corrector «c»',
  S1: 'corrector posterior (s. VII)',
  S2: 'corrector posterior (s. VII)'
};

/** Presenta una sigla legible a partir del código del aparato. */
export function witnessLabel(sigla) {
  return WITNESSES[sigla] || sigla;
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

export default NT_BOOKS;
