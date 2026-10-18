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
  { label: 'biblia NTV (móvil)', path: '/biblia/ntv?libro=juan&cap=3', mobile: true }
];

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

async function audit(page, label, { mobile = false } = {}) {
  await page.evaluate(AXE_SOURCE);
  const result = await page.evaluate(async options => {
    const r = await window.axe.run(document, options);
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
  }, AXE_OPTIONS);

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

try {
  for (const route of ROUTES) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.goto(`${BASE}${route.path}`, { waitUntil: 'domcontentloaded' });
    await wait(2400);
    await audit(page, route.label);
    await page.close();
  }
  for (const state of STATES) {
    const page = await browser.newPage();
    await page.setViewport(state.mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 });
    await page.goto(`${BASE}${state.path}`, { waitUntil: 'domcontentloaded' });
    await wait(2400);
    if (state.action === 'nav-desktop') await page.evaluate(() => document.querySelector('.hamburger-menu')?.click());
    if (state.action === 'nav-mobile') await page.evaluate(() => document.querySelector('.hamburger-menu')?.click());
    await wait(1000);
    await audit(page, state.label, { mobile: state.mobile });
    await page.close();
  }

  await browser.close();
} catch (e) {
  console.error(e);
  await browser.close().catch(() => {});
  process.exit(1);
}

fs.writeFileSync(join(OUT, 'a11y-report.json'), JSON.stringify(report, null, 2), 'utf8');

console.log(`\nInforme: ${join(OUT, 'a11y-report.json')}`);
if (problems.length === 0) {
  console.log('Accesibilidad: 0 violaciones critical/serious.');
  process.exit(0);
}
console.log(`\nAccesibilidad: ${problems.length} vista(s) con violaciones critical/serious:`);
for (const p of problems) console.log(`  · ${p.label}: ${p.blockers.join(', ')}`);
process.exit(1);
