/**
 * QA de /apologetica/shincheonji (necesita `npm run dev`; CRUX_BASE para otra base).
 *
 * - Datos: 100 preguntas en 10 bloques y cada referencia existe en la NTV.
 * - Página: las 100 preguntas, el griego y la NTV de una pregunta del NT, el
 *   aviso del AT, la nota de numeración de 2 Co 13:14, la respuesta cerrada
 *   hasta que se abre, los enlaces a Exégesis y al manuscrito, y sin scroll
 *   horizontal en móvil.
 */
import puppeteer from 'puppeteer-core';
import { readFileSync } from 'node:fs';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = (process.env.CRUX_BASE || 'http://localhost:5173').replace(/\/$/, '');
const URL_PAGE = `${BASE}/apologetica/shincheonji`;
const wait = ms => new Promise(r => setTimeout(r, ms));

const results = [];
const check = (name, ok, detail = '') => {
  results.push(ok);
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
};

// ------------------------------------------------------------------ datos
const data = JSON.parse(readFileSync(new URL('../content/apologetica/shincheonji-preguntas.json', import.meta.url), 'utf8'));
const preguntas = data.bloques.flatMap(b => b.preguntas);
check('datos: 10 bloques y 100 preguntas numeradas', data.bloques.length === 10 && preguntas.every((p, i) => p.n === i + 1) && preguntas.length === 100);

const ntv = new Map();
const faltan = [];
for (const p of preguntas) {
  for (const r of [...p.refs, ...p.claveRefs]) {
    if (!ntv.has(r.libro)) ntv.set(r.libro, JSON.parse(readFileSync(new URL(`../public/textos/exegesis/ntv/${r.libro}.json`, import.meta.url), 'utf8')));
    const ch = ntv.get(r.libro).chapters.find(c => (c.num ?? c.n) === r.cap);
    for (let v = r.desde; v <= r.hasta; v++) if (!ch?.verses.some(x => x.n === v)) faltan.push(`${p.n}: ${r.label}`);
  }
}
check('datos: todos los versículos citados existen en la NTV', faltan.length === 0, faltan.slice(0, 5).join(' | '));

// El texto copiado en el JSON sigue igual que la NTV y el Codex de public/textos.
const codex = new Map();
const distintos = [];
for (const p of preguntas) {
  for (const r of p.refs) {
    const ch = ntv.get(r.libro).chapters.find(c => (c.num ?? c.n) === r.cap);
    for (const v of r.ntv) {
      const src = ch.verses.find(x => x.n === v.n)?.text.replace(/\[[a-z]{1,2}\]/g, '');
      if (src !== v.text) distintos.push(`${p.n}: NTV ${r.label}`);
    }
    if (r.grc.length) {
      if (!codex.has(r.libro)) codex.set(r.libro, JSON.parse(readFileSync(new URL(`../public/textos/exegesis/codex/${r.libro}.json`, import.meta.url), 'utf8')));
      const g = r.codex ? { ...r, ...r.codex } : r;
      const cch = codex.get(r.libro).chapters.find(c => c.num === g.cap);
      for (const v of r.grc) if (cch?.verses.find(x => x.n === v.n)?.grc !== v.grc) distintos.push(`${p.n}: Codex ${r.label}`);
    }
  }
}
check(
  'datos: el texto copiado coincide con la NTV y el Codex del sitio',
  distintos.length === 0,
  distintos.length ? `${distintos.slice(0, 4).join(' | ')} — vuelve a ejecutar node scripts/import-shincheonji.mjs --write` : ''
);

// ------------------------------------------------------------------ página
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
try {
  for (const [w, h] of [[1280, 900], [390, 844]]) {
    const page = await browser.newPage();
    await page.setViewport({ width: w, height: h, isMobile: w < 800, hasTouch: w < 800 });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    const res = await page.goto(URL_PAGE, { waitUntil: 'networkidle2', timeout: 60000 });
    await page.waitForSelector('.scj-q', { timeout: 30000 });
    // GitHub Pages sirve el SPA con un 404 en rutas sin prerender; aquí debe ser 200.
    check(`${w}px: la página responde`, Boolean(res) && res.status() < 400, String(res?.status()));

    const head = await page.evaluate(() => ({
      h1: document.querySelector('h1')?.textContent.replace(/\s+/g, ' ').trim(),
      preguntas: document.querySelectorAll('.scj-q').length,
      bloques: document.querySelectorAll('.scj-block').length,
      codex: Boolean(document.querySelector('.scj-card--codex')),
      over: document.documentElement.scrollWidth - window.innerWidth,
      title: document.title
    }));
    check(`${w}px: título, 10 bloques y 100 preguntas`, /100 preguntas/.test(head.h1) && head.bloques === 10 && head.preguntas === 100, `${head.bloques} bloques · ${head.preguntas} preguntas`);
    check(`${w}px: explica qué es el Codex Sinaiticus`, head.codex);
    check(`${w}px: sin scroll horizontal`, head.over <= 1, `${head.over}px`);

    // Pregunta 1 (NT): griego + NTV, respuesta cerrada, enlaces.
    await page.evaluate(() => document.getElementById('p-1').scrollIntoView());
    await page.waitForFunction(() => document.querySelector('#p-1 .scj-grc') && document.querySelector('#p-1 .scj-es'), { timeout: 20000 });
    const q1 = await page.evaluate(() => {
      const q = document.getElementById('p-1');
      return {
        grc: q.querySelector('.scj-grc').textContent,
        es: q.querySelector('.scj-es').textContent,
        open: q.querySelector('details').open,
        exegesis: q.querySelector('a[href*="/exegesis?libro=mateo&cap=28"]') !== null,
        manuscrito: [...q.querySelectorAll('a')].some(a => a.href.includes('codexsinaiticus.org/en/manuscript.aspx?book=33&chapter=28') && a.rel.includes('noopener'))
      };
    });
    check(`${w}px: Mt 28:19 en griego (ονομα) y en la NTV (en el nombre)`, /ονομα/.test(q1.grc) && /en el nombre/.test(q1.es));
    check(`${w}px: la respuesta está cerrada hasta que se abre`, q1.open === false);
    check(`${w}px: enlaces a Exégesis y al manuscrito`, q1.exegesis && q1.manuscrito);

    // Pregunta 81 (AT sin Codex): aviso honesto, la NTV sí sale.
    await page.evaluate(() => document.getElementById('p-81').scrollIntoView());
    await page.waitForFunction(() => document.querySelector('#p-81 .scj-es'), { timeout: 20000 });
    const q81 = await page.evaluate(() => document.getElementById('p-81').textContent);
    check(`${w}px: Dt 18 avisa que el Codex no lo conserva y que el original es hebreo`, /no conserva este pasaje/.test(q81) && /hebreo/.test(q81));

    // Pregunta 9: 2 Co 13:14 (NTV) = 13:13 en griego.
    await page.evaluate(() => document.getElementById('p-9').scrollIntoView());
    await page.waitForFunction(() => document.querySelector('#p-9 .scj-grc'), { timeout: 20000 });
    const q9 = await page.evaluate(() => ({ t: document.getElementById('p-9').textContent, g: document.querySelector('#p-9 .scj-grc').textContent }));
    check(`${w}px: 2 Co 13:14 muestra el griego del 13:13 con su nota`, /13:13/.test(q9.t) && /χαριϲ/.test(q9.g));

    // El índice de temas lleva al bloque y este no se desplaza al llegar.
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.evaluate(() => document.querySelector('a[href="#bloque-IX"]').click());
    await wait(1500);
    const salto = await page.evaluate(() => Math.round(document.getElementById('bloque-IX').getBoundingClientRect().top));
    check(`${w}px: el índice lleva al tema IX y queda arriba`, salto >= 0 && salto < 260, `${salto}px desde arriba`);

    await page.click('#p-1 summary');
    const opened = await page.evaluate(() => document.querySelector('#p-1 details').open && /singular/.test(document.querySelector('#p-1 details').textContent));
    check(`${w}px: «Lo que dice el texto» abre la clave`, opened);
    check(`${w}px: sin errores de JavaScript`, errors.length === 0, errors.slice(0, 2).join(' | '));
    await page.close();
  }
} finally {
  await browser.close();
}

const ok = results.filter(Boolean).length;
console.log(`\n${ok}/${results.length} comprobaciones OK`);
process.exit(ok === results.length ? 0 : 1);
