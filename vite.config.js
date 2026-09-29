import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

import contentApi from './plugins/content-api.mjs';

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

export default defineConfig({
  base,
  plugins: [react(), contentApi(), pagesFallback()],
  assetsInclude: ['**/*.glb', '**/*.stl'],
  build: {
    chunkSizeWarningLimit: 1200
  }
});
