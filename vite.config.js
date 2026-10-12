import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import contentApi from './plugins/content-api.mjs';
import { writeIndex } from './scripts/content-lib.mjs';
import { validate } from './scripts/validate-content.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const CONTENT = path.join(ROOT, 'content');
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

      for (const name of ['videos', 'slides', 'versiculos', 'anuncios', 'site', 'categorias']) {
        const file = path.join(CONTENT, `${name}.json`);
        if (fs.existsSync(file)) check(name, () => readJson(name));
      }

      // personajes
      const pDir = path.join(CONTENT, 'personajes');
      if (fs.existsSync(pDir)) {
        for (const f of fs.readdirSync(pDir).filter(x => x.endsWith('.json'))) {
          const slug = f.replace(/\.json$/, '');
          try {
            validate('personaje', JSON.parse(fs.readFileSync(path.join(pDir, f), 'utf8')), slug);
          } catch (e) {
            errors.push(`content/personajes/${f} → ${e.message}`);
          }
        }
      }

      // Regenerar el índice de estudios para que nunca quede desincronizado.
      try {
        writeIndex(CONTENT);
      } catch (e) {
        errors.push(`No se pudo regenerar content/estudios.json → ${e.message}`);
      }

      if (errors.length) {
        this.error(`Contenido inválido:\n  - ${errors.join('\n  - ')}`);
      }
    }
  };
}

/**
 * Emite sitemap.xml y robots.txt a partir de los estudios y las rutas fijas.
 */
function seoFiles(env) {
  return {
    name: 'crux-seo-files',
    apply: 'build',
    generateBundle() {
      const siteUrl = (env.SITE_URL || 'https://bryan1605.github.io/crux').replace(/\/$/, '');
      const routes = new Set(['/', '/estudio', '/biblia', '/videos']);
      try {
        const index = JSON.parse(fs.readFileSync(path.join(CONTENT, 'estudios.json'), 'utf8'));
        for (const s of index.studies || []) routes.add(`/estudio/${s.slug}`);
      } catch {
        // sin índice: solo rutas fijas
      }

      const urls = [...routes]
        .map(r => `  <url><loc>${siteUrl}${r === '/' ? '/' : r}</loc></url>`)
        .join('\n');
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemap });
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base,
    plugins: [react(), contentApi(env), contentGuard(), pagesFallback(), seoFiles(env)],
    assetsInclude: ['**/*.glb', '**/*.stl'],
    build: {
      chunkSizeWarningLimit: 1200
    }
  };
});
