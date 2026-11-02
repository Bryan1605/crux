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

  // ---------------------------------------------------------------- línea de tiempo
  const tlPage = await makePage();
  await tlPage.goto(`${BASE}/estudio`, { waitUntil: 'domcontentloaded' });
  await wait(2600);
  await tlPage.evaluate(() => document.querySelector('.timeline-section')?.scrollIntoView({ block: 'start' }));
  await wait(800);

  const tl = await tlPage.evaluate(() => {
    const section = document.querySelector('.timeline-section');
    const cards = [...document.querySelectorAll('.timeline__card')];
    const eras = [...document.querySelectorAll('.timeline__era')].map(e => e.textContent.trim());
    const chips = [...document.querySelectorAll('.timeline__chips .chip')].map(c => ({
      label: c.textContent.trim(),
      pressed: c.getAttribute('aria-pressed')
    }));
    const scroller = document.querySelector('.timeline__scroller');
    return {
      section: Boolean(section),
      cards: cards.length,
      linked: cards.filter(c => c.tagName === 'A').length,
      withDate: cards.filter(c => c.querySelector('.timeline__date')).length,
      withTitle: cards.filter(c => c.querySelector('.timeline__title')).length,
      eras,
      chips,
      scrollable: scroller ? scroller.scrollWidth > scroller.clientWidth : false,
      t0: scroller?.scrollLeft ?? 0
    };
  });
  check('sección línea de tiempo en /estudio', tl.section);
  check('pinta los hitos de los personajes', tl.cards >= 24, `${tl.cards} tarjetas`);
  check('todas las tarjetas tienen fecha y título', tl.withDate === tl.cards && tl.withTitle === tl.cards, `${tl.withDate}/${tl.withTitle}`);
  check('todas las tarjetas enlazan a su ficha', tl.linked === tl.cards, `${tl.linked}/${tl.cards} con href`);
  check('línea de eras pintada', tl.eras.length >= 3, tl.eras.join(' · '));
  check('filtros por tipo presentes', tl.chips.length >= 2, tl.chips.map(c => c.label).join(' | '));
  check('el carrete tiene recorrido horizontal', tl.scrollable, '');
  await tlPage.screenshot({ path: `${OUT}/v-timeline.png` });

  const tlScroll = await tlPage.$eval('.timeline__scroller', el => {
    el.scrollLeft = 0;
    return el.scrollLeft;
  });
  check('carrete inicia a la izquierda', tlScroll <= 6, `${tlScroll}px`);

  // Flecha → desplaza y teclado también
  await tlPage.evaluate(() => {
    const btns = [...document.querySelectorAll('.timeline__nav')];
    btns[btns.length - 1].click();
  });
  await wait(800);
  const tlAfterArrow = await tlPage.$eval('.timeline__scroller', el => el.scrollLeft);
  check('el botón → desplaza la línea', tlAfterArrow > 100, `${tlAfterArrow}px`);

  await tlPage.evaluate(() => document.querySelector('.timeline__scroller').scrollLeft = 0);
  await wait(300);
  await tlPage.focus('.timeline__scroller');
  await tlPage.keyboard.press('ArrowRight');
  await wait(800);
  const tlAfterKey = await tlPage.$eval('.timeline__scroller', el => el.scrollLeft);
  check('la tecla → desplaza la línea', tlAfterKey > 100, `${tlAfterKey}px`);

  // El filtro por tipo marca el chip
  await tlPage.evaluate(() => {
    const chip = [...document.querySelectorAll('.timeline__chips .chip')].find(c => /personaje/i.test(c.textContent));
    chip?.click();
  });
  await wait(500);
  const chipState = await tlPage.evaluate(() => {
    const pressed = [...document.querySelectorAll('.timeline__chips .chip')].filter(c => c.getAttribute('aria-pressed') === 'true');
    return { n: pressed.length, label: pressed[0]?.textContent.trim() };
  });
  check('el filtro Personajes se marca', chipState.n === 1 && /personaje/i.test(chipState.label || ''), JSON.stringify(chipState));

  // Un hito navega a su ficha (todo el camino, no solo href)
  const firstHref = await tlPage.$eval('.timeline__card', el => el.getAttribute('href'));
  await tlPage.click('.timeline__card');
  await wait(1400);
  const afterNav = tlPage.url();
  check('clic en un hito navega a su ficha', afterNav.includes('/estudio/personajes/') && afterNav !== `${BASE}/estudio`, `${firstHref}`);
  await tlPage.screenshot({ path: `${OUT}/v-timeline-personaje.png` });
  await tlPage.goBack();
  await wait(1600);
  await tlPage.close();

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
  check('«Todos» va sin sidebar de temas', !(await page.$('.estudio__side')));

  // ---------------------------------------------------------------- temas
  const temasPage = await makePage();
  await temasPage.goto(`${BASE}/estudio?cat=01-fundamentos`, { waitUntil: 'domcontentloaded' });
  await wait(2200);
  const side = await temasPage.evaluate(() => {
    const nav = document.querySelector('.estudio__side');
    const links = [...document.querySelectorAll('.estudio__side a')];
    return {
      label: nav?.getAttribute('aria-label'),
      sticky: nav ? getComputedStyle(nav).position : '',
      temas: links.filter(a => a.dataset.kind === 'tema').length,
      sum: links.reduce((n, a) => n + Number(a.querySelector('.estudio__side-count')?.textContent || 0), 0),
      first: links[0]?.textContent.trim(),
      broken: links.filter(a => !document.getElementById(a.getAttribute('href').slice(1))).length
    };
  });
  check('Fundamentos: sidebar con 13 temas', side.temas === 13, `${side.temas} · ${side.label}`);
  check('los recuentos de la sidebar suman 92', side.sum === 92, `${side.sum}`);
  check('«Empieza aquí» va la primera', /^Empieza aquí/.test(side.first || ''), String(side.first));
  check('cada tema enlaza a su grupo', side.broken === 0, `${side.broken} sin destino`);
  check('la sidebar es sticky en escritorio', side.sticky === 'sticky', side.sticky);

  await temasPage.evaluate(() => {
    const link = [...document.querySelectorAll('.estudio__side a')].find(a => a.textContent.includes('Últimos tiempos'));
    link?.click();
  });
  await wait(1600);
  const jumped = await temasPage.evaluate(() => {
    const link = [...document.querySelectorAll('.estudio__side a')].find(a => a.textContent.includes('Últimos tiempos'));
    const head = document.getElementById(link.getAttribute('href').slice(1));
    return {
      top: Math.round(head.getBoundingClientRect().top),
      current: link.getAttribute('aria-current'),
      others: document.querySelectorAll('.estudio__side a[aria-current="true"]').length
    };
  });
  check(
    'clic en un tema baja a su grupo y queda aria-current',
    jumped.current === 'true' && jumped.others === 1 && jumped.top >= 0 && jumped.top < 260,
    JSON.stringify(jumped)
  );
  await temasPage.screenshot({ path: `${OUT}/v-temas.png` });

  const enVista = () =>
    temasPage.evaluate(() => ({
      cards: document.querySelectorAll('.estudio__grid .study-card').length,
      rows: document.querySelectorAll('.row-card').length,
      car: document.querySelectorAll('.concave-carousel__item').length,
      groups: document.querySelectorAll('.estudio__group-head h2').length
    }));
  const vCards = await enVista();
  await clickView(temasPage, 'lista');
  await wait(700);
  const vList = await enVista();
  await temasPage.screenshot({ path: `${OUT}/v-temas-lista.png` });
  await clickView(temasPage, 'carrusel');
  await wait(1000);
  const vCar = await enVista();
  check(
    'las tres vistas muestran las mismas 92 fichas',
    vCards.cards === 92 && vList.rows === 92 && vCar.car === 92,
    `tarjetas ${vCards.cards} · lista ${vList.rows} · carrusel ${vCar.car}`
  );
  check('tarjetas y lista se agrupan por tema (14 grupos)', vCards.groups === 14 && vList.groups === 14, `${vCards.groups}/${vList.groups}`);

  const carInfo = () => temasPage.$eval('.estudio__carousel-count', el => el.textContent.trim()).catch(() => '');
  const car0 = await carInfo();
  check('el carrusel cuenta «1 de 92 · Empieza aquí»', car0 === '1 de 92 · Empieza aquí', car0);
  await temasPage.evaluate(() => {
    [...document.querySelectorAll('.estudio__jump-btn')].find(b => b.textContent.trim() === 'Cristo')?.click();
  });
  await wait(1400);
  const car1 = await carInfo();
  check('«Saltar a: Cristo» lleva el carrusel a ese tema', / · Cristo$/.test(car1), car1);
  await temasPage.screenshot({ path: `${OUT}/v-temas-carrusel.png` });
  await clickView(temasPage, 'tarjetas');
  await temasPage.close();

  const temasMovil = await makePage('no-preference', 390, 844);
  await temasMovil.goto(`${BASE}/estudio?cat=01-fundamentos`, { waitUntil: 'domcontentloaded' });
  await wait(2200);
  const sideMovil = await temasMovil.evaluate(() => {
    const nav = document.querySelector('.estudio__side');
    return {
      position: nav ? getComputedStyle(nav).position : '',
      tabs: nav ? nav.scrollWidth > nav.clientWidth : false
    };
  });
  check('móvil: los temas son pestañas con scroll horizontal, sin sticky', sideMovil.position !== 'sticky' && sideMovil.tabs, JSON.stringify(sideMovil));
  await checkNoOverflow(temasMovil, 'móvil temas');
  await temasMovil.screenshot({ path: `${OUT}/v-mobile-temas.png` });
  await temasMovil.close();

  // ---------------------------------------------------------------- móvil
  const mobile = await makePage('no-preference', 390, 844);
  await mobile.goto(`${BASE}/estudio`, { waitUntil: 'domcontentloaded' });
  await wait(2200);

  const mobileTl = await mobile.evaluate(() => {
    const scroller = document.querySelector('.timeline__scroller');
    const nav = document.querySelector('.timeline__nav');
    return {
      has: Boolean(scroller),
      scrollWidth: scroller?.scrollWidth || 0,
      clientWidth: scroller?.clientWidth || 0,
      navDisplay: nav ? getComputedStyle(nav).display : 'none'
    };
  });
  check('línea de tiempo en móvil', mobileTl.has && mobileTl.scrollWidth > mobileTl.clientWidth, `ancho ${mobileTl.scrollWidth}px`);
  check('sin botones ‹ › en móvil (gesto táctil)', mobileTl.navDisplay === 'none', String(mobileTl.navDisplay));
  await checkNoOverflow(mobile, 'móvil línea de tiempo');
  await mobile.screenshot({ path: `${OUT}/v-mobile-timeline.png` });

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

  // ---------------------------------------------------------------- imágenes de personaje
  const personajeImgs = [
    '/img/personajes/JuanBautista/JuanBautistaPortada.webp',
    '/img/personajes/JuanBautista/JuanBautistaNace.webp',
    '/img/personajes/JuanBautista/JuanPredicaenelDesierto.webp'
  ];
  for (const src of personajeImgs) {
    const res = await fetch(`${BASE}${src}`);
    check(`imagen servida ${src.split('/').pop()}`, res.ok && /image\//.test(res.headers.get('content-type') || ''), String(res.status));
  }
  const personajePage = await makePage();
  await personajePage.goto(`${BASE}/estudio/personajes/juan-bautista`, { waitUntil: 'domcontentloaded' });
  await wait(2500);
  const brokenImgs = await personajePage.evaluate(() =>
    [...document.querySelectorAll('img')]
      .filter(i => i.complete && i.naturalWidth === 0)
      .map(i => i.getAttribute('src'))
  );
  check('la ficha de Juan el Bautista sin imágenes rotas', brokenImgs.length === 0, brokenImgs.join(' | ') || 'todas cargan');
  await personajePage.close();

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
  const reducedTl = await reduced.evaluate(() => {
    const item = document.querySelector('.timeline__item');
    return { has: Boolean(item), animation: item ? getComputedStyle(item).animationName : 'sin-item' };
  });
  check(
    'reduced-motion sin animación de entrada',
    reducedTl.has && reducedTl.animation === 'none',
    String(reducedTl.animation)
  );
  await reduced.close();

  // ---------------------------------------------------------------- portada
  const home = await makePage('no-preference', 1280, 900);
  await home.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await wait(3200);

  const portada = await home.evaluate(() => {
    const clases = [...document.querySelectorAll('main > section')].map(s => s.className);
    const principales = [...document.querySelectorAll('main .btn--primary')].map(a => a.getAttribute('href'));
    return {
      clases,
      buscador: Boolean(document.querySelector('.hero__search input')),
      principales,
      stats: document.querySelectorAll('.stats__item').length,
      categorias: document.querySelectorAll('.cat-card').length,
      puertas: document.querySelectorAll('.section--alt .grid .card').length,
      personajes: document.querySelectorAll('.char-card').length,
      imgsRotas: [...document.images].filter(i => i.complete && i.naturalWidth === 0).length
    };
  });
  check('la portada pinta sus secciones', portada.clases.length >= 8, portada.clases.map(c => c.split(' ')[0]).join(' · '));
  check('cifras reales en la portada', portada.stats === 5, `${portada.stats} cifras`);
  check('rejilla de categorías completa', portada.categorias === 10, `${portada.categorias} tarjetas`);
  check('personajes destacados con portada', portada.personajes === 4, `${portada.personajes} tarjetas`);
  check('buscador en el héroe', portada.buscador);
  check('una sola acción primaria (héroe y cierre)', portada.principales.length === 2 && portada.principales.every(h => h === '/estudio'), portada.principales.join(' | '));
  check('portada sin imágenes rotas', portada.imgsRotas === 0, `${portada.imgsRotas} rotas`);
  await checkNoOverflow(home, 'portada');
  await home.screenshot({ path: `${OUT}/v-home.png` });

  // El buscador del héroe lleva a la búsqueda global con la consulta.
  await home.type('.hero__search input', 'nicea');
  await home.click('.hero__search button[type="submit"]');
  await wait(1600);
  const trasBuscar = await home.evaluate(() => ({
    url: location.href,
    resultados: document.querySelectorAll('.buscar__item').length,
    valor: document.querySelector('.buscar__input, input[type="search"]')?.value
  }));
  check('el buscador del héroe busca de verdad', /\/buscar\?q=nicea/.test(trasBuscar.url) && trasBuscar.resultados > 0, `${trasBuscar.url.split('/buscar')[1] || ''} · ${trasBuscar.resultados} resultados`);
  await home.close();

  // La barra de versículos va arriba, encima del menú, y no lo tapa.
  const barra = await makePage('no-preference', 1280, 900);
  await barra.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await wait(3200);
  const arriba = await barra.evaluate(() => {
    const b = document.querySelector('.marquee-bar');
    const nav = document.querySelector('.card-nav');
    const rb = b?.getBoundingClientRect();
    return {
      hayBarra: Boolean(b),
      barraTop: rb?.top ?? null,
      barraAbajo: rb?.bottom ?? null,
      barraAlto: rb?.height ?? null,
      navArriba: nav?.getBoundingClientRect().top ?? null,
      varAltura: getComputedStyle(document.documentElement).getPropertyValue('--marquee-h').trim()
    };
  });
  check(
    'la barra de versículos está arriba y no tapa el menú',
    arriba.hayBarra && Math.abs(arriba.barraTop) < 1 && arriba.barraAbajo <= arriba.navArriba + 1,
    `barra top ${Math.round(arriba.barraTop)} · alto ${Math.round(arriba.barraAlto)} · abajo ${Math.round(arriba.barraAbajo)} ≤ menú ${Math.round(arriba.navArriba)} · --marquee-h=${arriba.varAltura}`
  );

  await barra.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await wait(900);
  const abajo = await barra.evaluate(() => {
    const pie = document.querySelector('footer');
    return {
      pieAbajo: pie?.getBoundingClientRect().bottom ?? null,
      alto: window.innerHeight,
      paddingBody: getComputedStyle(document.body).paddingBottom
    };
  });
  check(
    'el pie llega al final sin padding inferior para la barra',
    parseFloat(abajo.paddingBody) === 0 && abajo.pieAbajo <= abajo.alto + 1,
    `pie ${Math.round(abajo.pieAbajo)} ≤ ventana ${abajo.alto} · padding-bottom ${abajo.paddingBody}`
  );
  await barra.close();

  // El pie del banner cambia al empezar la transición, no al terminarla (2,2 s).
  const banner = await makePage('no-preference', 1280, 900);
  await banner.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await wait(2500);
  await banner.evaluate(() => document.querySelector('.banner')?.scrollIntoView());
  const pie = await banner.evaluate(
    () =>
      new Promise(resolve => {
        const swap = document.querySelector('.banner .liquid-swap');
        const caption = document.querySelector('.banner__caption');
        if (!swap || !caption) return resolve({ error: 'sin banner o sin pie' });
        const antes = caption.textContent.trim();
        let t0 = null;
        const obs = new MutationObserver(() => {
          if (t0 === null && swap.querySelector('.liquid-swap__layer--next')) t0 = performance.now();
          const ahora = caption.textContent.trim();
          if (t0 !== null && ahora !== antes) {
            obs.disconnect();
            resolve({ ms: Math.round(performance.now() - t0), antes, ahora });
          }
        });
        obs.observe(document.querySelector('.banner'), { childList: true, subtree: true, characterData: true });
        const r = swap.getBoundingClientRect();
        swap.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 }));
        setTimeout(() => { obs.disconnect(); resolve({ timeout: true, t0, antes }); }, 4000);
      })
  );
  check(
    'el pie del banner cambia al empezar la transición (< 300 ms)',
    typeof pie.ms === 'number' && pie.ms < 300,
    pie.ms != null ? `${pie.ms} ms · «${pie.antes}» → «${pie.ahora}»` : JSON.stringify(pie)
  );
  await banner.close();

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
  const trasCerrar = await marquee.evaluate(() => ({
    varAltura: getComputedStyle(document.documentElement).getPropertyValue('--marquee-h').trim(),
    paddingTop: getComputedStyle(document.body).paddingTop,
    navArriba: document.querySelector('.card-nav')?.getBoundingClientRect().top ?? null
  }));
  check(
    'al cerrarla, el menú sube y no queda hueco',
    trasCerrar.varAltura === '' && parseFloat(trasCerrar.paddingTop) === 0 && trasCerrar.navArriba < 30,
    `--marquee-h=«${trasCerrar.varAltura}» · padding-top ${trasCerrar.paddingTop} · menú ${Math.round(trasCerrar.navArriba)}`
  );
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
