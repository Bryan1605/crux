/**
 * Carga de los textos de exégesis (NTV y Codex) desde `public/textos/exegesis/`.
 *
 * Los JSON se generan con `npm run exegesis` (scripts/build-ntv.mjs,
 * scripts/fetch-codex.mjs y scripts/build-exegesis-index.mjs) y se sirven como
 * ficheros estáticos, así que aquí solo hay `fetch` + caché en memoria.
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

/** Índice general: testigos + disponibilidad por libro. */
export const loadExegesisIndex = () => loadJson('/textos/exegesis/index.json');

/**
 * Un libro de un testigo concreto.
 * @param {'ntv'|'codex'} witness
 * @param {string} bookId p. ej. `juan`
 */
export const loadWitnessBook = (witness, bookId) =>
  loadJson(`/textos/exegesis/${witness}/${bookId}.json`);

/**
 * Mapa de lemas del Codex para un libro: por versículo, una entrada por palabra
 * en el mismo orden que `tokenizeGreek` (`[lema, Strong, parse, ns, categoría]`).
 */
export const loadLemmas = bookId => loadJson(`/textos/exegesis/lemas/${bookId}.json`);

/** Diccionario griego → español (250 lemas más frecuentes del Codex). */
export const loadLexicon = () => loadJson('/textos/exegesis/lexico.json');

/**
 * Índice de búsqueda de un testamento (NTV + Codex). Se descarga solo cuando
 * alguien busca más allá del libro abierto; el AT y el NT están partidos para
 * no cargar los dos a la vez.
 * @param {'AT'|'NT'} testament
 */
export const loadSearchIndex = (testament = 'NT') =>
  loadJson(`/textos/exegesis/buscar-${String(testament).toLowerCase()}.json`);
