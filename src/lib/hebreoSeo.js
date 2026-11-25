/**
 * Metadatos SEO de la Biblia Hebrea (`/biblia/hebreo`).
 * Módulo puro compartido entre `BibliaHebreo.jsx` (`useSeo`) y
 * `scripts/routes-lib.mjs` (prerender + sitemap) para que HTML estático y SPA
 * coincidan literalmente.
 */

export const hebreoSeo = brand => ({
  title: `Biblia Hebrea (WLC / OSHB) — ${brand}`,
  description:
    'Antiguo Testamento completo en hebreo y arameo bíblico (Westminster Leningrad Codex / OSHB), lectura RTL con tipografía Ezra SIL, arameo marcado palabra por palabra y variantes ketiv/qere visibles.'
});
