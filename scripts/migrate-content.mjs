/**
 * Migra el wiki → content/ (sistema de edición propio).
 *
 *   npm run index:wiki
 *
 * Genera:
 *   content/estudios/<slug>.md   ficha (frontmatter) + cuerpo completo en Markdown
 *   content/estudios.json        índice (categories + studies) para la web
 *   content/videos.json          parrilla de videos
 *   content/slides.json          banner de portada
 *
 * ATENCIÓN: sobrescribe content/estudios/*.md (pierde ediciones hechas en /admin).
 * La fuente de verdad de este script es el wiki; las ediciones del panel viven
 * en content/ y solo se reescriben ejecutando este script.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { writeIndex } from './content-lib.mjs';
import {
  CATEGORIES,
  descriptionFrom,
  parseFrontmatter,
  parseIndexDescriptions,
  readText,
  slugify,
  titleCase,
  titleFrom,
  truncate,
  walk
} from './index-wiki.mjs';
import { serializeFrontmatter } from '../src/lib/frontmatter.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WIKI = 'D:/Biblia/SegundoCerebroBiblico/wiki';
const ROOT = path.resolve(__dirname, '..');
const CONTENT = path.join(ROOT, 'content');
const SKIP_FILES = new Set(['_index.md', '_log.md', '_meta.md']);

function bodyFromWiki(text) {
  let body = text;
  if (body.startsWith('---')) {
    const end = body.indexOf('\n---', 3);
    if (end >= 0) {
      body = body.slice(end + 4);
      if (body.startsWith('\r')) body = body.slice(1);
      if (body.startsWith('\n')) body = body.slice(1);
    }
  }
  return body;
}

function preprocessBody(body) {
  const out = [];
  for (let line of body.split(/\r?\n/)) {
    const t = line.trim();
    if (t.startsWith('![[')) continue; // embeds del vault no existen en la web
    line = line
      .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, (_, _a, b) => b)
      .replace(/\[\[([^\]]+)\]\]/g, (_, a) => a)
      .replace(/^(\s*>)\s*\[!(\w+)\]\s*(.*)$/, '$1 **$3**');
    out.push(line);
  }
  let joined = out.join('\n');
  // El título vive en el frontmatter: quitamos el H1 inicial si coincide.
  joined = joined.replace(/^#\s+[^\n]+\n+/, '');
  return joined.replace(/\n{4,}/g, '\n\n\n').trim() + '\n';
}

function main() {
  if (!fs.existsSync(WIKI)) {
    console.error(`No se encontró el wiki: ${WIKI}`);
    process.exit(1);
  }

  const descriptions = parseIndexDescriptions();
  const studiesDir = path.join(CONTENT, 'estudios');
  fs.rmSync(studiesDir, { recursive: true, force: true });
  fs.mkdirSync(studiesDir, { recursive: true });

  let count = 0;
  for (const cat of CATEGORIES) {
    const dir = path.join(WIKI, cat.id);
    if (!fs.existsSync(dir)) continue;
    for (const rel of walk(dir)) {
      const abs = path.join(dir, rel);
      if (rel === 'index.md' || fs.statSync(abs).size < 400) continue;
      const text = readText(abs);
      const fm = parseFrontmatter(text);
      const fileBase = path.basename(rel, '.md');
      const folderRel = path.posix.join(cat.id, rel);
      const slug = slugify(folderRel);
      const title = titleFrom(text, titleCase(fileBase));
      const desc =
        descriptions.get(folderRel.replace(/\.md$/, '')) ||
        descriptions.get(`${cat.id}/${fileBase}`) ||
        descriptionFrom(text);
      const parts = rel.split('/');
      const sub = parts.length > 1 ? titleCase(parts[0]) : '';

      const frontmatter = {
        title,
        category: cat.id,
        subcategory: sub,
        description: truncate(desc || 'Estudio del segundo cerebro bíblico.'),
        passage: fm.pasaje || '',
        tags: fm.tags.slice(0, 6),
        aliases: fm.aliases.slice(0, 4),
        updated: fm.updated || fm.created || ''
      };
      const body = preprocessBody(bodyFromWiki(text));
      fs.writeFileSync(path.join(studiesDir, `${slug}.md`), serializeFrontmatter(frontmatter, body), 'utf8');
      count++;
    }
  }

  // Videos y banner (solo se crean si no existen: no pisar ediciones del panel)
  const videosFile = path.join(CONTENT, 'videos.json');
  if (!fs.existsSync(videosFile)) fs.writeFileSync(videosFile, '[]\n', 'utf8');
  const slidesFile = path.join(CONTENT, 'slides.json');
  if (!fs.existsSync(slidesFile)) {
    fs.writeFileSync(slidesFile, `${JSON.stringify([{ image: '/HeroBanner1.jpg', caption: 'Estudios bíblicos', href: '/estudio' }], null, 2)}\n`, 'utf8');
  }

  const index = writeIndex(CONTENT);
  console.log(`OK → content/estudios/*.md (${count} archivos)`);
  console.log(`   content/estudios.json → ${index.studies.length} estudios · ${index.categories.length} categorías`);
  console.log('   ATENCIÓN: esto sobrescribe las ediciones hechas en /admin sobre los .md');
}

main();
