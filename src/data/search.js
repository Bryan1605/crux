/**
 * Búsqueda global: índice `content/busquedas.json` (pre-generado en el build).
 *
 * El índice es un JSON con un haystack ya plegado (`fold`) por entrada. Se carga
 * **bajo demanda** (chunk aparte) para no engordar la primera pantalla: solo lo
 * pide /buscar. La lógica de búsqueda es pura y vive en src/lib/search.js.
 */
export { TIPOS, TIPO_ORDER, MIN_QUERY, searchItems, groupByTipo } from '../lib/search';

let pending = null;

/** Carga el índice una sola vez (promesa memorizada). */
export function loadSearchIndex() {
  if (!pending) {
    pending = import('../../content/busquedas.json')
      .then(m => (m.default && Array.isArray(m.default.items) ? m.default : { items: [] }))
      .catch(() => ({ items: [] }));
  }
  return pending;
}
