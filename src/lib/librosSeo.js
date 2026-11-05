/**
 * Títulos y descripciones de las fichas de libros. Módulo puro: lo usan las
 * páginas (`useSeo`) y `scripts/routes-lib.mjs` (prerender y sitemap), así que
 * el HTML del build y la web no pueden divergir.
 */

export const librosIndexSeo = brand => ({
  title: `Libros de la Biblia — ${brand}`,
  description:
    'Fichas de los libros de la Biblia que lee el sitio: género, contexto, composición, texto y canon, distinguiendo texto, tradición y estudio, con fuentes verificadas.'
});

export const libroSeo = (ficha, brand) => ({
  title: `${ficha.title}: ficha del libro — ${brand}`,
  description: ficha.summary
});
