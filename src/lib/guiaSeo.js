/**
 * Metadatos SEO de la Guía didáctica de lectura (griego, hebreo y arameo).
 * Módulo puro: lo usan `GuiaLectura.jsx` (`useSeo`) y `scripts/routes-lib.mjs`
 * (prerender y sitemap) para que el HTML del build y la web coincidan siempre.
 */

export const guiaLecturaSeo = brand => ({
  title: `Guía para leer griego, hebreo y arameo bíblico — ${brand}`,
  description:
    'Guía didáctica para principiantes: alfabeto griego koiné, convenciones del Codex Sinaiticus, alefato hebreo, vocales (niqqud), arameo bíblico, lectura guiada de versículos y práctica interactiva.'
});
