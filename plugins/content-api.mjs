/**
 * API de contenidos para el editor local (/admin).
 * SOLO existe en `vite dev` (configureServer no se ejecuta en build).
 * Endpoints:
 *   GET    /api/content/estudios           → regenera y devuelve el índice
 *   GET    /api/content/estudio?slug=x     → { slug, raw }
 *   POST   /api/content/estudio            → { slug, raw, renameFrom? } escribe .md + índice
 *   DELETE /api/content/estudio?slug=x     → borra .md + índice
 *   GET    /api/content/<nombre>           → { raw }  (videos|slides|versiculos|anuncios|site|categorias)
 *   POST   /api/content/<nombre>           → body: JSON  (valida antes de escribir)
 *   GET    /api/content/personajes/:slug   → ficha de personaje
 *   POST   /api/content/personajes         → crea/actualiza personaje
 *   DELETE /api/content/personajes/:slug   → borra personaje
 *   GET    /api/content/media              → lista archivos en public/img/
 *   POST   /api/content/media              → sube archivo (multipart/form-data)
 *   DELETE /api/content/media?path=x       → borra archivo
 *   GET    /api/content/history            → lista backups
 *   POST   /api/content/history/restore    → restaura backup { file, backup }
 *   GET    /api/content/status             → { clean: true, changes: [...] }
 *   GET    /api/content/diff               → diff resumido de content/
 *   POST   /api/content/publish            → commit+push a GitHub (requiere GH_TOKEN)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

import { writeIndex } from '../scripts/content-lib.mjs';
import { parseFrontmatter } from '../src/lib/frontmatter.js';
import { validate } from '../scripts/validate-content.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = path.join(ROOT, 'content');
const PUBLIC_IMG = path.join(ROOT, 'public', 'img');
const HISTORY = path.join(CONTENT, '.history');
const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;
const JSON_FILES = new Set(['videos', 'slides', 'versiculos', 'anuncios', 'site', 'categorias', 'timeline']);
const PERSONAJES_DIR = path.join(CONTENT, 'personajes');

// --- helpers ---
function send(res, code, obj) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(obj));
}

function readRaw(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function readBody(req) {
  const buf = await readRaw(req);
  return buf.toString('utf8');
}

function slugPath(slug) {
  if (!SLUG_RE.test(slug)) return null;
  const file = path.join(CONTENT, 'estudios', `${slug}.md`);
  return file.startsWith(path.join(CONTENT, 'estudios') + path.sep) ? file : null;
}

function personajePath(slug) {
  if (!SLUG_RE.test(slug)) return null;
  const file = path.join(PERSONAJES_DIR, `${slug}.json`);
  return file.startsWith(PERSONAJES_DIR + path.sep) ? file : null;
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function writeJson(file, obj) {
  const content = `${JSON.stringify(obj, null, 2)}\n`;
  fs.writeFileSync(file, content, 'utf8');
}

function backupFile(file) {
  ensureDir(HISTORY);
  const rel = path.relative(CONTENT, file);
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const base = path.basename(rel);
  const dest = path.join(HISTORY, `${base}.${stamp}`);
  fs.copyFileSync(file, dest);
  return dest;
}

function runGit(args, cwd = ROOT) {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8', stdio: 'pipe' });
  if (r.status !== 0) throw new Error(`git ${args.join(' ')} falló: ${r.stderr}`);
  return r.stdout.trim();
}

async function publishToGitHub(env) {
  const token = env.GH_TOKEN || process.env.GH_TOKEN;
  const repo = env.GH_REPO || process.env.GH_REPO; // formato owner/repo
  if (!token || !repo) throw new Error('Faltan GH_TOKEN y GH_REPO en .env.local');
  // git add/commit
  runGit(['add', 'content', 'public/img']);
  const msg = `chore(content): actualización desde admin ${new Date().toISOString().slice(0, 16)}`;
  runGit(['commit', '-m', msg]);
  // push usando el remoto configurado (origin). El token se usa para HTTPS.
  const remote = runGit(['remote', 'get-url', 'origin']);
  if (token && remote.startsWith('https://') && !remote.includes('@')) {
    const authed = remote.replace('https://', `https://x-access-token:${token}@`);
    runGit(['push', authed, `HEAD:${env.GH_BRANCH || 'main'}`]);
  } else {
    runGit(['push', 'origin', `HEAD:${env.GH_BRANCH || 'main'}`]);
  }
  return { ok: true, commit: msg };
}

// --- multipart parser simple para subida de imágenes (sobre Buffer, sin
// decodificar a texto para no corromper el binario) ---
function parseMultipart(buffer, boundary) {
  const delim = Buffer.from(`--${boundary}`);
  const files = [];
  let idx = buffer.indexOf(delim);
  while (idx !== -1) {
    const next = buffer.indexOf(delim, idx + delim.length);
    const part = buffer.subarray(idx + delim.length, next === -1 ? buffer.length : next);
    idx = next;
    if (part.length === 0) continue;
    const headerEnd = part.indexOf('\r\n\r\n');
    if (headerEnd === -1) continue;
    const headersRaw = part.subarray(0, headerEnd).toString('utf8');
    let content = part.subarray(headerEnd + 4);
    // quitar el CRLF final que precede al boundary
    if (content.length >= 2 && content[content.length - 2] === 0x0d && content[content.length - 1] === 0x0a) {
      content = content.subarray(0, content.length - 2);
    }
    const disp = (headersRaw.match(/content-disposition:[^\n]*/i) || [''])[0];
    const nameMatch = disp.match(/name="([^"]+)"/);
    const filenameMatch = disp.match(/filename="([^"]+)"/);
    if (filenameMatch) {
      files.push({ field: nameMatch?.[1] || 'file', filename: filenameMatch[1], content });
    }
  }
  return files;
}

// --- plugin ---
export default function contentApi(env = {}) {
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
              const raw = fs.readFileSync(file, 'utf8');
              const parsed = parseFrontmatter(raw);
              validate('estudio', parsed, slug);
              return send(res, 200, { slug, raw, data: parsed.data, body: parsed.body });
            }
            if (method === 'POST') {
              const body = JSON.parse(await readBody(req));
              const newSlug = String(body.slug || '');
              const raw = String(body.raw || '');
              const file = slugPath(newSlug);
              if (!file) return send(res, 400, { error: 'Slug inválido (a-z, 0-9 y guiones)' });
              if (!raw.startsWith('---')) return send(res, 400, { error: 'Falta el frontmatter (---)' });
              const parsed = parseFrontmatter(raw);
              try {
                validate('estudio', parsed, newSlug);
              } catch (e) {
                return send(res, 400, { error: e.message });
              }
              const renameFrom = body.renameFrom ? String(body.renameFrom) : '';
              if (fs.existsSync(file)) backupFile(file);
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
              if (file && fs.existsSync(file)) {
                backupFile(file);
                fs.unlinkSync(file);
              }
              const index = writeIndex(CONTENT);
              return send(res, 200, { ok: true, index });
            }
          }

          // --- JSON files (videos, slides, versiculos, anuncios, site, categorias) ---
          if (JSON_FILES.has(p.slice(1))) {
            const name = p.slice(1);
            const file = path.join(CONTENT, `${name}.json`);
            if (method === 'GET') {
              const raw = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : 'null';
              return send(res, 200, { raw });
            }
            if (method === 'POST') {
              const raw = await readBody(req);
              let data;
              try {
                data = JSON.parse(raw);
              } catch (e) {
                return send(res, 400, { error: `JSON inválido: ${e.message}` });
              }
              try {
                validate(name, data);
              } catch (e) {
                return send(res, 400, { error: e.message });
              }
              if (fs.existsSync(file)) backupFile(file);
              writeJson(file, data);
              return send(res, 200, { ok: true });
            }
          }

          // --- personajes ---
          if (p.startsWith('/personajes')) {
            const slug = p.split('/').pop();
            if (p === '/personajes' && method === 'GET') {
              // listar
              ensureDir(PERSONAJES_DIR);
              const files = fs.readdirSync(PERSONAJES_DIR).filter(f => f.endsWith('.json'));
              const list = files.map(f => {
                const raw = fs.readFileSync(path.join(PERSONAJES_DIR, f), 'utf8');
                return JSON.parse(raw);
              });
              return send(res, 200, { items: list });
            }
            if (slug && method === 'GET') {
              const file = personajePath(slug);
              if (!file || !fs.existsSync(file)) return send(res, 404, { error: 'No existe' });
              const raw = fs.readFileSync(file, 'utf8');
              const data = JSON.parse(raw);
              validate('personaje', data, slug);
              return send(res, 200, data);
            }
            if (p === '/personajes' && method === 'POST') {
              const data = JSON.parse(await readBody(req));
              const newSlug = String(data.slug || '');
              if (!SLUG_RE.test(newSlug)) return send(res, 400, { error: 'Slug inválido (a-z, 0-9 y guiones)' });
              const file = personajePath(newSlug);
              if (!file) return send(res, 400, { error: 'Slug inválido' });
              validate('personaje', data, newSlug);
              if (fs.existsSync(file)) backupFile(file);
              writeJson(file, data);
              return send(res, 200, { ok: true });
            }
            if (slug && method === 'DELETE') {
              const file = personajePath(slug);
              if (file && fs.existsSync(file)) {
                backupFile(file);
                fs.unlinkSync(file);
              }
              return send(res, 200, { ok: true });
            }
          }

          // --- media library ---
          if (p === '/media') {
            ensureDir(PUBLIC_IMG);
            if (method === 'GET') {
              const walk = dir => {
                const out = [];
                for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
                  const abs = path.join(dir, entry.name);
                  if (entry.isDirectory()) out.push(...walk(abs));
                  else if (/\.(webp|png|jpg|jpeg|svg|gif)$/i.test(entry.name)) {
                    const stat = fs.statSync(abs);
                    const rel = path.relative(PUBLIC_IMG, abs).split(path.sep).join('/');
                    out.push({ name: rel, size: stat.size, modified: stat.mtime.toISOString(), url: `/img/${rel}` });
                  }
                }
                return out;
              };
              const items = walk(PUBLIC_IMG).sort((a, b) => a.name.localeCompare(b.name));
              return send(res, 200, { items });
            }
            if (method === 'POST') {
              const ct = req.headers['content-type'] || '';
              const m = ct.match(/boundary=([^;]+)/);
              if (!m) return send(res, 400, { error: 'Content-Type multipart requerido' });
              const raw = await readRaw(req);
              const files = parseMultipart(raw, m[1]);
              if (!files.length) return send(res, 400, { error: 'Sin archivo' });
              const file = files[0];
              const ext = path.extname(file.filename).toLowerCase();
              if (!['.webp', '.png', '.jpg', '.jpeg', '.svg', '.gif'].includes(ext)) {
                return send(res, 400, { error: 'Extensión no permitida' });
              }
              const safeName = file.filename.replace(/[^a-z0-9._-]/gi, '-').toLowerCase();
              const dest = path.join(PUBLIC_IMG, safeName);
              if (fs.existsSync(dest)) backupFile(dest);
              fs.writeFileSync(dest, file.content);
              return send(res, 200, { ok: true, url: `/img/${safeName}`, name: safeName });
            }
          }
          if (p === '/media' && method === 'DELETE') {
            const rel = url.searchParams.get('path');
            if (!rel) return send(res, 400, { error: 'path requerido' });
            const file = path.join(PUBLIC_IMG, rel);
            if (!file.startsWith(PUBLIC_IMG + path.sep)) return send(res, 400, { error: 'Ruta inválida' });
            if (fs.existsSync(file)) {
              backupFile(file);
              fs.unlinkSync(file);
              return send(res, 200, { ok: true });
            }
            return send(res, 404, { error: 'No existe' });
          }

          // --- history ---
          if (p === '/history' && method === 'GET') {
            ensureDir(HISTORY);
            const files = fs.readdirSync(HISTORY).sort().reverse();
            return send(res, 200, { items: files });
          }
          if (p === '/history/restore' && method === 'POST') {
            const body = JSON.parse(await readBody(req));
            const { file, backup } = body;
            if (!file || !backup) return send(res, 400, { error: 'file y backup requeridos' });
            const src = path.join(HISTORY, backup);
            const dest = path.join(CONTENT, file);
            if (!fs.existsSync(src)) return send(res, 404, { error: 'Backup no existe' });
            if (!dest.startsWith(CONTENT + path.sep)) return send(res, 400, { error: 'Ruta inválida' });
            if (fs.existsSync(dest)) backupFile(dest);
            fs.copyFileSync(src, dest);
            if (file === 'estudios.json') writeIndex(CONTENT);
            return send(res, 200, { ok: true });
          }

          // --- status / diff ---
          if (p === '/status' && method === 'GET') {
            const out = runGit(['status', '--porcelain', 'content', 'public/img']);
            const changes = out.split('\n').filter(Boolean).map(l => l.trim());
            return send(res, 200, { clean: changes.length === 0, changes });
          }
          if (p === '/diff' && method === 'GET') {
            const out = runGit(['diff', 'content', 'public/img']);
            return send(res, 200, { diff: out });
          }

          // --- publish ---
          if (p === '/publish' && method === 'POST') {
            try {
              const result = await publishToGitHub(env);
              return send(res, 200, result);
            } catch (e) {
              return send(res, 500, { error: e.message });
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