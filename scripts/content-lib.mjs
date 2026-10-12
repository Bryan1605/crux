/**
 * Índice de contenidos: lee content/estudios/*.md y genera content/estudios.json.
 * Lo usan el script de migración y el plugin de Vite (admin).
 * Las categorías se leen de content/categorias.json (editable en /admin).
 */
import fs from 'node:fs';
import path from 'node:path';

import { parseFrontmatter } from '../src/lib/frontmatter.js';
import { fold } from '../src/lib/fold.js';

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

/* -------------------------------------------------------------------------- */
/* Índice de búsqueda (content/busquedas.json)                                */
/* -------------------------------------------------------------------------- */

// Cada entrada guarda un haystack ya plegado (`fold`) para que la búsqueda del
// navegador sea un `includes` sin recalcular acentos. Lo comparten el índice de
// estudios, las fichas de personajes, los concilios/herejías y los videos.

/** Pliega varios textos en un único haystack sin acentos ni mayúsculas. */
const haystack = parts => fold(parts.filter(Boolean).join(' '));

/** Lee un JSON de content/ si existe; si no (o está mal), devuelve el valor por defecto. */
function readJson(contentDir, name, def) {
  const file = path.join(contentDir, `${name}.json`);
  if (!fs.existsSync(file)) return def;
  try {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    return Array.isArray(data) ? data : def;
  } catch {
    return def;
  }
}

export function buildSearchIndex(contentDir, index = buildIndex(contentDir)) {
  const items = [];

  // 1 · Estudios (el grueso del sitio).
  for (const s of index.studies) {
    items.push({
      tipo: 'estudio',
      id: s.slug,
      href: `/estudio/${s.slug}`,
      title: s.title,
      sub: [s.categoryLabel, s.passage].filter(Boolean).join(' · '),
      desc: s.description,
      tags: s.tags,
      fold: haystack([s.title, s.categoryLabel, s.subcategory, s.passage, s.description, ...s.tags, ...s.aliases])
    });
  }

  // 2 · Personajes (ficha propia o el estudio que los cubre).
  const personajesDir = path.join(contentDir, 'personajes');
  if (fs.existsSync(personajesDir)) {
    for (const name of fs.readdirSync(personajesDir).sort()) {
      if (!name.endsWith('.json')) continue;
      let p;
      try {
        p = JSON.parse(fs.readFileSync(path.join(personajesDir, name), 'utf8'));
      } catch {
        continue;
      }
      if (!p || !p.slug) continue;
      items.push({
        tipo: 'personaje',
        id: p.slug,
        href: p.estudio ? `/estudio/${p.estudio}` : `/estudio/personajes/${p.slug}`,
        title: p.nombre || p.slug,
        sub: [p.rol, p.epoca].filter(Boolean).join(' · '),
        desc: p.resumen || '',
        tags: Array.isArray(p.tags) ? p.tags : [],
        fold: haystack([p.nombre, p.rol, p.epoca, p.resumen, ...(p.tags || []), ...(p.bio || [])])
      });
    }
  }

  // 3 · Concilios y herejías (enlazan a su ancla en /concilios).
  for (const c of readJson(contentDir, 'concilios', [])) {
    if (!c || !c.id) continue;
    const esConcilio = c.tipo === 'concilio';
    items.push({
      tipo: esConcilio ? 'concilio' : 'herejia',
      id: c.id,
      href: `/concilios#${c.id}`,
      title: c.nombre || c.id,
      sub: esConcilio ? c.anio_label || '' : c.contexto || '',
      desc: c.resumen || '',
      tags: esConcilio && Array.isArray(c.decisiones) ? c.decisiones : [],
      fold: haystack([c.nombre, c.anio_label, c.convocante, c.contexto, c.resumen, ...(c.decisiones || [])])
    });
  }

  // 4 · Videos (vacío hasta que se llene content/videos.json).
  for (const v of readJson(contentDir, 'videos', [])) {
    if (!v || !v.id) continue;
    items.push({
      tipo: 'video',
      id: v.id,
      href: `/videos#${v.id}`,
      title: v.title || v.id,
      sub: v.date || '',
      desc: v.description || '',
      tags: [],
      fold: haystack([v.title, v.description, v.date])
    });
  }

  const tipos = items.reduce((acc, it) => {
    acc[it.tipo] = (acc[it.tipo] || 0) + 1;
    return acc;
  }, {});

  return { v: 1, tipos, items };
}

export function writeSearchIndex(contentDir, index) {
  const search = buildSearchIndex(contentDir, index);
  fs.writeFileSync(path.join(contentDir, 'busquedas.json'), `${JSON.stringify(search, null, 2)}\n`, 'utf8');
  return search;
}

/** Regenera `estudios.json` y `busquedas.json` en una sola pasada. */
export function writeIndexes(contentDir) {
  const index = writeIndex(contentDir);
  writeSearchIndex(contentDir, index);
  return index;
}