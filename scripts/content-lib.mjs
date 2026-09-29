/**
 * Índice de contenidos: lee content/estudios/*.md y genera content/estudios.json.
 * Lo usan el script de migración y el plugin de Vite (admin).
 */
import fs from 'node:fs';
import path from 'node:path';

import { parseFrontmatter } from '../src/lib/frontmatter.js';
import { CATEGORIES } from './index-wiki.mjs';

export function buildIndex(contentDir) {
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
        subcategory: data.subcategory || '',
        description: data.description || '',
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
