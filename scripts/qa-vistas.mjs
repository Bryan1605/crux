/**
 * QA de las vistas del índice (/estudio): Tarjetas · Lista · Carrusel.
 *
 *   node scripts/qa-vistas.mjs
 *
 * Requiere el servidor de desarrollo en http://localhost:5173.
 * Deja capturas en C:\Users\PC\AppData\Local\Temp\opencode\crux.
 */
import puppeteer from 'puppeteer-core';
import { mkdir, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT = 'C:\\Users\\PC\\AppData\\Local\\Temp\\opencode\\crux';
const BASE = process.env.CRUX_BASE || 'http://localhost:5173';

const wait = ms => new Promise(r => setTimeout(r, ms));

await mkdir(OUT, { recursive: true });

const userDataDir = await mkdtemp(join(tmpdir(), 'crux-vistas-'));
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  userDataDir,
  args: ['--disable-gpu', '--enable-unsafe-swiftshader', '--hide-scrollbars', '--no-first-run']
});

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok: Boolean(ok), detail });
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
};

async function makePage(reduced = 'no-preference', width = 1280, height = 900) {
  const page = await browser.newPage();
  await page.setViewport({ width, height });
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: reduced }]);
  page.on('pageerror', e => console.log('  [pageerror]', e.message));
  page.on('console', m => {
    if (m.type() === 'error') console.log('  [console.error]', m.text());
  });
  return page;
}

const clickView = (page, label) =>
  page.evaluate(text => {
    const btn = [...document.querySelectorAll('.view-toggle__btn')].find(b =>
      b.textContent.trim().toLowerCase().includes(text)
    );
    if (btn) btn.click();
    return Boolean(btn);
  }, label.toLowerCase());

/** Ninguna vista debe provocar scroll horizontal en la página. */
async function checkNoOverflow(page, label) {
  const m = await page.evaluate(() => ({
    doc: document.documentElement.scrollWidth,
    win: document.documentElement.clientWidth
  }));
  check(`sin desbordamiento horizontal (${label})`, m.doc <= m.win + 1, `${m.doc}px vs ${m.win}px`);
}

try {
  // ---------------------------------------------------------------- escritorio
  let page = await makePage();
  await page.goto(`${BASE}/estudio`, { waitUntil: 'domcontentloaded' });
  await wait(2500);

  const toggle = await page.$$eval('.view-toggle__btn', els => els.map(e => e.textContent.trim()));
  check('conmutador con 3 vistas', toggle.length === 3, toggle.join(' | '));

  const initial = await page.evaluate(() => ({
    grid: Boolean(document.querySelector('.estudio__grid')),
    list: Boolean(document.querySelector('.estudio__list')),
    carousel: Boolean(document.querySelector('.concave-carousel')),
    stored: localStorage.getItem('crux:estudio-vista')
  }));
  check('vista por defecto = tarjetas', initial.grid && !initial.list && !initial.carousel, JSON.stringify(initial));
  check('preferencia persistida = cards', initial.stored === 'cards', String(initial.stored));
  await page.screenshot({ path: `${OUT}/v-cards.png` });

  // Lista
  check('clic en Lista', await clickView(page, 'lista'));
  await wait(700);
  const rows = await page.$$eval('.row-card', els => els.length);
  check('la lista pinta filas', rows > 10, `${rows} filas`);
  await checkNoOverflow(page, 'lista');
  await page.screenshot({ path: `${OUT}/v-list.png` });

  // Carrusel
  check('clic en Carrusel', await clickView(page, 'carrusel'));
  await wait(900);
  const car = await page.evaluate(() => {
    const scroller = document.querySelector('.concave-carousel__scroller');
    const items = [...document.querySelectorAll('.concave-carousel__item')];
    if (!scroller || !items.length) return { items: items.length };
    return {
      items: items.length,
      scrollWidth: scroller.scrollWidth,
      clientWidth: scroller.clientWidth,
      first: items[0].style.transform,
      firstOpacity: items[0].style.opacity,
      rotated: items.filter(i => /rotateY/.test(i.style.transform || '')).length,
      perspective: getComputedStyle(scroller).perspective,
      snaps: getComputedStyle(items[0]).scrollSnapAlign
    };
  });
  check('el carrusel pinta tarjetas', car.items > 10, `${car.items} items`);
  check('hay recorrido horizontal', car.scrollWidth > car.clientWidth * 2, `${car.scrollWidth}px`);
  check('perspectiva compartida activa', car.perspective && car.perspective !== 'none', String(car.perspective));
  check('la tarjeta centrada se transforma (rotateY)', /rotateY/.test(car.first || ''), String(car.first));
  check('varias tarjetas giran hacia el centro', car.rotated >= 3, `${car.rotated} tarjetas con rotateY`);
  check('la tarjeta centrada va a plena opacidad', Number(car.firstOpacity) > 0.9, String(car.firstOpacity));
  check('snap al centro', car.snaps === 'center', String(car.snaps));
  await checkNoOverflow(page, 'carrusel');
  await page.screenshot({ path: `${OUT}/v-carousel.png` });

  // Flecha siguiente desplaza
  const before = await page.$eval('.concave-carousel__scroller', el => el.scrollLeft);
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('.concave-carousel__btn')];
    btns[btns.length - 1].click();
  });
  await wait(900);
  const after = await page.$eval('.concave-carousel__scroller', el => el.scrollLeft);
  check('el botón → desplaza', after > before + 50, `${before} → ${after}`);

  // La rueda vertical mueve el carrusel
  const wheelBefore = after;
  await page.evaluate(() => {
    const scroller = document.querySelector('.concave-carousel__scroller');
    scroller.dispatchEvent(new WheelEvent('wheel', { deltaY: 400, bubbles: true, cancelable: true }));
  });
  await wait(400);
  const wheelAfter = await page.$eval('.concave-carousel__scroller', el => el.scrollLeft);
  check('la rueda mueve el carrusel', wheelAfter > wheelBefore + 50, `${wheelBefore} → ${wheelAfter}`);

  // Persistencia tras recargar
  await page.reload({ waitUntil: 'domcontentloaded' });
  await wait(2200);
  const persisted = await page.evaluate(() => ({
    carousel: Boolean(document.querySelector('.concave-carousel')),
    stored: localStorage.getItem('crux:estudio-vista')
  }));
  check('la vista persiste al recargar', persisted.carousel && persisted.stored === 'carousel', JSON.stringify(persisted));

  // Vuelta a tarjetas
  await clickView(page, 'tarjetas');
  await wait(800);
  // La rejilla queda bajo el pliegue: hay que acercarla para que el
  // IntersectionObserver la revele.
  await page.evaluate(() => document.querySelector('.estudio__grid')?.scrollIntoView({ block: 'start' }));
  await wait(1400);
  const backToGrid = await page.evaluate(() => ({
    grid: Boolean(document.querySelector('.estudio__grid')),
    revealed: document.querySelectorAll('.estudio__grid .study-card.is-revealed').length
  }));
  check('vuelve a la rejilla', backToGrid.grid && backToGrid.revealed > 0, JSON.stringify(backToGrid));

  // ---------------------------------------------------------------- móvil
  const mobile = await makePage('no-preference', 390, 844);
  await mobile.goto(`${BASE}/estudio`, { waitUntil: 'domcontentloaded' });
  await wait(2200);
  await clickView(mobile, 'carrusel');
  await wait(900);
  const mobileCar = await mobile.evaluate(() => {
    const scroller = document.querySelector('.concave-carousel__scroller');
    return { has: Boolean(scroller), scrollWidth: scroller?.scrollWidth || 0, clientWidth: scroller?.clientWidth || 0 };
  });
  check('carrusel en móvil', mobileCar.has && mobileCar.scrollWidth > mobileCar.clientWidth, JSON.stringify(mobileCar));
  await checkNoOverflow(mobile, 'móvil carrusel');
  await mobile.screenshot({ path: `${OUT}/v-mobile-carousel.png` });
  await clickView(mobile, 'lista');
  await wait(600);
  await checkNoOverflow(mobile, 'móvil lista');
  await mobile.screenshot({ path: `${OUT}/v-mobile-list.png` });
  await mobile.close();

  // ---------------------------------------------------------------- PWA
  const manRes = await fetch(`${BASE}/manifest.webmanifest`);
  const manifest = await manRes.json();
  check('manifest servido', manRes.ok && manifest.icons?.length === 3, `${manRes.status} · ${manifest.icons?.length} iconos`);
  for (const icon of manifest.icons || []) {
    const res = await fetch(new URL(icon.src, `${BASE}/manifest.webmanifest`));
    check(`icono ${icon.src}`, res.ok, String(res.status));
  }
  const apple = await fetch(`${BASE}/icons/apple-touch-icon.png`);
  check('apple-touch-icon', apple.ok, String(apple.status));

  // ---------------------------------------------------------------- reduced motion
  const reduced = await makePage('reduce');
  await reduced.goto(`${BASE}/estudio`, { waitUntil: 'domcontentloaded' });
  await wait(2200);
  await clickView(reduced, 'carrusel');
  await wait(900);
  const reducedCar = await reduced.evaluate(() => {
    const items = [...document.querySelectorAll('.concave-carousel__item')];
    return { transform: items[0]?.style.transform, opacity: items[0]?.style.opacity };
  });
  check(
    'reduced-motion sin transformaciones 3D',
    reducedCar.transform === 'none',
    JSON.stringify(reducedCar)
  );
  await reduced.close();

  // ---------------------------------------------------------------- marquesina
  const marquee = await makePage();
  await marquee.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await wait(3500);
  const beforeClose = await marquee.$$eval('.marquee-bar', els => els.length);
  const closed = await marquee.evaluate(() => {
    const btn = document.querySelector('.marquee-bar__close');
    if (!btn) return 'sin-boton';
    btn.click();
    return 'clic';
  });
  await wait(600);
  const afterClose = await marquee.$$eval('.marquee-bar', els => els.length);
  check('la marquesina se puede cerrar', beforeClose === 1 && closed === 'clic' && afterClose === 0, `${beforeClose} → ${afterClose} (${closed})`);
  await marquee.close();

  await page.close();
} catch (error) {
  console.error('ERROR', error);
  process.exitCode = 1;
} finally {
  await browser.close();
  const failed = results.filter(r => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} comprobaciones OK`);
  if (failed.length) process.exitCode = 1;
}
