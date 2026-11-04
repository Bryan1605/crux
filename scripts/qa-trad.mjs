/**
 * QA de las traducciones de trabajo (libros solo-Codex).
 *
 *   node scripts/qa-trad.mjs             # datos
 *   node scripts/qa-trad.mjs --browser   # datos + lector real (necesita `npm run dev`)
 *
 * Datos: cada `public/textos/exegesis/trad/<id>.json` pasa el validador de
 * `build-trad.mjs`, es idéntico a lo que publicaría su fuente
 * (`src/assets/texts/trad/`) y el índice declara su cobertura.
 *
 * Navegador (`CRUX_BASE`, por defecto http://localhost:5173): el libro abre en
 * Codex × Trad, `?modo=trad` muestra solo la traducción, la etiqueta de borrador
 * y la licencia se ven, el aviso explica la cobertura parcial, el estado vacío
 * de `/biblia/ntv` lleva a la traducción, móvil sin scroll horizontal y sin
 * errores de consola.
 */
import { readFile, readdir, mkdir, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { BOOK_BY_ID } from '../src/data/exegesis.js';
import { TRAD_LABEL, TRAD_LICENSE, publishTrad, validateTrad } from './build-trad.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src/assets/texts/trad');
const DIR = path.join(ROOT, 'public/textos/exegesis');
const BASE = process.env.CRUX_BASE || 'http://localhost:5173';
const OUT = 'C:\\Users\\PC\\AppData\\Local\\Temp\\opencode\\crux';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const WITH_BROWSER = process.argv.includes('--browser');

const readJson = async file => JSON.parse(await readFile(file, 'utf8'));
const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok: Boolean(ok), detail });
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
};

/* -------------------------------------------------------------------------- */
/* 1. Datos                                                                   */
/* -------------------------------------------------------------------------- */

const sources = (await readdir(SRC).catch(() => [])).filter(f => f.endsWith('.json')).sort();
check('Hay al menos una traducción de trabajo', sources.length > 0, sources.join(', '));

const index = await readJson(path.join(DIR, 'index.json'));
const witness = index.witnesses.find(w => w.id === 'trad');
check(
  'El índice declara el testigo «trad» con su licencia y sin decir NTV',
  witness && witness.license?.includes(TRAD_LICENSE) && !/ntv/i.test(witness.name),
  witness ? `${witness.name} · ${witness.license}` : 'sin testigo'
);

const books = [];
for (const file of sources) {
  const id = file.replace(/\.json$/, '');
  const meta = BOOK_BY_ID.get(id);
  const src = await readJson(path.join(SRC, file));
  const codex = await readJson(path.join(DIR, 'codex', `${id}.json`));
  let pub = null;
  try {
    pub = await readJson(path.join(DIR, 'trad', `${id}.json`));
  } catch {
    /* sin publicar */
  }
  check(`${id}: está publicado en public/textos/exegesis/trad/`, Boolean(pub), 'npm run exegesis:trad');
  if (!pub) continue;

  const errors = validateTrad(pub, codex, meta);
  check(`${id}: cobertura, numeración, texto y etiquetas válidos`, errors.length === 0, errors.slice(0, 4).join(' | ') || 'sin errores');
  check(
    `${id}: lo publicado es idéntico a su fuente validada`,
    JSON.stringify(pub) === JSON.stringify(publishTrad(src, meta)),
    'si no, npm run exegesis:trad'
  );
  check(
    `${id}: metadatos del libro coinciden con la tabla canónica`,
    pub.name === meta.name && pub.abbr === meta.abbr && pub.order === meta.order && pub.codexNo === meta.codexNo,
    `${pub.name} · ${pub.abbr} · ${pub.order} · Codex ${pub.codexNo}`
  );
  check(
    `${id}: etiqueta «${TRAD_LABEL}», ${TRAD_LICENSE}, base codex`,
    pub.label === TRAD_LABEL && pub.license === TRAD_LICENSE && pub.base === 'codex',
    `${pub.label} · ${pub.status}`
  );
  check(`${id}: el libro no tiene NTV (la traducción no sustituye a la NTV)`, !meta.ntv, String(meta.ntv));

  const entry = index.books.find(b => b.id === id);
  const chapters = pub.chapters.map(c => c.num);
  const verses = pub.chapters.reduce((a, c) => a + c.verses.length, 0);
  check(
    `${id}: el índice declara su cobertura`,
    entry?.trad && entry.trad.chapters.join() === chapters.join() && entry.trad.verses === verses && entry.trad.status === pub.status,
    entry?.trad ? `caps. ${entry.trad.chapters.join(', ')} · ${entry.trad.verses} vers.` : 'npm run exegesis:index'
  );
  books.push({ id, chapters, name: meta.name });
}

/* -------------------------------------------------------------------------- */
/* 2. Lector real                                                             */
/* -------------------------------------------------------------------------- */

if (WITH_BROWSER && books.length) {
  const { default: puppeteer } = await import('puppeteer-core');
  await mkdir(OUT, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    userDataDir: await mkdtemp(path.join(tmpdir(), 'crux-trad-')),
    args: ['--disable-gpu', '--hide-scrollbars', '--no-first-run']
  });
  const errors = [];
  const page = await browser.newPage();
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => m.type() === 'error' && errors.push(m.text()));
  await page.setViewport({ width: 1280, height: 900 });
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const state = () =>
    page.evaluate(() => ({
      witnesses: [...document.querySelectorAll('.exg-grid__witness')].map(w => w.className.replace('exg-grid__witness exg-grid__witness--', '')),
      trad: document.querySelectorAll('.exg-row__cell--trad .exg-trad').length,
      head: document.querySelector('.exg-grid__witness--trad')?.textContent || '',
      notice: document.querySelector('.exg__notice')?.textContent || '',
      panel: Boolean(document.querySelector('[aria-label="Notas de la traducción de trabajo"]')),
      credits: document.querySelector('.exg__credits')?.textContent || '',
      tradBtn: Boolean(document.querySelector('[aria-label^="Solo la Trad"]')),
      ntvBtn: Boolean(document.querySelector('[aria-label^="Solo la NTV"]')),
      wide: document.documentElement.scrollWidth - document.documentElement.clientWidth
    }));

  for (const book of books) {
    const first = book.chapters[0];
    await page.goto(`${BASE}/exegesis?libro=${book.id}&cap=${first}`, { waitUntil: 'networkidle2', timeout: 60000 });
    await page.waitForSelector('.exg-grid', { timeout: 20000 });
    await wait(500);
    const par = await state();
    check(`${book.id} ${first}: abre en Codex × Trad`, par.witnesses.join() === 'codex,trad' && par.trad > 0, `${par.witnesses.join(' × ')} · ${par.trad} vers.`);
    check(`${book.id}: la columna dice «Borrador», la licencia y que no es la NTV`, /Borrador/.test(par.head) && /CC BY-NC-SA/.test(par.head) && /no es la NTV/.test(par.head), par.head.trim());
    check(`${book.id}: aviso, panel de notas y créditos de la traducción`, /traducción de trabajo/.test(par.notice) && par.panel && /Traducción de trabajo/.test(par.credits), par.notice.trim());
    check(`${book.id}: hay botón «Trad» y no hay botón «NTV»`, par.tradBtn && !par.ntvBtn);
    await page.screenshot({ path: path.join(OUT, `trad-${book.id}-paralelo.png`) });

    await page.goto(`${BASE}/exegesis?libro=${book.id}&cap=${first}&modo=trad`, { waitUntil: 'networkidle2', timeout: 60000 });
    await page.waitForSelector('.exg-grid', { timeout: 20000 });
    await wait(400);
    const solo = await state();
    check(`${book.id}: ?modo=trad muestra solo la traducción`, solo.witnesses.join() === 'trad' && solo.trad > 0, solo.witnesses.join());

    const beyond = Math.max(...book.chapters) + 1;
    await page.goto(`${BASE}/exegesis?libro=${book.id}&cap=${beyond}&modo=trad`, { waitUntil: 'networkidle2', timeout: 60000 });
    await page.waitForSelector('.exg-grid', { timeout: 20000 });
    await wait(400);
    const after = await state();
    check(
      `${book.id} ${beyond}: sin traducción, se lee el Codex y el aviso lo explica`,
      after.witnesses.join() === 'codex' && /cubre por ahora/.test(after.notice),
      after.notice.trim()
    );

    await page.goto(`${BASE}/biblia/ntv?libro=${book.id}`, { waitUntil: 'networkidle2', timeout: 60000 });
    await wait(800);
    const href = await page.evaluate(() =>
      [...document.querySelectorAll('.empty-state a')].map(a => a.getAttribute('href')).find(h => /modo=trad/.test(h || ''))
    );
    check(`/biblia/ntv?libro=${book.id} enlaza a la traducción de trabajo`, Boolean(href), String(href));
  }

  const mobile = await browser.newPage();
  mobile.on('pageerror', e => errors.push(String(e)));
  await mobile.setViewport({ width: 390, height: 844 });
  await mobile.goto(`${BASE}/exegesis?libro=${books[0].id}&cap=${books[0].chapters[0]}`, { waitUntil: 'networkidle2', timeout: 60000 });
  await mobile.waitForSelector('.exg-grid', { timeout: 20000 });
  await wait(500);
  const m = await mobile.evaluate(() => ({
    wide: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    trad: document.querySelectorAll('.exg-row__cell--trad').length
  }));
  check('Móvil: sin scroll horizontal y con la traducción', m.wide <= 1 && m.trad > 0, `${m.wide}px · ${m.trad} celdas`);
  await mobile.screenshot({ path: path.join(OUT, `trad-${books[0].id}-movil.png`) });

  check('Sin errores de consola', errors.length === 0, errors.slice(0, 3).join(' | ') || 'ninguno');
  await browser.close();
}

const failed = results.filter(r => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} comprobaciones superadas`);
process.exit(failed ? 1 : 0);
