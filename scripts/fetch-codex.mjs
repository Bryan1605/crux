/**
 * Descarga la Biblia del Codex Sinaiticus (transcripción diplomática con
 * aparato crítico) y genera los JSON de la vista de exégesis.
 *
 *   node scripts/fetch-codex.mjs [--refresh] [--metadata]
 *
 * Fuente: el visor del Codex Sinaiticus Project
 *   https://www.codexsinaiticus.org/
 * Cuya transcripción se sirve por páginas (cuaderno + folio + cara):
 *   handler/getFolioList.ashx?q=<cuaderno>
 *   handler/transcription.ashx?q=<cuaderno>&f=<folio>&s=<cara>&type=1
 *
 * Las respuestas crudas se cachean en `src/assets/texts/.cache-codex/`
 * (ignorada por git) para que el build sea determinista y repetible sin red.
 * Salida: `public/textos/exegesis/codex/<libro>.json`.
 *
 * `--metadata` intenta además descargar la ficha de cada capítulo (cuaderno,
 * folio, biblioteca y escriba); sin red, los capítulos que ya tienen su ficha
 * en caché la conservan y los demás se generan sin esos datos.
 *
 * Licencia: el Codex Sinaiticus Project permite el uso personal, educativo y no
 * comercial con atribución. Se acredita a las instituciones propietarias en
 * `public/textos/exegesis/index.json`.
 */
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { CODEX_BOOKS } from '../src/data/exegesis.js';
import { parseCodexFolio, parseManuscriptPage } from './exegesis-lib.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = path.join(ROOT, 'src/assets/texts/.cache-codex');
const OUT = path.join(ROOT, 'public/textos/exegesis/codex');
const BASE = 'https://www.codexsinaiticus.org';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';
const REFRESH = process.argv.includes('--refresh');
const ONLINE_METADATA = process.argv.includes('--metadata');
const MAX_QUIRE = 100;
const CONCURRENCY = 4;

let network = 0;
const sleep = ms => new Promise(r => setTimeout(r, ms));

/** Descarga con caché en disco y reintentos. */
async function fetchCached(name, url) {
  const file = path.join(CACHE, name);
  if (!REFRESH) {
    try {
      return await readFile(file, 'utf8');
    } catch { /* sin caché */ }
  }
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'text/html,*/*' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      await writeFile(file, text, 'utf8');
      network += 1;
      await sleep(80);
      return text;
    } catch (err) {
      if (attempt === 3) throw new Error(`${url} → ${err.message}`);
      await sleep(400 * attempt);
    }
  }
  return '';
}

/** Lee una respuesta de la caché sin salir a la red. */
async function readCached(name) {
  try {
    return await readFile(path.join(CACHE, name), 'utf8');
  } catch {
    return null;
  }
}

/** Ejecuta tareas con un tope de concurrencia, en orden de array. */
async function pool(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;
  const run = async () => {
    while (next < items.length) {
      const i = next;
      next += 1;
      results[i] = await worker(items[i], i);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

await mkdir(CACHE, { recursive: true });

/* -------------------------------------------------------------------------- */
/* 1) Cuadernos y folios                                                      */
/* -------------------------------------------------------------------------- */

const quireNumbers = [];
for (let q = 0; q <= MAX_QUIRE; q += 1) {
  const html = await fetchCached(`quire-${q}.html`, `${BASE}/handler/getFolioList.ashx?q=${q}`);
  const folios = [...html.matchAll(/<option value="(\d+)"/g)].map(m => Number(m[1]));
  if (folios.length) quireNumbers.push({ q, folios });
}
console.log(`Cuadernos con contenido: ${quireNumbers.length} (${quireNumbers.map(x => x.q).join(', ')})`);

/* -------------------------------------------------------------------------- */
/* 2) Transcripción página a página                                           */
/* -------------------------------------------------------------------------- */

const tasks = [];
for (const { q, folios } of quireNumbers) {
  for (const f of folios) {
    for (const s of ['r', 'v']) tasks.push({ q, f, s });
  }
}
// Orden de lectura explícito: los folios llegan del visor y no se da por hecho
// que ya vengan ordenados.
tasks.sort((a, b) => a.q - b.q || a.f - b.f || (a.s === b.s ? 0 : a.s === 'r' ? -1 : 1));

/** (libro, capítulo, versículo) → { text, apparatus, pages[] } */
const verses = new Map();
const pageResults = new Array(tasks.length);

await pool(tasks, CONCURRENCY, async ({ q, f, s }, i) => {
  const html = await fetchCached(`t-${q}-${f}${s}.html`, `${BASE}/handler/transcription.ashx?q=${q}&f=${f}&s=${s}&type=1`);
  pageResults[i] = parseCodexFolio(html);
  if ((i + 1) % 50 === 0) console.log(`  ${i + 1}/${tasks.length} páginas (${network} descargas nuevas)`);
});

// Se fusionan las páginas en orden de lectura (cuaderno, folio, cara), no en el
// orden en que termina la descarga: si no, un versículo partido entre dos caras
// podía recomponerse al revés.
for (let i = 0; i < pageResults.length; i += 1) {
  const { q, f, s } = tasks[i];
  const page = `${q}.${f}${s}`;
  for (const v of pageResults[i] || []) {
    const key = `${v.bookId}.${v.chapter}.${v.verse}`;
    const prev = verses.get(key);
    if (!prev) {
      verses.set(key, { bookId: v.bookId, chapter: v.chapter, verse: v.verse, texts: [{ page, grc: v.grc }], apparatus: v.apparatus });
    } else {
      prev.apparatus.push(...v.apparatus);
      const last = prev.texts[prev.texts.length - 1];
      if (last.grc === v.grc) continue; // misma cara repetida
      // Un versículo partido entre dos caras se reconstruye concatenando los
      // trozos en orden de lectura, sin repetir el solape final/inicial.
      if (last.grc.endsWith(v.grc) || v.grc.startsWith(last.grc)) {
        if (v.grc.length > last.grc.length) last.grc = v.grc;
      } else if (last.grc.includes(v.grc)) {
        /* ya contenido */
      } else {
        prev.texts.push({ page, grc: v.grc });
      }
    }
  }
}

console.log(`Páginas leídas: ${tasks.length} · versículos únicos: ${verses.size}`);

/* -------------------------------------------------------------------------- */
/* 3) Metadatos por capítulo (cuaderno, folio absoluto, biblioteca, escriba)   */
/* -------------------------------------------------------------------------- */

const byBook = new Map();
for (const v of verses.values()) {
  if (!byBook.has(v.bookId)) byBook.set(v.bookId, new Map());
  const chapters = byBook.get(v.bookId);
  if (!chapters.has(v.chapter)) chapters.set(v.chapter, []);
  chapters.get(v.chapter).push(v);
}

const chapterTasks = [];
for (const meta of CODEX_BOOKS) {
  if (!byBook.has(meta.id)) continue;
  for (const ch of [...byBook.get(meta.id).keys()].sort((a, b) => a - b)) {
    chapterTasks.push({ meta, ch });
  }
}

const chapterMeta = new Map();
await pool(chapterTasks, CONCURRENCY, async ({ meta, ch }, i) => {
  const name = `m-${meta.codexNo}-${ch}.html`;
  let html = await readCached(name);
  if (!html && ONLINE_METADATA) {
    try {
      html = await fetchCached(name, `${BASE}/en/manuscript.aspx?book=${meta.codexNo}&chapter=${ch}&verse=1`);
    } catch {
      html = '';
    }
  }
  chapterMeta.set(`${meta.id}.${ch}`, html ? parseManuscriptPage(html) : {});
  if ((i + 1) % 50 === 0) console.log(`  metadatos ${i + 1}/${chapterTasks.length}`);
});

/* -------------------------------------------------------------------------- */
/* 4) Escritura de los JSON por libro                                          */
/* -------------------------------------------------------------------------- */

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

const summary = [];
for (const meta of CODEX_BOOKS) {
  const chapters = byBook.get(meta.id);
  if (!chapters) continue;

  const outChapters = [];
  for (const num of [...chapters.keys()].sort((a, b) => a - b)) {
    const list = chapters.get(num).sort((a, b) => a.verse - b.verse);
    const m = chapterMeta.get(`${meta.id}.${num}`) || {};
    outChapters.push({
      num,
      folio: m.folioNumber ? Number(m.folioNumber) : null,
      quire: m.quire ?? null,
      side: m.side ?? null,
      library: m.library ?? null,
      scribe: m.scribe ?? null,
      verses: list.map(v => ({
        n: v.verse,
        grc: v.texts.map(t => t.grc).join(' ').replace(/\s+/g, ' ').trim(),
        pages: v.texts.map(t => t.page),
        apparatus: v.apparatus
      }))
    });
  }

  const payload = {
    id: meta.id,
    name: meta.name,
    abbr: meta.abbr,
    order: meta.order,
    codexNo: meta.codexNo,
    chapters: outChapters
  };
  await writeFile(path.join(OUT, `${meta.id}.json`), JSON.stringify(payload) + '\n', 'utf8');
  const nv = outChapters.reduce((a, c) => a + c.verses.length, 0);
  const na = outChapters.reduce((a, c) => a + c.verses.reduce((x, v) => x + v.apparatus.length, 0), 0);
  summary.push({ id: meta.id, name: meta.name, chapters: outChapters.length, verses: nv, apparatus: na });
}

console.log('\nCodex — libros presentes:');
for (const s of summary) console.log(`  ${s.name}: ${s.chapters} cap. · ${s.verses} vers. · ${s.apparatus} variantes`);
console.log(`Total: ${summary.reduce((a, s) => a + s.verses, 0)} versículos · ${summary.reduce((a, s) => a + s.apparatus, 0)} variantes`);
console.log(`Descargas nuevas: ${network}`);
