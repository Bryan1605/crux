/**
 * Descarga las fuentes del Antiguo Testamento hebreo/arameo (OSHB / WLC) y la
 * tipografía Ezra SIL 2.51, y las cachea en disco.
 *
 *   node scripts/fetch-hebreo.mjs [--refresh]
 *
 * Fuentes abiertas verificadas:
 *
 *   - Open Scriptures Hebrew Bible (`openscriptures/morphhb`): texto base del
 *     Westminster Leningrad Codex (WLC, dominio público) y marcado OSIS,
 *     arameo, ketiv/qere y mapa de versificación (`VerseMap.xml`) bajo CC BY 4.0.
 *   - Ezra SIL 2.51 (SIL International): fuente Unicode bíblica hebrea bajo
 *     licencia SIL Open Font License 1.1 (`EzraSIL-2.51-web.zip`).
 *
 * La caché (`src/assets/texts/.cache-hebreo/`) está ignorada por git; la fuente
 * tipográfica (`src/assets/fonts/ezra-sil/`) y los JSON derivados sí se
 * versionan, así que el build no necesita red.
 */
import { writeFile, mkdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateRawSync } from 'node:zlib';

import { HEBREW_BOOKS } from '../src/lib/hebrew.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = path.join(ROOT, 'src', 'assets', 'texts', '.cache-hebreo');
const WLC_DIR = path.join(CACHE, 'wlc');
const FONT_DEST = path.join(ROOT, 'src', 'assets', 'fonts', 'ezra-sil');
const REFRESH = process.argv.includes('--refresh');
const UA = 'crux-hebreo/1.0 (https://github.com/Bryan1605/crux)';

const API_COMMIT = 'https://api.github.com/repos/openscriptures/morphhb/commits/master';
const API_ROOT = 'https://api.github.com/repos/openscriptures/morphhb/contents';
const API_WLC = 'https://api.github.com/repos/openscriptures/morphhb/contents/wlc';
const RAW_BASE = sha => `https://raw.githubusercontent.com/openscriptures/morphhb/${sha}`;
const EZRA_URL = 'https://software.sil.org/downloads/r/ezra/EzraSIL-2.51-web.zip';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry(url, asBuffer = false) {
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (asBuffer) {
        const ab = await res.arrayBuffer();
        if (ab.byteLength < 50) throw new Error('respuesta vacía');
        return Buffer.from(ab);
      }
      const text = await res.text();
      if (!text || text.length < 10) throw new Error('respuesta vacía');
      return text;
    } catch (err) {
      if (attempt === 4) throw new Error(`${url} → ${err.message}`);
      await sleep(500 * attempt);
    }
  }
  return null;
}

async function fetchJson(url) {
  const text = await fetchWithRetry(url, false);
  return JSON.parse(text);
}

async function fileExists(file) {
  try {
    const info = await stat(file);
    return info.size > 0;
  } catch {
    return false;
  }
}

async function downloadFile(target, url, asBuffer = false) {
  if (!REFRESH && (await fileExists(target))) {
    const info = await stat(target);
    return { file: path.relative(CACHE, target), bytes: info.size, cached: true };
  }
  await mkdir(path.dirname(target), { recursive: true });
  const data = await fetchWithRetry(url, asBuffer);
  await writeFile(target, data, asBuffer ? undefined : 'utf8');
  return { file: path.relative(CACHE, target), bytes: data.length, cached: false };
}

/**
 * Lector mínimo de archivos ZIP sobre Buffer usando Central Directory + zlib
 * (sin dependencias externas ni invocación de subprocesos).
 */
function unzipEntries(buf) {
  let eocdOffset = -1;
  const minOffset = Math.max(0, buf.length - 65557);
  for (let i = buf.length - 22; i >= minOffset; i -= 1) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset === -1) throw new Error('ZIP inválido: falta EOCD');

  const totalEntries = buf.readUInt16LE(eocdOffset + 10);
  const cdOffset = buf.readUInt32LE(eocdOffset + 16);
  const entries = new Map();
  let ptr = cdOffset;

  for (let idx = 0; idx < totalEntries; idx += 1) {
    if (buf.readUInt32LE(ptr) !== 0x02014b50) throw new Error('ZIP inválido en Central Directory');
    const method = buf.readUInt16LE(ptr + 10);
    const compSize = buf.readUInt32LE(ptr + 20);
    const nameLen = buf.readUInt16LE(ptr + 28);
    const extraLen = buf.readUInt16LE(ptr + 30);
    const commentLen = buf.readUInt16LE(ptr + 32);
    const localHeaderOffset = buf.readUInt32LE(ptr + 42);
    const name = buf.subarray(ptr + 46, ptr + 46 + nameLen).toString('utf8');
    ptr += 46 + nameLen + extraLen + commentLen;

    if (name.endsWith('/')) continue;
    if (buf.readUInt32LE(localHeaderOffset) !== 0x04034b50) {
      throw new Error(`ZIP inválido en cabecera local de ${name}`);
    }
    const lNameLen = buf.readUInt16LE(localHeaderOffset + 26);
    const lExtraLen = buf.readUInt16LE(localHeaderOffset + 28);
    const dataStart = localHeaderOffset + 30 + lNameLen + lExtraLen;
    const slice = buf.subarray(dataStart, dataStart + compSize);
    if (method === 0) entries.set(name, slice);
    else if (method === 8) entries.set(name, inflateRawSync(slice));
    else throw new Error(`Método de compresión ZIP no soportado (${method}) para ${name}`);
  }
  return entries;
}

await mkdir(WLC_DIR, { recursive: true });
await mkdir(FONT_DEST, { recursive: true });

const metaPath = path.join(CACHE, 'meta.json');
let meta = null;
if (!REFRESH && (await fileExists(metaPath))) {
  try {
    meta = JSON.parse(await readFile(metaPath, 'utf8'));
  } catch {
    meta = null;
  }
}

if (!meta?.sha) {
  const [commit, rootList, wlcList] = await Promise.all([
    fetchJson(API_COMMIT),
    fetchJson(API_ROOT),
    fetchJson(API_WLC)
  ]);

  const wlcFiles = wlcList.filter(e => e.type === 'file').map(e => e.name);
  const rootFiles = rootList.filter(e => e.type === 'file').map(e => e.name);
  const expectedXmls = HEBREW_BOOKS.map(b => `${b.osis}.xml`);
  const missingXmls = expectedXmls.filter(name => !wlcFiles.includes(name));
  if (missingXmls.length > 0) {
    throw new Error(`Faltan XML en openscriptures/morphhb/wlc: ${missingXmls.join(', ')}`);
  }
  if (!wlcFiles.includes('VerseMap.xml')) {
    throw new Error('Falta wlc/VerseMap.xml en openscriptures/morphhb');
  }

  const licenseName = rootFiles.find(n => /^license/i.test(n)) || 'LICENSE.md';
  const readmeName = rootFiles.find(n => /^readme/i.test(n)) || 'README.md';

  meta = {
    repo: 'openscriptures/morphhb',
    sha: commit.sha,
    date: commit.commit?.committer?.date || commit.commit?.author?.date || '',
    message: (commit.commit?.message || '').split('\n')[0],
    licenseFile: licenseName,
    readmeFile: readmeName,
    wlcFiles: wlcFiles.sort(),
    fetchedAt: new Date().toISOString()
  };
  await writeFile(metaPath, `${JSON.stringify(meta, null, 2)}\n`, 'utf8');
}

const rawRoot = RAW_BASE(meta.sha);
const downloads = [
  downloadFile(path.join(CACHE, meta.licenseFile || 'LICENSE.md'), `${rawRoot}/${meta.licenseFile || 'LICENSE.md'}`),
  downloadFile(path.join(CACHE, meta.readmeFile || 'README.md'), `${rawRoot}/${meta.readmeFile || 'README.md'}`),
  downloadFile(path.join(WLC_DIR, 'VerseMap.xml'), `${rawRoot}/wlc/VerseMap.xml`),
  ...HEBREW_BOOKS.map(b =>
    downloadFile(path.join(WLC_DIR, `${b.osis}.xml`), `${rawRoot}/wlc/${b.osis}.xml`)
  ),
  downloadFile(path.join(CACHE, 'EzraSIL-2.51-web.zip'), EZRA_URL, true)
];

const results = [];
for (let i = 0; i < downloads.length; i += 8) {
  const batch = await Promise.all(downloads.slice(i, i + 8));
  results.push(...batch);
}

const fontZipPath = path.join(CACHE, 'EzraSIL-2.51-web.zip');
const fontWoffPath = path.join(FONT_DEST, 'SILEOT.woff');
const fontOflPath = path.join(FONT_DEST, 'OFL.txt');
if (REFRESH || !(await fileExists(fontWoffPath)) || !(await fileExists(fontOflPath))) {
  const zipBuf = await readFile(fontZipPath);
  const entries = unzipEntries(zipBuf);
  const entryNames = [...entries.keys()];
  const woffEntry = entryNames.find(n => /(?:^|\/)SILEOT\.woff$/i.test(n));
  const oflEntry = entryNames.find(n => /(?:^|\/)(?:OFL|Licenses?)\.txt$/i.test(n));
  if (!woffEntry) {
    throw new Error(`No se encontró SILEOT.woff en EzraSIL-2.51-web.zip (${entryNames.join(', ')})`);
  }
  await writeFile(fontWoffPath, entries.get(woffEntry));
  if (oflEntry) await writeFile(fontOflPath, entries.get(oflEntry));
  console.log(`Fuente extraída: ${woffEntry} (${(entries.get(woffEntry).length / 1024).toFixed(1)} KB)`);
  if (oflEntry) console.log(`Licencia fuente: ${oflEntry}`);
}

let bytes = 0;
let fresh = 0;
for (const r of results) {
  bytes += r.bytes;
  if (!r.cached) fresh += 1;
}
console.log(
  `OSHB (${meta.sha.slice(0, 7)}, ${meta.date.slice(0, 10)}): ${results.length} archivos · ` +
    `${(bytes / 1024 / 1024).toFixed(1)} MB · ${fresh} descargas nuevas`
);
console.log(`Caché: ${path.relative(ROOT, CACHE)}`);
