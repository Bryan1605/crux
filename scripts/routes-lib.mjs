/**
 * Rutas públicas del sitio con sus metadatos SEO.
 *
 * Fuente única para tres cosas que antes podían divergir:
 *
 *   - el `sitemap.xml` y el `robots.txt` del build,
 *   - el prerender de HTML (`plugins/prerender.mjs`): cada ruta se publica como
 *     `dist/<ruta>/index.html` con su título, su descripción y su `og:image`,
 *   - las comprobaciones de QA (`qa:prod`, `qa:enlaces`).
 *
 * Los títulos y las descripciones repiten literalmente los que usa `useSeo()` en
 * cada página: el HTML del build y la web en el navegador no pueden divergir.
 *
 * No hay rutas legales ni de privacidad: el sitio no recoge datos, no usa
 * cookies ni analítica (verificado en el código: cero `document.cookie`).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = path.join(ROOT, 'content');

/** JSON de `content/`, o `fallback` si no existe o está mal formado. */
function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(path.join(CONTENT, file), 'utf8'));
  } catch {
    return fallback;
  }
}

/** Configuración del sitio (marca, copy y SEO por defecto). */
export function siteConfig() {
  return readJson('site.json', { marca: { nombre: 'Crux' }, seo: {} });
}

/** Índice de estudios: `{ studies, categories }`. */
export function estudiosIndex() {
  return readJson('estudios.json', { studies: [], categories: [] });
}

/** Fichas de personajes, ordenadas por nombre. */
export function personajesFichas() {
  const dir = path.join(CONTENT, 'personajes');
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .map(f => readJson(`personajes/${f}`, null))
    .filter(Boolean)
    .sort((a, b) => String(a.nombre).localeCompare(String(b.nombre), 'es'));
}

/** Concilios y herejías. */
export function conciliosLista() {
  return readJson('concilios.json', []);
}

/** Parrilla de videos (vacía mientras no haya parrilla publicada). */
export function videosLista() {
  return readJson('videos.json', []);
}

/**
 * Imagen de previsualización al compartir (1200×630, JPEG).
 * Se genera con `npm run og` y se publica desde `public/`.
 */
export const OG_IMAGE = '/img/og/crux.jpg';

/** Escapa el texto que entra en un atributo o en un nodo de HTML. */
export const escapeHtml = value =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/**
 * Todas las rutas públicas en orden, con su SEO.
 *
 *   indexable: false → página de servicio (buscador, parrilla vacía): se
 *   prerenderiza para que exista, pero no entra en el sitemap y lleva `noindex`.
 *
 * @returns {{ path: string, title: string, description: string, type: string,
 *             ogImage?: string, lastmod?: string, indexable: boolean }[]}
 */
export function siteRoutes() {
  const site = siteConfig();
  const brand = site.marca?.nombre || 'Crux';
  const seo = site.seo || {};
  const { studies = [], categories = [] } = estudiosIndex();
  const fichas = personajesFichas();
  const concilios = conciliosLista();
  const videos = videosLista();

  const nConcilios = concilios.filter(c => c.tipo === 'concilio').length;
  const nHerejias = concilios.filter(c => c.tipo === 'herejia').length;
  const etiquetas = categories.map(c => c.label).join(', ');

  /** @type {ReturnType<typeof siteRoutes>} */
  const routes = [
    {
      path: '/',
      title: seo.title || brand,
      description: seo.description || '',
      type: 'website',
      indexable: true
    },
    {
      path: '/estudio',
      title: `${brand} — Estudio`,
      description: `${studies.length} fichas en ${categories.length} categorías: ${etiquetas}.`,
      type: 'website',
      indexable: true
    },
    {
      path: '/biblia',
      title: `Biblia Patrística — ${brand}`,
      description: 'Los Padres de la Iglesia: sus cartas, homilías y tratados, del siglo I al VIII.',
      type: 'website',
      indexable: true
    },
    {
      path: '/biblia/ntv',
      title: 'Biblia NTV',
      description:
        'La Nueva Traducción Viviente completa, versículo a versículo: 39 libros del Antiguo Testamento y 27 del Nuevo, en rejilla o en pliego de dos páginas, con sus notas del traductor y un buscador por palabras.',
      type: 'website',
      indexable: true
    },
    {
      path: '/exegesis',
      title: `Exégesis comparada — Codex Sinaiticus y NTV`,
      description:
        'Lectura paralela de la Biblia, versículo a versículo: la transcripción del Codex Sinaiticus con su aparato crítico frente a la Nueva Traducción Viviente.',
      type: 'website',
      indexable: true
    },
    {
      path: '/concilios',
      title: `${brand} — Concilios y herejías`,
      description: `${nConcilios} concilios y ${nHerejias} herejías de la historia de la Iglesia: año, decisiones y a quién condenaron.`,
      type: 'website',
      indexable: true
    },
    {
      path: '/temas',
      title: `${brand} — Temas`,
      description: 'Todas las categorías y las etiquetas del estudio bíblico, para entrar por donde prefieras.',
      type: 'website',
      indexable: true
    },
    {
      path: '/videos',
      title: `${brand} — Videos`,
      description: seo.description || '',
      type: 'website',
      indexable: videos.length > 0
    },
    {
      path: '/buscar',
      title: `${brand} — Buscar`,
      description: 'Busca a la vez en los estudios, los personajes, los concilios y los vídeos del sitio.',
      type: 'website',
      indexable: false
    }
  ];

  for (const s of studies) {
    routes.push({
      path: `/estudio/${s.slug}`,
      title: `${s.title} — ${brand}`,
      description: s.description || seo.description || '',
      type: 'article',
      ogImage: OG_IMAGE,
      lastmod: s.updated,
      indexable: true
    });
  }

  for (const p of fichas) {
    routes.push({
      path: `/estudio/personajes/${p.slug}`,
      title: `${p.nombre} — ${brand}`,
      description: p.resumen || seo.description || '',
      type: 'article',
      ogImage: OG_IMAGE,
      indexable: true
    });
  }

  return routes;
}

/** Rutas que deben responder 200 con HTML propio en producción. */
export function prerenderedPaths() {
  return siteRoutes().map(r => r.path);
}
