/**
 * Título y descripción de las páginas de apologética. Módulo puro: lo usan la
 * página (`useSeo`) y `scripts/routes-lib.mjs` (prerender y sitemap), así que el
 * HTML del build y la web no pueden divergir.
 */

export const SHINCHEONJI_PATH = '/apologetica/shincheonji';

export const shincheonjiSeo = brand => ({
  title: `100 preguntas, solo con la Biblia — ${brand}`,
  description:
    'Para miembros y estudiantes de Shincheonji: 100 preguntas que se responden leyendo el versículo, en el griego del Codex Sinaiticus y en español, sin recortes.'
});
