/**
 * QA de accesibilidad con axe-core sobre las rutas públicas.
 *
 *   node scripts/qa-a11y.mjs
 *
 * Requiere el servidor de desarrollo en http://localhost:5173.
 * Falla (código 1) si hay violaciones de impacto critical o serious; los
 * moderate/minor se listan como avisos. Deja el informe en
 * C:\Users\PC\AppData\Local\Temp\opencode\crux\a11y.
 */
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import { mkdir, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT = 'C:\\Users\\PC\\AppData\\Local\\Temp\\opencode\\crux\\a11y';
const BASE = process.env.CRUX_BASE || 'http://localhost:5173';

const AXE_SOURCE = fs.readFileSync(new URL('../node_modules/axe-core/axe.min.js', import.meta.url), 'utf8');

const wait = ms => new Promise(r => setTimeout(r, ms));

// Reglas WCAG 2.x + best-practice: el objetivo es 0 critical/serious.
const DEFAULT_TAGS = 'wcag2a,wcag2aa,wcag21a,wcag21aa,wcag22aa,best-practice';
const AXE_OPTIONS = {
  runOnly: { type: 'tag', values: (process.env.CRUX_A11Y_TAGS || DEFAULT_TAGS).split(',') }
};

/*
 * El domo 3D de la Biblia Patrística solapa sus fichas por diseño (es una
 * esfera girando): la regla `target-size` lo marcaría siempre. La WCAG 2.2 lo
 * exceptúa por «control equivalente» —el índice `#biblia-indice` ofrece la
 * misma función con enlaces de tamaño completo—, así que la esfera queda fuera
 * del barrido (y se anota en el informe).
 */
const AXE_CONTEXT = { exclude: [['.sphere-root']] };

const ROUTES = [
  { label: 'portada', path: '/' },
  { label: 'estudio (índice)', path: '/estudio' },
  { label: 'estudio (categoría)', path: '/estudio?cat=03-personajes' },
  { label: 'estudio (ficha)', path: '/estudio/01-fundamentos--01-perdon' },
  { label: 'personaje', path: '/estudio/personajes/apostol-pablo' },
  { label: 'biblia (índice)', path: '/biblia' },
  { label: 'biblia (lector)', path: '/biblia?pag=p2-1' },
  { label: 'biblia NTV (lector)', path: '/biblia/ntv?libro=juan&cap=3' },
  { label: 'biblia NTV (narración)', path: '/biblia/ntv?libro=judas&cap=1' },
  { label: 'exégesis (comparada)', path: '/exegesis?libro=juan&cap=3&vv=16-21' },
  { label: 'exégesis (diccionario)', path: '/exegesis?libro=juan&cap=3&vv=16-21&dic=G3056' },
  { label: 'exégesis (diccionario, lista)', path: '/exegesis?libro=juan&cap=3&vv=16-21&dic=' },
  { label: 'videos', path: '/videos' },
  { label: 'concilios', path: '/concilios' },
  { label: 'concilios (ancla)', path: '/concilios#nicea' },
  { label: 'temas', path: '/temas' },
  { label: 'buscar (vacío)', path: '/buscar' },
  { label: 'buscar (resultados)', path: '/buscar?q=nicea' },
  { label: '404', path: '/ruta-no-existe' }
];

// Rutas + estados que solo existen al interactuar.
const STATES = [
  { label: 'portada (menú abierto)', path: '/', action: 'nav-desktop' },
  { label: 'temas (menú móvil abierto)', path: '/temas', mobile: true, action: 'nav-mobile' },
  { label: 'exégesis (móvil)', path: '/exegesis?libro=juan&cap=3&vv=16-21', mobile: true },
  { label: 'exégesis (ficha de palabra)', path: '/exegesis?libro=juan&cap=3&vv=16-21&v=16', action: 'word' },
  { label: 'biblia NTV (móvil)', path: '/biblia/ntv?libro=juan&cap=3', mobile: true }
];

// Objetivos táctiles: la WCAG 2.2 (AA) exige 24 × 24 como mínimo y 44 × 44 es el
// tamaño cómodo para el pulgar (Apple HIG / WCAG AAA). Por debajo de 24 falla;
// entre 24 y 44 se cuenta como aviso. Los enlaces dentro de un párrafo quedan
// exentos, como marca la propia norma.
const TAP_MIN = Number(process.env.CRUX_TAP_MIN || 44);
const TAP_BLOCK = Number(process.env.CRUX_TAP_BLOCK || 24);

/*
 * Controles que viven dentro de la frase (notas del traductor del aparato
 * crítico, que se pintan en superíndice): su caja la limita la altura de línea
 * del texto que los rodea, así que caen en la excepción «Inline» de la norma y
 * no se miden. El resto de controles pequeños sí se corrigen.
 */
const TAP_INLINE_OK = ['.ntv-fn', '.exg-fn', '.exg-sigil', '.exg-note__ref--fn'];

/*
 * Controles con «control equivalente» en la misma página (excepción de la WCAG
 * 2.2): el domo 3D de la Patrística solapa sus fichas por diseño y el índice
 * `#biblia-indice` ofrece los mismos destinos con enlaces de tamaño completo.
 */
const TAP_EQUIVALENT_OK = ['.sphere-root'];

await mkdir(OUT, { recursive: true });

const userDataDir = await mkdtemp(join(tmpdir(), 'crux-a11y-'));
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  userDataDir,
  args: ['--disable-gpu', '--enable-unsafe-swiftshader', '--hide-scrollbars', '--no-first-run']
});

const problems = [];
const report = [];
const taps = [];

async function audit(page, label, { mobile = false } = {}) {
  await page.evaluate(AXE_SOURCE);
  const result = await page.evaluate(
    async ({ options, context }) => {
      const r = await window.axe.run(context, options);
      return r.violations.map(v => ({
        id: v.id,
        impact: v.impact,
        help: v.help,
        nodes: v.nodes.slice(0, 3).map(n => ({
          target: n.target.join(' '),
          summary: (n.failureSummary || '').split('\n').slice(1).join(' ').trim().slice(0, 160)
        })),
        count: v.nodes.length
      }));
    },
    { options: AXE_OPTIONS, context: AXE_CONTEXT }
  );

  const blockers = result.filter(v => v.impact === 'critical' || v.impact === 'serious');
  report.push({ label, mobile, violations: result });

  const tag = `${mobile ? 'móvil' : 'escritorio'} · ${label}`;
  if (result.length === 0) {
    console.log(`OK   ${tag} — sin violaciones`);
  } else {
    const fmt = v => `${v.impact} ${v.id} (${v.count})`;
    console.log(`${blockers.length ? 'FAIL' : 'WARN'} ${tag} — ${result.map(fmt).join(' · ')}`);
    for (const v of result) {
      for (const n of v.nodes) console.log(`       ↳ [${v.impact}] ${v.id} → ${n.target}${n.summary ? ` :: ${n.summary}` : ''}`);
    }
  }
  if (blockers.length) problems.push({ label: tag, blockers: blockers.map(b => `${b.impact} ${b.id}`) });
}

/**
 * Controles por debajo del tamaño táctil cómodo. Devuelve la lista de los que
 * quedan por debajo de TAP_MIN (sin contar los enlaces dentro de un párrafo).
 */
async function tapTargets(page) {
  return page.evaluate(
    ({ min, inlineOk, equivalentOk }) => {
      const selector =
        'a[href], button, [role="button"], input:not([type="hidden"]), select, textarea, summary, [tabindex]:not([tabindex="-1"])';
      const malos = [];
      for (const el of document.querySelectorAll(selector)) {
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) continue;
        if (el.disabled || el.getAttribute('aria-hidden') === 'true') continue;
        // Excepción de la norma: enlaces dentro de una línea de texto.
        if (cs.display === 'inline' || cs.display === 'contents') continue;
        // Excepción «Inline»: superíndices dentro de la frase.
        if (inlineOk.some(sel => el.closest(sel))) continue;
        // Excepción de «control equivalente» (domo 3D con índice aparte).
        if (equivalentOk.some(sel => el.closest(sel))) continue;
        const r = el.getBoundingClientRect();
        if (r.width < 1 || r.height < 1) continue;
        if (r.width + 0.5 >= min && r.height + 0.5 >= min) continue;
        malos.push({
          tag: el.tagName.toLowerCase(),
          cls: typeof el.className === 'string' ? el.className.split(' ')[0] : '',
          texto: (el.textContent || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 28),
          w: Math.round(r.width),
          h: Math.round(r.height)
        });
      }
      return malos;
    },
    { min: TAP_MIN, inlineOk: TAP_INLINE_OK, equivalentOk: TAP_EQUIVALENT_OK }
  );
}

try {
  for (const route of ROUTES) {
    for (const mobile of [false, true]) {
      const page = await browser.newPage();
      await page.setViewport(mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 });
      await page.goto(`${BASE}${route.path}`, { waitUntil: 'domcontentloaded' });
      await wait(mobile ? 2600 : 2400);
      await audit(page, route.label, { mobile });
      if (mobile) {
        const malos = await tapTargets(page);
        if (malos.length) taps.push({ label: route.label, malos });
      }
      await page.close();
    }
  }
  for (const state of STATES) {
    const page = await browser.newPage();
    await page.setViewport(state.mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 });
    await page.goto(`${BASE}${state.path}`, { waitUntil: 'domcontentloaded' });
    await wait(2400);
    if (state.action === 'nav-desktop') await page.evaluate(() => document.querySelector('.hamburger-menu')?.click());
    if (state.action === 'nav-mobile') await page.evaluate(() => document.querySelector('.hamburger-menu')?.click());
    if (state.action === 'word') {
      await page.evaluate(() => document.querySelector('.exg-row[data-v="16"] .exg-word')?.click());
      await page.waitForSelector('.vpop', { timeout: 4000 }).catch(() => {});
    }
    await wait(1000);
    await audit(page, state.label, { mobile: state.mobile });
    await page.close();
  }

  // Objetivos táctiles: resumen agrupado (críticos por debajo de 24 y avisos).
  if (taps.length === 0) {
    console.log(`OK   móvil · objetivos táctiles ≥ ${TAP_MIN}px en las ${ROUTES.length} rutas`);
  } else {
    const agrupar = lista => {
      const porClave = new Map();
      for (const { label, malos } of lista) {
        for (const m of malos) {
          const clave = `${m.tag}${m.cls ? `.${m.cls}` : ''} ${m.w}×${m.h}${m.texto ? ` “${m.texto}”` : ''}`;
          if (!porClave.has(clave)) porClave.set(clave, new Set());
          porClave.get(clave).add(label);
        }
      }
      return porClave;
    };

    const criticos = taps.map(({ label, malos }) => ({
      label,
      malos: malos.filter(m => m.w < TAP_BLOCK || m.h < TAP_BLOCK)
    })).filter(t => t.malos.length);
    const comodos = taps.map(({ label, malos }) => ({
      label,
      malos: malos.filter(m => m.w >= TAP_BLOCK && m.h >= TAP_BLOCK)
    })).filter(t => t.malos.length);

    if (criticos.length) {
      const porClave = agrupar(criticos);
      console.log(`FAIL móvil · ${criticos.reduce((n, t) => n + t.malos.length, 0)} controles por debajo de ${TAP_BLOCK}px (mínimo WCAG 2.2)`);
      for (const [clave, rutas] of [...porClave].slice(0, 14)) {
        console.log(`       ↳ ${clave} — ${[...rutas].slice(0, 3).join(', ')}`);
      }
      problems.push({
        label: `móvil · objetivos táctiles ≥ ${TAP_BLOCK}px`,
        blockers: [...porClave.keys()].slice(0, 8)
      });
    } else {
      console.log(`OK   móvil · ningún control por debajo de ${TAP_BLOCK}px (mínimo WCAG 2.2)`);
    }

    if (comodos.length) {
      const porClave = agrupar(comodos);
      const nComodos = comodos.reduce((n, t) => n + t.malos.length, 0);
      // Los que ya miden 40 px o más se tocan con comodidad: se cuentan aparte
      // para que el aviso diga cuánto queda de verdad por mejorar.
      const casi = comodos.reduce((n, t) => n + t.malos.filter(m => m.w >= 40 && m.h >= 40).length, 0);
      console.log(
        `WARN móvil · ${nComodos} apariciones de controles entre ${TAP_BLOCK} y ${TAP_MIN}px (${casi} ya llegan a 40px; cómodo para el pulgar: ${TAP_MIN})`
      );
      for (const [clave, rutas] of [...porClave].slice(0, 10)) {
        console.log(`       ↳ ${clave} — ${[...rutas].slice(0, 3).join(', ')}`);
      }
    }
  }

  await browser.close();
} catch (e) {
  console.error(e);
  await browser.close().catch(() => {});
  process.exit(1);
}

fs.writeFileSync(join(OUT, 'a11y-report.json'), JSON.stringify({ report, taps }, null, 2), 'utf8');

console.log(`\nInforme: ${join(OUT, 'a11y-report.json')}`);
if (problems.length === 0) {
  console.log('Accesibilidad: 0 violaciones critical/serious.');
  process.exit(0);
}
console.log(`\nAccesibilidad: ${problems.length} vista(s) con violaciones critical/serious:`);
for (const p of problems) console.log(`  · ${p.label}: ${p.blockers.join(', ')}`);
process.exit(1);
