import puppeteer from 'puppeteer-core';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT = 'C:\\Users\\PC\\AppData\\Local\\Temp\\opencode\\crux';
const BASE = 'http://localhost:5173';

const userDataDir = await mkdtemp(join(tmpdir(), 'crux-qa-'));
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  userDataDir,
  args: ['--disable-gpu', '--enable-unsafe-swiftshader', '--hide-scrollbars', '--no-first-run'],
});

async function page(reduced = 'no-preference', w = 1280, h = 900) {
  const p = await browser.newPage();
  await p.setViewport({ width: w, height: h });
  await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: reduced }]);
  return p;
}
const wait = ms => new Promise(r => setTimeout(r, ms));

try {
  // 1. CardNav abierto
  let p = await page();
  await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await wait(5000);
  await p.click('.hamburger-menu');
  await wait(1200);
  await p.screenshot({ path: OUT + '/i-nav.png' });

  // 2. Estudio: búsqueda con resultados
  p = await page();
  await p.goto(BASE + '/estudio', { waitUntil: 'domcontentloaded' });
  await wait(2500);
  await p.type('input[type="search"], input[placeholder*="Buscar"]', 'parabola');
  await wait(800);
  await p.screenshot({ path: OUT + '/i-search.png' });

  // 3. Estudio: estado vacío
  await p.click('input[type="search"], input[placeholder*="Buscar"]', { clickCount: 3 });
  await p.type('input[type="search"], input[placeholder*="Buscar"]', 'zzzzqq');
  await wait(800);
  await p.screenshot({ path: OUT + '/i-empty.png' });

  // 4. Home con prefers-reduced-motion: reduce
  p = await page('reduce');
  await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await wait(4000);
  await p.screenshot({ path: OUT + '/i-reduced.png' });

  // 5. Chip de categoría via query (?cat=)
  p = await page();
  await p.goto(BASE + '/estudio?cat=09-parabolas', { waitUntil: 'domcontentloaded' });
  await wait(2000);
  await p.screenshot({ path: OUT + '/i-cat.png' });

  console.log('ok interact');
} finally {
  await browser.close();
}
