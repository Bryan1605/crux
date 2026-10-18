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
 * Índice de búsqueda de todo el Nuevo Testamento (NTV + Codex). Pesa ~1,5 MB,
 * así que solo se descarga cuando alguien busca más allá del libro abierto.
 */
export const loadSearchIndex = () => loadJson('/textos/exegesis/buscar.json');
