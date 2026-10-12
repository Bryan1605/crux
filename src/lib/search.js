/**
 * Lógica pura de la búsqueda global (sin acceso a red ni al entorno de Vite).
 *
 * La comparten el navegador (`src/data/search.js`, que carga el índice) y los
 * scripts de QA en Node (`scripts/check-search.mjs`). El índice ya viene con el
 * texto plegado (`fold`), así que buscar es un `includes` con una puntuación
 * sencilla por relevancia.
 */
import { fold } from './fold.js';

export const TIPOS = {
  estudio: { label: 'Estudios', orden: 0 },
  personaje: { label: 'Personajes', orden: 1 },
  concilio: { label: 'Concilios', orden: 2 },
  herejia: { label: 'Herejías', orden: 3 },
  video: { label: 'Vídeos', orden: 4 }
};

export const TIPO_ORDER = Object.keys(TIPOS).sort((a, b) => TIPOS[a].orden - TIPOS[b].orden);

export const MIN_QUERY = 2;

/**
 * Busca `rawQuery` en el índice. Devuelve los items ordenados por relevancia:
 * primero los títulos que empiezan por el término, luego los que lo contienen,
 * después los que coinciden en etiquetas; los empates por longitud del título.
 */
export function searchItems(index, rawQuery, { limit = 80 } = {}) {
  const q = fold(String(rawQuery).trim());
  if (q.length < MIN_QUERY || !index) return [];

  const hits = [];
  for (const item of index.items || []) {
    const at = item.fold.indexOf(q);
    if (at === -1) continue;
    const title = fold(item.title || '');
    let score = 4;
    if (title.startsWith(q)) score = 0;
    else if (title.includes(q)) score = 1;
    else if (fold((item.tags || []).join(' ')).includes(q)) score = 2;
    else if (at <= 40) score = 3; // pega al principio del haystack (título/categoría)
    hits.push({ item, score });
  }

  hits.sort(
    (a, b) =>
      a.score - b.score ||
      (a.item.title || '').length - (b.item.title || '').length ||
      (a.item.title || '').localeCompare(b.item.title || '', 'es')
  );

  return hits.slice(0, limit).map(h => h.item);
}

/** Agrupa los resultados por tipo respetando TIPO_ORDER. */
export function groupByTipo(items) {
  return TIPO_ORDER.map(tipo => ({
    tipo,
    label: TIPOS[tipo].label,
    items: items.filter(it => it.tipo === tipo)
  })).filter(g => g.items.length > 0);
}
