/**
 * Normalización de texto compartida por las búsquedas del sitio.
 *
 * El módulo es deliberadamente puro (no importa nada del entorno de Vite) para
 * que también lo usen los scripts de Node que generan `content/busquedas.json`.
 * Así el texto se pliega igual en el navegador y en el build.
 */

/* -------------------------------------------------------------------------- */
/* Normalización de texto                                                     */
/* -------------------------------------------------------------------------- */

// Mapa 1:1 (un carácter → un carácter) para que los índices de la búsqueda
// coincidan con el texto original. Se aplica *después* de toLowerCase().
const FOLD_MAP = {
  á: 'a', à: 'a', ä: 'a', â: 'a', ã: 'a', å: 'a',
  é: 'e', è: 'e', ë: 'e', ê: 'e',
  í: 'i', ì: 'i', ï: 'i', î: 'i',
  ó: 'o', ò: 'o', ö: 'o', ô: 'o', õ: 'o',
  ú: 'u', ù: 'u', ü: 'u', û: 'u',
  ñ: 'n', ç: 'c', ý: 'y', ÿ: 'y',
  æ: 'a', œ: 'o', ø: 'o', ß: 's'
};

const FOLD_RE = /[áàäâãåéèëêíìïîóòöôõúùüûñçýÿæœøß]/g;

/** Quita acentos y mayúsculas conservando la longitud (para buscar). */
export const fold = s => String(s).toLowerCase().replace(FOLD_RE, c => FOLD_MAP[c]);

/** Identificador legible para URLs: sin acentos, minúsculas, guiones. */
export const slugify = s =>
  fold(s)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 52) || 'x';
