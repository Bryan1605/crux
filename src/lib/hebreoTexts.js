/**
 * Carga de los textos hebreo y arameo (WLC / OSHB) desde `public/textos/hebreo/`.
 *
 * Los JSON se generan con `npm run hebreo:build` y se sirven como ficheros
 * estáticos; aquí hay únicamente `fetch` + caché en memoria pasando por
 * `assetUrl()`.
 */
import { assetUrl } from './assets';

const cache = new Map();

async function loadJson(path) {
  if (cache.has(path)) return cache.get(path);
  const promise = fetch(assetUrl(path)).then(res => {
    if (!res.ok) throw new Error(`${path} → HTTP ${res.status}`);
    return res.json();
  });
  cache.set(path, promise);
  try {
    return await promise;
  } catch (err) {
    cache.delete(path);
    throw err;
  }
}

/** Índice general hebreo/arameo: metadatos de fuente + 39 libros del AT. */
export const loadHebreoIndex = () => loadJson('/textos/hebreo/index.json');

/**
 * Un libro del Antiguo Testamento en hebreo/arameo.
 * @param {string} bookId p. ej. `genesis`, `daniel`, `rut`
 */
export const loadHebreoBook = bookId => loadJson(`/textos/hebreo/${bookId}.json`);

/** Mapa de lemas palabra a palabra (OSHB / WLC, formato V2 compacto). */
export const loadHebreoLemas = bookId => loadJson(`/textos/hebreo/lemas/${bookId}.json`);

/** Diccionario curado hebreo/arameo → español (con conteos del AT). */
export const loadHebreoLexico = () => loadJson('/textos/hebreo/lexico.json');

/** Respaldo bajo demanda TBESH completo (8 200 Strongs adicionales en inglés). */
export const loadHebreoLexicoBase = () => loadJson('/textos/hebreo/lexico-hebreo-base.json');
