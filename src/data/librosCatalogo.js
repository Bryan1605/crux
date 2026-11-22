/**
 * Metadatos estructurales de los 73 libros para `/biblia/libros` (puro JS).
 *
 * Centraliza las 6 eras cronológicas, las secciones literarias, los recuentos
 * verificados de capítulos/versículos (de `public/textos/exegesis/index.json`)
 * y el punto de extensión futuro `LIBRO_PORTADAS` para añadir portadas por id.
 */

/** Eras cronológicas del eje en el hero (cada libro pertenece a una sola era). */
export const ERAS_BIBLICAS = [
  {
    id: 'ley-exodo',
    tag: 'Torá · orígenes',
    title: 'La Ley y el Éxodo',
    sub: 'Pentateuco'
  },
  {
    id: 'monarquia-poesia',
    tag: 's. XI–VI a.C.',
    title: 'Monarquía y Poesía',
    sub: 'Históricos y sapienciales'
  },
  {
    id: 'profetas-israel',
    tag: 's. VIII–VI a.C.',
    title: 'Profetas de Israel',
    sub: 'Isaías, Jeremías y los Doce'
  },
  {
    id: 'exilio-retorno',
    tag: 's. VI–V a.C.',
    title: 'Exilio y Retorno',
    sub: 'Esdras, Daniel y posexilio'
  },
  {
    id: 'codex-lxx',
    tag: 's. III–I a.C.',
    title: 'Septuaginta LXX',
    sub: '7 libros del Codex Sinaiticus'
  },
  {
    id: 'nuevo-testamento',
    tag: 's. I d.C.',
    title: 'Evangelios y Cartas',
    sub: 'Nuevo Testamento'
  }
];

/** Secciones literarias de la barra de filtros (suman los 73 libros). */
export const SECCIONES_BIBLICAS = [
  { id: 'todas', label: 'Todas las secciones' },
  { id: 'pentateuco', label: 'Pentateuco y Ley' },
  { id: 'historicos', label: 'Históricos' },
  { id: 'poeticos', label: 'Poéticos y Sabiduría' },
  { id: 'profetas', label: 'Profetas' },
  { id: 'codex', label: 'Solo Codex', accent: true },
  { id: 'evangelios', label: 'Evangelios y Hechos' },
  { id: 'cartas', label: 'Cartas y Apocalipsis' }
];

/**
 * Portadas futuras por id de libro (`/img/libros/<id>.webp`).
 * Mientras no exista portada, `StudyCard` pinta la abreviatura del libro.
 */
export const LIBRO_PORTADAS = {};

/** Metadatos por id de libro (73 entradas en orden canónico). */
export const LIBRO_META = {
  // Pentateuco y Ley (5)
  genesis:          { era: 'ley-exodo', section: 'pentateuco', sectionLabel: 'Pentateuco',          chapters: 50,  verses: 1533, witnesses: 'NTV · Codex' },
  exodo:            { era: 'ley-exodo', section: 'pentateuco', sectionLabel: 'Pentateuco',          chapters: 40,  verses: 1213, witnesses: 'NTV' },
  levitico:         { era: 'ley-exodo', section: 'pentateuco', sectionLabel: 'Pentateuco',          chapters: 27,  verses: 859,  witnesses: 'NTV · Codex' },
  numeros:          { era: 'ley-exodo', section: 'pentateuco', sectionLabel: 'Pentateuco',          chapters: 36,  verses: 1221, witnesses: 'NTV · Codex' },
  deuteronomio:     { era: 'ley-exodo', section: 'pentateuco', sectionLabel: 'Pentateuco',          chapters: 34,  verses: 959,  witnesses: 'NTV · Codex' },

  // Históricos NTV (12)
  josue:            { era: 'monarquia-poesia', section: 'historicos', sectionLabel: 'Históricos', chapters: 24, verses: 658, witnesses: 'NTV · Codex' },
  jueces:           { era: 'monarquia-poesia', section: 'historicos', sectionLabel: 'Históricos', chapters: 21, verses: 618, witnesses: 'NTV · Codex' },
  rut:              { era: 'monarquia-poesia', section: 'historicos', sectionLabel: 'Históricos', chapters: 4,  verses: 85,  witnesses: 'NTV' },
  '1-samuel':       { era: 'monarquia-poesia', section: 'historicos', sectionLabel: 'Históricos', chapters: 31, verses: 810, witnesses: 'NTV' },
  '2-samuel':       { era: 'monarquia-poesia', section: 'historicos', sectionLabel: 'Históricos', chapters: 24, verses: 695, witnesses: 'NTV' },
  '1-reyes':        { era: 'monarquia-poesia', section: 'historicos', sectionLabel: 'Históricos', chapters: 22, verses: 816, witnesses: 'NTV' },
  '2-reyes':        { era: 'monarquia-poesia', section: 'historicos', sectionLabel: 'Históricos', chapters: 25, verses: 719, witnesses: 'NTV' },
  '1-cronicas':     { era: 'monarquia-poesia', section: 'historicos', sectionLabel: 'Históricos', chapters: 29, verses: 942, witnesses: 'NTV · Codex' },
  '2-cronicas':     { era: 'monarquia-poesia', section: 'historicos', sectionLabel: 'Históricos', chapters: 36, verses: 822, witnesses: 'NTV' },
  esdras:           { era: 'exilio-retorno',   section: 'historicos', sectionLabel: 'Históricos', chapters: 10, verses: 280, witnesses: 'NTV' },
  nehemias:         { era: 'exilio-retorno',   section: 'historicos', sectionLabel: 'Históricos', chapters: 13, verses: 406, witnesses: 'NTV' },
  ester:            { era: 'exilio-retorno',   section: 'historicos', sectionLabel: 'Históricos', chapters: 10, verses: 167, witnesses: 'NTV · Codex' },

  // Poéticos y Sabiduría NTV (5)
  job:              { era: 'monarquia-poesia', section: 'poeticos', sectionLabel: 'Sapienciales', chapters: 42,  verses: 1070, witnesses: 'NTV · Codex' },
  salmos:           { era: 'monarquia-poesia', section: 'poeticos', sectionLabel: 'Poéticos',     chapters: 150, verses: 2461, witnesses: 'NTV · Codex' },
  proverbios:       { era: 'monarquia-poesia', section: 'poeticos', sectionLabel: 'Sapienciales', chapters: 31,  verses: 915,  witnesses: 'NTV · Codex' },
  eclesiastes:      { era: 'monarquia-poesia', section: 'poeticos', sectionLabel: 'Sapienciales', chapters: 12,  verses: 222,  witnesses: 'NTV · Codex' },
  cantares:         { era: 'monarquia-poesia', section: 'poeticos', sectionLabel: 'Poéticos',     chapters: 8,   verses: 117,  witnesses: 'NTV · Codex' },

  // Profetas NTV (17)
  isaias:           { era: 'profetas-israel', section: 'profetas', sectionLabel: 'Profetas mayores', chapters: 66, verses: 1292, witnesses: 'NTV · Codex' },
  jeremias:         { era: 'profetas-israel', section: 'profetas', sectionLabel: 'Profetas mayores', chapters: 52, verses: 1364, witnesses: 'NTV · Codex' },
  lamentaciones:    { era: 'profetas-israel', section: 'profetas', sectionLabel: 'Poéticos',         chapters: 5,  verses: 154,  witnesses: 'NTV · Codex' },
  ezequiel:         { era: 'profetas-israel', section: 'profetas', sectionLabel: 'Profetas mayores', chapters: 48, verses: 1273, witnesses: 'NTV' },
  daniel:           { era: 'exilio-retorno',  section: 'profetas', sectionLabel: 'Apocalíptico',     chapters: 12, verses: 357,  witnesses: 'NTV' },
  oseas:            { era: 'profetas-israel', section: 'profetas', sectionLabel: 'Profetas menores', chapters: 14, verses: 197,  witnesses: 'NTV' },
  joel:             { era: 'profetas-israel', section: 'profetas', sectionLabel: 'Profetas menores', chapters: 3,  verses: 73,   witnesses: 'NTV · Codex' },
  amos:             { era: 'profetas-israel', section: 'profetas', sectionLabel: 'Profetas menores', chapters: 9,  verses: 146,  witnesses: 'NTV' },
  abdias:           { era: 'profetas-israel', section: 'profetas', sectionLabel: 'Profetas menores', chapters: 1,  verses: 21,   witnesses: 'NTV · Codex' },
  jonas:            { era: 'profetas-israel', section: 'profetas', sectionLabel: 'Profetas menores', chapters: 4,  verses: 48,   witnesses: 'NTV · Codex' },
  miqueas:          { era: 'profetas-israel', section: 'profetas', sectionLabel: 'Profetas menores', chapters: 7,  verses: 105,  witnesses: 'NTV' },
  nahum:            { era: 'profetas-israel', section: 'profetas', sectionLabel: 'Profetas menores', chapters: 3,  verses: 47,   witnesses: 'NTV · Codex' },
  habacuc:          { era: 'profetas-israel', section: 'profetas', sectionLabel: 'Profetas menores', chapters: 3,  verses: 56,   witnesses: 'NTV · Codex' },
  sofonias:         { era: 'profetas-israel', section: 'profetas', sectionLabel: 'Profetas menores', chapters: 3,  verses: 53,   witnesses: 'NTV · Codex' },
  hageo:            { era: 'exilio-retorno',  section: 'profetas', sectionLabel: 'Profetas menores', chapters: 2,  verses: 38,   witnesses: 'NTV · Codex' },
  zacarias:         { era: 'exilio-retorno',  section: 'profetas', sectionLabel: 'Profetas menores', chapters: 14, verses: 211,  witnesses: 'NTV · Codex' },
  malaquias:        { era: 'exilio-retorno',  section: 'profetas', sectionLabel: 'Profetas menores', chapters: 4,  verses: 55,   witnesses: 'NTV · Codex' },

  // Solo en el Codex Sinaiticus (7)
  '2-esdras':       { era: 'codex-lxx', section: 'codex', sectionLabel: 'Historiografía LXX',  chapters: 15, verses: 454,  witnesses: 'Codex' },
  tobit:            { era: 'codex-lxx', section: 'codex', sectionLabel: 'Narrativa LXX',       chapters: 14, verses: 232,  witnesses: 'Codex · Trad' },
  judit:            { era: 'codex-lxx', section: 'codex', sectionLabel: 'Narrativa heroica',   chapters: 16, verses: 327,  witnesses: 'Codex · Trad' },
  '1-macabeos':     { era: 'codex-lxx', section: 'codex', sectionLabel: 'Historiografía',      chapters: 16, verses: 924,  witnesses: 'Codex' },
  '4-macabeos':     { era: 'codex-lxx', section: 'codex', sectionLabel: 'Discurso filosófico', chapters: 18, verses: 479,  witnesses: 'Codex' },
  sabiduria:        { era: 'codex-lxx', section: 'codex', sectionLabel: 'Sapiencial koiné',    chapters: 19, verses: 435,  witnesses: 'Codex' },
  siracida:         { era: 'codex-lxx', section: 'codex', sectionLabel: 'Sapiencial koiné',    chapters: 51, verses: 1364, witnesses: 'Codex' },

  // Evangelios y Hechos (5)
  mateo:            { era: 'nuevo-testamento', section: 'evangelios', sectionLabel: 'Evangelio sinóptico', chapters: 28, verses: 1068, witnesses: 'NTV · Codex' },
  marcos:           { era: 'nuevo-testamento', section: 'evangelios', sectionLabel: 'Evangelio sinóptico', chapters: 16, verses: 673,  witnesses: 'NTV · Codex' },
  lucas:            { era: 'nuevo-testamento', section: 'evangelios', sectionLabel: 'Evangelio sinóptico', chapters: 24, verses: 1149, witnesses: 'NTV · Codex' },
  juan:             { era: 'nuevo-testamento', section: 'evangelios', sectionLabel: 'Cuarto Evangelio',    chapters: 21, verses: 878,  witnesses: 'NTV · Codex' },
  hechos:           { era: 'nuevo-testamento', section: 'evangelios', sectionLabel: 'Historia apostólica', chapters: 28, verses: 1003, witnesses: 'NTV · Codex' },

  // Cartas y Apocalipsis (22)
  romanos:          { era: 'nuevo-testamento', section: 'cartas', sectionLabel: 'Epístola paulina',    chapters: 16, verses: 432, witnesses: 'NTV · Codex' },
  '1-corintios':    { era: 'nuevo-testamento', section: 'cartas', sectionLabel: 'Epístola paulina',    chapters: 16, verses: 437, witnesses: 'NTV · Codex' },
  '2-corintios':    { era: 'nuevo-testamento', section: 'cartas', sectionLabel: 'Epístola paulina',    chapters: 13, verses: 257, witnesses: 'NTV · Codex' },
  galatas:          { era: 'nuevo-testamento', section: 'cartas', sectionLabel: 'Epístola paulina',    chapters: 6,  verses: 149, witnesses: 'NTV · Codex' },
  efesios:          { era: 'nuevo-testamento', section: 'cartas', sectionLabel: 'Epístola paulina',    chapters: 6,  verses: 155, witnesses: 'NTV · Codex' },
  filipenses:       { era: 'nuevo-testamento', section: 'cartas', sectionLabel: 'Epístola paulina',    chapters: 4,  verses: 104, witnesses: 'NTV · Codex' },
  colosenses:       { era: 'nuevo-testamento', section: 'cartas', sectionLabel: 'Epístola paulina',    chapters: 4,  verses: 95,  witnesses: 'NTV · Codex' },
  '1-tesalonicenses': { era: 'nuevo-testamento', section: 'cartas', sectionLabel: 'Epístola paulina',  chapters: 5,  verses: 89,  witnesses: 'NTV · Codex' },
  '2-tesalonicenses': { era: 'nuevo-testamento', section: 'cartas', sectionLabel: 'Epístola paulina',  chapters: 3,  verses: 47,  witnesses: 'NTV · Codex' },
  '1-timoteo':      { era: 'nuevo-testamento', section: 'cartas', sectionLabel: 'Epístola pastoral',   chapters: 6,  verses: 113, witnesses: 'NTV · Codex' },
  '2-timoteo':      { era: 'nuevo-testamento', section: 'cartas', sectionLabel: 'Epístola pastoral',   chapters: 4,  verses: 83,  witnesses: 'NTV · Codex' },
  tito:             { era: 'nuevo-testamento', section: 'cartas', sectionLabel: 'Epístola pastoral',   chapters: 3,  verses: 46,  witnesses: 'NTV · Codex' },
  filemon:          { era: 'nuevo-testamento', section: 'cartas', sectionLabel: 'Epístola paulina',    chapters: 1,  verses: 25,  witnesses: 'NTV · Codex' },
  hebreos:          { era: 'nuevo-testamento', section: 'cartas', sectionLabel: 'Homilía epistolar',   chapters: 13, verses: 303, witnesses: 'NTV · Codex' },
  santiago:         { era: 'nuevo-testamento', section: 'cartas', sectionLabel: 'Epístola general',    chapters: 5,  verses: 108, witnesses: 'NTV · Codex' },
  '1-pedro':        { era: 'nuevo-testamento', section: 'cartas', sectionLabel: 'Epístola general',    chapters: 5,  verses: 105, witnesses: 'NTV · Codex' },
  '2-pedro':        { era: 'nuevo-testamento', section: 'cartas', sectionLabel: 'Epístola general',    chapters: 3,  verses: 61,  witnesses: 'NTV · Codex' },
  '1-juan':         { era: 'nuevo-testamento', section: 'cartas', sectionLabel: 'Epístola juanina',    chapters: 5,  verses: 105, witnesses: 'NTV · Codex' },
  '2-juan':         { era: 'nuevo-testamento', section: 'cartas', sectionLabel: 'Epístola juanina',    chapters: 1,  verses: 13,  witnesses: 'NTV · Codex' },
  '3-juan':         { era: 'nuevo-testamento', section: 'cartas', sectionLabel: 'Epístola juanina',    chapters: 1,  verses: 15,  witnesses: 'NTV · Codex' },
  judas:            { era: 'nuevo-testamento', section: 'cartas', sectionLabel: 'Epístola general',    chapters: 1,  verses: 25,  witnesses: 'NTV · Codex' },
  apocalipsis:      { era: 'nuevo-testamento', section: 'cartas', sectionLabel: 'Profecía apocalíptica', chapters: 22, verses: 405, witnesses: 'NTV · Codex' }
};
