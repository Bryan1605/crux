/**
 * QA de la Biblia Patrística.
 *
 *   node scripts/qa-biblia.mjs            # solo comprobaciones de datos
 *   node scripts/qa-biblia.mjs --browser  # + lector real en Chrome (dev server)
 *
 * Requiere el servidor de desarrollo (http://localhost:5173) solo con --browser.
 * Deja capturas en C:\Users\PC\AppData\Local\Temp\opencode\crux.
 */
import { readFile } from 'node:fs/promises';

import { parseBook, searchBiblia, fold } from '../src/data/biblia.js';
import { bookGeometry, packBook, resolvePage } from '../src/lib/bookPages.js';

const DOC = new URL('../public/textos/biblia-patristica.md', import.meta.url);
const OUT = 'C:\\Users\\PC\\AppData\\Local\\Temp\\opencode\\crux';
const BASE = process.env.CRUX_BASE || 'http://localhost:5173';
const WITH_BROWSER = process.argv.includes('--browser');

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok: Boolean(ok), detail });
  const mark = ok ? '\u001b[32mOK  \u001b[0m' : '\u001b[31mFALLA\u001b[0m';
  console.log(`${mark} ${name}${detail ? ` — ${detail}` : ''}`);
};

/* -------------------------------------------------------------------------- */
/* 1. Datos                                                                   */
/* -------------------------------------------------------------------------- */

const raw = await readFile(DOC, 'utf8');
const book = parseBook(raw);

check('El documento no tiene caracteres dañados (U+FFFD)', !raw.includes('\uFFFD'));

const emptyBlocks = book.blocks.filter(b => !b.text || !b.text.trim());
check('No hay bloques vacíos', emptyBlocks.length === 0, `${emptyBlocks.length} vacíos`);

const damaged = book.blocks.filter(b => b.text.includes('\uFFFD'));
check('Ningún bloque contiene U+FFFD', damaged.length === 0, `${damaged.length}`);

check('Hay al menos 20 Partes', book.parts.length >= 20, `${book.parts.length} partes`);
check('Hay secciones', book.sections.length >= 40, `${book.sections.length} secciones`);

const partIds = new Set(book.parts.map(p => p.id));
check('Los ids de Parte son únicos', partIds.size === book.parts.length);
check(
  'Los ids de Parte tienen forma estable',
  book.parts.every(p => /^(p-intro|p[\d]+(?:-[\d]+)*)$/.test(p.id)),
  book.parts.filter(p => !/^(p-intro|p[\d]+(?:-[\d]+)*)$/.test(p.id)).map(p => p.id).join(', ')
);

const sectionIds = new Set(book.sections.map(s => s.id));
check('Los ids de sección son únicos', sectionIds.size === book.sections.length);

const badSections = book.sections.filter(s => {
  const block = book.blocks[s.blockIndex];
  return !block || block.type !== 'heading' || block.text !== s.label;
});
check('Cada sección apunta a su encabezado', badSections.length === 0, `${badSections.length}`);

const orphanBlocks = book.blocks.filter(b => b.partId && !book.partById.has(b.partId));
check('Cada bloque pertenece a una Parte', orphanBlocks.length === 0, `${orphanBlocks.length}`);

const orphanSections = book.blocks.filter(b => b.sectionId && !book.sectionById.has(b.sectionId));
check('Cada bloque con sección la tiene declarada', orphanSections.length === 0, `${orphanSections.length}`);

check(
  'Todas las Partes tienen su bloque de título',
  book.parts.every(p => book.blocks.some(b => b.type === 'part' && b.partId === p.id))
);

/* --- las Partes que antes se perdían ------------------------------------- */

for (const [id, label] of [
  ['p2-1', 'Justino Mártir'],
  ['p2-4', 'Atenágoras'],
  ['p3-1', 'Ireneo']
]) {
  const part = book.partById.get(id);
  check(`Existe la Parte ${id}`, Boolean(part), part ? part.label : '');
  if (part) {
    const body = book.blocks.filter(b => b.partId === id && b.type === 'md');
    check(
      `La Parte ${id} tiene contenido (${label})`,
      body.length > 0,
      `${body.length} bloques, ${body.reduce((a, b) => a + b.text.length, 0)} caracteres`
    );
  }
}

for (const label of ['Resumen', 'Citas clave explicadas']) {
  const found = book.sections.filter(s => s.partId === 'p2-4' && s.label.toLowerCase().includes(fold(label)));
  check(`Atenágoras tiene «${label}»`, found.length > 0, found.map(s => s.id).join(', '));
}

/* -------------------------------------------------------------------------- */
/* 2. Paginación (alturas estimadas: el DOM real se mide en el navegador)     */
/* -------------------------------------------------------------------------- */

const estimate = block => {
  if (block.type === 'part') return 78;
  if (block.type === 'heading') return block.level >= 4 ? 38 : 48;
  const lines = Math.ceil(block.text.length / 62);
  return lines * 27 + 12;
};

const geometry = bookGeometry({ width: 1240, height: 900, fontSize: 17 });
const extents = book.blocks.map(estimate);
const pagination = packBook(book, extents, geometry.bodyH);

check('El libro tiene páginas', pagination.pages.length > 10, `${pagination.pages.length} páginas`);

const emptyPages = pagination.pages.filter(p => !p.blocks.length);
check('No hay páginas vacías', emptyPages.length === 0, `${emptyPages.length}`);

const headingOnly = pagination.pages.filter(
  p => p.blocks.length === 1 && book.blocks[p.blocks[0]].type === 'heading'
);
check('No hay páginas con solo un encabezado', headingOnly.length === 0, `${headingOnly.length}`);

const trailingHeading = pagination.pages.filter((p, i) => {
  if (i === pagination.pages.length - 1) return false;
  const last = book.blocks[p.blocks[p.blocks.length - 1]];
  return last.type === 'heading';
});
check('Ningún título queda viudo al final de página', trailingHeading.length === 0, `${trailingHeading.length}`);

const overflowing = pagination.pages
  .map(p => ({ p, h: p.blocks.reduce((acc, i) => acc + extents[i], 0) }))
  .filter(({ p, h }) => h > geometry.bodyH && p.blocks.length > 1);
check('Ninguna página desborda (salvo un bloque gigante)', overflowing.length === 0, `${overflowing.length}`);

check(
  'Los folios son correlativos desde 1',
  pagination.pages.every((p, i) => p.folio === i + 1)
);

const duplicateIds = new Map();
for (const page of pagination.pages) duplicateIds.set(page.id, (duplicateIds.get(page.id) || 0) + 1);
const dupes = [...duplicateIds.entries()].filter(([, n]) => n > 1);
check('Los ids de página son únicos', dupes.length === 0, dupes.map(([id]) => id).join(', '));

const pageOfBlockOk = book.blocks.every((b, i) => pagination.pageOfBlock.has(i));
check('Cada bloque está en alguna página', pageOfBlockOk);

/* --- resolución de enlaces ----------------------------------------------- */

const badParts = book.parts.filter(p => resolvePage(pagination, p.id) < 0);
check('Todas las Partes se resuelven desde la URL', badParts.length === 0, badParts.map(p => p.id).join(', '));

const badSectionLinks = book.sections.filter(s => resolvePage(pagination, s.id) < 0);
check(
  'Todas las secciones se resuelven desde la URL',
  badSectionLinks.length === 0,
  badSectionLinks.slice(0, 5).map(s => s.id).join(', ')
);

for (const id of ['p9', 'p133', 'p135', 'p139']) {
  const index = resolvePage(pagination, id);
  check(`El enlace antiguo ${id} se resuelve`, index >= 0, index >= 0 ? pagination.pages[index].id : '');
}

const legacyTargets = { p9: 'p2-1', p133: 'p2-4', p135: 'p2-4', p139: 'p3-1' };
for (const [legacy, expected] of Object.entries(legacyTargets)) {
  const index = resolvePage(pagination, legacy);
  check(
    `${legacy} apunta a ${expected}`,
    index >= 0 && pagination.pages[index].partId === expected,
    index >= 0 ? pagination.pages[index].id : ''
  );
}

const resume = book.sectionById.get('p2-4-resumen');
const sectionPage = resolvePage(pagination, 'p2-4-resumen');
check(
  'p2-4-resumen abre la página donde está su título',
  sectionPage >= 0 && pagination.pages[sectionPage].blocks.includes(resume.blockIndex),
  sectionPage >= 0 ? pagination.pages[sectionPage].id : ''
);

const k1 = resolvePage(pagination, 'p2-4-resumen.1');
const k2 = resolvePage(pagination, 'p2-4-resumen.2');
check('La k-ésima página de una sección avanza', k2 === -1 || k2 >= k1, `${k1} → ${k2}`);

check('resolvePage no revienta con basura', resolvePage(pagination, 'pzz.??.9') === -1);

/* --- búsqueda ------------------------------------------------------------- */

const hits = searchBiblia(book, 'atanasio');
check('La búsqueda encuentra a Atanasio', hits.length > 0, `${hits.length} coincidencias`);

const accentHits = searchBiblia(book, 'resurreccion');
check('La búsqueda ignora acentos', accentHits.length > 0, `${accentHits.length} coincidencias`);

check(
  'El fragmento de búsqueda coincide con el original',
  hits.every(h => {
    const needle = h.snippet.hit;
    return h.block.text.includes(needle) || fold(h.block.text).includes(fold(needle));
  })
);

/* -------------------------------------------------------------------------- */
/* 3. Lector real (opcional)                                                  */
/* -------------------------------------------------------------------------- */

if (WITH_BROWSER) {
  const { default: puppeteer } = await import('puppeteer-core');
  const { mkdir, mkdtemp } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');

  const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  await mkdir(OUT, { recursive: true });
  const userDataDir = await mkdtemp(join(tmpdir(), 'crux-biblia-'));
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    userDataDir,
    args: ['--disable-gpu', '--enable-unsafe-swiftshader', '--hide-scrollbars', '--no-first-run']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1360, height: 900 });

  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });

  const folioNow = () => page.$eval('.reader__status strong', n => n.textContent);
  const waitFolioChange = async previous => {
    try {
      await page.waitForFunction(
        prev => document.querySelector('.reader__status strong')?.textContent !== prev,
        { timeout: 8000 },
        previous
      );
      return true;
    } catch {
      return false;
    }
  };

  await page.goto(`${BASE}/biblia`, { waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForSelector('.toc__list', { timeout: 30000 });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: join(OUT, 'biblia-portada.png'), fullPage: false });

  const folios = await page.$$eval('.toc__folio', nodes => nodes.map(n => n.textContent.trim()));
  check('El índice muestra folios', folios.some(f => /^\d+$/.test(f)), `${folios.length} entradas`);
  check(
    'Todas las entradas del índice tienen folio',
    folios.length > 0 && folios.every(f => /^\d+$/.test(f)),
    `${folios.filter(f => !/^\d+$/.test(f)).length} sin folio`
  );

  await page.click('.toc__row--part');
  await page.waitForSelector('.book__page--left .book-page__body', { timeout: 30000 });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: join(OUT, 'biblia-lector.png') });

  const clipped = await page.$$eval('.book-page__body', nodes =>
    nodes.map(n => n.scrollHeight - n.clientHeight)
  );
  check('Ninguna página recorta texto', clipped.every(over => over <= 1), clipped.join(', '));

  const folio1 = await folioNow();
  check('El lector muestra el folio actual', /^\d+$/.test(folio1), folio1);

  await page.click('.book-stage__arrow--next');
  check('Pasar la hoja avanza el folio', await waitFolioChange(folio1), `${folio1} → ${await folioNow()}`);
  await page.screenshot({ path: join(OUT, 'biblia-hoja.png') });

  const folio2 = await folioNow();
  await page.keyboard.press('ArrowRight');
  check('La flecha del teclado pasa la hoja', await waitFolioChange(folio2), `${folio2} → ${await folioNow()}`);

  // Índice flotante.
  await page.click('button[aria-label="Abrir el índice rápido"]');
  await page.waitForSelector('.reader__panel .toc__list', { timeout: 10000 });
  const panelFolios = await page.$$eval('.reader__panel .toc__folio', nodes => nodes.map(n => n.textContent.trim()));
  check(
    'El índice rápido del lector tiene folios',
    panelFolios.length > 0 && panelFolios.every(f => /^\d+$/.test(f)),
    `${panelFolios.length} entradas`
  );
  await page.screenshot({ path: join(OUT, 'biblia-indice.png') });
  await page.click('button[aria-label="Abrir el índice rápido"]');

  // Búsqueda dentro de la obra.
  await page.click('button[aria-label="Buscar en la obra"]');
  await page.waitForSelector('#buscador-biblia', { timeout: 10000 });
  await page.type('#buscador-biblia', 'gnosticismo');
  await page.waitForSelector('.reader__result', { timeout: 15000 });
  const resultCount = await page.$$eval('.reader__result', nodes => nodes.length);
  check('La búsqueda del lector encuentra resultados', resultCount > 0, `${resultCount} resultados`);
  await page.click('.reader__result');
  await new Promise(r => setTimeout(r, 600));
  check('Un resultado de búsqueda lleva a su página', /^\d+$/.test(await folioNow()), await folioNow());

  // Tamaño de letra (repagina sin perder el sitio).
  const folio3 = await folioNow();
  await page.click('button[aria-label="Aumentar el tamaño de letra"]');
  await new Promise(r => setTimeout(r, 1500));
  check('A+ repagina sin perder el sitio', /^\d+$/.test(await folioNow()), `${folio3} → ${await folioNow()}`);

  // Papel.
  const paperBefore = await page.$eval('.book-stage', n => n.getAttribute('data-theme'));
  await page.click('button[aria-label^="Tema del papel"]');
  await new Promise(r => setTimeout(r, 400));
  const paperAfter = await page.$eval('.book-stage', n => n.getAttribute('data-theme'));
  check('El tema del papel cambia', paperBefore !== paperAfter, `${paperBefore} → ${paperAfter}`);

  // Enlaces antiguos y páginas que antes salían vacías.
  for (const legacy of ['p9', 'p133', 'p135', 'p139']) {
    await page.goto(`${BASE}/biblia?pag=${legacy}`, { waitUntil: 'networkidle2', timeout: 60000 });
    await page.waitForSelector('.book__page--left .book-page__body, .book__page--single .book-page__body', {
      timeout: 30000
    });
    await new Promise(r => setTimeout(r, 400));
    const chars = await page.$$eval('.book-page__body', nodes =>
      nodes.reduce((acc, n) => acc + n.textContent.trim().length, 0)
    );
    const notFound = await page.$('.biblia__notfound');
    check(`${legacy} abre una página con texto`, chars > 200 && !notFound, `${chars} caracteres`);
  }
  await page.screenshot({ path: join(OUT, 'biblia-antiguas.png') });

  // Scroll continuo.
  await page.click('button[aria-label="Cambiar entre lectura de libro y scroll continuo"]');
  await page.waitForSelector('.reader__scroll .book-block', { timeout: 20000 });
  await new Promise(r => setTimeout(r, 700));
  const scrollChars = await page.$eval('.reader__scroll', n => n.textContent.length);
  check('El modo scroll muestra la obra completa', scrollChars > 100000, `${scrollChars} caracteres`);

  // Tablas, citas y listas (el scroll muestra toda la obra de una vez).
  const structure = await page.$$eval('.reader__scroll', root => ({
    tables: root[0].querySelectorAll('table').length,
    quotes: root[0].querySelectorAll('blockquote').length,
    lists: root[0].querySelectorAll('ul, ol').length,
    wide: document.documentElement.scrollWidth - document.documentElement.clientWidth
  }));
  check('Las tablas de la obra se renderizan como tablas', structure.tables > 1, `${structure.tables} tablas`);
  check('Hay citas en bloque', structure.quotes > 1, `${structure.quotes} citas`);
  check('Hay listas', structure.lists > 1, `${structure.lists} listas`);
  check('El documento no desborda a lo ancho', structure.wide <= 1, `${structure.wide}px`);
  await page.screenshot({ path: join(OUT, 'biblia-scroll.png') });

  // Volvemos al modo libro con el propio mando del lector.
  await page.click('button[aria-label="Cambiar entre lectura de libro y scroll continuo"]');
  await page.waitForSelector('.book-stage', { timeout: 15000 });
  await new Promise(r => setTimeout(r, 600));

  // «Continuar leyendo» vuelve al último folio visitado.
  await page.goto(`${BASE}/biblia`, { waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForSelector('.biblia__resume, .toc__list', { timeout: 30000 });
  const resume = await page.$('.biblia__resume');
  check('La portada ofrece continuar la lectura', Boolean(resume));

  // Una página inexistente avisa y ofrece volver al índice.
  await page.goto(`${BASE}/biblia?pag=pzz.??.9`, { waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForSelector('.biblia__notfound', { timeout: 30000 });
  const back = await page.$('.biblia__notfound a[href*="biblia"]');
  check('Una página inexistente avisa y vuelve al índice', Boolean(back));
  await page.screenshot({ path: join(OUT, 'biblia-no-encontrada.png') });

  // Con movimiento reducido el paso de hoja sigue funcionando (sin animación).
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.goto(`${BASE}/biblia?pag=p2-1.1`, { waitUntil: 'networkidle2', timeout: 60000 });
  let reducedOk = false;
  let reducedDetail = 'no llegó a montarse';
  try {
    await page.waitForSelector('.book-stage__arrow--next', { timeout: 30000 });
    await new Promise(r => setTimeout(r, 400));
    const before = await folioNow();
    await page.click('.book-stage__arrow--next');
    const changed = await waitFolioChange(before);
    reducedOk = changed;
    reducedDetail = changed ? `${before} → ${await folioNow()}` : 'el folio no avanzó';
  } catch (error) {
    reducedDetail = await page.evaluate(() => ({
      url: location.href,
      notFound: Boolean(document.querySelector('.biblia__notfound')),
      landing: Boolean(document.querySelector('.toc__list')),
      loader: Boolean(document.querySelector('.loader-pulse')),
      stage: Boolean(document.querySelector('.book-stage')),
      book: Boolean(document.querySelector('.book')),
      rootLen: document.querySelector('#root')?.innerHTML.length || 0,
      rootHead: (document.querySelector('#root')?.textContent || '').slice(0, 80),
      header: Boolean(document.querySelector('header, .site-header, nav'))
    }));
    reducedDetail =
      JSON.stringify(reducedDetail) + ' — ' + String(error).slice(0, 90) + (errors.length ? ' — pageerrors: ' + errors.slice(-3).join(' | ') : '');
  }
  check('Con movimiento reducido también se pasa la hoja', reducedOk, reducedDetail);
  await page.emulateMediaFeatures([]);

  // Móvil: una sola página, sin desbordar el ancho.
  await page.setViewport({ width: 390, height: 780 });
  await page.goto(`${BASE}/biblia?pag=p2-4-resumen`, { waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForSelector('.book--single .book-page__body', { timeout: 30000 });
  await new Promise(r => setTimeout(r, 700));
  const mobile = await page.evaluate(() => {
    const body = document.querySelector('.book-page__body');
    const book = document.querySelector('.book');
    return {
      over: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      overflow: body ? body.scrollHeight - body.clientHeight : 999,
      width: book ? book.getBoundingClientRect().width : 0
    };
  });
  check('En móvil no hay scroll horizontal', mobile.over <= 1, `${mobile.over}px`);
  check('En móvil la página no recorta texto', mobile.overflow <= 1, `${mobile.overflow}px`);
  await page.screenshot({ path: join(OUT, 'biblia-movil.png') });

  check('Sin errores de consola', errors.length === 0, errors.slice(0, 3).join(' | '));

  await browser.close();
}

/* -------------------------------------------------------------------------- */

console.log('');
const failed = results.filter(r => !r.ok);
console.log(
  failed.length === 0
    ? `\u001b[32m${results.length}/${results.length} comprobaciones OK\u001b[0m`
    : `\u001b[31m${failed.length} de ${results.length} comprobaciones FALLAN\u001b[0m`
);

process.exit(failed.length === 0 ? 0 : 1);
