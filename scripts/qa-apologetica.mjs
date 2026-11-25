/**
 * QA de /apologetica/adventismo y /apologetica/dispensacionalismo
 * (necesita `npm run dev`; CRUX_BASE para otra base).
 *
 * - Datos:
 *   - Adventismo: 10 bloques y 100 preguntas, 100 % en NTV y Codex sincronizado,
 *     checkClaves 100/100, doctrina en 8 partes con citas primarias oficiales y
 *     sección patrística sobre el sábado y el Día del Señor.
 *   - Dispensacionalismo: 6 bloques y 50 preguntas, checkClaves 50/50 y doctrina
 *     de Pentecost (24 citas).
 * - Página (1280px y 390px): tarjetas activas en portada, preguntas, griego + NTV,
 *   resaltes, notas LXX, avisos AT sin Codex, pestañas doctrinales y 0 errores JS / 0 overflow.
 */
import puppeteer from 'puppeteer-core';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { BOOK_BY_NAME } from '../src/data/exegesis.js';
import { checkClaves } from '../src/lib/claves.js';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = (process.env.CRUX_BASE || 'http://localhost:5173').replace(/\/$/, '');
const wait = ms => new Promise(r => setTimeout(r, ms));

const results = [];
const check = (name, ok, detail = '') => {
  results.push(Boolean(ok));
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
};

const ntv = new Map();
const codex = new Map();
const readJson = rel => JSON.parse(readFileSync(new URL(rel, import.meta.url), 'utf8'));
const loadBook = (map, dir, libro) => {
  if (!map.has(libro)) map.set(libro, readJson(`../public/textos/exegesis/${dir}/${libro}.json`));
  return map.get(libro);
};

// ------------------------------------------------------------------ datos
for (const spec of [
  { slug: 'adventismo', bloques: 10, preguntas: 100 },
  { slug: 'dispensacionalismo', bloques: 6, preguntas: 50 }
]) {
  const { slug } = spec;
  const data = readJson(`../content/apologetica/${slug}-preguntas.json`);
  const preguntas = data.bloques.flatMap(b => b.preguntas);
  check(
    `${slug} datos: ${spec.bloques} bloques y ${spec.preguntas} preguntas numeradas`,
    data.bloques.length === spec.bloques &&
      preguntas.length === spec.preguntas &&
      preguntas.every((p, i) => p.n === i + 1),
    `${data.bloques.length} bloques · ${preguntas.length} preguntas`
  );

  const faltan = [];
  const distintos = [];
  for (const p of preguntas) {
    for (const r of [...p.refs, ...p.claveRefs]) {
      const ch = loadBook(ntv, 'ntv', r.libro).chapters.find(c => (c.num ?? c.n) === r.cap);
      for (let v = r.desde; v <= r.hasta; v++) {
        if (!ch?.verses.some(x => x.n === v)) faltan.push(`${p.n}: ${r.label}`);
      }
    }
    for (const r of p.refs) {
      const ch = loadBook(ntv, 'ntv', r.libro).chapters.find(c => (c.num ?? c.n) === r.cap);
      for (const v of r.ntv) {
        const src = ch.verses.find(x => x.n === v.n)?.text.replace(/\[[a-z]{1,2}\]/g, '');
        if (src !== v.text) distintos.push(`${p.n}: NTV ${r.label}`);
      }
      if (r.grc.length) {
        const g = r.codex ? { ...r, ...r.codex } : r;
        const cch = loadBook(codex, 'codex', r.libro).chapters.find(c => c.num === g.cap);
        for (const v of r.grc) {
          if (cch?.verses.find(x => x.n === v.n)?.grc !== v.grc) distintos.push(`${p.n}: Codex ${r.label}`);
        }
      }
    }
  }
  check(`${slug} datos: todos los versículos existen en la NTV`, faltan.length === 0, faltan.slice(0, 4).join(' | '));
  check(
    `${slug} datos: texto copiado coincide literalmente con NTV y Codex`,
    distintos.length === 0,
    distintos.slice(0, 4).join(' | ')
  );

  const claves = readJson(`../content/apologetica/${slug}-claves.json`).claves;
  const malClaves = checkClaves(preguntas, claves);
  check(
    `${slug} datos: ${spec.preguntas} preguntas con palabra clave en NTV y Codex`,
    malClaves.length === 0,
    malClaves.slice(0, 4).join(' | ')
  );
}

const ntvRango = label => {
  const m = /^(.+?)\s(\d+):(\d+)(?:-(\d+))?$/.exec(label);
  const book = m && BOOK_BY_NAME.get(m[1]);
  if (!book) return null;
  const ch = loadBook(ntv, 'ntv', book.id).chapters.find(c => (c.num ?? c.n) === Number(m[2]));
  const desde = Number(m[3]);
  const hasta = Number(m[4] || m[3]);
  return (ch?.verses || [])
    .filter(v => v.n >= desde && v.n <= hasta)
    .map(v => v.text.replace(/\[[a-z]{1,2}\]/g, ''))
    .join(' ');
};

const checkDoctrinaNtv = doc => {
  const mal = [];
  for (const p of doc.partes || []) {
    const c = p.biblia?.cita;
    if (c && !ntvRango(c.ref)?.includes(c.texto)) mal.push(`Parte ${p.id}: cita ${c.ref}`);
    for (const b of p.biblia?.puntos || []) {
      for (const r of b.refs) if (!ntvRango(r)) mal.push(`Parte ${p.id}: falta ${r}`);
      const txt = b.refs.map(ntvRango).join(' ');
      for (const frase of b.cita || []) if (!txt.includes(frase)) mal.push(`Parte ${p.id}: «${frase}» fuera de ${b.ref}`);
    }
    for (const cita of p.citas || []) {
      if (cita.en && cita.en.split('…').length !== cita.es.split('…').length) {
        mal.push(`Parte ${p.id}: tramos «…» no coinciden`);
      }
    }
  }
  for (const q of doc.preguntas || []) {
    if (!ntvRango(q.ref)) mal.push(`Pregunta p.${q.pagina}: falta ${q.ref}`);
  }
  return mal;
};

const advDoctrina = readJson('../content/apologetica/adventismo-doctrina.json');
const malAdvDocNtv = checkDoctrinaNtv(advDoctrina);
const totalCitasAdv = advDoctrina.partes.reduce((n, p) => n + p.citas.length, 0);
const patristicaParteI = advDoctrina.partes[0]?.patristica;
check(
  'adventismo doctrina: 8 partes, citas primarias, patrística sobre el Día del Señor y citas NTV literales',
  advDoctrina.partes.length === 8 &&
    totalCitasAdv >= 25 &&
    (patristicaParteI?.citas?.length || 0) >= 7 &&
    (patristicaParteI?.historia?.length || 0) >= 4 &&
    advDoctrina.partes.every(p => p.citas.every(c => c.es && c.paginas?.length)) &&
    malAdvDocNtv.length === 0,
  malAdvDocNtv.slice(0, 4).join(' | ') ||
    `${totalCitasAdv} citas · ${patristicaParteI?.citas?.length || 0} patrísticas · ${patristicaParteI?.historia?.length || 0} históricas`
);

const dispDoctrina = readJson('../content/apologetica/dispensacionalismo-doctrina.json');
const malDocNtv = checkDoctrinaNtv(dispDoctrina);
const totalCitasDisp = dispDoctrina.partes.reduce((n, p) => n + p.citas.length, 0);
check(
  'dispensacionalismo doctrina: 6 partes, 24 citas de Pentecost y citas NTV literales',
  dispDoctrina.partes.length === 6 &&
    totalCitasDisp === 24 &&
    dispDoctrina.partes.every(p => p.citas.every(c => c.es && c.paginas?.length)) &&
    malDocNtv.length === 0,
  malDocNtv.slice(0, 4).join(' | ') || `${totalCitasDisp} citas`
);

// ------------------------------------------------------------------ navegador
const userDataDir = mkdtempSync(join(tmpdir(), 'crux-apologetica-'));
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  userDataDir,
  args: ['--disable-gpu', '--enable-unsafe-swiftshader', '--hide-scrollbars', '--no-first-run']
});

try {
  // Portada: tarjetas activas de Adventismo y Dispensacionalismo.
  const home = await browser.newPage();
  await home.setViewport({ width: 1280, height: 900 });
  const homeRes = await home.goto(`${BASE}/`, { waitUntil: 'networkidle2', timeout: 60000 });
  await home.waitForSelector('.apolo-grid', { timeout: 25000 });
  const cards = await home.evaluate(() =>
    [...document.querySelectorAll('.apolo-card')].map(el => ({
      title: el.querySelector('.apolo-card__title')?.textContent.trim(),
      cta: el.querySelector('.apolo-card__cta')?.getAttribute('href') || null,
      soon: el.classList.contains('apolo-card--soon')
    }))
  );
  check(
    'portada: tarjetas Adventismo y Dispensacionalismo activas y fascículos futuros visibles',
    homeRes?.status() < 400 &&
      cards.some(c => c.title === 'Adventismo' && c.cta === '/apologetica/adventismo') &&
      cards.some(c => c.title === 'Dispensacionalismo' && c.cta === '/apologetica/dispensacionalismo') &&
      cards.some(c => /Catolicismo/.test(c.title || '') && c.soon) &&
      cards.some(c => c.title === 'Gnósticos' && c.soon) &&
      cards.some(c => c.title === 'Islam' && c.soon) &&
      cards.some(c => /Mormonismo/.test(c.title || '') && c.soon) &&
      cards.some(c => c.title === 'Testigos de Jehová' && c.soon) &&
      cards.some(c => /Judaizantes/.test(c.title || '') && c.soon),
    cards.filter(c => c.title).map(c => `${c.title}:${c.cta || 'soon'}`).join(' | ')
  );
  await home.close();

  for (const [w, h] of [
    [1280, 900],
    [390, 844]
  ]) {
    // -------------------- Adventismo --------------------
    const pAdv = await browser.newPage();
    await pAdv.setViewport({ width: w, height: h, isMobile: w < 800, hasTouch: w < 800 });
    const advErr = [];
    pAdv.on('pageerror', e => advErr.push(e.message));
    const resAdv = await pAdv.goto(`${BASE}/apologetica/adventismo`, { waitUntil: 'networkidle2', timeout: 60000 });
    await pAdv.waitForSelector('.scj-q', { timeout: 30000 });

    const advInfo = await pAdv.evaluate(() => ({
      h1: document.querySelector('h1')?.textContent.replace(/\s+/g, ' ').trim(),
      q: document.querySelectorAll('.scj-q').length,
      bloques: document.querySelectorAll('#scj-panel-preguntas .scj-block').length,
      tabs: Boolean(document.getElementById('scj-tabs')),
      docPanel: Boolean(document.getElementById('scj-panel-doctrina')),
      folio: document.querySelector('#p-5 .scj-lab span:last-child')?.textContent || '',
      estudioLink: Boolean(document.querySelector('a[href*="/estudio/06-apologetica--origenes-usa--03-adventismo"]')),
      judaizantesLink: Boolean(document.querySelector('a[href*="/estudio/06-apologetica--judaizantes"]')),
      p5Grc: document.querySelector('#p-5 .scj-grc')?.textContent || '',
      p5Es: document.querySelector('#p-5 .scj-es')?.textContent || '',
      p5MarksGrc: [...document.querySelectorAll('#p-5 .scj-grc mark')].map(m => m.textContent.trim()),
      p5MarksEs: [...document.querySelectorAll('#p-5 .scj-es mark')].map(m => m.textContent.trim()),
      p5Exg: Boolean(document.querySelector('#p-5 a[href*="/exegesis?libro=colosenses&cap=2"]')),
      p5Ms: [...document.querySelectorAll('#p-5 a')].some(a => a.href.includes('codexsinaiticus.org') && a.rel.includes('noopener')),
      p37Text: document.getElementById('p-37')?.textContent || '',
      over: document.documentElement.scrollWidth - window.innerWidth
    }));
    check(
      `adventismo ${w}px: 10 bloques, 100 preguntas, folio manuscrito y pestañas`,
      resAdv?.status() < 400 &&
        /100 preguntas/.test(advInfo.h1 || '') &&
        advInfo.bloques === 10 &&
        advInfo.q === 100 &&
        advInfo.tabs &&
        advInfo.docPanel &&
        /^cuaderno \d+ · f\. \d+[rv]$/.test(advInfo.folio),
      `${advInfo.bloques} bloques · ${advInfo.q} preg · ${advInfo.folio}`
    );
    check(
      `adventismo ${w}px: Col 2:16-17 en griego/NTV, resaltes y enlaces a estudios`,
      /ϲαββατων/.test(advInfo.p5Grc) &&
        /días de descanso/.test(advInfo.p5Es) &&
        advInfo.p5MarksGrc.includes('η ϲαββατων') &&
        advInfo.p5MarksEs.includes('los días de descanso') &&
        advInfo.p5Exg &&
        advInfo.p5Ms &&
        advInfo.estudioLink &&
        advInfo.judaizantesLink
    );
    check(
      `adventismo ${w}px: Dn 8:13-14 avisa que el Codex no lo conserva y cita hebreo`,
      /no conserva este pasaje/.test(advInfo.p37Text) && /hebreo/.test(advInfo.p37Text)
    );
    await pAdv.click('#p-5 summary');
    const advOpen = await pAdv.evaluate(() => document.querySelector('#p-5 details').open);
    check(`adventismo ${w}px: <details> abre la respuesta al pulsar`, advOpen);
    check(`adventismo ${w}px: sin scroll horizontal ni errores JS`, advInfo.over <= 1 && advErr.length === 0, `${advInfo.over}px · err=${advErr.length}`);

    await pAdv.click('#scj-tab-doctrina');
    await wait(500);
    const advDoc = await pAdv.evaluate(() => ({
      url: location.search,
      visible: !document.getElementById('scj-panel-doctrina').hidden,
      partes: document.querySelectorAll('#scj-panel-doctrina .scj-parte').length,
      singleCol: document.querySelectorAll('#scj-panel-doctrina .scj-pair--single').length,
      bilingue: document.querySelectorAll('#scj-panel-doctrina .scj-pair:not(.scj-pair--single)').length,
      patrCitas: document.querySelectorAll('#parte-I .scj-patr-quote').length,
      patrHist: document.querySelectorAll('#parte-I .scj-patr-hist li').length,
      bibliaLink: Boolean(document.querySelector('#parte-I a[href*="/biblia"]')),
      preguntasFinales: document.querySelectorAll('#preguntas-libro li').length,
      over: document.documentElement.scrollWidth - window.innerWidth
    }));
    check(
      `adventismo ${w}px: pestaña «¿Qué cree?» abre 8 partes, patrística y preguntas con sus libros`,
      advDoc.url.includes('vista=doctrina') &&
        advDoc.visible &&
        advDoc.partes === 8 &&
        advDoc.singleCol > 0 &&
        advDoc.bilingue > 0 &&
        advDoc.patrCitas >= 7 &&
        advDoc.patrHist >= 4 &&
        advDoc.bibliaLink &&
        advDoc.preguntasFinales >= 12 &&
        advDoc.over <= 1 &&
        advErr.length === 0,
      `${advDoc.partes} partes · ${advDoc.singleCol}+${advDoc.bilingue} citas · ${advDoc.patrCitas} patr · ${advDoc.patrHist} hist · ${advDoc.over}px`
    );
    await pAdv.close();

    // -------------------- Dispensacionalismo --------------------
    const pDisp = await browser.newPage();
    await pDisp.setViewport({ width: w, height: h, isMobile: w < 800, hasTouch: w < 800 });
    const dispErr = [];
    pDisp.on('pageerror', e => dispErr.push(e.message));
    const resDisp = await pDisp.goto(`${BASE}/apologetica/dispensacionalismo`, { waitUntil: 'networkidle2', timeout: 60000 });
    await pDisp.waitForSelector('.scj-q', { timeout: 30000 });

    const dispInfo = await pDisp.evaluate(() => ({
      h1: document.querySelector('h1')?.textContent.replace(/\s+/g, ' ').trim(),
      q: document.querySelectorAll('.scj-q').length,
      bloques: document.querySelectorAll('#scj-panel-preguntas .scj-block').length,
      tabs: Boolean(document.getElementById('scj-tabs')),
      p7Text: document.getElementById('p-7')?.textContent || '',
      p14Text: document.getElementById('p-14')?.textContent || '',
      p26Text: document.getElementById('p-26')?.textContent || '',
      p49Text: document.getElementById('p-49')?.textContent || '',
      over: document.documentElement.scrollWidth - window.innerWidth
    }));
    check(
      `dispensacionalismo ${w}px: 6 bloques, 50 preguntas y pestañas`,
      resDisp?.status() < 400 && /50 preguntas/.test(dispInfo.h1 || '') && dispInfo.bloques === 6 && dispInfo.q === 50 && dispInfo.tabs
    );
    check(
      `dispensacionalismo ${w}px: notas de numeración LXX (Jer 38, Sal 109, Joel 3) y aviso Dn 9`,
      /38:31-34/.test(dispInfo.p7Text) &&
        /109:1/.test(dispInfo.p14Text) &&
        /3:1-5/.test(dispInfo.p26Text) &&
        /no conserva este pasaje/.test(dispInfo.p49Text)
    );
    check(`dispensacionalismo ${w}px: sin scroll horizontal ni errores JS`, dispInfo.over <= 1 && dispErr.length === 0, `${dispInfo.over}px`);

    await pDisp.click('#scj-tab-doctrina');
    await wait(500);
    const doc = await pDisp.evaluate(() => ({
      url: location.search,
      visible: !document.getElementById('scj-panel-doctrina').hidden,
      citas: document.querySelectorAll('#scj-panel-doctrina .scj-lee').length,
      singleCol: document.querySelectorAll('#scj-panel-doctrina .scj-pair--single').length,
      firstQuote: document.querySelector('#parte-I .scj-en')?.textContent || '',
      firstPage: document.querySelector('#parte-I .scj-lab span:last-child')?.textContent || '',
      preguntasFinales: document.querySelectorAll('#preguntas-libro li').length,
      over: document.documentElement.scrollWidth - window.innerWidth
    }));
    check(
      `dispensacionalismo ${w}px: pestaña «¿Qué enseña?» abre 24 citas de Pentecost y 12 preguntas`,
      doc.url.includes('vista=doctrina') &&
        doc.visible &&
        doc.citas === 24 &&
        doc.singleCol === 24 &&
        /En Rom 9:4/.test(doc.firstQuote) &&
        /^pp?\. \d/.test(doc.firstPage) &&
        doc.preguntasFinales === 12 &&
        doc.over <= 1 &&
        dispErr.length === 0,
      `${doc.citas} citas · ${doc.firstPage} · ${doc.over}px`
    );
    await pDisp.close();
  }
} finally {
  await browser.close();
}

const ok = results.filter(Boolean).length;
console.log(`\n${ok}/${results.length} comprobaciones OK`);
process.exit(ok === results.length ? 0 : 1);
