/**
 * Temas del sitio: etiquetas agregadas de todos los estudios.
 *
 * No inventa taxonomía: los temas son exactamente las `tags` del frontmatter de
 * `content/estudios/*.md`, con su frecuencia. Los usan `/temas` (nube de temas)
 * y `/buscar` (sugerencias cuando aún no hay consulta).
 */
import temasPorCategoria from '../../content/temas.json';
import { assetUrl } from '../lib/assets';
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

/**
 * Temas de cada categoría (`content/temas.json`), en el orden de la sidebar de
 * `/estudio`. `key` es el valor exacto de `subcategory` en el frontmatter;
 * `label` es lo que se muestra (si falta, `key`).
 *
 * @type {Record<string, { key:string, label:string, lema?:string, image?:string }[]>}
 */
export const TEMAS_POR_CATEGORIA = Object.fromEntries(
  Object.entries(temasPorCategoria).map(([cat, temas]) => [
    cat,
    temas.map(t => ({ ...t, label: t.label || t.key, image: t.image ? assetUrl(t.image) : undefined }))
  ])
);

/** Temas de una categoría (vacío si no tiene). */
export const temasDeCategoria = catId => TEMAS_POR_CATEGORIA[catId] || [];

/**
 * Fichas de entrada: sin tema a propósito, se muestran fijas arriba como
 * «Empieza aquí» (fase D del rediseño; `null` en su asignación).
 */
export const ENTRADAS = { '01-fundamentos': ['01-fundamentos--fundamentos-teologia-ntv'] };

/** Id de ancla de un tema: «Últimos tiempos» → `tema-ultimos-tiempos`. */
export const temaId = key =>
  `tema-${String(key)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}`;
