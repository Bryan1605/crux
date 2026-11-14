/**
 * QA del editor visual de /admin (solo dev; necesita `npm run dev`).
 *
 * 1. Fidelidad: cada estudio de content/estudios pasa por el editor (cargar
 *    Markdown → guardar Markdown) y su HTML publicado no cambia.
 * 2. Uso: abre un estudio, escribe, aplica formato, usa el menú «/», mueve un
 *    bloque, cambia de modo y comprueba el aviso de cambios sin guardar.
 *    No guarda nada en disco.
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
// Cursiva dentro de cursiva (o negrita dentro de negrita) se ve igual que una
// sola; el editor no anida marcas iguales.
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
// Cursor al final con el propio editor (Ctrl+Fin en Chrome sin ventana no es fiable).
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

// Volver al visual y deshacer.
await page.evaluate(() => [...document.querySelectorAll('.rte__modes button')].find(b => b.textContent === 'Visual').click());
await wait(200);
const visual = await page.$eval(surface, el => el.textContent.includes('Sección QA'));
check('el modo visual conserva lo escrito', visual);

// Borrador local guardado tras la pausa.
await wait(1800);
const draft = await page.evaluate(() => Object.keys(localStorage).some(k => k.startsWith('crux-admin-draft:')));
check('el borrador se autoguarda en el navegador', draft);
await page.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith('crux-admin-draft:')).forEach(k => localStorage.removeItem(k)));

await page.screenshot({ path: join(OUT, 'admin-editor.png') });
check('sin errores en consola', errors.length === 0, errors.slice(0, 3).join(' | '));

await browser.close();
const ok = results.filter(Boolean).length;
console.log(`\n${ok}/${results.length} comprobaciones OK`);
process.exit(ok === results.length ? 0 : 1);
