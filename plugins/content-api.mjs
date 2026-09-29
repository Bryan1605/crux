/**
 * API de contenidos para el editor local (/admin).
 * SOLO existe en `vite dev` (configureServer no se ejecuta en build),
 * por lo que la versión desplegada no tiene puertas de escritura.
 *
 *   GET    /api/content/estudios            → regenera y devuelve el índice
 *   GET    /api/content/estudio?slug=x      → { slug, raw }
 *   POST   /api/content/estudio             → { slug, raw, renameFrom? } escribe .md + índice
 *   DELETE /api/content/estudio?slug=x      → borra .md + índice
 *   GET    /api/content/<nombre>            → { raw }  (videos|slides|versiculos|anuncios)
 *   POST   /api/content/<nombre>            → body: raw JSON  (valida antes de escribir)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { writeIndex } from '../scripts/content-lib.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = path.join(ROOT, 'content');
const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;
const JSON_FILES = new Set(['videos', 'slides', 'versiculos', 'anuncios']);

function send(res, code, obj) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(obj));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function slugPath(slug) {
  if (!SLUG_RE.test(slug)) return null;
  const file = path.join(CONTENT, 'estudios', `${slug}.md`);
  return file.startsWith(path.join(CONTENT, 'estudios') + path.sep) ? file : null;
}

export default function contentApi() {
  return {
    name: 'crux-content-api',
    configureServer(server) {
      server.middlewares.use('/api/content', async (req, res) => {
        try {
          const url = new URL(req.url || '/', 'http://local');
          const p = url.pathname.replace(/\/$/, '');
          const method = req.method || 'GET';

          // --- índice de estudios ---
          if (p === '/estudios' && method === 'GET') {
            const index = writeIndex(CONTENT);
            return send(res, 200, index);
          }

          // --- un estudio (.md) ---
          if (p === '/estudio') {
            const slug = url.searchParams.get('slug') || '';
            if (method === 'GET') {
              const file = slugPath(slug);
              if (!file || !fs.existsSync(file)) return send(res, 404, { error: 'No existe' });
              return send(res, 200, { slug, raw: fs.readFileSync(file, 'utf8') });
            }
            if (method === 'POST') {
              const body = JSON.parse(await readBody(req));
              const newSlug = String(body.slug || '');
              const raw = String(body.raw || '');
              const file = slugPath(newSlug);
              if (!file) return send(res, 400, { error: 'Slug inválido (a-z, 0-9 y guiones)' });
              if (!raw.startsWith('---')) return send(res, 400, { error: 'Falta el frontmatter (---)' });
              const renameFrom = body.renameFrom ? String(body.renameFrom) : '';
              if (renameFrom && renameFrom !== newSlug) {
                const old = slugPath(renameFrom);
                if (old && fs.existsSync(old)) fs.unlinkSync(old);
              }
              fs.writeFileSync(file, raw.endsWith('\n') ? raw : `${raw}\n`, 'utf8');
              const index = writeIndex(CONTENT);
              return send(res, 200, { ok: true, index });
            }
            if (method === 'DELETE') {
              const file = slugPath(slug);
              if (file && fs.existsSync(file)) fs.unlinkSync(file);
              const index = writeIndex(CONTENT);
              return send(res, 200, { ok: true, index });
            }
          }

          // --- ficheros JSON de contenido ---
          if (JSON_FILES.has(p.slice(1))) {
            const name = p.slice(1);
            const file = path.join(CONTENT, `${name}.json`);
            if (method === 'GET') {
              const raw = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : 'null';
              return send(res, 200, { raw });
            }
            if (method === 'POST') {
              const raw = await readBody(req);
              try {
                JSON.parse(raw);
              } catch (e) {
                return send(res, 400, { error: `JSON inválido: ${e.message}` });
              }
              fs.writeFileSync(file, raw.endsWith('\n') ? raw : `${raw}\n`, 'utf8');
              return send(res, 200, { ok: true });
            }
          }

          return send(res, 404, { error: 'Ruta desconocida' });
        } catch (e) {
          return send(res, 500, { error: String(e && e.message ? e.message : e) });
        }
      });
    }
  };
}
