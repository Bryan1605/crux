/**
 * QA de la Biblia Hebrea (OSHB / WLC, Fase 1).
 *
 *   node scripts/qa-hebreo.mjs             # datos, rangos y rutas
 *   node scripts/qa-hebreo.mjs --browser   # + pruebas reales en Chrome
 *
 * Los informes y capturas se guardan en %TEMP%\opencode\crux\hebreo.
 */
import { mkdir, mkdtemp, readFile, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { hebreoSeo } from '../src/lib/hebreoSeo.js';
import { HEBREW_BOOKS, versePlainText } from '../src/lib/hebrew.js';
import { siteConfig, siteRoutes } from './routes-lib.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = path.join(ROOT, 'public', 'textos', 'hebreo');
const FONT_WOFF = path.join(ROOT, 'src', 'assets', 'fonts', 'ezra-sil', 'SILEOT.woff');
const BASE = (process.env.CRUX_BASE || 'http://localhost:5173').replace(/\/$/, '');
const OUT = path.join(process.env.TEMP || tmpdir(), 'opencode', 'crux', 'hebreo');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const WITH_BROWSER = process.argv.includes('--browser');

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok: Boolean(ok), detail });
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
};

const readJson = async file => JSON.parse(await readFile(file, 'utf8'));

/* -------------------------------------------------------------------------- */
/* 1. Datos estáticos, normalización, arameo y ketiv/qere                     */
/* -------------------------------------------------------------------------- */

const pkg = await readJson(path.join(ROOT, 'package.json'));
check('Versión de package.json en 0.12.0 (Hebreo Fase 2)', pkg.version === '0.12.0', pkg.version);

const index = await readJson(path.join(DATA_DIR, 'index.json'));
check(
  'Fuente Ezra SIL empaquetada localmente',
  (await stat(FONT_WOFF).then(s => s.size).catch(() => 0)) > 10000,
  path.relative(ROOT, FONT_WOFF)
);
check(
  'index.json registra los 39 libros, commit OSHB y licencias',
  index.books?.length === 39 &&
    Boolean(index.source?.commit) &&
    /CC BY 4\.0/.test(index.source?.markupLicense || '') &&
    index.normalization === 'none',
  `${index.books?.length} libros · commit ${index.source?.commit?.slice(0, 7)}`
);

let sumChapters = 0;
let sumVerses = 0;
let sumWords = 0;
let sumAramaicVerses = 0;
let sumAramaicWords = 0;
let sumKq = 0;
let sumKqBoth = 0;
let sumKOnly = 0;
let sumQOnly = 0;
let emptyVerses = 0;
let badChars = 0;
let badKq = 0;
let nonNfcFiles = 0;
const booksById = new Map();

for (const meta of HEBREW_BOOKS) {
  const raw = await readFile(path.join(DATA_DIR, `${meta.id}.json`), 'utf8');
  if (raw.normalize('NFC') !== raw) nonNfcFiles += 1;
  const book = JSON.parse(raw);
  booksById.set(meta.id, book);

  for (const ch of book.chapters) {
    sumChapters += 1;
    for (const v of ch.verses) {
      sumVerses += 1;
      if (!Array.isArray(v.t) || v.t.length === 0) emptyVerses += 1;
      for (const tok of v.t) {
        if (typeof tok === 'string') {
          if (/[\uFFFD<>\/]/.test(tok)) badChars += 1;
          if (!['\u05BE', '\u05C3', '\u05C0'].includes(tok)) sumWords += 1;
        } else if (typeof tok === 'object' && tok !== null) {
          if (typeof tok.a === 'string') {
            if (/[\uFFFD<>\/]/.test(tok.a)) badChars += 1;
            sumWords += 1;
            sumAramaicWords += 1;
          } else if ('k' in tok) {
            sumWords += 1;
            sumKq += 1;
            if (tok.a) sumAramaicWords += 1;
            if (/[\uFFFD<>\/]/.test(tok.k) || /[\uFFFD<>\/]/.test(tok.q)) badChars += 1;
            if (!tok.k && !tok.q) badKq += 1;
            else if (tok.k && tok.q) sumKqBoth += 1;
            else if (tok.k && !tok.q) sumKOnly += 1;
            else sumQOnly += 1;
          } else if (typeof tok.p === 'string') {
            if (/[\uFFFD<>\/]/.test(tok.p)) badChars += 1;
          }
        }
      }
      if (v.ar > 0) sumAramaicVerses += 1;
    }
  }
}

check(
  'Conteos globales coinciden con index.json',
  sumChapters === index.totals.chapters &&
    sumVerses === index.totals.verses &&
    sumWords === index.totals.words &&
    sumAramaicVerses === index.totals.aramaicVerses &&
    sumAramaicWords === index.totals.aramaicWords &&
    sumKq === index.totals.ketivQere,
  `${sumChapters} caps · ${sumVerses} vv · ${sumWords} palabras · ${sumKq} ketiv/qere`
);
check(
  'Cero versículos vacíos, cero XML residual o U+FFFD, cero KQ vacíos',
  emptyVerses === 0 && badChars === 0 && badKq === 0,
  `vacíos=${emptyVerses} · raros=${badChars} · kqVacíos=${badKq}`
);
check(
  'Los 39 archivos conservan el orden Unicode sin normalizar a NFC',
  nonNfcFiles === 39,
  `${nonNfcFiles}/39 conservan combinaciones WLC sin normalizar`
);

const verseAt = (bookId, chNum, vNum) =>
  booksById
    .get(bookId)
    ?.chapters.find(c => c.num === chNum)
    ?.verses.find(v => v.n === vNum);

const isAllAramaicVerse = v =>
  Boolean(v) &&
  v.t.every(tok => {
    if (typeof tok === 'string') return ['\u05BE', '\u05C3', '\u05C0'].includes(tok);
    if ('p' in tok) return true;
    return Boolean(tok.a);
  });

const gen3147 = verseAt('genesis', 31, 47);
const gen3147Arc = gen3147?.t.filter(tok => typeof tok === 'object' && tok.a).map(tok => tok.a) || [];
check(
  'Génesis 31:47 marca las dos palabras arameas de Labán dentro de versículo mixto',
  gen3147Arc.length === 2 && (gen3147?.t.some(tok => typeof tok === 'string' && tok.includes('גַּלְעֵ'))) && !isAllAramaicVerse(gen3147),
  gen3147Arc.join(' · ')
);

check(
  'Jeremías 10:11 es arameo completo entre 10:10 y 10:12 hebreos',
  isAllAramaicVerse(verseAt('jeremias', 10, 11)) &&
    !verseAt('jeremias', 10, 10)?.ar &&
    !verseAt('jeremias', 10, 12)?.ar
);

const dan24 = verseAt('daniel', 2, 4);
const danArcOk =
  Boolean(dan24) &&
  !isAllAramaicVerse(dan24) &&
  dan24.ar === 8 &&
  booksById
    .get('daniel')
    .chapters.filter(c => c.num >= 2 && c.num <= 7)
    .every(c =>
      c.verses
        .filter(v => !(c.num === 2 && v.n < 4))
        .every(v => (c.num === 2 && v.n === 4 ? v.ar === 8 : isAllAramaicVerse(v)))
    ) &&
  !verseAt('daniel', 8, 1)?.ar;
check('Daniel 2:4–7:28 marca arameo palabra por palabra y vuelve al hebreo en 8:1', danArcOk);

const ezra = booksById.get('esdras');
const ezraArcOk =
  !verseAt('esdras', 4, 7)?.ar &&
  ezra.chapters
    .find(c => c.num === 4)
    .verses.filter(v => v.n >= 8)
    .every(isAllAramaicVerse) &&
  ezra.chapters.find(c => c.num === 5).verses.every(isAllAramaicVerse) &&
  ezra.chapters
    .find(c => c.num === 6)
    .verses.filter(v => v.n <= 18)
    .every(isAllAramaicVerse) &&
  !verseAt('esdras', 6, 19)?.ar &&
  !verseAt('esdras', 7, 11)?.ar &&
  ezra.chapters
    .find(c => c.num === 7)
    .verses.filter(v => v.n >= 12 && v.n <= 26)
    .every(isAllAramaicVerse) &&
  !verseAt('esdras', 7, 27)?.ar;
check('Esdras 4:8–6:18 y 7:12–26 marcados en arameo con fronteras exactas', ezraArcOk);

const ruth35 = verseAt('rut', 3, 5);
const ruth312 = verseAt('rut', 3, 12);
const kings518 = verseAt('2-reyes', 5, 18);
check(
  'Los tres tipos de ketiv/qere presentes y bien formados',
  sumKqBoth === 1245 &&
    sumKOnly === 6 &&
    sumQOnly === 9 &&
    ruth35?.t.some(tok => typeof tok === 'object' && tok.k === '' && Boolean(tok.q)) &&
    ruth312?.t.some(tok => typeof tok === 'object' && Boolean(tok.k) && tok.q === '') &&
    kings518?.t.some(tok => typeof tok === 'object' && tok.k === 'נא' && tok.q === ''),
  `${sumKqBoth} K+Q · ${sumKOnly} solo K · ${sumQOnly} solo Q`
);

const routes = siteRoutes();
const brand = siteConfig().marca?.nombre || 'Crux';
const expectedSeo = hebreoSeo(brand);
const registered = routes.find(r => r.path === '/biblia/hebreo');
check(
  'Ruta /biblia/hebreo registrada en routes-lib.mjs con SEO coincidente',
  Boolean(registered && registered.indexable && registered.title === expectedSeo.title && registered.description === expectedSeo.description),
  `${routes.length} rutas totales`
);

/* -------------------------------------------------------------------------- */
/* 2. Pruebas en navegador real (opcional --browser)                          */
/* -------------------------------------------------------------------------- */

if (WITH_BROWSER) {
  const { default: puppeteer } = await import('puppeteer-core');
  await mkdir(OUT, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    userDataDir: await mkdtemp(path.join(tmpdir(), 'crux-hebreo-')),
    args: ['--disable-gpu', '--enable-unsafe-swiftshader', '--hide-scrollbars', '--no-first-run']
  });

  const errors = [];
  const httpErrors = [];
  const page = await browser.newPage();
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('response', r => {
    if (r.status() >= 400) httpErrors.push(`${r.status()} ${r.url()}`);
  });

  const wait = ms => new Promise(r => setTimeout(r, ms));
  const goto = async (url, waitMs = 600) => {
    await page.goto(`${BASE}${url}`, { waitUntil: 'networkidle2', timeout: 60000 });
    await page.waitForSelector('.heb-grid, .exg-grid, .empty-state', { timeout: 20000 });
    await wait(waitMs);
  };

  try {
    await page.setViewport({ width: 1280, height: 900 });
    await goto('/biblia/hebreo?libro=genesis&cap=1', 900);

    const gen1 = await page.evaluate(async () => {
      await document.fonts.ready;
      const fonts = [...document.fonts].map(f => ({ family: f.family, status: f.status }));
      const row1 = document.querySelector('.heb-row[data-v="1"] .heb-row__text');
      const gridStyle = row1 ? getComputedStyle(row1) : null;
      return {
        h1s: [...document.querySelectorAll('h1')].map(h => h.textContent.trim()),
        rows: document.querySelectorAll('.heb-row').length,
        dir: row1?.getAttribute('dir'),
        lang: row1?.getAttribute('lang'),
        computedDir: gridStyle?.direction,
        fontFamily: gridStyle?.fontFamily || '',
        ezraLoaded: fonts.some(f => f.family.includes('Ezra SIL') && f.status === 'loaded'),
        introHref: document.querySelector('.book-intro a')?.getAttribute('href') || '',
        creditsText: document.querySelector('.heb__credits')?.textContent || '',
        firstVerseText: row1?.textContent || '',
        title: document.title
      };
    });

    check(
      'Génesis 1 renderiza en RTL con 31 versículos y Ezra SIL cargada',
      gen1.h1s.length === 1 &&
        gen1.rows === 31 &&
        gen1.dir === 'rtl' &&
        gen1.computedDir === 'rtl' &&
        gen1.ezraLoaded &&
        gen1.introHref.endsWith('/biblia/libros/genesis'),
      `font=${gen1.ezraLoaded ? 'Ezra SIL loaded' : 'missing'} · ficha=${gen1.introHref}`
    );
    check(
      'Atribución WLC, OSHB CC BY 4.0 y Ezra SIL visible',
      /Westminster Leningrad Codex/.test(gen1.creditsText) &&
        /CC BY 4\.0/.test(gen1.creditsText) &&
        /Ezra SIL/.test(gen1.creditsText)
    );
    await page.evaluate(() => document.querySelector('.heb-grid')?.scrollIntoView({ block: 'start' }));
    await wait(250);
    await page.screenshot({ path: path.join(OUT, 'hebreo-gen1.png') });

    // Conmutadores de cantilación, vocales y temas en el menú Aa
    await page.click('.rmenu__toggle');
    await wait(250);
    await page.evaluate(() => {
      const btns = [...document.querySelectorAll('.rmenu__panel button')];
      btns.find(b => b.textContent.includes('Cantilación'))?.click();
    });
    await wait(200);
    const noCantText = await page.$eval('.heb-row[data-v="1"] .heb-row__text', el => el.textContent);
    await page.evaluate(() => {
      const btns = [...document.querySelectorAll('.rmenu__panel button')];
      btns.find(b => b.textContent.includes('Vocales'))?.click();
    });
    await wait(200);
    const noNiqqudText = await page.$eval('.heb-row[data-v="1"] .heb-row__text', el => el.textContent);
    // Reactivar vocales y cantilación para dejar estado limpio
    await page.evaluate(() => {
      const btns = [...document.querySelectorAll('.rmenu__panel button')];
      btns.find(b => b.textContent.includes('Vocales'))?.click();
      setTimeout(() => {
        const b2 = [...document.querySelectorAll('.rmenu__panel button')];
        b2.find(b => b.textContent.includes('Cantilación'))?.click();
      }, 50);
    });
    await wait(250);
    const restoredText = await page.$eval('.heb-row[data-v="1"] .heb-row__text', el => el.textContent);
    check(
      'Conmutadores Cantilación / Vocales alteran la vista de forma no destructiva',
      noCantText !== gen1.firstVerseText &&
        noNiqqudText !== noCantText &&
        restoredText === gen1.firstVerseText &&
        noNiqqudText.includes('בראשית'),
      noNiqqudText.trim()
    );

    // Buscador dentro del libro abierto
    await page.click('#heb-search');
    await page.type('#heb-search', 'בראשית');
    await wait(300);
    const searchHits = await page.$$eval('.heb-search__hit', els => els.length);
    if (searchHits > 0) await page.click('.heb-search__hit');
    await wait(250);
    check('Buscador interno sin necesidad de vocales encuentra Génesis 1:1', searchHits >= 1, `${searchHits} resultado(s)`);

    // Génesis 31:47 arameo mixto
    await goto('/biblia/hebreo?libro=genesis&cap=31&v=47');
    const g3147 = await page.evaluate(() => {
      const row = document.querySelector('.heb-row[data-v="47"]');
      return {
        arcWords: [...(row?.querySelectorAll('.heb-w--arc[lang="arc"]') || [])].map(e => e.textContent),
        notice: document.querySelector('.heb__notice--arc')?.textContent || '',
        masoreticNotice: document.querySelector('.exg__notice')?.textContent || ''
      };
    });
    check(
      'Génesis 31:47 pinta exactamente 2 palabras arameas con lang="arc" y avisos del capítulo',
      g3147.arcWords.length === 2 && /Arameo bíblico/.test(g3147.notice) && /Numeración masorética/.test(g3147.masoreticNotice),
      g3147.arcWords.join(' · ')
    );

    // Daniel 2:4 arameo + ketiv/qere
    await goto('/biblia/hebreo?libro=daniel&cap=2&v=4');
    const d24 = await page.evaluate(() => ({
      arcInVerse: document.querySelectorAll('.heb-row[data-v="4"] .heb-w--arc, .heb-row[data-v="4"] .heb-kq--arc').length,
      kqs: document.querySelectorAll('.heb-row[data-v="4"] .heb-kq').length
    }));
    check('Daniel 2:4 muestra transición hebreo → arameo y ketiv/qere arameo', d24.arcInVerse === 8 && d24.kqs === 1);
    await page.evaluate(() => document.querySelector('.heb-row[data-v="4"]')?.scrollIntoView({ block: 'center' }));
    await wait(250);
    await page.screenshot({ path: path.join(OUT, 'hebreo-dan2.png') });

    // Rut 3 ketiv/qere popover + Escape
    await goto('/biblia/hebreo?libro=rut&cap=3');
    await page.click('.heb-kq');
    await page.waitForSelector('.vpop', { timeout: 5000 });
    const kqPop = await page.$eval('.vpop', el => el.textContent);
    await page.keyboard.press('Escape');
    await wait(200);
    const popClosed = await page.evaluate(() => !document.querySelector('.vpop'));
    check(
      'Ketiv/Qere abre ficha explicativa en .vpop y cierra con Escape',
      /Ketiv/.test(kqPop) && /Qere/.test(kqPop) && popClosed
    );

    // Libro fuera del AT (Mateo)
    await goto('/biblia/hebreo?libro=mateo&cap=1');
    const ntEmpty = await page.$eval('.empty-state', el => el.textContent);
    check(
      'Libro del NT en /biblia/hebreo muestra estado claro con enlaces a NTV y Exégesis',
      /no está en el canon hebreo/.test(ntEmpty)
    );

    // Fase 2: columna hebrea en /exegesis (apagada por defecto, alineada y fallback)
    await page.setViewport({ width: 1280, height: 900 });
    await page.evaluate(() => localStorage.setItem('crux.exegesis.columnas', 'paralelo'));
    await goto('/exegesis?libro=genesis&cap=1', 700);
    const exgDef = await page.evaluate(() => ({
      witnesses: document.querySelectorAll('.exg-grid__witness').length,
      ntvCells: document.querySelectorAll('.exg-row__cell--ntv').length,
      hebCells: document.querySelectorAll('.exg-row__cell--hebreo').length,
      togglePressed: document.querySelector('.exg-heb-toggle')?.getAttribute('aria-pressed')
    }));
    check(
      'Exégesis Fase 2: columna hebrea apagada por defecto en AT (Génesis 1)',
      exgDef.witnesses === 1 && exgDef.ntvCells === 31 && exgDef.hebCells === 0 && exgDef.togglePressed === 'false',
      JSON.stringify(exgDef)
    );

    await page.click('.exg-heb-toggle');
    await page.waitForSelector('.exg-row__cell--hebreo', { timeout: 10000 });
    await wait(500);
    const exgPar2 = await page.evaluate(async () => {
      await document.fonts.ready;
      const fonts = [...document.fonts];
      const cell = document.querySelector('.exg-row[data-v="1"] .exg-hebreo');
      return {
        url: window.location.search,
        witnesses: document.querySelectorAll('.exg-grid__witness').length,
        hebCells: document.querySelectorAll('.exg-row__cell--hebreo').length,
        ntvCells: document.querySelectorAll('.exg-row__cell--ntv').length,
        dir: cell?.getAttribute('dir'),
        lang: cell?.getAttribute('lang'),
        ezraLoaded: fonts.some(f => f.family.includes('Ezra SIL') && f.status === 'loaded'),
        wide: document.documentElement.scrollWidth - document.documentElement.clientWidth
      };
    });
    check(
      'Exégesis Fase 2: activar Hebreo en Génesis 1 abre paralelo Hebreo × NTV en RTL con Ezra SIL',
      exgPar2.witnesses === 2 &&
        exgPar2.hebCells === 31 &&
        exgPar2.ntvCells === 31 &&
        exgPar2.dir === 'rtl' &&
        exgPar2.lang === 'he' &&
        exgPar2.ezraLoaded &&
        exgPar2.wide <= 1 &&
        /hebreo=1/.test(exgPar2.url),
      JSON.stringify(exgPar2)
    );

    await goto('/exegesis?libro=genesis&cap=21&hebreo=1', 700);
    const exgPar3 = await page.evaluate(() => ({
      grid3: Boolean(document.querySelector('.exg-grid--3')),
      witnesses: document.querySelectorAll('.exg-grid__witness').length,
      hebCells: document.querySelectorAll('.exg-row__cell--hebreo').length,
      codexCells: document.querySelectorAll('.exg-row__cell--codex').length,
      ntvCells: document.querySelectorAll('.exg-row__cell--ntv').length,
      wide: document.documentElement.scrollWidth - document.documentElement.clientWidth
    }));
    check(
      'Exégesis Fase 2: Génesis 21 abre las 3 columnas (Hebreo × Codex × NTV) sin desbordamiento',
      exgPar3.grid3 &&
        exgPar3.witnesses === 3 &&
        exgPar3.hebCells === 34 &&
        exgPar3.codexCells === 34 &&
        exgPar3.ntvCells === 34 &&
        exgPar3.wide <= 1,
      JSON.stringify(exgPar3)
    );
    await page.screenshot({ path: path.join(OUT, 'exegesis-gen21-3col.png') });

    await goto('/exegesis?libro=genesis&cap=31&hebreo=1', 700);
    const exgFallback = await page.evaluate(() => ({
      witnesses: document.querySelectorAll('.exg-grid__witness').length,
      hebCells: document.querySelectorAll('.exg-row__cell--hebreo').length,
      ntvCells: document.querySelectorAll('.exg-row__cell--ntv').length,
      notice: document.querySelector('.exg__notice--hebreo')?.textContent || '',
      arcWords: document.querySelectorAll('.exg-row[data-v="47"] .heb-w--arc[lang="arc"]').length
    }));
    check(
      'Exégesis Fase 2: Génesis 31 no fuerza paralelo desalineado y marca el arameo de 31:47',
      exgFallback.witnesses === 1 &&
        exgFallback.hebCells === 54 &&
        exgFallback.ntvCells === 0 &&
        /Numeración masorética/.test(exgFallback.notice) &&
        exgFallback.arcWords === 2,
      JSON.stringify({ ...exgFallback, notice: exgFallback.notice.slice(0, 60) })
    );

    await goto('/exegesis?libro=rut&cap=3&hebreo=1', 700);
    await page.click('.exg-row .heb-kq');
    await page.waitForSelector('.vpop', { timeout: 5000 });
    const exgKqText = await page.$eval('.vpop', el => el.textContent);
    await page.keyboard.press('Escape');
    await wait(200);
    const exgKqClosed = await page.evaluate(() => !document.querySelector('.vpop'));
    check(
      'Exégesis Fase 2: ketiv/qere en /exegesis abre explicación y cierra con Escape',
      /Ketiv/.test(exgKqText) && /Qere/.test(exgKqText) && exgKqClosed
    );

    // Móvil 390px sin desbordamiento horizontal
    await page.setViewport({ width: 390, height: 844 });
    for (const mobileUrl of [
      '/biblia/hebreo?libro=genesis&cap=1',
      '/biblia/hebreo?libro=daniel&cap=2',
      '/exegesis?libro=genesis&cap=21&hebreo=1'
    ]) {
      await goto(mobileUrl);
      const wide = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      check(`Móvil 390px (${mobileUrl}): sin desbordamiento horizontal`, wide <= 1, `${wide}px`);
    }
    const mobileTags = await page.$$eval('.exg-cell__tag', els => els.filter(el => getComputedStyle(el).display !== 'none').length);
    check('Móvil 390px (/exegesis 3 columnas): celdas apiladas con etiquetas visibles', mobileTags === 102, `${mobileTags} etiquetas`);
    await page.evaluate(() => document.querySelector('.exg-row[data-v="1"]')?.scrollIntoView({ block: 'center' }));
    await wait(250);
    await page.screenshot({ path: path.join(OUT, 'exegesis-gen21-movil.png') });

    check('Sin errores de consola ni respuestas HTTP >= 400', errors.length === 0 && httpErrors.length === 0, errors.concat(httpErrors).slice(0, 3).join(' | ') || '0 errores');
  } finally {
    await browser.close();
  }
}

const failed = results.filter(r => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} comprobaciones superadas`);
process.exit(failed ? 1 : 0);
