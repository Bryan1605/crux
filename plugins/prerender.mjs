/**
 * Prerender por ruta.
 *
 * GitHub Pages sirve `404.html` para cualquier ruta profunda de la SPA: la
 * respuesta llegaba con **404** y con `noindex`, así que Google solo podía
 * indexar la portada y las redes sociales (que no ejecutan JavaScript) no veían
 * ni el título ni la imagen al compartir un enlace.
 *
 * Este plugin escribe `dist/<ruta>/index.html` para cada ruta pública, con el
 * título, la descripción, el `canonical` y los `og:*`/`twitter:*` de esa ruta ya
 * en el HTML. El HTML es el mismo armazón de siempre (la app arranca con su
 * JavaScript como hasta ahora), pero los rastreadores ya leen lo que necesitan.
 *
 * El `404.html` se mantiene para las rutas que no existen y para los enlaces con
 * parámetros que no tienen página propia.
 */
import fs from 'node:fs';
import path from 'node:path';

import { OG_IMAGE, escapeHtml, siteConfig, siteRoutes } from '../scripts/routes-lib.mjs';

/** Escapa lo que entra dentro de un `<script type="application/ld+json">`. */
const escapeJson = value => JSON.stringify(value).replace(/</g, '\\u003c');

/**
 * Metas que dependen de la ruta: se insertan antes de `</head>` del armazón que
 * genera Vite.
 */
function headFor(route, { origin }) {
  // Forma canónica: la del índice de directorio (`/estudio/`), que es la que
  // GitHub Pages sirve sin redirección intermedia.
  const url = `${origin}${route.path === '/' ? '/' : `${route.path}/`}`;
  const image = `${origin}${route.ogImage || OG_IMAGE}`;
  const tags = [
    `<link rel="canonical" href="${escapeHtml(url)}" />`,
    `<meta name="robots" content="${route.indexable ? 'index, follow' : 'noindex, follow'}" />`,
    `<meta property="og:type" content="${escapeHtml(route.type || 'website')}" />`,
    `<meta property="og:site_name" content="${escapeHtml(siteConfig().marca?.nombre || 'Crux')}" />`,
    `<meta property="og:locale" content="es_ES" />`,
    `<meta property="og:url" content="${escapeHtml(url)}" />`,
    `<meta property="og:title" content="${escapeHtml(route.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(route.description)}" />`,
    `<meta property="og:image" content="${escapeHtml(image)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${escapeHtml(route.title)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(route.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(route.description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(image)}" />`
  ];

  const jsonld =
    route.path === '/'
      ? {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: siteConfig().marca?.nombre || 'Crux',
          url: `${origin}/`,
          inLanguage: 'es',
          potentialAction: {
            '@type': 'SearchAction',
            target: `${origin}/buscar?q={search_term_string}`,
            'query-input': 'required name=search_term_string'
          }
        }
      : {
          '@context': 'https://schema.org',
          '@type': route.type === 'article' ? 'Article' : 'WebPage',
          name: route.title,
          description: route.description,
          url,
          inLanguage: 'es',
          isPartOf: { '@type': 'WebSite', name: siteConfig().marca?.nombre || 'Crux', url: `${origin}/` }
        };

  tags.push(`<script type="application/ld+json">${escapeJson(jsonld)}</script>`);
  return tags.join('\n    ');
}

/** Sustituye el título y la descripción del armazón por los de la ruta. */
function htmlFor(shell, route, options) {
  const withTitle = shell.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(route.title)}</title>`);
  const withDescription = withTitle.replace(
    /<meta\s+name="description"[\s\S]*?\/>/,
    `<meta name="description" content="${escapeHtml(route.description)}" />`
  );
  return withDescription.replace('</head>', `  ${headFor(route, options)}\n  </head>`);
}

export default function prerender({ origin }) {
  return {
    name: 'crux-prerender',
    apply: 'build',
    closeBundle() {
      const dist = path.join(process.cwd(), 'dist');
      const shellFile = path.join(dist, 'index.html');
      if (!fs.existsSync(shellFile)) {
        this.error('No existe dist/index.html: el prerender necesita el armazón ya compilado.');
      }

      const shell = fs.readFileSync(shellFile, 'utf8');
      let files = 0;

      for (const route of siteRoutes()) {
        const html = htmlFor(shell, route, { origin });
        const dir = route.path === '/' ? dist : path.join(dist, route.path);
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, 'index.html'), html);
        files += 1;
      }

      // eslint-disable-next-line no-console
      console.log(`\n  prerender: ${files} rutas con su propio HTML (canonical + og)\n`);
    }
  };
}
