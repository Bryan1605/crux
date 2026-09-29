import puppeteer from 'puppeteer-core';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const [url, out, w = '1280', h = '900', reduced = 'no-preference', scroll = '0'] = process.argv.slice(2);

const userDataDir = await mkdtemp(join(tmpdir(), 'crux-shot-'));
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  userDataDir,
  args: ['--disable-gpu', '--enable-unsafe-swiftshader', '--hide-scrollbars', '--no-first-run', '--disable-extensions'],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: +w, height: +h, deviceScaleFactor: 1 });
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: reduced }]);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 6000));
  if (+scroll > 0) {
    await page.evaluate((y) => window.scrollTo(0, y), +scroll);
    await new Promise((r) => setTimeout(r, 1500));
  }
  await page.screenshot({ path: out });
  const rm = await page.evaluate(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const dbg = await page.evaluate(() => document.body.innerText.match(/frames=\d+[^\n]*/)?.[0] || null);
  const gl = await page.evaluate(() => {
    const c = document.querySelector('canvas[data-engine]');
    return c ? `${c.width}x${c.height}` : 'no-canvas';
  });
  console.log(`ok ${out} reducedMotion=${rm} canvas=${gl} dbg=${dbg ?? '-'}`);
} finally {
  await browser.close();
}
