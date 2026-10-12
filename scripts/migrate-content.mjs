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
 *   content/categorias.json      categorías (se crea si no existe, NO se sobrescribe)
 *
 * SEGURIDAD: por defecto NO sobrescribe content/estudios/*.md si ya existen.
 * Si hay estudios previos, el script aborta y pide ejecutar con --force.
 * Con --force hace una copia de seguridad en content/.history/ antes de borrar.
 * Esto evita perder por accidente las ediciones hechas en /admin.
 *
 *   npm run index:wiki -- --force   (regenerar desde el wiki, con backup)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { writeIndex } from './content-lib.mjs';
import {
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

// Cargar categorías desde content/categorias.json o usar fallback
function loadCategorias() {
  const file = path.join(CONTENT, 'categorias.json');
  if (fs.existsSync(file)) {
    try {
      const raw = fs.readFileSync(file, 'utf8');
      const data = JSON.parse(raw);
      if (Array.isArray(data)) return data.sort((a, b) => a.orden - b.orden);
    } catch {
      // fallback
    }
  }
  // fallback hardcoded (compatibilidad con index-wiki.mjs)
  return [
    { id: '01-fundamentos', label: 'Fundamentos', short: 'Doctrina fundamental desde la NTV', orden: 1 },
    { id: '02-libros-biblicos', label: 'Libros bíblicos', short: 'Un estudio por cada libro', orden: 2 },
    { id: '03-personajes', label: 'Personajes', short: 'Vidas de la Biblia con contexto', orden: 3 },
    { id: '04-doctrinas', label: 'Doctrinas', short: 'Sistematización bíblica', orden: 4 },
    { id: '05-estudios', label: 'Estudios temáticos', short: 'Planes de estudio prácticos', orden: 5 },
    { id: '06-apologetica', label: 'Apologética', short: 'Defensa de la fe y sectas', orden: 6 },
    { id: '07-herramientas', label: 'Herramientas', short: 'Métodos y guías de estudio', orden: 7 },
    { id: '08-recursos', label: 'Recursos', short: 'Bibliotecas y materiales', orden: 8 },
    { id: '09-parabolas', label: 'Parábolas', short: 'Las parábolas de Jesús, una a una', orden: 9 },
    { id: '10-apocalipsis', label: 'Apocalipsis', short: 'El último libro, sección por sección', orden: 10 }
  ];
}

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
  const FORCE = process.argv.includes('--force');
  const studiesDir = path.join(CONTENT, 'estudios');

  // Sin el wiki disponible, al menos regeneramos el índice desde el Markdown
  // ya existente en content/ (no destructivo).
  if (!fs.existsSync(WIKI)) {
    console.warn(`Aviso: no se encontró el wiki (${WIKI}).`);
    if (fs.existsSync(studiesDir)) {
      const index = writeIndex(CONTENT);
      console.log(`Índice regenerado desde content/estudios/*.md → ${index.studies.length} estudios.`);
      return;
    }
    console.error('No hay wiki ni content/estudios/ para migrar. Nada que hacer.');
    process.exit(1);
  }

  // Guarda: no borrar ediciones del panel sin permiso explícito.
  if (fs.existsSync(studiesDir)) {
    const existing = fs.readdirSync(studiesDir).filter(f => f.endsWith('.md'));
    if (existing.length > 0 && !FORCE) {
      console.error(
        `Se encontraron ${existing.length} estudios en content/estudios/. ` +
          'Este comando los sobrescribiría con la versión del wiki y perderías ' +
          'las ediciones hechas en /admin.\n' +
          'Si de verdad quieres regenerarlos desde el wiki, ejecuta:\n' +
          '  npm run index:wiki -- --force   (se guarda un backup en content/.history/)'
      );
      process.exit(1);
    }
    if (existing.length > 0 && FORCE) {
      const backupDir = path.join(CONTENT, '.history', `estudios-${new Date().toISOString().replace(/[:.]/g, '-')}`);
      fs.mkdirSync(backupDir, { recursive: true });
      for (const f of existing) fs.copyFileSync(path.join(studiesDir, f), path.join(backupDir, f));
      console.log(`Backup de ${existing.length} estudios → ${path.relative(ROOT, backupDir)}`);
    }
  }

  const CATEGORIES = loadCategorias();
  const descriptions = parseIndexDescriptions();
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
  const versiculosFile = path.join(CONTENT, 'versiculos.json');
  if (!fs.existsSync(versiculosFile)) fs.writeFileSync(versiculosFile, '[]\n', 'utf8');
  const anunciosFile = path.join(CONTENT, 'anuncios.json');
  if (!fs.existsSync(anunciosFile)) fs.writeFileSync(anunciosFile, `${JSON.stringify({ enabled: true, dismissable: true, items: [] }, null, 2)}\n`, 'utf8');

  // Categorías: solo crear si no existe (NO sobrescribir ediciones del admin)
  const categoriasFile = path.join(CONTENT, 'categorias.json');
  if (!fs.existsSync(categoriasFile)) {
    fs.writeFileSync(categoriasFile, `${JSON.stringify(CATEGORIES, null, 2)}\n`, 'utf8');
  }

  // site.json: solo crear si no existe
  const siteFile = path.join(CONTENT, 'site.json');
  if (!fs.existsSync(siteFile)) {
    // Se crea por separado (ya existe en content/)
  }

  const index = writeIndex(CONTENT);
  console.log(`OK → content/estudios/*.md (${count} archivos)`);
  console.log(`   content/estudios.json → ${index.studies.length} estudios · ${index.categories.length} categorías`);
  console.log('   ATENCIÓN: esto sobrescribe las ediciones hechas en /admin sobre los .md');
}

main();