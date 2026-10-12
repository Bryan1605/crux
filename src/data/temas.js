/**
 * Temas del sitio: etiquetas agregadas de todos los estudios.
 *
 * No inventa taxonomía: los temas son exactamente las `tags` del frontmatter de
 * `content/estudios/*.md`, con su frecuencia. Los usan `/temas` (nube de temas)
 * y `/buscar` (sugerencias cuando aún no hay consulta).
 */
import { STUDIES, STUDY_CATEGORIES } from './estudios';

/** [{ tag, count }] ordenado por frecuencia y luego alfabéticamente. */
export function buildTemas(studies = STUDIES) {
  const counts = new Map();
  for (const s of studies) {
    for (const t of s.tags || []) {
      const tag = String(t).trim();
      if (tag) counts.set(tag, (counts.get(tag) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, 'es'));
}

export const TEMAS = buildTemas();

/** Etiqueta legible a partir del slug: `vida-cristiana` → «Vida Cristiana». */
export function tagLabel(tag) {
  return String(tag)
    .replace(/[/-]+/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

/** Los N temas más frecuentes (para sugerencias). */
export function topTemas(n = 12, temas = TEMAS) {
  return temas.slice(0, n);
}

export const CATEGORIAS = STUDY_CATEGORIES;
