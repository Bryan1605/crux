/**
 * QA del editor visual y paneles de /admin (solo dev; necesita `npm run dev`).
 *
 * 1. Fidelidad: cada estudio de content/estudios pasa por el editor (cargar
 *    Markdown → guardar Markdown) y su HTML publicado no cambia.
 * 2. Uso: abre un estudio, escribe, aplica formato, usa el menú «/», mueve un
 *    bloque, cambia de modo, abre los modales de pasaje/imagen y comprueba el
 *    aviso de cambios sin guardar. No guarda nada en disco.
 * 3. Nuevas secciones: sidebar agrupado, Resumen, Ajustes del sitio (+ Enlace),
 *    Libros (73), Traducciones (8), Portadas Patrística y Medios.
 */
import puppeteer from 'puppeteer-core';
import { readdirSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { parseFrontmatter } from '../src/lib/frontmatter.js';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT = 'C:\\Users\\PC\\AppData\\Local\\Temp\\opencode\\crux';
const BASE = process.env.CRUX_BASE || 'http://localhost:5173';
const wait = ms => new Promise(r => setTimeout(r, ms));
mkdirSync(OUT, { recursive: true });

const results = [];
const check = (name, ok, detail = '') => {
  results.push(ok);
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
};

const dir = 'content/estudios';
const studies = readdirSync(dir)
  .filter(f => f.endsWith('.md'))
  .map(f => ({ slug: f.slice(0, -3), body: parseFrontmatter(readFileSync(join(dir, f), 'utf8')).body }));

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1000 });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => m.type() === 'error' && errors.push(m.text()));

await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle2', timeout: 60000 });
await page.waitForSelector('.admin__list li button', { timeout: 30000 });
await page.click('.admin__list li button');
await page.waitForSelector('.rte__surface', { timeout: 30000 });
await wait(500);

// ------------------------------------------------------------ 1. fidelidad
const flatten = (html, tag) => {
  let depth = 0;
  return html.replace(new RegExp(`</?${tag}>`, 'g'), t => {
    if (t === `<${tag}>`) return depth++ ? '' : t;
    return --depth ? '' : t;
  });
};
const norm = html => flatten(flatten(html.replace(/\s+/g, ' ').replace(/> </g, '><').trim(), 'em'), 'strong');
const fallos = [];
for (const s of studies) {
  const r = await page.evaluate(md => window.__cruxRoundtrip(md), s.body);
  if (norm(r.before) !== norm(r.after)) {
    const a = norm(r.before);
    const b = norm(r.after);
    let i = 0;
    while (i < a.length && a[i] === b[i]) i++;
    fallos.push(`${s.slug}: «${a.slice(Math.max(0, i - 40), i + 60)}» ≠ «${b.slice(Math.max(0, i - 40), i + 60)}»`);
  }
}
writeFileSync(join(OUT, 'admin-roundtrip.txt'), fallos.join('\n\n'));
check(
  `los ${studies.length} estudios pasan por el editor sin cambiar su HTML`,
  fallos.length === 0,
  fallos.length ? `${fallos.length} distintos · ${fallos.slice(0, 3).join(' | ')}` : `${studies.length}/${studies.length}`
);

// ------------------------------------------------------------ 2. uso
const md = () => page.evaluate(() => document.querySelector('.rte__md')?.value ?? null);
const surface = '.rte__surface';

check('sin cambios no hay aviso de «sin guardar»', !(await page.$('.admin__dirty')));

// Escribir al final, en negrita.
await page.click(surface);
await page.evaluate(() => window.__cruxEditor.commands.focus('end'));
await page.keyboard.down('Control');
await page.keyboard.press('KeyB');
await page.keyboard.up('Control');
await page.keyboard.type('Prueba QA');
await page.keyboard.down('Control');
await page.keyboard.press('KeyB');
await page.keyboard.up('Control');
await wait(200);
check('al escribir aparece el aviso de cambios sin guardar', Boolean(await page.$('.admin__dirty')));

// Menú «/»: nueva línea, «/tit», Enter → título de sección.
await page.keyboard.press('Enter');
await page.keyboard.type('/tit');
await wait(200);
const menu = await page.$$eval('.rte__slash li', li => li.map(l => l.textContent));
check('«/» abre el menú de bloques y filtra', menu.length >= 1 && /Título/.test(menu[0]), menu.slice(0, 3).join(' · '));
await page.keyboard.press('Enter');
await page.keyboard.type('Sección QA');
await wait(200);

// Mover el bloque arriba con Alt+↑.
await page.keyboard.down('Alt');
await page.keyboard.press('ArrowUp');
await page.keyboard.up('Alt');
await wait(200);

// Ver el Markdown resultante.
await page.evaluate(() => [...document.querySelectorAll('.rte__modes button')].find(b => b.textContent === 'Markdown').click());
await wait(300);
const text = await md();
const tail = (text || '').trim().split('\n').filter(Boolean).slice(-2);
check('negrita y título salen en Markdown', /\*\*Prueba QA\*\*/.test(text || '') && /^## Sección QA$/m.test(text || ''), tail.join(' / '));
check('Alt+↑ sube el bloque', tail[0] === '## Sección QA' && tail[1] === '**Prueba QA**', tail.join(' / '));

// Vista previa con anchos.
await page.evaluate(() => [...document.querySelectorAll('.rte__modes button')].find(b => b.textContent === 'Vista previa').click());
await page.evaluate(() => [...document.querySelectorAll('.rte__widths button')].find(b => b.textContent === 'Móvil').click());
await wait(300);
const prev = await page.evaluate(() => {
  const p = document.querySelector('.rte__preview');
  return { w: Math.round(p.getBoundingClientRect().width), h2: p.querySelectorAll('h2').length };
});
check('la vista previa muestra el estudio a 390 px', prev.w <= 392 && prev.h2 > 0, `${prev.w}px · ${prev.h2} títulos`);

// Volver al visual y probar modales de pasaje e imagen + plantilla/ver en web.
await page.evaluate(() => [...document.querySelectorAll('.rte__modes button')].find(b => b.textContent === 'Visual').click());
await wait(200);
const visual = await page.$eval(surface, el => el.textContent.includes('Sección QA'));
check('el modo visual conserva lo escrito', visual);

await page.click('button[aria-label="Insertar pasaje bíblico"]');
await page.waitForSelector('.rte__modal pre', { timeout: 15000 });
await wait(500);
const versePreview = await page.$eval('.rte__modal pre', el => el.textContent || '');
check('el modal de pasaje bíblico carga NTV real', /Juan 3:16/.test(versePreview) && /Dios/.test(versePreview), versePreview.slice(0, 60));
await page.keyboard.press('Escape');
await wait(150);

await page.click('button[aria-label="Insertar imagen"]');
await page.waitForSelector('#img-modal-title', { timeout: 10000 });
const hasImgModal = Boolean(await page.$('#img-modal-title'));
check('el modal de imagen abre con MediaPicker', hasImgModal);
await page.keyboard.press('Escape');
await wait(150);

// Borrador local guardado tras la pausa.
await wait(1800);
const draft = await page.evaluate(() => Object.keys(localStorage).some(k => k.startsWith('crux-admin-draft:')));
check('el borrador se autoguarda en el navegador', draft);
await page.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith('crux-admin-draft:')).forEach(k => localStorage.removeItem(k)));

// ------------------------------------------------------------ 3. sidebar y nuevas secciones
let confirmSeen = false;
page.on('dialog', async dialog => {
  confirmSeen = true;
  await dialog.accept();
});

const clickTab = async tabId => {
  await page.click(`button[data-admin-tab="${tabId}"]`);
};

await clickTab('resumen');
await page.waitForSelector('.admin__dash-card', { timeout: 15000 });
check('cambiar de pestaña con cambios pide confirmación', confirmSeen);
const dashCards = await page.$$eval('.admin__dash-card', els => els.map(e => e.textContent));
check('Resumen muestra conteos reales del proyecto', dashCards.length >= 6 && dashCards.some(t => /Estudios/.test(t)), `${dashCards.length} tarjetas`);

await clickTab('site');
await page.waitForSelector('fieldset.admin__section', { timeout: 15000 });
const siteControls = await page.evaluate(() => {
  const fieldsets = [...document.querySelectorAll('fieldset.admin__section')];
  const footerFs = fieldsets.find(f => /Pie de página/i.test(f.querySelector('legend')?.textContent || ''));
  const footerBtns = footerFs ? [...footerFs.querySelectorAll('button')].map(b => b.textContent.trim()) : [];
  const txt = document.body.textContent || '';
  return {
    addLink: footerBtns.includes('+ Enlace'),
    apariencia: txt.includes('Apariencia y secciones de portada')
  };
});
check('Ajustes del sitio incluye + Enlace en footer y Apariencia', siteControls.addLink && siteControls.apariencia);

await clickTab('libros');
await page.waitForSelector('.admin__list li button', { timeout: 15000 });
const bookCount = await page.$$eval('.admin__list li button', els => els.length);
await page.click('.admin__list li button');
await wait(300);
const bookWordsVisible = await page.evaluate(() => document.body.innerText.includes('Las 7 secciones'));
check('Libros lista las 73 fichas y abre su editor', bookCount === 73 && bookWordsVisible, `${bookCount} libros`);

await clickTab('trad');
await page.waitForSelector('.admin__list li button', { timeout: 15000 });
const tradCount = await page.$$eval('.admin__list li button', els => els.length);
await page.click('.admin__list li button');
await page.waitForSelector('.admin__trad-row', { timeout: 15000 });
const tradRows = await page.$$eval('.admin__trad-row', els => els.length);
check('Traducciones lista 8 archivos y abre vista Codex × Español', tradCount === 8 && tradRows > 0, `${tradCount} archivos · ${tradRows} vv.`);

await clickTab('obras');
await page.waitForSelector('fieldset, .admin__card', { timeout: 15000 });
const obrasCards = await page.$$eval('.admin__card', els => els.length);
check('Portadas Patrística carga las obras ilustradas', obrasCards >= 19, `${obrasCards} obras`);

await clickTab('media');
await page.waitForSelector('.admin__media-card', { timeout: 15000 });
const mediaInfo = await page.evaluate(() => ({
  cards: document.querySelectorAll('.admin__media-card').length,
  hasWebpToggle: document.body.innerText.includes('Optimizar a WebP')
}));
check('Medios lista imágenes y muestra opción WebP', mediaInfo.cards > 0 && mediaInfo.hasWebpToggle, `${mediaInfo.cards} archivos`);

await page.screenshot({ path: join(OUT, 'admin-editor.png') });
check('sin errores en consola', errors.length === 0, errors.slice(0, 3).join(' | '));

await browser.close();
const ok = results.filter(Boolean).length;
console.log(`\n${ok}/${results.length} comprobaciones OK`);
process.exit(ok === results.length ? 0 : 1);
