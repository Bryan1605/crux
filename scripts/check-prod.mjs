// check-prod.mjs — verifica el sitio publicado en GitHub Pages con un navegador real.
// Uso: node scripts/check-prod.mjs  (requiere Chrome instalado en la ruta por defecto)
import { mkdir, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const BASE = 'https://bryan1605.github.io/crux';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT = join(process.env.TEMP || tmpdir(), 'opencode', 'crux', 'prod');

const { default: puppeteer } = await import('puppeteer-core');
await mkdir(OUT, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  userDataDir: await mkdtemp(join(tmpdir(), 'crux-prod-')),
  args: ['--disable-gpu', '--enable-unsafe-swiftshader', '--no-first-run'],
});

let pass = 0;
let fail = 0;
const check = (name, ok, extra = '') => {
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${extra ? ` — ${extra}` : ''}`);
  ok ? pass++ : fail++;
};

const cases = [
  { url: `${BASE}/`, label: 'portada', selector: 'main, #root *' },
  { url: `${BASE}/estudio`, label: '/estudio', selector: 'main, #root *' },
  { url: `${BASE}/biblia`, label: '/biblia (índice)', selector: '.toc__list, .book' },
  { url: `${BASE}/biblia?pag=p2-4-resumen`, label: 'deep-link p2-4-resumen', selector: '.reader__status, .book-page, .book' },
  { url: `${BASE}/biblia?pag=p9`, label: 'alias legacy p9 → p2-1', selector: '.reader__status, .book-page, .book' },
  { url: `${BASE}/biblia?pag=p133`, label: 'alias legacy p133 → p2-4-resumen', selector: '.reader__status, .book-page, .book' },
  { url: `${BASE}/ruta-no-existe`, label: 'ruta inventada → portada (SPA)', selector: 'main, #root *' },
];

for (const { url, label, selector } of cases) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1360, height: 900 });
  const errors = [];
  const http404 = [];
  let realErrors = errors;
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('response', r => { if (r.status() === 404) http404.push(r.url().replace('https://bryan1605.github.io', '')); });

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    await page.waitForSelector(selector, { timeout: 30000 });
    await new Promise(r => setTimeout(r, 800));
    // En GitHub Pages una ruta profunda SPA se sirve a traves de 404.html con codigo
    // 404: el unico 404 esperado es el propio documento pedido, que luego se restaura.
    const u = new URL(url);
    const expectedDoc = u.pathname + u.search;
    const onlyDoc404 = http404.every(p => p === expectedDoc);
    realErrors = errors.filter(e => !(onlyDoc404 && e.includes('404')));
    const info = await page.evaluate(() => ({
      url: location.href,
      title: document.title,
      hasRoot: !!document.getElementById('root'),
      h1: document.querySelector('h1')?.textContent?.trim().slice(0, 60) ?? '',
      bodyLen: document.body.innerText.length,
    }));
    check(label, info.hasRoot && info.bodyLen > 400,
      `url=${info.url} | h1=${info.h1} | texto=${info.bodyLen} | title=${info.title}`);
    if (label.startsWith('deep-link') || label.startsWith('alias')) {
      check(`${label}: vuelve a la ruta pedida`, info.url.startsWith(url.split('?')[0] + '?') || info.url.includes('pag='),
        `final=${info.url}`);
      const folio = await page.$eval('.reader__status strong', n => n.textContent).catch(() => null);
      check(`${label}: estado/fólio visible`, folio !== null && /^\d+$/.test(folio), `fólio=${folio}`);
    }
  } catch (e) {
    check(label, false, String(e).slice(0, 120));
  }
  check(`${label}: 0 errores de consola`, realErrors.length === 0,
    `${realErrors.slice(0, 2).join(' | ') || 'ninguno'} || http404=${http404.join(',') || '-'}`);
  await page.close();
}

await browser.close();
console.log(`\n${pass} OK / ${fail} FAIL`);
process.exit(fail ? 1 : 0);