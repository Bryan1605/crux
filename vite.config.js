import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import contentApi from './plugins/content-api.mjs';
import prerender from './plugins/prerender.mjs';
import { writeIndexes } from './scripts/content-lib.mjs';
import { OG_IMAGE, siteRoutes } from './scripts/routes-lib.mjs';
import { validate } from './scripts/validate-content.mjs';
import { checkTimelineLabels } from './src/lib/timeline.js';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const CONTENT = path.join(ROOT, 'content');
const PUBLIC = path.join(ROOT, 'public');
const base = process.env.BASE_PATH || '/';

// GitHub Pages no resuelve rutas profundas de una SPA: 404.html debe devolver al
// inicio conservando la ruta. Se emite desde aqui para poder incrustar el base.
const FALLBACK_HTML = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <title>Crux</title>
    <script>
      (function () {
        var base = '__BASE__';
        var path = location.pathname;
        if (/\\.[a-z0-9]{2,5}$/i.test(path)) return;
        try {
          sessionStorage.setItem('crux:path', path + location.search + location.hash);
        } catch (e) {}
        location.replace(base);
      })();
    </script>
  </head>
  <body>
    <p>Cargando&hellip;</p>
  </body>
</html>
`;

function pagesFallback() {
  return {
    name: 'crux-pages-fallback',
    apply: 'build',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: '404.html',
        source: FALLBACK_HTML.replaceAll('__BASE__', base)
      });
    }
  };
}

/**
 * Valida el contenido y regenera el índice ANTES de compilar.
 * Si un JSON está mal, el build falla con un mensaje claro en vez de publicar
 * una web rota.
 */
function contentGuard() {
  return {
    name: 'crux-content-guard',
    apply: 'build',
    buildStart() {
      const errors = [];
      const check = (name, read) => {
        try {
          validate(name, read());
        } catch (e) {
          errors.push(`content/${name}.json → ${e.message}`);
        }
      };
      const readJson = name => JSON.parse(fs.readFileSync(path.join(CONTENT, `${name}.json`), 'utf8'));

      for (const name of ['videos', 'slides', 'versiculos', 'anuncios', 'site', 'categorias', 'concilios', 'narraciones']) {
        const file = path.join(CONTENT, `${name}.json`);
        if (fs.existsSync(file)) check(name, () => readJson(name));
      }

      // Léxico: la fuente editable vive en content/lexico/griego.json.
      const lexicoFile = path.join(CONTENT, 'lexico', 'griego.json');
      if (fs.existsSync(lexicoFile)) {
        try {
          validate('lexico', JSON.parse(fs.readFileSync(lexicoFile, 'utf8')));
        } catch (e) {
          errors.push(`content/lexico/griego.json → ${e.message}`);
        }
      }

      // Narraciones: el audio y su onda tienen que estar publicados de verdad.
      const nFile = path.join(CONTENT, 'narraciones.json');
      if (fs.existsSync(nFile)) {
        try {
          const { items } = JSON.parse(fs.readFileSync(nFile, 'utf8'));
          for (const item of items || []) {
            for (const key of ['src', 'peaks']) {
              const rel = item[key];
              if (!rel) continue;
              if (!fs.existsSync(path.join(PUBLIC, rel))) {
                errors.push(`narraciones: no existe public${rel} (${item.id})`);
              }
            }
          }
        } catch (e) {
          errors.push(`narraciones: ${e.message}`);
        }
      }

      // Imagen de previsualización: el HTML prerenderizado la declara en cada
      // ruta, así que tiene que existir de verdad (se genera con `npm run og`).
      if (!fs.existsSync(path.join(PUBLIC, OG_IMAGE))) {
        errors.push(`seo: falta public${OG_IMAGE} (genera la imagen social con: npm run og)`);
      }

      // personajes
      const pDir = path.join(CONTENT, 'personajes');
      const personajesData = [];
      if (fs.existsSync(pDir)) {
        for (const f of fs.readdirSync(pDir).filter(x => x.endsWith('.json'))) {
          const slug = f.replace(/\.json$/, '');
          try {
            const data = JSON.parse(fs.readFileSync(path.join(pDir, f), 'utf8'));
            validate('personaje', data, slug);
            personajesData.push(data);
          } catch (e) {
            errors.push(`content/personajes/${f} → ${e.message}`);
          }
        }
      }

      // Línea de tiempo: todas las fechas display deben convertirse a número.
      if (fs.existsSync(pDir)) {
        const { broken } = checkTimelineLabels(personajesData);
        for (const b of broken.slice(0, 8)) {
          errors.push(`timeline: fecha sin convertir "${b.anio}" (${b.slug}): edita la ficha o añade anio_label`);
        }
      }

      // Regenerar el índice de estudios y el de búsqueda para que nunca queden desincronizados.
      try {
        writeIndexes(CONTENT);
      } catch (e) {
        errors.push(`No se pudieron regenerar los índices (estudios/búsqueda) → ${e.message}`);
      }

      // Destinos de los eventos curated: deben resolver a rutas reales.
      const tFile = path.join(CONTENT, 'timeline.json');
      if (fs.existsSync(tFile)) {
        try {
          const indexNow = JSON.parse(fs.readFileSync(path.join(CONTENT, 'estudios.json'), 'utf8'));
          const routes = {
            studies: new Set((indexNow.studies || []).map(s => s.slug)),
            personajes: new Set(personajesData.map(p => p.slug))
          };
          validate('timeline', JSON.parse(fs.readFileSync(tFile, 'utf8')), undefined, { routes });
        } catch (e) {
          errors.push(`content/timeline.json → ${e.message}`);
        }
      }

      if (errors.length) {
        this.error(`Contenido inválido:\n  - ${errors.join('\n  - ')}`);
      }
    }
  };
}

/**
 * Emite sitemap.xml y robots.txt a partir de las rutas públicas reales
 * (`scripts/routes-lib.mjs`): solo entran las que se indexan y responden 200 con
 * su propio HTML, con `lastmod` cuando la fecha es conocida.
 */
function seoFiles(env) {
  return {
    name: 'crux-seo-files',
    apply: 'build',
    generateBundle() {
      const siteUrl = siteUrlFrom(env);
      const urls = siteRoutes()
        .filter(r => r.indexable)
        .map(r => {
          const loc = `${siteUrl}${r.path === '/' ? '/' : `${r.path}/`}`;
          const lastmod = r.lastmod ? `\n    <lastmod>${r.lastmod}</lastmod>` : '';
          return `  <url>\n    <loc>${loc}</loc>${lastmod}\n  </url>`;
        })
        .join('\n');
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemap });
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: `User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: ${siteUrl}/sitemap.xml\n`
      });
    }
  };
}

/** URL pública del sitio, sin barra final. */
function siteUrlFrom(env) {
  return (env.SITE_URL || 'https://bryan1605.github.io/crux').replace(/\/$/, '');
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base,
    plugins: [
      react(),
      contentApi(env),
      contentGuard(),
      pagesFallback(),
      prerender({ origin: siteUrlFrom(env) }),
      seoFiles(env)
    ],
    assetsInclude: ['**/*.glb', '**/*.stl'],
    build: {
      chunkSizeWarningLimit: 1200
    }
  };
});
