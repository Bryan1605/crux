#!/usr/bin/env node
/**
 * Onda real de las narraciones.
 *
 * Decodifica el audio en Chrome (Web Audio) y guarda, por cada narración, un
 * JSON con los picos mínimos y máximos de cada tramo. La onda que dibuja el
 * reproductor es, por tanto, la del audio de verdad: no hay forma inventada ni
 * dependencia de ffmpeg (que en esta máquina no está).
 *
 *   Uso:  node scripts/build-audio-peaks.mjs            (escribe los JSON)
 *         node scripts/build-audio-peaks.mjs --report   (solo informa)
 *
 * El JSON se versiona junto al audio: el sitio no lo calcula en el navegador.
 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const ROOT = path.resolve(import.meta.dirname, '..');
const PUBLIC = path.join(ROOT, 'public');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const REPORT = process.argv.includes('--report');

/** Narraciones a medir: id, ruta pública y número de tramos de la onda. */
const ITEMS = [{ id: 'judas', src: '/audio/ntv/judas.ogg', out: '/audio/ntv/judas.peaks.json', buckets: 960 }];

const MIME = {
  '.ogg': 'audio/ogg',
  '.opus': 'audio/ogg',
  '.json': 'application/json; charset=utf-8'
};

/* Un servidor mínimo sobre `public/`: Chrome no descarga `file://` con fetch. */
const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(String(req.url).split('?')[0]);
  const file = path.join(PUBLIC, rel);
  if (!file.startsWith(PUBLIC) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404).end('no');
    return;
  }
  res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required']
});

try {
  const page = await browser.newPage();
  await page.goto(`${base}/`, { waitUntil: 'domcontentloaded' }).catch(() => {});

  let failed = 0;
  for (const item of ITEMS) {
    const peaks = await page.evaluate(
      async ({ src, buckets }) => {
        const bytes = await fetch(src).then(r => r.arrayBuffer());
        const ctx = new AudioContext();
        const buffer = await ctx.decodeAudioData(bytes);
        const data = [];
        for (let c = 0; c < buffer.numberOfChannels; c += 1) data.push(buffer.getChannelData(c));
        const step = buffer.length / buckets;
        const out = [];
        for (let b = 0; b < buckets; b += 1) {
          const from = Math.floor(b * step);
          const to = Math.min(buffer.length, Math.floor((b + 1) * step));
          let lo = 0;
          let hi = 0;
          for (let i = from; i < to; i += 1) {
            let sample = 0;
            for (const channel of data) sample += channel[i];
            sample /= data.length;
            if (sample < lo) lo = sample;
            if (sample > hi) hi = sample;
          }
          out.push([Math.round(lo * 1000) / 1000, Math.round(hi * 1000) / 1000]);
        }
        await ctx.close();
        return {
          duration: Math.round(buffer.duration * 1000) / 1000,
          sampleRate: buffer.sampleRate,
          channels: buffer.numberOfChannels,
          peaks: out
        };
      },
      { src: item.src, buckets: item.buckets }
    );

    const target = path.join(PUBLIC, item.out);
    const previous = fs.existsSync(target) ? JSON.parse(fs.readFileSync(target, 'utf8')) : null;
    const payload = {
      version: 1,
      source: item.src,
      duration: peaks.duration,
      sampleRate: peaks.sampleRate,
      channels: peaks.channels,
      buckets: item.buckets,
      peaks: peaks.peaks
    };

    const same =
      previous &&
      previous.duration === payload.duration &&
      JSON.stringify(previous.peaks) === JSON.stringify(payload.peaks);

    console.log(
      `${same ? '·' : '✓'} ${item.out} — ${payload.duration.toFixed(2)} s · ${item.buckets} tramos · ` +
        `${payload.sampleRate} Hz · ${payload.channels} canal(es)${same ? ' (idéntico)' : ''}`
    );

    if (!REPORT && !same) fs.writeFileSync(target, `${JSON.stringify(payload)}\n`);
    if (!peaks.peaks.length) failed += 1;
  }

  if (failed) {
    console.error(`\n✗ ${failed} narración(es) sin onda`);
    process.exitCode = 1;
  } else {
    console.log(`\n${REPORT ? 'Informe' : 'Ondas'} listo(s).`);
  }
} finally {
  await browser.close();
  server.close();
}
