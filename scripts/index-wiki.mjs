/**
 * Genera src/data/estudios.js a partir del segundo cerebro bíblico.
 *
 *   npm run index:wiki
 *
 * Fuente de verdad: D:\Biblia\SegundoCerebroBiblico\wiki
 *   - carpetas (01-fundamentos … 10-apocalipsis)  -> categorías
 *   - wiki/_index.md                              -> descripciones del índice
 *   - frontmatter de cada .md                     -> título, pasaje, tags, aliases
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WIKI = 'D:/Biblia/SegundoCerebroBiblico/wiki';
const OUT = path.resolve(__dirname, '../src/data/estudios.js');

export const CATEGORIES = [
  { id: '01-fundamentos', label: 'Fundamentos', short: 'Doctrina fundamental desde la NTV' },
  { id: '02-libros-biblicos', label: 'Libros bíblicos', short: 'Un estudio por cada libro' },
  { id: '03-personajes', label: 'Personajes', short: 'Vidas de la Biblia con contexto' },
  { id: '04-doctrinas', label: 'Doctrinas', short: 'Sistematización bíblica' },
  { id: '05-estudios', label: 'Estudios temáticos', short: 'Planes de estudio prácticos' },
  { id: '06-apologetica', label: 'Apologética', short: 'Defensa de la fe y sectas' },
  { id: '07-herramientas', label: 'Herramientas', short: 'Métodos y guías de estudio' },
  { id: '08-recursos', label: 'Recursos', short: 'Bibliotecas y materiales' },
  { id: '09-parabolas', label: 'Parábolas', short: 'Las parábolas de Jesús, una a una' },
  { id: '10-apocalipsis', label: 'Apocalipsis', short: 'El último libro, sección por sección' }
];

const SKIP_FILES = new Set(['_index.md', '_log.md', '_meta.md']);

// --- Reparación de mojibake -------------------------------------------------
// Algunos .md del wiki fueron guardados leyendo UTF-8 como CP1252
// ("ó" -> "Ã³"). Reparamos en lectura sin tocar los archivos de D:\Biblia.

const MOJI_RE =
  /[\u00C0-\u00FF][\u0080-\u009F\u00A0-\u00BF\u0152\u0153\u0160\u0161\u0178\u017D\u017E\u0192\u02C6\u02DC\u2013\u2014\u2018\u2019\u201A\u201C\u201D\u201E\u2020\u2021\u2022\u2026\u2030\u2039\u203A\u20AC\u2122]/;

const CP1252_BYTE_FOR_CHAR = (() => {
  const m = new Map();
  for (let b = 0x20; b <= 0x7e; b++) m.set(b, b);
  for (let b = 0xa0; b <= 0xff; b++) m.set(b, b);
  const specials = {
    0x80: 0x20ac, 0x82: 0x201a, 0x83: 0x0192, 0x84: 0x201e, 0x85: 0x2026,
    0x86: 0x2020, 0x87: 0x2021, 0x88: 0x02c6, 0x89: 0x2030, 0x8a: 0x0160,
    0x8b: 0x2039, 0x8c: 0x0152, 0x8e: 0x017d, 0x91: 0x2018, 0x92: 0x2019,
    0x93: 0x201c, 0x94: 0x201d, 0x95: 0x2022, 0x96: 0x2013, 0x97: 0x2014,
    0x98: 0x02dc, 0x99: 0x2122, 0x9a: 0x0161, 0x9b: 0x203a, 0x9c: 0x0153,
    0x9e: 0x017e, 0x9f: 0x0178
  };
  for (const [byte, code] of Object.entries(specials)) m.set(code, +byte);
  // Bytes sin asignar en CP1252 (81, 8D, 8F, 90, 9D): identidad.
  for (const b of [0x81, 0x8d, 0x8f, 0x90, 0x9d]) m.set(b, b);
  return m;
})();

const utf8Strict = new TextDecoder('utf-8', { fatal: true });

function encodeCp1252(s) {
  const out = [];
  for (const ch of s) {
    const b = CP1252_BYTE_FOR_CHAR.get(ch.codePointAt(0));
    if (b === undefined) return null;
    out.push(b);
  }
  return Uint8Array.from(out);
}

function decodeUtf8(bytes) {
  try {
    return utf8Strict.decode(bytes);
  } catch {
    return null;
  }
}

export function repairMojibake(text) {
  if (!MOJI_RE.test(text)) return text;
  const whole = encodeCp1252(text);
  if (whole) {
    const dec = decodeUtf8(whole);
    if (dec !== null && !MOJI_RE.test(dec)) return dec;
  }
  // Mezcla (archivos con partes bien codificadas): reparamos token a token.
  return text
    .split(/(\s+)/)
    .map(tok => {
      if (!MOJI_RE.test(tok)) return tok;
      const bytes = encodeCp1252(tok);
      if (!bytes) return tok;
      const dec = decodeUtf8(bytes);
      return dec !== null && !MOJI_RE.test(dec) ? dec : tok;
    })
    .join('');
}

export function readText(file) {
  const buf = fs.readFileSync(file);
  let text = buf.toString('utf8');
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  return repairMojibake(text);
}

export function parseFrontmatter(text) {
  const out = { tags: [], aliases: [], pasaje: '', created: '', updated: '' };
  if (!text.startsWith('---')) return out;
  const end = text.indexOf('\n---', 3);
  if (end < 0) return out;
  const block = text.slice(3, end);
  let key = null;
  let nested = null;
  for (const raw of block.split(/\r?\n/)) {
    if (!raw.trim()) continue;
    const list = raw.match(/^\s+-\s+(.*)$/);
    const kv = raw.match(/^([\w-]+):\s*(.*)$/);
    const nkv = raw.match(/^\s+([\w_]+):\s*(.*)$/);
    if (list && key) {
      out[key] = out[key] || [];
      if (Array.isArray(out[key])) out[key].push(list[1].replace(/^["']|["']$/g, ''));
      continue;
    }
    if (kv && !raw.startsWith(' ')) {
      key = kv[1];
      nested = null;
      const val = kv[2].trim();
      if (val && val !== '[]') out[key] = val.replace(/^["']|["']$/g, '');
      else if (val === '[]') out[key] = [];
      continue;
    }
    if (nkv) {
      if (key === 'biblico') {
        if (nkv[1] === 'pasaje_clave') out.pasaje = nkv[2].trim().replace(/^["']|["']$/g, '');
      } else if (key && typeof out[key] === 'object' && !Array.isArray(out[key])) {
        out[key][nkv[1]] = nkv[2].trim();
      }
      nested = nkv[1];
      continue;
    }
    void nested;
  }
  if (!Array.isArray(out.tags)) out.tags = [];
  if (!Array.isArray(out.aliases)) out.aliases = [];
  return out;
}

export function titleFrom(text, fallback) {
  const m = text.match(/^#\s+(.+)$/m);
  if (!m) return fallback;
  return m[1].trim().replace(/^\d+[\.\)]\s*/, '');
}

export function descriptionFrom(text) {
  const lines = text.split(/\r?\n/);
  let started = false;
  const buf = [];
  for (const line of lines) {
    if (!started) {
      if (/^#\s+/.test(line)) started = true;
      continue;
    }
    const t = line.trim();
    if (!t) {
      if (buf.length) break;
      continue;
    }
    if (/^(#|>|\||---|!\[|\[\[)/.test(t)) {
      if (buf.length) break;
      continue;
    }
    buf.push(t);
    if (buf.join(' ').length > 240) break;
  }
  return buf
    .join(' ')
    .replace(/\*\*?|__|`|==/g, '')
    .replace(/\[\[([^\]|]+)\|?([^\]]*)\]\]/g, (_, a, b) => b || a)
    .replace(/\s+/g, ' ')
    .trim();
}

export function truncate(s, n = 190) {
  if (s.length <= n) return s;
  const cut = s.slice(0, n);
  const sp = cut.lastIndexOf(' ');
  return `${cut.slice(0, sp > 80 ? sp : n)}…`;
}

export function slugify(rel) {
  return rel.replace(/\.md$/, '').replace(/[\\/]+/g, '--').toLowerCase();
}

export function titleCase(seg) {
  return seg
    .replace(/^\d+[-_]/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

export function parseIndexDescriptions() {
  const map = new Map();
  const indexFile = path.join(WIKI, '_index.md');
  if (!fs.existsSync(indexFile)) return map;
  for (const line of readText(indexFile).split(/\r?\n/)) {
    const m = line.match(/^\s*(?:→\s*)?\|\s*\[\[([^\]|]+)(?:\|([^\]]+))?\]\][^|]*\|\s*([^|]*)\|/);
    if (!m) continue;
    const rel = m[1].replace(/\\/g, '/').replace(/\.md$/, '');
    const desc = (m[3] || '').trim();
    if (desc && !map.has(rel)) map.set(rel, desc);
  }
  return map;
}

export function walk(dir, base = '') {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const rel = path.posix.join(base, entry.name);
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(abs, rel));
    else if (entry.isFile() && entry.name.endsWith('.md') && !SKIP_FILES.has(entry.name)) out.push(rel);
  }
  return out;
}

function main() {
  if (!fs.existsSync(WIKI)) {
    console.error(`No se encontró el wiki: ${WIKI}`);
    process.exit(1);
  }
  const descriptions = parseIndexDescriptions();
  const studies = [];

  for (const cat of CATEGORIES) {
    const dir = path.join(WIKI, cat.id);
    if (!fs.existsSync(dir)) continue;
    for (const rel of walk(dir)) {
      const abs = path.join(dir, rel);
      // índices internos y stubs vacíos no son estudios
      if (rel === 'index.md' || fs.statSync(abs).size < 400) continue;
      const text = readText(abs);
      const fm = parseFrontmatter(text);
      const fileBase = path.basename(rel, '.md');
      const folderRel = path.posix.join(cat.id, rel);
      const title = titleFrom(text, titleCase(fileBase));
      const desc =
        descriptions.get(folderRel.replace(/\.md$/, '')) ||
        descriptions.get(`${cat.id}/${fileBase}`) ||
        descriptionFrom(text);
      const parts = rel.split('/');
      const sub = parts.length > 1 ? titleCase(parts[0]) : '';
      studies.push({
        slug: slugify(folderRel),
        path: `${cat.id}/${rel}`,
        title,
        category: cat.id,
        categoryLabel: cat.label,
        subcategory: sub,
        description: truncate(desc || 'Estudio del segundo cerebro bíblico.'),
        passage: fm.pasaje || '',
        tags: fm.tags.slice(0, 6),
        aliases: fm.aliases.slice(0, 4),
        updated: fm.updated || fm.created || ''
      });
    }
  }

  studies.sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.path.localeCompare(b.path, 'es', { numeric: true });
  });

  const counts = Object.fromEntries(CATEGORIES.map(c => [c.id, 0]));
  for (const s of studies) counts[s.category] = (counts[s.category] || 0) + 1;
  const categories = CATEGORIES.filter(c => counts[c.id] > 0).map(c => ({ ...c, count: counts[c.id] }));

  const banner =
    '// Generado por scripts/index-wiki.mjs desde D:\\Biblia\\SegundoCerebroBiblico\\wiki\n' +
    '// Vuelve a generar con: npm run index:wiki\n';

  const file = `${banner}
export const STUDY_CATEGORIES = ${JSON.stringify(categories, null, 2)};

export const STUDIES = ${JSON.stringify(studies, null, 2)};

export const studyBySlug = slug => STUDIES.find(s => s.slug === slug);

export default STUDIES;
`;

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, file, 'utf8');
  console.log(`OK → ${path.relative(process.cwd(), OUT)}`);
  console.log(`   ${studies.length} estudios · ${categories.length} categorías`);
  for (const c of categories) console.log(`   ${String(c.count).padStart(3)}  ${c.label}`);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  console.error('Este script ya no genera src/data/estudios.js.');
  console.error('Usa: npm run index:wiki  (scripts/migrate-content.mjs → content/)');
  process.exit(1);
}
