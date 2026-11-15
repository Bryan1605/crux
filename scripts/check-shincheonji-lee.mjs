/**
 * Comprueba las citas de Lee Man-hee de content/apologetica/shincheonji-doctrina.json
 * contra el texto del libro (The Creation of Heaven and Earth, 2014).
 *
 *   node scripts/check-shincheonji-lee.mjs [--book <ruta al .txt por páginas>]
 *
 * El libro es material privado del usuario y no está en el repo: si no se
 * encuentra, el script lo dice y no falla (la QA del sitio no lo necesita).
 * Cada tramo de la cita (separados por «…») debe estar, letra a letra, en las
 * páginas indicadas. Se ignoran mayúsculas, signos y comillas, porque el OCR
 * los altera; no se ignora ninguna palabra.
 */
import { existsSync, readFileSync } from 'node:fs';

const args = process.argv.slice(2);
const i = args.indexOf('--book');
const BOOK =
  i >= 0
    ? args[i + 1]
    : 'D:/Biblia/SegundoCerebroBiblico/wiki/06-apologetica/shincheonji/Libros_Lee_Man-hee/EN/The_Creation_of_Heaven_and_Earth_por_paginas.txt';

const data = JSON.parse(readFileSync(new URL('../content/apologetica/shincheonji-doctrina.json', import.meta.url), 'utf8'));
const citas = data.partes.flatMap(p => p.lee.map(c => ({ ...c, parte: p.id })));

const results = [];
const check = (name, ok, detail = '') => {
  results.push(ok);
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
};

// Nunca se publica la marca de agua del escaneo (nombre, teléfono, correo).
const privado = /\d{3}-\d{3,4}-\d{4}|@|[\uac00-\ud7af]/;
check(
  'ninguna cita lleva datos personales de la marca de agua',
  citas.every(c => !privado.test(c.en) && !privado.test(c.es)),
  citas.filter(c => privado.test(c.en) || privado.test(c.es)).map(c => `p. ${c.paginas}`).join(', ')
);

if (!existsSync(BOOK)) {
  console.log(`\n(No se encuentra el libro en ${BOOK}: no se comprueban las citas.)`);
  process.exit(results.every(Boolean) ? 0 : 1);
}

const norm = s =>
  String(s)
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/-\s*\n\s*(?=[a-z])/g, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');

const src = readFileSync(BOOK, 'utf8').replace(/\r\n/g, '\n');
const parts = src.split(/^===== \[p\. (\d+)\] =====$/m);
const pages = new Map();
for (let k = 1; k < parts.length; k += 2) pages.set(Number(parts[k]), (pages.get(Number(parts[k])) || '') + parts[k + 1]);
const pageText = n => norm(pages.get(n) || '');

for (const c of citas) {
  // Una frase puede empezar al final de la página anterior o seguir en la siguiente.
  const texto = c.paginas.flatMap(n => [pageText(n - 1) + pageText(n) + pageText(n + 1)]).join('');
  const tramos = c.en.split('…').map(norm).filter(Boolean);
  const faltan = tramos.filter(t => !texto.includes(t));
  check(`Parte ${c.parte}, p. ${c.paginas.join(', ')}: «${c.en.slice(0, 60)}…»`, faltan.length === 0, faltan.length ? `no se encuentra: ${faltan[0].slice(0, 80)}` : '');
}

const ok = results.filter(Boolean).length;
console.log(`\n${ok}/${results.length} comprobaciones OK`);
process.exit(ok === results.length ? 0 : 1);
