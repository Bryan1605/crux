/**
 * QA de las narraciones de audio (lector NTV).
 *
 *   node scripts/qa-audio.mjs            # datos, audio y onda
 *   node scripts/qa-audio.mjs --browser  # + el reproductor real en Chrome
 *
 * Requiere el servidor de desarrollo (http://localhost:5173) solo con --browser.
 * Deja capturas en C:\Users\PC\AppData\Local\Temp\opencode\crux.
 */
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

import { validate } from './validate-content.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const CONTENT = path.join(ROOT, 'content');
const PUBLIC = path.join(ROOT, 'public');
const OUT = 'C:\\Users\\PC\\AppData\\Local\\Temp\\opencode\\crux';
const BASE = process.env.CRUX_BASE || 'http://localhost:5173';
const WITH_BROWSER = process.argv.includes('--browser');

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok: Boolean(ok), detail });
  const mark = ok ? '\u001b[32mOK  \u001b[0m' : '\u001b[31mFALLA\u001b[0m';
  console.log(`${mark} ${name}${detail ? ` — ${detail}` : ''}`);
};

/* -------------------------------------------------------------------------- */
/* 1. Contenido y archivos                                                    */
/* -------------------------------------------------------------------------- */

const narraciones = JSON.parse(await readFile(path.join(CONTENT, 'narraciones.json'), 'utf8'));

let shapeOk = true;
let shapeError = '';
try {
  validate('narraciones', narraciones);
} catch (error) {
  shapeOk = false;
  shapeError = error.message;
}
check('narraciones.json cumple el esquema', shapeOk, shapeError);
check('Hay al menos una narración', (narraciones.items || []).length > 0, `${(narraciones.items || []).length}`);

const index = JSON.parse(await readFile(path.join(PUBLIC, 'textos/exegesis/index.json'), 'utf8'));
const books = new Map((index.books || []).map(b => [b.id, b]));

for (const item of narraciones.items || []) {
  const label = item.id;

  const audio = path.join(PUBLIC, item.src);
  const info = await stat(audio).catch(() => null);
  check(`[${label}] el audio está publicado`, Boolean(info && info.isFile()), info ? `${(info.size / 1024 / 1024).toFixed(1)} MB` : `falta public${item.src}`);

  const head = info ? (await readFile(audio)).subarray(0, 4).toString('latin1') : '';
  check(`[${label}] el audio es un contenedor Ogg`, head === 'OggS', head);

  const peaksFile = item.peaks ? path.join(PUBLIC, item.peaks) : '';
  const peaksRaw = peaksFile ? await readFile(peaksFile, 'utf8').catch(() => null) : null;
  check(`[${label}] la onda está publicada`, Boolean(peaksRaw), item.peaks || 'sin peaks');

  if (peaksRaw) {
    const peaks = JSON.parse(peaksRaw);
    const sameDuration = Math.abs((peaks.duration || 0) - item.duration) <= 0.5;
    check(
      `[${label}] la onda dura lo mismo que el audio`,
      sameDuration,
      `${(peaks.duration || 0).toFixed(2)} s vs ${item.duration} s declarados`
    );
    check(
      `[${label}] la onda son picos reales y acotados`,
      Array.isArray(peaks.peaks) &&
        peaks.peaks.length === peaks.buckets &&
        peaks.peaks.length > 100 &&
        peaks.peaks.every(([lo, hi]) => lo >= -1.001 && hi <= 1.001 && lo <= hi) &&
        peaks.peaks.some(([lo, hi]) => Math.max(Math.abs(lo), Math.abs(hi)) > 0.2),
      `${peaks.peaks?.length} tramos`
    );
    check(`[${label}] la onda apunta a su audio`, peaks.source === item.src, peaks.source);
  }

  const book = books.get(item.book);
  check(`[${label}] el libro existe en el índice`, Boolean(book), item.book);
  check(
    `[${label}] el capítulo existe`,
    Boolean(book && (book.ntv?.chapters || []).includes(item.chapter)),
    book ? `capítulos ${(book.ntv?.chapters || []).join(', ')}` : ''
  );
}

/* -------------------------------------------------------------------------- */
/* 2. Reproductor real (opcional)                                             */
/* -------------------------------------------------------------------------- */

if (WITH_BROWSER) {
  const { default: puppeteer } = await import('puppeteer-core');
  const { mkdir } = await import('node:fs/promises');
  await mkdir(OUT, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--mute-audio']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 950 });
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });

  const item = (narraciones.items || [])[0];
  await page.goto(`${BASE}/biblia/ntv?libro=${item.book}&cap=${item.chapter}`, { waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForSelector('.ntv-audio', { timeout: 30000 });
  await wait(1200);

  const shape = await page.evaluate(() => {
    const slider = document.querySelector('.ntv-audio__track');
    const audio = document.querySelector('.ntv-audio__el');
    return {
      play: document.querySelector('.ntv-audio__play')?.getAttribute('aria-label') || '',
      waves: document.querySelectorAll('.ntv-audio__path').length,
      points: (document.querySelector('.ntv-audio__path')?.getAttribute('d') || '').length,
      role: slider?.getAttribute('role'),
      min: slider?.getAttribute('aria-valuemin'),
      max: slider?.getAttribute('aria-valuemax'),
      now: slider?.getAttribute('aria-valuenow'),
      valuetext: slider?.getAttribute('aria-valuetext'),
      tab: slider?.tabIndex,
      label: slider?.getAttribute('aria-label'),
      src: audio?.getAttribute('src') || '',
      time: document.querySelector('.ntv-audio__time')?.textContent.replace(/\s+/g, ' ').trim() || '',
      rail: Boolean(document.querySelector('.ntv__rail-chapters')),
      download: Boolean(document.querySelector('.ntv-audio__download[download]'))
    };
  });
  check('Reproductor: vive en el raíl, sobre los capítulos y las secciones', shape.rail && Boolean(shape.play), shape.play);

  /* El archivo se sirve como audio/ogg (sin eso el navegador no lo abre). */
  const served = await page.evaluate(async src => {
    const response = await fetch(src, { method: 'GET', headers: { Range: 'bytes=0-63' } });
    const blob = await response.blob();
    return {
      status: response.status,
      type: response.headers.get('content-type') || '',
      range: response.headers.get('content-range') || '',
      bytes: blob.size,
      playable: document.createElement('audio').canPlayType('audio/ogg; codecs="opus"')
    };
  }, shape.src);
  check(
    'Reproductor: el audio se sirve como audio/ogg',
    (served.status === 200 || served.status === 206) && /audio\/ogg/.test(served.type) && served.bytes > 0,
    `${served.status} · ${served.type} · ${served.bytes} bytes · ${served.range || 'sin rangos'}`
  );
  check('Reproductor: Chrome reproduce Ogg/Opus', served.playable !== '', served.playable);

  check(
    'Reproductor: la onda dibuja picos reales',
    shape.waves === 2 && shape.points > 1000,
    `${shape.waves} trazos, ${shape.points} caracteres de camino`
  );
  check(
    'Reproductor: deslizador accesible con nombre y valores',
    shape.role === 'slider' && shape.tab === 0 && shape.min === '0' && Number(shape.max) > 0 && / de /.test(shape.valuetext || '') && Boolean(shape.label),
    JSON.stringify({ role: shape.role, max: shape.max, valuetext: shape.valuetext, label: shape.label })
  );
  check('Reproductor: muestra la duración y ofrece la descarga', /\/ \d+:\d\d/.test(shape.time) && shape.download, shape.time);
  await page.screenshot({ path: path.join(OUT, 'ntv-audio.png') });

  /* Suena: el tiempo avanza y el progreso se pinta. */
  const total = await page.$eval('.ntv-audio__el', el => el.duration);
  await page.click('.ntv-audio__play');
  await wait(2600);
  const playing = await page.evaluate(() => {
    const audio = document.querySelector('.ntv-audio__el');
    return {
      paused: audio.paused,
      current: audio.currentTime,
      label: document.querySelector('.ntv-audio__play').getAttribute('aria-label'),
      now: Number(document.querySelector('.ntv-audio__track').getAttribute('aria-valuenow')),
      clip: (document.querySelector('.ntv-audio__wave clipPath rect')?.getAttribute('width') || 0) * 1
    };
  });
  check(
    'Reproductor: al pulsar play avanza la narración',
    !playing.paused && playing.current > 0.5 && playing.now > 0 && playing.clip > 0 && /Pausar/.test(playing.label),
    `${playing.current.toFixed(1)} s · ${playing.now} s en el deslizador`
  );
  await page.screenshot({ path: path.join(OUT, 'ntv-audio-sonando.png') });

  await page.click('.ntv-audio__play');
  await wait(300);
  check('Reproductor: se puede pausar', await page.$eval('.ntv-audio__el', el => el.paused));

  /* Pinchar la onda lleva a esa altura del audio. */
  const box = await page.$eval('.ntv-audio__track', el => {
    const b = el.getBoundingClientRect();
    return { x: b.left, y: b.top + b.height / 2, w: b.width };
  });
  await page.mouse.click(box.x + box.w * 0.5, box.y);
  await wait(700);
  const seek = await page.$eval('.ntv-audio__el', el => ({ t: el.currentTime, d: el.duration }));
  check(
    'Reproductor: pinchar la onda salta a esa altura',
    Math.abs(seek.t / seek.d - 0.5) < 0.05,
    `${seek.t.toFixed(1)} s de ${seek.d.toFixed(1)} s`
  );

  /* Teclado: flechas e Inicio. */
  await page.focus('.ntv-audio__track');
  const beforeKey = await page.$eval('.ntv-audio__el', el => Math.round(el.currentTime));
  await page.keyboard.press('ArrowRight');
  await wait(200);
  const afterKey = await page.$eval('.ntv-audio__el', el => Math.round(el.currentTime));
  await page.keyboard.press('Home');
  await wait(200);
  const afterHome = await page.$eval('.ntv-audio__el', el => Math.round(el.currentTime));
  check(
    'Reproductor: responde al teclado (flecha e Inicio)',
    afterKey === beforeKey + 5 && afterHome === 0,
    `${beforeKey} → ${afterKey} → ${afterHome}`
  );

  /* Solo el capítulo con narración la muestra. */
  await page.goto(`${BASE}/biblia/ntv?libro=juan&cap=3`, { waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForSelector('.ntv__rail', { timeout: 30000 });
  await wait(600);
  check('Reproductor: los capítulos sin narración no lo muestran', (await page.$('.ntv-audio')) === null);

  check('Sin errores de consola', errors.length === 0, errors.slice(0, 3).join(' | '));
  await browser.close();
}

/* -------------------------------------------------------------------------- */

console.log('');
const failed = results.filter(r => !r.ok);
console.log(
  failed.length === 0
    ? `\u001b[32m${results.length}/${results.length} comprobaciones OK\u001b[0m`
    : `\u001b[31m${failed.length} de ${results.length} comprobaciones FALLAN\u001b[0m`
);

process.exit(failed.length === 0 ? 0 : 1);
