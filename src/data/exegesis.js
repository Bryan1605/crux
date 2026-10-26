/**
 * Exégesis — modelo canónico compartido (navegador y Node).
 *
 * Aquí vive la tabla de los libros de la Biblia con sus dos identidades:
 *
 *   id       → slug estable de la web (`1-corintios`, `apocalipsis`)
 *   codexNo  → número de libro en el visor del Codex Sinaiticus (1 = Génesis … 59 = Apocalipsis)
 *
 * El módulo es puro (no importa nada de Vite ni de Node) para que lo usen tanto
 * las páginas de React como los scripts que generan los JSON de `public/`.
 */

/* -------------------------------------------------------------------------- */
/* Libros de la Biblia                                                        */
/* -------------------------------------------------------------------------- */

/**
 * @typedef {{ id:string, name:string, abbr:string, order:number,
 *             testament:'AT'|'NT', codexNo:number|null, codexOnly?:boolean,
 *             ntv?:boolean, ntvEquivalents?:string[], notice?:string }} Book
 */

/**
 * Los 39 libros del Antiguo Testamento en el orden de la NTV. `codexNo` solo
 * existe cuando el libro se conserva en el Codex Sinaiticus; los que faltan
 * quedan en `null` y la vista comparada muestra únicamente la NTV.
 *
 * El Codex numera sus libros con una tabla propia (1 = Génesis, 2 = Levítico,
 * 3 = Números…), no con el orden canónico. Por eso el número no se deduce del
 * orden: se declara aquí y lo comprueba `qa:exegesis`.
 *
 * @type {Book[]}
 */
export const OT_BOOKS = [
  { id: 'genesis',       name: 'Génesis',             abbr: 'Gn',   order: 1,  testament: 'AT', codexNo: 1,  ntv: true },
  { id: 'exodo',         name: 'Éxodo',               abbr: 'Éx',   order: 2,  testament: 'AT', codexNo: null, ntv: true },
  { id: 'levitico',      name: 'Levítico',            abbr: 'Lv',   order: 3,  testament: 'AT', codexNo: 2,  ntv: true },
  { id: 'numeros',       name: 'Números',             abbr: 'Nm',   order: 4,  testament: 'AT', codexNo: 3,  ntv: true },
  { id: 'deuteronomio',  name: 'Deuteronomio',        abbr: 'Dt',   order: 5,  testament: 'AT', codexNo: 4,  ntv: true },
  { id: 'josue',         name: 'Josué',               abbr: 'Jos',  order: 6,  testament: 'AT', codexNo: 5,  ntv: true },
  { id: 'jueces',        name: 'Jueces',              abbr: 'Jue',  order: 7,  testament: 'AT', codexNo: 6,  ntv: true },
  { id: 'rut',           name: 'Rut',                 abbr: 'Rt',   order: 8,  testament: 'AT', codexNo: null, ntv: true },
  { id: '1-samuel',      name: '1 Samuel',            abbr: '1 S',  order: 9,  testament: 'AT', codexNo: null, ntv: true },
  { id: '2-samuel',      name: '2 Samuel',            abbr: '2 S',  order: 10, testament: 'AT', codexNo: null, ntv: true },
  { id: '1-reyes',       name: '1 Reyes',             abbr: '1 R',  order: 11, testament: 'AT', codexNo: null, ntv: true },
  { id: '2-reyes',       name: '2 Reyes',             abbr: '2 R',  order: 12, testament: 'AT', codexNo: null, ntv: true },
  { id: '1-cronicas',    name: '1 Crónicas',          abbr: '1 Cr', order: 13, testament: 'AT', codexNo: 7,  ntv: true },
  { id: '2-cronicas',    name: '2 Crónicas',          abbr: '2 Cr', order: 14, testament: 'AT', codexNo: null, ntv: true },
  { id: 'esdras',        name: 'Esdras',              abbr: 'Esd',  order: 15, testament: 'AT', codexNo: null, ntv: true },
  { id: 'nehemias',      name: 'Nehemías',            abbr: 'Neh',  order: 16, testament: 'AT', codexNo: null, ntv: true },
  { id: 'ester',         name: 'Ester',               abbr: 'Est',  order: 17, testament: 'AT', codexNo: 9,  ntv: true },
  { id: 'job',           name: 'Job',                 abbr: 'Job',  order: 18, testament: 'AT', codexNo: 32, ntv: true },
  { id: 'salmos',        name: 'Salmos',              abbr: 'Sal',  order: 19, testament: 'AT', codexNo: 26, ntv: true },
  { id: 'proverbios',    name: 'Proverbios',          abbr: 'Pr',   order: 20, testament: 'AT', codexNo: 27, ntv: true },
  { id: 'eclesiastes',   name: 'Eclesiastés',         abbr: 'Ec',   order: 21, testament: 'AT', codexNo: 28, ntv: true },
  { id: 'cantares',      name: 'Cantar de los Cantares', abbr: 'Cnt', order: 22, testament: 'AT', codexNo: 29, ntv: true },
  { id: 'isaias',        name: 'Isaías',              abbr: 'Is',   order: 23, testament: 'AT', codexNo: 14, ntv: true },
  { id: 'jeremias',      name: 'Jeremías',            abbr: 'Jer',  order: 24, testament: 'AT', codexNo: 15, ntv: true },
  { id: 'lamentaciones', name: 'Lamentaciones',       abbr: 'Lm',   order: 25, testament: 'AT', codexNo: 16, ntv: true },
  { id: 'ezequiel',      name: 'Ezequiel',            abbr: 'Ez',   order: 26, testament: 'AT', codexNo: null, ntv: true },
  { id: 'daniel',        name: 'Daniel',              abbr: 'Dn',   order: 27, testament: 'AT', codexNo: null, ntv: true },
  { id: 'oseas',         name: 'Oseas',               abbr: 'Os',   order: 28, testament: 'AT', codexNo: null, ntv: true },
  { id: 'joel',          name: 'Joel',                abbr: 'Jl',   order: 29, testament: 'AT', codexNo: 17, ntv: true },
  { id: 'amos',          name: 'Amós',                abbr: 'Am',   order: 30, testament: 'AT', codexNo: null, ntv: true },
  { id: 'abdias',        name: 'Abdías',              abbr: 'Abd',  order: 31, testament: 'AT', codexNo: 18, ntv: true },
  { id: 'jonas',         name: 'Jonás',               abbr: 'Jon',  order: 32, testament: 'AT', codexNo: 19, ntv: true },
  { id: 'miqueas',       name: 'Miqueas',             abbr: 'Miq',  order: 33, testament: 'AT', codexNo: null, ntv: true },
  { id: 'nahum',         name: 'Nahum',               abbr: 'Nah',  order: 34, testament: 'AT', codexNo: 20, ntv: true },
  { id: 'habacuc',       name: 'Habacuc',             abbr: 'Hab',  order: 35, testament: 'AT', codexNo: 21, ntv: true },
  { id: 'sofonias',      name: 'Sofonías',            abbr: 'Sof',  order: 36, testament: 'AT', codexNo: 22, ntv: true },
  { id: 'hageo',         name: 'Hageo',               abbr: 'Hag',  order: 37, testament: 'AT', codexNo: 23, ntv: true },
  { id: 'zacarias',      name: 'Zacarías',            abbr: 'Zac',  order: 38, testament: 'AT', codexNo: 24, ntv: true },
  { id: 'malaquias',     name: 'Malaquías',           abbr: 'Mal',  order: 39, testament: 'AT', codexNo: 25, ntv: true }
];

/**
 * Libros que solo existen en la transcripción del Codex: los deuterocanónicos
 * que la NTV no incluye y el «2 Esdras» del códice, que reúne Esdras y
 * Nehemías. No entran en el selector de la NTV ni en los contadores 39 + 27.
 *
 * @type {Book[]}
 */
export const CODEX_EXTRA_BOOKS = [
  { id: '2-esdras',     name: '2 Esdras',     abbr: '2 Esd', order: 15.5, testament: 'AT', codexNo: 8,  codexOnly: true, ntv: false, ntvEquivalents: ['esdras', 'nehemias'], notice: 'El Codex reúne Esdras y Nehemías en un solo libro (2 Esdras); la NTV los separa y la numeración no coincide.' },
  { id: 'tobit',        name: 'Tobit',        abbr: 'Tob',   order: 17.1, testament: 'AT', codexNo: 10, codexOnly: true, ntv: false },
  { id: 'judit',        name: 'Judit',        abbr: 'Jdt',   order: 17.2, testament: 'AT', codexNo: 11, codexOnly: true, ntv: false },
  { id: '1-macabeos',   name: '1 Macabeos',   abbr: '1 Mac', order: 17.3, testament: 'AT', codexNo: 12, codexOnly: true, ntv: false },
  { id: '4-macabeos',   name: '4 Macabeos',   abbr: '4 Mac', order: 17.4, testament: 'AT', codexNo: 13, codexOnly: true, ntv: false },
  { id: 'sabiduria',    name: 'Sabiduría',    abbr: 'Sab',   order: 22.1, testament: 'AT', codexNo: 30, codexOnly: true, ntv: false },
  { id: 'siracida',     name: 'Sirácida',     abbr: 'Sir',   order: 22.2, testament: 'AT', codexNo: 31, codexOnly: true, ntv: false }
];

/** Los 27 libros del Nuevo Testamento, en orden canónico. @type {Book[]} */
export const NT_BOOKS = [
  { id: 'mateo',            name: 'Mateo',            abbr: 'Mt', order: 40, testament: 'NT', codexNo: 33, ntv: true },
  { id: 'marcos',           name: 'Marcos',           abbr: 'Mc', order: 41, testament: 'NT', codexNo: 34, ntv: true },
  { id: 'lucas',            name: 'Lucas',            abbr: 'Lc', order: 42, testament: 'NT', codexNo: 35, ntv: true },
  { id: 'juan',             name: 'Juan',             abbr: 'Jn', order: 43, testament: 'NT', codexNo: 36, ntv: true },
  { id: 'hechos',           name: 'Hechos',           abbr: 'Hch', order: 44, testament: 'NT', codexNo: 51, ntv: true },
  { id: 'romanos',          name: 'Romanos',          abbr: 'Ro', order: 45, testament: 'NT', codexNo: 37, ntv: true },
  { id: '1-corintios',      name: '1 Corintios',      abbr: '1 Co', order: 46, testament: 'NT', codexNo: 38, ntv: true },
  { id: '2-corintios',      name: '2 Corintios',      abbr: '2 Co', order: 47, testament: 'NT', codexNo: 39, ntv: true },
  { id: 'galatas',          name: 'Gálatas',          abbr: 'Gá', order: 48, testament: 'NT', codexNo: 40, ntv: true },
  { id: 'efesios',          name: 'Efesios',          abbr: 'Ef', order: 49, testament: 'NT', codexNo: 41, ntv: true },
  { id: 'filipenses',       name: 'Filipenses',       abbr: 'Fil', order: 50, testament: 'NT', codexNo: 42, ntv: true },
  { id: 'colosenses',       name: 'Colosenses',       abbr: 'Col', order: 51, testament: 'NT', codexNo: 43, ntv: true },
  { id: '1-tesalonicenses', name: '1 Tesalonicenses', abbr: '1 Ts', order: 52, testament: 'NT', codexNo: 44, ntv: true },
  { id: '2-tesalonicenses', name: '2 Tesalonicenses', abbr: '2 Ts', order: 53, testament: 'NT', codexNo: 45, ntv: true },
  { id: '1-timoteo',        name: '1 Timoteo',        abbr: '1 Ti', order: 54, testament: 'NT', codexNo: 47, ntv: true },
  { id: '2-timoteo',        name: '2 Timoteo',        abbr: '2 Ti', order: 55, testament: 'NT', codexNo: 48, ntv: true },
  { id: 'tito',             name: 'Tito',             abbr: 'Tit', order: 56, testament: 'NT', codexNo: 49, ntv: true },
  { id: 'filemon',          name: 'Filemón',          abbr: 'Flm', order: 57, testament: 'NT', codexNo: 50, ntv: true },
  { id: 'hebreos',          name: 'Hebreos',          abbr: 'He', order: 58, testament: 'NT', codexNo: 46, ntv: true },
  { id: 'santiago',         name: 'Santiago',         abbr: 'Stg', order: 59, testament: 'NT', codexNo: 52, ntv: true },
  { id: '1-pedro',          name: '1 Pedro',          abbr: '1 P', order: 60, testament: 'NT', codexNo: 53, ntv: true },
  { id: '2-pedro',          name: '2 Pedro',          abbr: '2 P', order: 61, testament: 'NT', codexNo: 54, ntv: true },
  { id: '1-juan',           name: '1 Juan',           abbr: '1 Jn', order: 62, testament: 'NT', codexNo: 55, ntv: true },
  { id: '2-juan',           name: '2 Juan',           abbr: '2 Jn', order: 63, testament: 'NT', codexNo: 56, ntv: true },
  { id: '3-juan',           name: '3 Juan',           abbr: '3 Jn', order: 64, testament: 'NT', codexNo: 57, ntv: true },
  { id: 'judas',            name: 'Judas',            abbr: 'Jud', order: 65, testament: 'NT', codexNo: 58, ntv: true },
  { id: 'apocalipsis',      name: 'Apocalipsis',      abbr: 'Ap', order: 66, testament: 'NT', codexNo: 59, ntv: true }
];

/** Los 66 libros que tienen texto en la NTV (39 AT + 27 NT). */
export const BIBLE_BOOKS = [...OT_BOOKS, ...NT_BOOKS];

/** Los 59 libros transcritos del Codex (32 AT + 27 NT). */
export const CODEX_BOOKS = [...OT_BOOKS.filter(b => b.codexNo), ...CODEX_EXTRA_BOOKS, ...NT_BOOKS];

/** Todos los libros conocidos por la web, incluidos los solo-Codex. */
export const ALL_BOOKS = [...BIBLE_BOOKS, ...CODEX_EXTRA_BOOKS];

export const BOOK_BY_ID = new Map(ALL_BOOKS.map(b => [b.id, b]));
export const BOOK_BY_NAME = new Map(ALL_BOOKS.map(b => [b.name, b]));
export const BOOK_BY_CODEX_NO = new Map(CODEX_BOOKS.filter(b => b.codexNo).map(b => [b.codexNo, b]));

/** Conteos que la interfaz muestra junto a los selectores. */
export const TESTAMENTS = {
  AT: { id: 'AT', label: 'Antiguo Testamento', short: 'AT', books: OT_BOOKS.length },
  NT: { id: 'NT', label: 'Nuevo Testamento', short: 'NT', books: NT_BOOKS.length }
};

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
for (const book of ALL_BOOKS) {
  PASSAGE_ALIASES.set(plain(book.name), book.id);
  PASSAGE_ALIASES.set(plain(book.abbr), book.id);
}
// Formas que usa la NTV o el habla corriente y que no coinciden con la tabla.
PASSAGE_ALIASES.set('salmo', 'salmos');
PASSAGE_ALIASES.set('cantares', 'cantares');
PASSAGE_ALIASES.set('cantardeloscantares', 'cantares');
PASSAGE_ALIASES.set('hechosdelosapostoles', 'hechos');
PASSAGE_ALIASES.set('2esdras', '2-esdras');

/**
 * Interpreta una referencia bíblica —«1 Juan 1:9», «Mateo 11:28-30», «Romanos
 * 8», «Génesis 1:1» o «Joel 2:28-29 / Hechos 2:16-18»— y devuelve
 * `{ bookId, chapter, verse, label, testament }`, donde `verse` es `null` si la
 * cita no lo precisa. Devuelve `null` cuando ninguna parte de la cita es un
 * libro conocido.
 *
 * Si la cita encadena un texto del AT y otro del NT, se prefiere el del NT: es
 * el que tiene lector propio en la casa. Si solo hay AT, se enlaza el AT.
 *
 * De los rangos se toma el punto de entrada (`Mateo 26:26-29` → cap. 26, v. 26).
 */
export function parsePassage(text) {
  const raw = String(text || '').trim();
  if (!raw) return null;
  const parts = raw.split(/\s*(?:\/|;|·|\by\b|\be\b)\s*/i).filter(Boolean);
  const parsed = parts.map(parseOnePassage).filter(Boolean);
  return parsed.find(item => item.testament === 'NT') || parsed[0] || null;
}

function parseOnePassage(part) {
  const text = String(part).trim();
  // El capítulo es obligatorio; sin él, solo se admite un nombre de libro suelto.
  let m = /^(?:([1-4])\s*)?([^\d:]+?)\s*(\d+)\s*(?:[:.,]\s*(\d+))?/.exec(text);
  if (!m) m = /^(?:([1-4])\s*)?([^\d:]+)$/.exec(text);
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
    label: `${book.name} ${cap}${ver ? `:${ver}` : ''}`,
    testament: book.testament,
    codexOnly: Boolean(book.codexOnly),
    ntv: Boolean(book.ntv)
  };
}

/** Ruta al lector de la NTV para una referencia. */
export const ntvPath = passage => {
  const parsed = typeof passage === 'string' ? parsePassage(passage) : passage;
  if (!parsed) return '/biblia/ntv';
  // Tobit y los demás deuterocanónicos no están en la NTV: su único lector es
  // la vista del Codex.
  if (parsed.ntv === false || parsed.codexOnly) return exegesisPath(parsed);
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

export default BIBLE_BOOKS;
