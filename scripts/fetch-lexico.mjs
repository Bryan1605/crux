/**
 * Descarga las fuentes del diccionario griego y las cachea en disco.
 *
 *   node scripts/fetch-lexico.mjs [--refresh]
 *
 * Fuentes (todas abiertas y con atribución):
 *
 *   - TBESG — STEPBible, «Translators Brief lexicon of Extended Strongs for
 *     Greek» (CC BY 4.0), basado en Abbott-Smith (1922, dominio público).
 *   - MorphGNT — lematización y morfología del SBLGNT (CC BY-SA 3.0). Solo se
 *     usan las columnas de análisis; el texto SBLGNT no se redistribuye.
 *
 * La caché (`src/assets/texts/.cache-lexico/`) está ignorada por git: los JSON
 * derivados que se publican sí se versionan, así que el build no necesita red.
 */
import { writeFile, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';

import { CACHE, ROOT, MORPHGNT_FILES } from './lexico-files.mjs';

const MORPH = path.join(CACHE, 'morphgnt');
const REFRESH = process.argv.includes('--refresh');
const UA = 'crux-lexico/1.0 (https://github.com/Bryan1605/crux)';

const TBESG_FILE = 'tbesg.txt';
const TBESG_URL =
  'https://raw.githubusercontent.com/STEPBible/STEPBible-Data/master/Lexicons/' +
  'TBESG%20-%20Translators%20Brief%20lexicon%20of%20Extended%20Strongs%20for%20Greek%20-%20STEPBible.org%20CC%20BY.txt';
const MORPH_URL = name =>
  `https://raw.githubusercontent.com/morphgnt/sblgnt/master/${name}`;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function download(file, url) {
  const target = path.join(CACHE, file);
  if (!REFRESH) {
    try {
      const info = await stat(target);
      if (info.size > 0) return { file, bytes: info.size, cached: true };
    } catch {
      /* sin caché */
    }
  }
  await mkdir(path.dirname(target), { recursive: true });
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      if (!text || text.length < 100) throw new Error('respuesta vacía');
      await writeFile(target, text, 'utf8');
      return { file, bytes: text.length, cached: false };
    } catch (err) {
      if (attempt === 4) throw new Error(`${url} → ${err.message}`);
      await sleep(500 * attempt);
    }
  }
  return null;
}

await mkdir(MORPH, { recursive: true });

const tasks = [
  download(TBESG_FILE, TBESG_URL),
  ...MORPHGNT_FILES.map(([name]) => download(`morphgnt/${name}`, MORPH_URL(name)))
];

const results = await Promise.all(tasks);
let bytes = 0;
let fresh = 0;
for (const r of results) {
  bytes += r.bytes;
  if (!r.cached) fresh += 1;
}
console.log(`Léxico: ${results.length} ficheros · ${(bytes / 1024 / 1024).toFixed(1)} MB · ${fresh} descargas nuevas`);
console.log(`Caché: ${path.relative(ROOT, CACHE)}`);
