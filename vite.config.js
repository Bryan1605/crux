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
import { APOLOGETICA_FASCICULOS } from './src/lib/apologeticaSeo.js';
import { checkClaves } from './src/lib/claves.js';
import { checkTimelineLabels } from './src/lib/timeline.js';
import { BOOK_BY_ID } from './src/data/exegesis.js';

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

      for (const name of ['videos', 'slides', 'versiculos', 'anuncios', 'site', 'categorias', 'concilios', 'narraciones', 'obras-patristica']) {
        const file = path.join(CONTENT, `${name}.json`);
        if (fs.existsSync(file)) check(name, () => readJson(name));
      }

      // Portadas de obras (Biblia Patrística): cada .webp debe existir en public/img/obras/.
      const obrasFile = path.join(CONTENT, 'obras-patristica.json');
      if (fs.existsSync(obrasFile)) {
        try {
          const { items } = JSON.parse(fs.readFileSync(obrasFile, 'utf8'));
          for (const item of items || []) {
            if (item?.portada && !fs.existsSync(path.join(PUBLIC, item.portada))) {
              errors.push(`content/obras-patristica.json → falta public${item.portada}`);
            }
          }
        } catch {
          // El error de JSON o esquema ya se registra arriba.
        }
      }

      // Léxico: las fuentes editables viven en content/lexico/.
      const lexicoFile = path.join(CONTENT, 'lexico', 'griego.json');
      if (fs.existsSync(lexicoFile)) {
        try {
          validate('lexico', JSON.parse(fs.readFileSync(lexicoFile, 'utf8')));
        } catch (e) {
          errors.push(`content/lexico/griego.json → ${e.message}`);
        }
      }
      const lexicoHebreoFile = path.join(CONTENT, 'lexico', 'hebreo.json');
      if (fs.existsSync(lexicoHebreoFile)) {
        try {
          validate('lexico-hebreo', JSON.parse(fs.readFileSync(lexicoHebreoFile, 'utf8')));
        } catch (e) {
          errors.push(`content/lexico/hebreo.json → ${e.message}`);
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

      // Temas por categoría: categorías reales, keys únicas e imágenes publicadas.
      // Una ficha con una `subcategory` fuera de la lista no rompe el build
      // (se pinta al final de su categoría), pero se avisa.
      const temasFile = path.join(CONTENT, 'temas.json');
      if (fs.existsSync(temasFile)) {
        try {
          const temas = JSON.parse(fs.readFileSync(temasFile, 'utf8'));
          const categorias = new Set(readJson('categorias').map(c => c.id));
          validate('temas', temas, undefined, {
            categorias,
            imageExists: rel => fs.existsSync(path.join(PUBLIC, rel))
          });
          const { studies = [] } = JSON.parse(fs.readFileSync(path.join(CONTENT, 'estudios.json'), 'utf8'));
          const sueltos = new Map();
          for (const s of studies) {
            const lista = temas[s.category];
            if (!lista || !s.subcategory || lista.some(t => t.key === s.subcategory)) continue;
            const k = `${s.category} · ${s.subcategory}`;
            sueltos.set(k, (sueltos.get(k) || 0) + 1);
          }
          for (const [k, n] of sueltos) {
            this.warn(`temas: ${n} ficha(s) con subcategory fuera de content/temas.json → ${k}`);
          }
        } catch (e) {
          errors.push(`content/temas.json → ${e.message}`);
        }
      }

      // Apologética: fascículos de preguntas + palabras clave + contraste doctrinal opcional.
      const registroFuentes = JSON.parse(fs.readFileSync(path.join(CONTENT, 'libros', 'fuentes.json'), 'utf8'));
      const fuentesApolo = new Set(Object.keys(registroFuentes.fuentes));
      for (const f of APOLOGETICA_FASCICULOS) {
        const pFile = path.join(CONTENT, 'apologetica', f.preguntasFile);
        if (!fs.existsSync(pFile)) continue;
        try {
          const preg = JSON.parse(fs.readFileSync(pFile, 'utf8'));
          validate('apologetica-preguntas', preg, f.slug, {
            books: BOOK_BY_ID,
            fuentes: fuentesApolo,
            expectedCount: f.expectedCount
          });
          // Palabras clave: cada frase debe estar en su versículo (NTV y Codex).
          const clavesFile = path.join(CONTENT, 'apologetica', f.clavesFile);
          const claves = JSON.parse(fs.readFileSync(clavesFile, 'utf8')).claves;
          const problemas = checkClaves(preg.bloques.flatMap(b => b.preguntas), claves);
          if (problemas.length) throw new Error(`claves: ${problemas.slice(0, 5).join(' | ')}`);
          if (f.doctrinaFile) {
            const doctrinaFile = path.join(CONTENT, 'apologetica', f.doctrinaFile);
            if (fs.existsSync(doctrinaFile)) {
              validate('apologetica-doctrina', JSON.parse(fs.readFileSync(doctrinaFile, 'utf8')), f.slug, {
                bilingual: f.bilingualDoctrina
              });
            }
          }
        } catch (e) {
          errors.push(`content/apologetica/${f.slug}-* → ${e.message}`);
        }
      }

      // Fichas de libros: cada una cuadra con la tabla canónica, tiene 600–900
      // palabras y solo cita fuentes del registro verificado (content/libros/fuentes.json).
      const lDir = path.join(CONTENT, 'libros');
      if (fs.existsSync(lDir)) {
        let fuentes = new Set();
        try {
          const registro = JSON.parse(fs.readFileSync(path.join(lDir, 'fuentes.json'), 'utf8'));
          validate('fuentes', registro);
          fuentes = new Set(Object.keys(registro.fuentes));
        } catch (e) {
          errors.push(`content/libros/fuentes.json → ${e.message}`);
        }
        for (const f of fs.readdirSync(lDir).filter(x => x.endsWith('.json') && x !== 'fuentes.json')) {
          const slug = f.replace(/\.json$/, '');
          try {
            const data = JSON.parse(fs.readFileSync(path.join(lDir, f), 'utf8'));
            validate('libro', data, slug, { book: BOOK_BY_ID.get(slug) || null, fuentes });
          } catch (e) {
            errors.push(`content/libros/${f} → ${e.message}`);
          }
        }
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
  return (env.SITE_URL || 'https://cruxestudios.com').replace(/\/$/, '');
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
