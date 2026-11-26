/**
 * Descarga el léxico abierto de hebreo/arameo bíblico (TBESH de STEPBible,
 * CC BY 4.0) y lo cachea en `src/assets/texts/.cache-hebreo/tbesh.txt`.
 *
 *   node scripts/fetch-hebreo-lexico.mjs [--refresh]
 */
import { mkdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = path.join(ROOT, 'src', 'assets', 'texts', '.cache-hebreo');
const TBESH_PATH = path.join(CACHE, 'tbesh.txt');
const REFRESH = process.argv.includes('--refresh');
const UA = 'crux-hebreo-lexico/1.0 (https://github.com/Bryan1605/crux)';

const TBESH_URL =
  'https://raw.githubusercontent.com/STEPBible/STEPBible-Data/master/Lexicons/' +
  'TBESH%20-%20Translators%20Brief%20lexicon%20of%20Extended%20Strongs%20for%20Hebrew%20-%20STEPBible.org%20CC%20BY.txt';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

if (!REFRESH) {
  try {
    const info = await stat(TBESH_PATH);
    if (info.size > 0) {
      console.log(`· tbesh.txt en caché (${Math.round(info.size / 1024)} KB)`);
      process.exit(0);
    }
  } catch {
    /* sin caché */
  }
}

await mkdir(CACHE, { recursive: true });
for (let attempt = 1; attempt <= 4; attempt += 1) {
  try {
    const res = await fetch(TBESH_URL, { headers: { 'User-Agent': UA } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    if (!text || text.length < 1000) throw new Error('respuesta inesperadamente pequeña');
    await writeFile(TBESH_PATH, text, 'utf8');
    console.log(`OK  tbesh.txt descargado (${Math.round(Buffer.byteLength(text) / 1024)} KB)`);
    process.exit(0);
  } catch (err) {
    if (attempt === 4) {
      console.error(`FAIL ${TBESH_URL} → ${err.message}`);
      process.exit(1);
    }
    await sleep(600 * attempt);
  }
}
