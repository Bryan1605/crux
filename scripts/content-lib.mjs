/**
 * Índice de contenidos: lee content/estudios/*.md y genera content/estudios.json.
 * Lo usan el script de migración y el plugin de Vite (admin).
 * Las categorías se leen de content/categorias.json (editable en /admin).
 */
import fs from 'node:fs';
import path from 'node:path';

import { parseFrontmatter } from '../src/lib/frontmatter.js';

function loadCategorias(contentDir) {
  const file = path.join(contentDir, 'categorias.json');
  if (fs.existsSync(file)) {
    try {
      const raw = fs.readFileSync(file, 'utf8');
      const data = JSON.parse(raw);
      if (Array.isArray(data)) return data.sort((a, b) => a.orden - b.orden);
    } catch {
      // fallback silencioso
    }
  }
  // fallback hardcoded (compatibilidad)
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

export function buildIndex(contentDir) {
  const CATEGORIES = loadCategorias(contentDir);
  const studiesDir = path.join(contentDir, 'estudios');
  const studies = [];
  if (fs.existsSync(studiesDir)) {
    for (const name of fs.readdirSync(studiesDir).sort()) {
      if (!name.endsWith('.md')) continue;
      const raw = fs.readFileSync(path.join(studiesDir, name), 'utf8');
      const { data } = parseFrontmatter(raw);
      const slug = name.replace(/\.md$/, '');
      const cat = CATEGORIES.find(c => c.id === data.category);
      studies.push({
        slug,
        title: data.title || slug,
        category: data.category || 'sin-categoria',
        categoryLabel: cat ? cat.label : data.category || 'Sin categoría',
        categoryShort: cat ? cat.short : '',
        subcategory: data.subcategory || '',
        description: data.description || '',
        portada: data.portada || '',
        passage: data.passage || '',
        tags: Array.isArray(data.tags) ? data.tags : [],
        aliases: Array.isArray(data.aliases) ? data.aliases : [],
        updated: data.updated || ''
      });
    }
  }

  studies.sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.slug.localeCompare(b.slug, 'es', { numeric: true });
  });

  const counts = {};
  for (const s of studies) counts[s.category] = (counts[s.category] || 0) + 1;
  const categories = CATEGORIES.filter(c => counts[c.id] > 0).map(c => ({ ...c, count: counts[c.id] }));

  return { categories, studies };
}

export function writeIndex(contentDir) {
  const index = buildIndex(contentDir);
  const out = path.join(contentDir, 'estudios.json');
  fs.writeFileSync(out, `${JSON.stringify(index, null, 2)}\n`, 'utf8');
  return index;
}