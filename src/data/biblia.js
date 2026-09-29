// Biblia Patrística: fuente pública /textos/biblia-patristica.md (1.2 MB),
// se trae bajo demanda al abrir /biblia y se pagina por capítulos.

import { assetUrl } from '../lib/assets';

const foldChar = c => {
  const n = c.normalize('NFD');
  return n[0] || c;
};

const fold = s =>
  s
    .toLowerCase()
    .split('')
    .map(foldChar)
    .join('');

const MAX_PAGE = 30000;

const splitAt = (body, re) => {
  const lines = body.split('\n');
  const parts = [];
  let buf = [];
  for (const line of lines) {
    if (re.test(line) && buf.length > 0 && buf.join('\n').length > 0) {
      parts.push(buf.join('\n'));
      buf = [];
    }
    buf.push(line);
  }
  if (buf.length) parts.push(buf.join('\n'));
  return parts.filter(p => p.trim().length > 0);
};

const refine = body => {
  if (body.length <= MAX_PAGE) return [body];
  let parts = splitAt(body, /^### /);
  if (parts.length === 1) parts = [body];
  const out = [];
  for (const part of parts) {
    if (part.length <= MAX_PAGE) {
      out.push(part);
      continue;
    }
    const chapters = splitAt(part, /^\*\*(?:Capítulo|Libro) /);
    for (const ch of chapters.length > 1 ? chapters : [part]) {
      out.push(ch);
    }
  }
  return out;
};

function parse(text) {
  const lines = text.split(/\r?\n/);
  const blocks = [];
  let title = null;
  let buf = [];
  const push = () => {
    if (title !== null) blocks.push({ title, body: buf.join('\n') });
  };
  for (const line of lines) {
    if (line.startsWith('## ')) {
      push();
      title = line.slice(3).trim();
      buf = [line];
    } else if (title !== null) {
      buf.push(line);
    }
  }
  push();

  const chapters = [];
  let current = null;
  for (const block of blocks) {
    const isChapter = /^Parte\s/i.test(block.title);
    if (isChapter) {
      current = { title: block.title, pages: [] };
      chapters.push(current);
      if (block.body.replace(/^#.*\n?/, '').trim().length > 40) {
        current.pages.push({ title: block.title, body: block.body });
      }
    } else {
      if (!current) {
        current = { title: 'Introducción', pages: [] };
        chapters.push(current);
      }
      current.pages.push({ title: block.title, body: block.body });
    }
  }

  const pages = [];
  const seen = new Set();
  for (const chapter of chapters) {
    const expanded = [];
    for (const page of chapter.pages) {
      const pieces = refine(page.body);
      if (pieces.length === 1) {
        expanded.push(page);
      } else {
        pieces.forEach((body, i) => {
          const firstHeading = body.split('\n').find(l => l.startsWith('#'));
          const boldLine = body.split('\n').find(l => /^\*\*(?:Capítulo|Libro) /.test(l));
          const clean = firstHeading
            ? firstHeading.replace(/^#+\s*/, '').trim()
            : boldLine
              ? boldLine.replace(/^\*\*/, '').split('**')[0].trim().slice(0, 100)
              : '';
          expanded.push({
            title: clean ? `${page.title} — ${clean}` : `${page.title} — Parte ${i + 1}`,
            body
          });
        });
      }
    }
    chapter.pages = [];
    for (const page of expanded) {
      let body = page.body;
      const first = body.split('\n', 1)[0];
      if (first.startsWith('#')) body = body.slice(first.length).replace(/^\n/, '');
      const id = `p${pages.length}`;
      const record = {
        id,
        chapter: chapter.title,
        title: page.title,
        body,
        folded: fold(`${page.title} ${body}`)
      };
      pages.push(record);
      chapter.pages.push(id);
      seen.add(id);
    }
  }

  const docTitle = (lines[0] || '').replace(/^#\s*/, '').trim();
  return { title: docTitle, chapters, pages };
}

let cache = null;

export function loadBiblia() {
  if (cache) return cache;
  cache = fetch(assetUrl('/textos/biblia-patristica.md'))
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.text();
    })
    .then(parse)
    .catch(err => {
      cache = null;
      throw err;
    });
  return cache;
}

export function searchBiblia(book, rawQuery, limit = 24) {
  const q = fold(rawQuery.trim());
  if (q.length < 2) return [];
  const out = [];
  for (const page of book.pages) {
    const at = page.folded.indexOf(q);
    if (at < 0) continue;
    const off = fold(page.title).length + 1;
    const bodyAt = page.folded.indexOf(q, off);
    let snippet = { before: '', hit: '', after: '' };
    if (bodyAt >= 0) {
      const rel = bodyAt - off;
      const start = Math.max(0, rel - 70);
      const end = Math.min(page.body.length, rel + q.length + 110);
      const slice = page.body.slice(start, end);
      const relIn = rel - start;
      snippet = {
        before: (start > 0 ? '…' : '') + slice.slice(0, relIn),
        hit: slice.slice(relIn, relIn + q.length),
        after: slice.slice(relIn + q.length) + (end < page.body.length ? '…' : '')
      };
    } else {
      const inTitle = fold(page.title).indexOf(q);
      if (inTitle >= 0) {
        const start = Math.max(0, inTitle - 40);
        const slice = page.title.slice(start);
        const rel = inTitle - start;
        snippet = {
          before: slice.slice(0, rel),
          hit: slice.slice(rel, rel + q.length),
          after: slice.slice(rel + q.length)
        };
      }
    }
    out.push({ page, snippet });
    if (out.length >= limit) break;
  }
  return out;
}

export default loadBiblia;
