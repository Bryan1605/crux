/**
 * API de contenidos para el editor local (/admin).
 * SOLO existe en `vite dev` (configureServer no se ejecuta en build).
 * Endpoints:
 *   GET    /api/content/dashboard          → conteos y estado general del panel
 *   GET    /api/content/estudios           → regenera y devuelve el índice
 *   GET    /api/content/estudio?slug=x     → { slug, raw }
 *   POST   /api/content/estudio            → { slug, raw, renameFrom? } escribe .md + índice
 *   DELETE /api/content/estudio?slug=x     → borra .md + índice
 *   GET    /api/content/<nombre>           → { raw }  (videos|slides|versiculos|anuncios|site|categorias|timeline|concilios|obras-patristica)
 *   POST   /api/content/<nombre>           → body: JSON  (valida antes de escribir)
 *   GET    /api/content/personajes         → lista personajes
 *   GET    /api/content/personajes/:slug   → ficha de personaje
 *   POST   /api/content/personajes         → crea/actualiza personaje
 *   DELETE /api/content/personajes/:slug   → borra personaje
 *   GET    /api/content/libros             → lista las fichas de libros + fuentes
 *   GET    /api/content/libros/:id         → ficha de libro + fuentes
 *   POST   /api/content/libros/:id         → valida y guarda ficha de libro
 *   GET    /api/content/trad               → lista traducciones de trabajo
 *   GET    /api/content/trad/:id           → { trad, codex }
 *   POST   /api/content/trad/:id           → guarda trad y ejecuta build-trad + índice
 *   GET    /api/content/media              → lista archivos en public/img/
 *   GET    /api/content/media/usage?path=x → referencias a /img/<x>
 *   POST   /api/content/media              → sube archivo (multipart/form-data, soporta ?folder=&webp=)
 *   DELETE /api/content/media?path=x       → borra archivo
 *   GET    /api/content/history            → lista backups
 *   POST   /api/content/history/restore    → restaura backup { backup, file? }
 *   GET    /api/content/status             → { clean: true, changes: [...] }
 *   GET    /api/content/diff               → diff resumido de contenido/medios
 *   POST   /api/content/publish            → commit+push a GitHub (requiere GH_TOKEN; admite { message })
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

import { BOOK_BY_ID } from '../src/data/exegesis.js';
import { writeIndexes } from '../scripts/content-lib.mjs';
import { parseFrontmatter } from '../src/lib/frontmatter.js';
import { validate, palabrasLibro } from '../scripts/validate-content.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = path.join(ROOT, 'content');
const PUBLIC_DIR = path.join(ROOT, 'public');
const PUBLIC_IMG = path.join(PUBLIC_DIR, 'img');
const HISTORY = path.join(CONTENT, '.history');
const PERSONAJES_DIR = path.join(CONTENT, 'personajes');
const LIBROS_DIR = path.join(CONTENT, 'libros');
const TRAD_DIR = path.join(ROOT, 'src', 'assets', 'texts', 'trad');
const CODEX_DIR = path.join(PUBLIC_DIR, 'textos', 'exegesis', 'codex');

const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;
const FOLDER_RE = /^[a-z0-9/_-]*$/i;
const JSON_FILES = new Set([
  'videos',
  'slides',
  'versiculos',
  'anuncios',
  'site',
  'categorias',
  'timeline',
  'concilios',
  'obras-patristica'
]);
const TRAD_STATUSES = new Set(['borrador', 'revisado']);
const PUBLISH_PATHS = [
  'content',
  'public/img',
  'src/assets/texts/trad',
  'public/textos/exegesis/trad',
  'public/textos/exegesis/index.json'
];

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

function safeChild(baseDir, relPath) {
  const abs = path.resolve(baseDir, relPath);
  return abs === baseDir || abs.startsWith(baseDir + path.sep) ? abs : null;
}

function slugPath(slug) {
  if (!SLUG_RE.test(slug)) return null;
  return safeChild(path.join(CONTENT, 'estudios'), `${slug}.md`);
}

function personajePath(slug) {
  if (!SLUG_RE.test(slug)) return null;
  return safeChild(PERSONAJES_DIR, `${slug}.json`);
}

function libroPath(slug) {
  if (!SLUG_RE.test(slug) || !BOOK_BY_ID.has(slug)) return null;
  return safeChild(LIBROS_DIR, `${slug}.json`);
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

function readFuentes() {
  const file = path.join(LIBROS_DIR, 'fuentes.json');
  if (!fs.existsSync(file)) return {};
  return JSON.parse(fs.readFileSync(file, 'utf8')).fuentes || {};
}

function walkImages(dir) {
  if (!fs.existsSync(dir)) return [];
  const walk = cur => {
    const out = [];
    for (const entry of fs.readdirSync(cur, { withFileTypes: true })) {
      const abs = path.join(cur, entry.name);
      if (entry.isDirectory()) out.push(...walk(abs));
      else if (/\.(webp|png|jpg|jpeg|svg|gif)$/i.test(entry.name)) {
        const stat = fs.statSync(abs);
        const rel = path.relative(PUBLIC_IMG, abs).split(path.sep).join('/');
        const slash = rel.lastIndexOf('/');
        out.push({
          name: rel,
          folder: slash === -1 ? '' : rel.slice(0, slash),
          size: stat.size,
          modified: stat.mtime.toISOString(),
          url: `/img/${rel}`
        });
      }
    }
    return out;
  };
  return walk(dir).sort((a, b) => a.name.localeCompare(b.name));
}

function findImageUsage(rel) {
  const cleanRel = String(rel || '').replace(/^\/?(?:img\/)?/, '').replace(/\\/g, '/');
  if (!cleanRel || cleanRel.includes('..')) return [];
  const needle = `/img/${cleanRel}`;
  const refs = [];

  const scanFile = (abs, kind) => {
    try {
      const text = fs.readFileSync(abs, 'utf8');
      if (text.includes(needle)) {
        refs.push({ file: path.relative(ROOT, abs).split(path.sep).join('/'), kind });
      }
    } catch {
      /* ignorar archivo ilegible */
    }
  };

  const walk = (dir, exts, kind, skip = new Set()) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue;
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(abs, exts, kind, skip);
      } else if (exts.some(e => entry.name.endsWith(e)) && !skip.has(entry.name)) {
        scanFile(abs, kind);
      }
    }
  };

  walk(path.join(CONTENT, 'estudios'), ['.md'], 'estudio');
  for (const entry of fs.readdirSync(CONTENT, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith('.json') && entry.name !== 'estudios.json' && entry.name !== 'busquedas.json') {
      scanFile(path.join(CONTENT, entry.name), 'config');
    }
  }
  walk(PERSONAJES_DIR, ['.json'], 'personaje');
  walk(LIBROS_DIR, ['.json'], 'libro');
  walk(path.join(ROOT, 'src', 'data'), ['.js', '.json'], 'codigo');
  walk(path.join(ROOT, 'src', 'pages'), ['.js', '.jsx', '.css'], 'vista');
  return refs;
}

function resolveHistoryDest(backupName, explicitFile) {
  if (explicitFile) {
    const dest = path.resolve(CONTENT, explicitFile);
    return dest.startsWith(CONTENT + path.sep) ? dest : null;
  }
  const orig = String(backupName || '').replace(/\.\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z$/, '');
  if (!orig || orig === backupName || orig.includes('/') || orig.includes('\\') || orig.includes('..')) {
    return null;
  }
  if (orig.endsWith('.md')) return safeChild(path.join(CONTENT, 'estudios'), orig);
  const direct = safeChild(CONTENT, orig);
  if (direct && (fs.existsSync(direct) || JSON_FILES.has(orig.replace(/\.json$/, '')))) return direct;
  const pj = safeChild(PERSONAJES_DIR, orig);
  if (pj && fs.existsSync(pj)) return pj;
  const lb = safeChild(LIBROS_DIR, orig);
  if (lb && (fs.existsSync(lb) || BOOK_BY_ID.has(orig.replace(/\.json$/, '')))) return lb;
  const ap = safeChild(path.join(CONTENT, 'apologetica'), orig);
  if (ap && fs.existsSync(ap)) return ap;
  return null;
}

function runGit(args, cwd = ROOT) {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8', stdio: 'pipe' });
  if (r.status !== 0) throw new Error(`git ${args.join(' ')} falló: ${r.stderr}`);
  return r.stdout.trim();
}

function runNodeScript(scriptRel) {
  const r = spawnSync(process.execPath, [scriptRel], { cwd: ROOT, encoding: 'utf8', stdio: 'pipe' });
  if (r.status !== 0) {
    throw new Error(`${scriptRel} falló:\n${(r.stderr || r.stdout || '').trim()}`);
  }
  return r.stdout.trim();
}

function existingPublishPaths() {
  return PUBLISH_PATHS.filter(rel => fs.existsSync(path.join(ROOT, rel)));
}

async function publishToGitHub(env, customMessage) {
  const token = env.GH_TOKEN || process.env.GH_TOKEN;
  const repo = env.GH_REPO || process.env.GH_REPO; // formato owner/repo
  if (!token || !repo) throw new Error('Faltan GH_TOKEN y GH_REPO en .env.local');
  writeIndexes(CONTENT);
  const paths = existingPublishPaths();
  if (!paths.length) throw new Error('No hay rutas de contenido para publicar');
  runGit(['add', '--', ...paths]);
  const staged = runGit(['status', '--porcelain', '--', ...paths]);
  if (!staged) throw new Error('No hay cambios que publicar');
  const msg =
    String(customMessage || '').trim() ||
    `chore(content): actualización desde admin ${new Date().toISOString().slice(0, 16)}`;
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

          // --- dashboard resumen ---
          if (p === '/dashboard' && method === 'GET') {
            const estudiosDir = path.join(CONTENT, 'estudios');
            const estudiosCount = fs.existsSync(estudiosDir)
              ? fs.readdirSync(estudiosDir).filter(f => f.endsWith('.md')).length
              : 0;
            const personajesCount = fs.existsSync(PERSONAJES_DIR)
              ? fs.readdirSync(PERSONAJES_DIR).filter(f => f.endsWith('.json')).length
              : 0;

            let libros = { total: 0, borrador: 0, revisado: 0 };
            if (fs.existsSync(LIBROS_DIR)) {
              for (const f of fs.readdirSync(LIBROS_DIR)) {
                if (!f.endsWith('.json') || f === 'fuentes.json') continue;
                libros.total += 1;
                const d = JSON.parse(fs.readFileSync(path.join(LIBROS_DIR, f), 'utf8'));
                if (d.status === 'revisado') libros.revisado += 1;
                else libros.borrador += 1;
              }
            }

            let trad = { total: 0, borrador: 0, revisado: 0, verses: 0 };
            if (fs.existsSync(TRAD_DIR)) {
              for (const f of fs.readdirSync(TRAD_DIR)) {
                if (!f.endsWith('.json')) continue;
                trad.total += 1;
                const d = JSON.parse(fs.readFileSync(path.join(TRAD_DIR, f), 'utf8'));
                if (d.status === 'revisado') trad.revisado += 1;
                else trad.borrador += 1;
                trad.verses += (d.chapters || []).reduce((n, c) => n + (c.verses?.length || 0), 0);
              }
            }

            const obrasFile = path.join(CONTENT, 'obras-patristica.json');
            const obrasPatristica = fs.existsSync(obrasFile)
              ? (JSON.parse(fs.readFileSync(obrasFile, 'utf8')).items || []).length
              : 0;

            const mediaCount = walkImages(PUBLIC_IMG).length;

            let git = null;
            try {
              const paths = existingPublishPaths();
              const out = paths.length ? runGit(['status', '--porcelain', '--', ...paths]) : '';
              const changes = out.split('\n').filter(Boolean).map(l => l.trim());
              git = { clean: changes.length === 0, changes };
            } catch {
              git = null;
            }

            return send(res, 200, {
              estudios: estudiosCount,
              personajes: personajesCount,
              libros,
              trad,
              obrasPatristica,
              media: mediaCount,
              git
            });
          }

          // --- índice de estudios ---
          if (p === '/estudios' && method === 'GET') {
            const index = writeIndexes(CONTENT);
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
              const index = writeIndexes(CONTENT);
              return send(res, 200, { ok: true, index });
            }
            if (method === 'DELETE') {
              const file = slugPath(slug);
              if (file && fs.existsSync(file)) {
                backupFile(file);
                fs.unlinkSync(file);
              }
              const index = writeIndexes(CONTENT);
              return send(res, 200, { ok: true, index });
            }
          }

          // --- JSON files (videos, slides, versiculos, anuncios, site, categorias, timeline, concilios, obras-patristica) ---
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
                if (name === 'obras-patristica') {
                  for (const item of data.items || []) {
                    if (item.portada && !fs.existsSync(path.join(PUBLIC_DIR, item.portada))) {
                      throw new Error(`No existe public${item.portada}`);
                    }
                  }
                }
              } catch (e) {
                return send(res, 400, { error: e.message });
              }
              if (fs.existsSync(file)) backupFile(file);
              writeJson(file, data);
              // Concilios y videos alimentan el índice de búsqueda.
              if (name === 'concilios' || name === 'videos') writeIndexes(CONTENT);
              return send(res, 200, { ok: true });
            }
          }

          // --- fichas de libros ---
          if (p === '/libros' || p.startsWith('/libros/')) {
            const id = p === '/libros' ? '' : p.slice('/libros/'.length);
            if (p === '/libros' && method === 'GET') {
              const fuentes = readFuentes();
              const items = [];
              if (fs.existsSync(LIBROS_DIR)) {
                for (const f of fs.readdirSync(LIBROS_DIR)) {
                  if (!f.endsWith('.json') || f === 'fuentes.json') continue;
                  const slug = f.replace(/\.json$/, '');
                  const d = JSON.parse(fs.readFileSync(path.join(LIBROS_DIR, f), 'utf8'));
                  items.push({
                    id: d.id || slug,
                    title: d.title,
                    abbr: d.abbr,
                    order: d.order ?? BOOK_BY_ID.get(slug)?.order ?? 999,
                    testament: d.testament,
                    status: d.status || 'borrador',
                    updated: d.updated || '',
                    words: palabrasLibro(d)
                  });
                }
              }
              items.sort((a, b) => a.order - b.order);
              return send(res, 200, { items, fuentes });
            }
            if (id && !id.includes('/') && method === 'GET') {
              const file = libroPath(id);
              if (!file || !fs.existsSync(file)) return send(res, 404, { error: 'Ficha de libro no encontrada' });
              const data = JSON.parse(fs.readFileSync(file, 'utf8'));
              const fuentes = readFuentes();
              validate('libro', data, id, { book: BOOK_BY_ID.get(id), fuentes: new Set(Object.keys(fuentes)) });
              return send(res, 200, { data, fuentes });
            }
            if (id && !id.includes('/') && method === 'POST') {
              const file = libroPath(id);
              if (!file) return send(res, 400, { error: 'Libro inválido' });
              const data = JSON.parse(await readBody(req));
              const fuentes = readFuentes();
              try {
                validate('libro', data, id, { book: BOOK_BY_ID.get(id), fuentes: new Set(Object.keys(fuentes)) });
              } catch (e) {
                return send(res, 400, { error: e.message });
              }
              if (fs.existsSync(file)) backupFile(file);
              writeJson(file, data);
              writeIndexes(CONTENT);
              return send(res, 200, { ok: true, data });
            }
          }

          // --- traducciones de trabajo ---
          if (p === '/trad' || p.startsWith('/trad/')) {
            const id = p === '/trad' ? '' : p.slice('/trad/'.length);
            if (p === '/trad' && method === 'GET') {
              const items = [];
              if (fs.existsSync(TRAD_DIR)) {
                for (const f of fs.readdirSync(TRAD_DIR)) {
                  if (!f.endsWith('.json')) continue;
                  const slug = f.replace(/\.json$/, '');
                  const d = JSON.parse(fs.readFileSync(path.join(TRAD_DIR, f), 'utf8'));
                  const chapters = (d.chapters || []).length;
                  const verses = (d.chapters || []).reduce((n, c) => n + (c.verses?.length || 0), 0);
                  items.push({
                    id: d.id || slug,
                    name: d.name || BOOK_BY_ID.get(slug)?.name || slug,
                    abbr: d.abbr || BOOK_BY_ID.get(slug)?.abbr || '',
                    order: BOOK_BY_ID.get(slug)?.order ?? 999,
                    status: d.status || 'borrador',
                    scope: d.scope || '',
                    chapters,
                    verses
                  });
                }
              }
              items.sort((a, b) => a.order - b.order);
              return send(res, 200, { items });
            }
            if (id && !id.includes('/') && SLUG_RE.test(id)) {
              const tradFile = safeChild(TRAD_DIR, `${id}.json`);
              if (!tradFile || !fs.existsSync(tradFile)) return send(res, 404, { error: 'Traducción no encontrada' });
              if (method === 'GET') {
                const trad = JSON.parse(fs.readFileSync(tradFile, 'utf8'));
                const codexFile = safeChild(CODEX_DIR, `${id}.json`);
                const codex = codexFile && fs.existsSync(codexFile) ? JSON.parse(fs.readFileSync(codexFile, 'utf8')) : null;
                return send(res, 200, { trad, codex });
              }
              if (method === 'POST') {
                const payload = JSON.parse(await readBody(req));
                const nextTrad = payload.trad || payload;
                if (nextTrad.id !== id) return send(res, 400, { error: 'El id no coincide con la ruta' });
                if (!TRAD_STATUSES.has(nextTrad.status)) {
                  return send(res, 400, { error: 'status debe ser borrador o revisado' });
                }
                const backup = backupFile(tradFile);
                try {
                  writeJson(tradFile, nextTrad);
                  runNodeScript('scripts/build-trad.mjs');
                  runNodeScript('scripts/build-exegesis-index.mjs');
                } catch (e) {
                  // Revertir al instante si build-trad rechaza alguna edición.
                  if (fs.existsSync(backup)) fs.copyFileSync(backup, tradFile);
                  return send(res, 400, { error: e.message });
                }
                return send(res, 200, { ok: true, trad: nextTrad });
              }
            }
          }

          // --- personajes ---
          if (p.startsWith('/personajes')) {
            const slug = p.split('/').pop();
            if (p === '/personajes' && method === 'GET') {
              ensureDir(PERSONAJES_DIR);
              const files = fs.readdirSync(PERSONAJES_DIR).filter(f => f.endsWith('.json'));
              const list = files.map(f => JSON.parse(fs.readFileSync(path.join(PERSONAJES_DIR, f), 'utf8')));
              return send(res, 200, { items: list });
            }
            if (slug && method === 'GET') {
              const file = personajePath(slug);
              if (!file || !fs.existsSync(file)) return send(res, 404, { error: 'No existe' });
              const data = JSON.parse(fs.readFileSync(file, 'utf8'));
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
              writeIndexes(CONTENT);
              return send(res, 200, { ok: true });
            }
            if (slug && method === 'DELETE') {
              const file = personajePath(slug);
              if (file && fs.existsSync(file)) {
                backupFile(file);
                fs.unlinkSync(file);
              }
              writeIndexes(CONTENT);
              return send(res, 200, { ok: true });
            }
          }

          // --- media usage ---
          if (p === '/media/usage' && method === 'GET') {
            const rel = url.searchParams.get('path') || '';
            if (!rel) return send(res, 400, { error: 'path requerido' });
            const refs = findImageUsage(rel);
            return send(res, 200, { count: refs.length, refs });
          }

          // --- media library ---
          if (p === '/media') {
            ensureDir(PUBLIC_IMG);
            if (method === 'GET') {
              return send(res, 200, { items: walkImages(PUBLIC_IMG) });
            }
            if (method === 'POST') {
              const ct = req.headers['content-type'] || '';
              const m = ct.match(/boundary=([^;]+)/);
              if (!m) return send(res, 400, { error: 'Content-Type multipart requerido' });
              const rawFolder = (url.searchParams.get('folder') || '').replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
              if (rawFolder.includes('..') || !FOLDER_RE.test(rawFolder)) {
                return send(res, 400, { error: 'Subcarpeta inválida' });
              }
              const targetDir = rawFolder ? safeChild(PUBLIC_IMG, rawFolder) : PUBLIC_IMG;
              if (!targetDir) return send(res, 400, { error: 'Ruta de carpeta inválida' });
              ensureDir(targetDir);

              const raw = await readRaw(req);
              const files = parseMultipart(raw, m[1]);
              if (!files.length) return send(res, 400, { error: 'Sin archivo' });
              const file = files[0];
              const ext = path.extname(file.filename).toLowerCase();
              if (!['.webp', '.png', '.jpg', '.jpeg', '.svg', '.gif'].includes(ext)) {
                return send(res, 400, { error: 'Extensión no permitida' });
              }
              const baseName = path.basename(file.filename, ext).replace(/[^a-z0-9._-]/gi, '-').toLowerCase() || 'imagen';
              const wantWebp = url.searchParams.get('webp') !== '0';
              let finalName = `${baseName}${ext}`;
              let outBuf = file.content;
              let converted = false;

              if (wantWebp && ['.png', '.jpg', '.jpeg'].includes(ext)) {
                const { default: sharp } = await import('sharp');
                outBuf = await sharp(file.content).webp({ quality: 86 }).toBuffer();
                finalName = `${baseName}.webp`;
                converted = true;
              }

              const dest = safeChild(targetDir, finalName);
              if (!dest) return send(res, 400, { error: 'Nombre de archivo inválido' });
              if (fs.existsSync(dest)) backupFile(dest);
              fs.writeFileSync(dest, outBuf);
              const relName = rawFolder ? `${rawFolder}/${finalName}` : finalName;
              return send(res, 200, { ok: true, url: `/img/${relName}`, name: relName, converted });
            }
          }
          if (p === '/media' && method === 'DELETE') {
            const rel = url.searchParams.get('path');
            if (!rel) return send(res, 400, { error: 'path requerido' });
            const file = safeChild(PUBLIC_IMG, rel);
            if (!file || file === PUBLIC_IMG) return send(res, 400, { error: 'Ruta inválida' });
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
            const items = fs
              .readdirSync(HISTORY, { withFileTypes: true })
              .filter(d => d.isFile())
              .map(d => d.name)
              .sort()
              .reverse();
            return send(res, 200, { items });
          }
          if (p === '/history/restore' && method === 'POST') {
            const body = JSON.parse(await readBody(req));
            const { file, backup } = body;
            if (!backup) return send(res, 400, { error: 'backup requerido' });
            const src = safeChild(HISTORY, backup);
            if (!src || !fs.existsSync(src)) return send(res, 404, { error: 'Backup no existe' });
            const dest = resolveHistoryDest(backup, file);
            if (!dest) return send(res, 400, { error: 'No se pudo resolver la ruta de destino para este backup' });
            ensureDir(path.dirname(dest));
            if (fs.existsSync(dest)) backupFile(dest);
            fs.copyFileSync(src, dest);
            writeIndexes(CONTENT);
            const restored = path.relative(CONTENT, dest).split(path.sep).join('/');
            return send(res, 200, { ok: true, restored });
          }

          // --- status / diff ---
          if (p === '/status' && method === 'GET') {
            const paths = existingPublishPaths();
            const out = paths.length ? runGit(['status', '--porcelain', '--', ...paths]) : '';
            const changes = out.split('\n').filter(Boolean).map(l => l.trim());
            return send(res, 200, { clean: changes.length === 0, changes });
          }
          if (p === '/diff' && method === 'GET') {
            const paths = existingPublishPaths();
            const out = paths.length ? runGit(['diff', '--', ...paths]) : '';
            return send(res, 200, { diff: out });
          }

          // --- publish ---
          if (p === '/publish' && method === 'POST') {
            try {
              const raw = await readBody(req);
              const body = raw.trim() ? JSON.parse(raw) : {};
              const result = await publishToGitHub(env, body.message);
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
