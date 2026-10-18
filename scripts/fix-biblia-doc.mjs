#!/usr/bin/env node
/**
 * Reparación del documento fuente de la Biblia Patrística.
 *
 * Corrige, de forma determinista e idempotente, tres defectos detectados en
 * `public/textos/biblia-patristica.md`:
 *
 *   1. Codificación: 43 caracteres U+FFFD (�) y emojis perdidos (`??`) en el
 *      bloque de Atenágoras (líneas ~2396-2427). Se reconstruyen por contexto.
 *   2. Jerarquía: la Parte 2.4 y el bloque de Tertuliano (Parte 4.1) usan `#`/`##`
 *      donde el resto de la obra usa `##`/`###`. Se normaliza a
 *      `## Parte` → `### sección` → `#### subsección`, y los capítulos de
 *      Tertuliano pasan al formato `**Capítulo N**` que emplea toda la obra.
 *   3. Estructura: los tres tratados de Tertuliano no tenían encabezado propio
 *      (los capítulos reiniciaban en 1 sin avisar). Se insertan los títulos que
 *      el propio documento declara en su tabla «Estructura de la Parte 4».
 *
 *   Uso:  node scripts/fix-biblia-doc.mjs                     (simulación del archivo del sitio)
 *         node scripts/fix-biblia-doc.mjs --write             (aplica y guarda una copia de seguridad)
 *         node scripts/fix-biblia-doc.mjs --file <ruta>       (otra copia: p. ej. la bóveda de Obsidian)
 *         node scripts/fix-biblia-doc.mjs --only encoding     (solo la codificación)
 *
 *   Pasos: `encoding` (caracteres perdidos), `headings` (jerarquía) y `titles` (títulos de
 *   obra ausentes). `--only` acepta una lista separada por comas; por defecto se ejecutan
 *   los tres. Al escribir se deja `<archivo>.bak` junto al original.
 *
 * Si se vuelve a ejecutar tras aplicarse, informa de que no hay nada que hacer.
 *
 * Nota: la bóveda `D:\Biblia\Biblia_Patristica_Completa.md` es la que citan los estudios
 * (con números de línea), así que se repara con `--only encoding`, que sustituye caracteres
 * sin tocar el número de líneas ni los finales de línea.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, relative, resolve } from 'node:path';

const R = '\uFFFD';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

const argv = process.argv.slice(2);
const flag = name => argv.includes(name);
const option = (name, fallback = '') => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : fallback;
};

const WRITE = flag('--write');
const FILE = option('--file', '');
const ALL_STEPS = ['encoding', 'headings', 'titles'];
const STEPS = new Set(
  option('--only', 'all') === 'all'
    ? ALL_STEPS
    : option('--only')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
);
const unknown = [...STEPS].filter(s => !ALL_STEPS.includes(s));
if (unknown.length) {
  console.error(`\n✗ paso(s) desconocido(s): ${unknown.join(', ')} (válidos: ${ALL_STEPS.join(', ')})`);
  process.exit(2);
}

const DOC = FILE ? resolve(FILE) : resolve(ROOT, 'public/textos/biblia-patristica.md');
if (!existsSync(DOC)) {
  console.error(`\n✗ no existe el archivo: ${DOC}`);
  process.exit(2);
}

/* -------------------------------------------------------------------------- */
/* 1. Codificación: reconstrucción de los caracteres perdidos                  */
/* -------------------------------------------------------------------------- */

/**
 * [texto dañado, texto correcto, apariciones esperadas].
 *
 * Solo sustituye caracteres: no toca la jerarquía (el nivel del encabezado de la
 * Parte 2.4 se conserva para que el arreglo sea byte-mínimo y la copia quede
 * idéntica a la del sitio). La jerarquía la normaliza el paso 2.
 */
const ENCODING_FIXES = [
  [`# Parte 2.4 ${R} Aten${R}goras de Atenas`, '# Parte 2.4 — Atenágoras de Atenas', 1],
  [`${R}goras`, 'ágoras', 2],
  [`fil${R}sofo`, 'filósofo', 1],
  [`resurrecci${R}n`, 'resurrección', 3],
  [`Resurrecci${R}n`, 'Resurrección', 3],
  [`filos${R}fico`, 'filosófico', 1],
  [`C${R}modo`, 'Cómodo', 1],
  [`filos${R}fica`, 'filosófica', 1],
  [`ate${R}smo`, 'ateísmo', 1],
  [`Dios ${R} Creador`, 'Dios — Creador', 1],
  [`invisible ${R} junto`, 'invisible — junto', 1],
  [`Esp${R}ritu`, 'Espíritu', 3],
  [`patr${R}stica`, 'patrística', 1],
  [`polite${R}smo`, 'politeísmo', 2],
  [`m${R}ltiples`, 'múltiples', 2],
  [`demon${R}aca`, 'demoníaca', 1],
  [`idolatr${R}a`, 'idolatría', 1],
  [`prop${R}sito`, 'propósito', 1],
  [`Prop${R}sito`, 'Propósito', 1],
  [`creaci${R}n`, 'creación', 2],
  [`emanaci${R}n`, 'emanación', 1],
  [`m${R}s`, 'más', 2],
  [`Trinidad ${R} Padre`, 'Trinidad — Padre', 1],
  [`Santo ${R} anterior`, 'Santo — anterior', 1],
  [`estar${R}an`, 'estarían', 1],
  [`l${R}gico`, 'lógico', 1],
  [`${R}Qui${R}n`, '¿Quién', 1],
  [`convertir${R}a`, 'convertiría', 1],
  [`resucitar${R}n`, 'resucitarán', 1],
  [`ser${R}a`, 'sería', 1],
  // Emojis perdidos de la Parte 2.4: el nivel del encabezado (`##`) se conserva
  // a propósito, para que la bóveda y la copia del sitio sigan siendo idénticas.
  ['## ?? Resumen', '## 📖 Resumen', 1],
  ['## ?? Citas clave explicadas', '## 📜 Citas clave explicadas', 1],
  ['## ?? Obra completa traducida', '## 📄 Obra completa traducida', 1]
];

/* -------------------------------------------------------------------------- */
/* 2. Jerarquía de encabezados                                                 */
/* -------------------------------------------------------------------------- */

/** [regex de línea completa, reemplazo, apariciones esperadas] */
const HEADING_FIXES = [
  // Parte 2.2, 2.3 y 2.4 (los caracteres de la 2.4 los repara el paso 1)
  [/^# (Parte 2\.[234] — .+)$/, '## $1', 3],
  // Tertuliano: `# PARTE 4.1 — TERTULIANO...` → `## Parte 4.1 — Tertuliano...`
  [
    /^# PARTE 4\.1 — TERTULIANO DE CARTAGO \(c\. 155–c\. 240 d\.C\.\)$/,
    '## Parte 4.1 — Tertuliano de Cartago (c. 155–c. 240 d.C.)',
    1
  ],
  // Secciones de las partes 2.2 / 2.3 / 2.4 (h2 → h3); los emojis de la 2.4 los
  // repara el paso 1, así que aquí ya llegan los tres «## 📖 Resumen».
  [/^## 📖 Resumen$/, '### 📖 Resumen', 3],
  [/^## 📜 Citas clave explicadas$/, '### 📜 Citas clave explicadas', 3],
  [/^## 📄 Obra completa traducida — Discurso contra los Griegos$/, '### 📄 Obra completa traducida — Discurso contra los Griegos', 1],
  [/^## 📄 Obra completa traducida — A Autólico$/, '### 📄 Obra completa traducida — A Autólico', 1],
  [/^## 📄 Obra completa traducida$/, '### 📄 Obra completa traducida', 1],
  // Secciones de la Parte 4.1 (h2 → h3)
  [/^## 📖 Resumen biográfico$/, '### 📖 Resumen biográfico', 1],
  [/^## 📋 Estructura de la Parte 4$/, '### 📋 Estructura de la Parte 4', 1],
  [/^## 📖 Resumen: Adversus Marcionem \(Contra Marción\)$/, '### 📖 Resumen: Adversus Marcionem (Contra Marción)', 1],
  // Subsecciones (h3 → h4)
  [/^### LIBRO (I|II|III)$/, '#### LIBRO $1', 3],
  [/^### SOBRE LA RESURRECCIÓN DE LOS MUERTOS \(\*De Resurrectione Mortuorum\*\)$/, '#### SOBRE LA RESURRECCIÓN DE LOS MUERTOS (*De Resurrectione Mortuorum*)', 1],
  [/^### Libro (I|II|III|IV|V) — /, '#### Libro $1 — ', 5],
  // Capítulos de Tertuliano: al formato de toda la obra
  [/^## Capítulo (\d+)$/, '**Capítulo $1**', 125],
  // Typo
  [/^### EMBARJADA EN FAVOR DE LOS CRISTIANOS \(\*Legatio pro Christianis\*\)$/, '#### EMBAJADA EN FAVOR DE LOS CRISTIANOS (*Legatio pro Christianis*)', 1]
];

/** Títulos que faltaban, a insertar antes del N-ésimo `**Capítulo 1**` (1-based). */
const WORK_TITLES = {
  1: '### 📄 Apologeticum (50 capítulos)',
  2: '### 📄 De Praescriptione Haereticorum (44 capítulos)',
  3: '### 📄 Adversus Praxean (31 capítulos)'
};

/* -------------------------------------------------------------------------- */

const log = [];
const errors = [];
let changed = 0;

const source = readFileSync(DOC, 'utf8');
const bom = source.startsWith('\uFEFF') ? '\uFEFF' : '';
const eol = source.includes('\r\n') ? '\r\n' : '\n';
let text = bom ? source.slice(1) : source;
let lines = text.split(/\r?\n/);

/* --- 0. ¿ya está reparado? ------------------------------------------------ */
{
  const rawLines = text.split(/\r?\n/);
  const anyPending =
    (STEPS.has('encoding') && ENCODING_FIXES.some(([from]) => text.includes(from))) ||
    (STEPS.has('headings') && HEADING_FIXES.some(([re]) => rawLines.some(line => re.test(line))));
  const titlesPresent =
    !STEPS.has('titles') || Object.values(WORK_TITLES).every(t => rawLines.includes(t));
  if (!anyPending && titlesPresent) {
    console.log('\n✓ El documento ya está reparado; no hay nada que hacer.');
    process.exit(0);
  }
}

/* --- 1. codificación ------------------------------------------------------ */
if (STEPS.has('encoding')) {
  for (const [from, to, expected] of ENCODING_FIXES) {
    const count = text.split(from).length - 1;
    if (count === 0) {
      // Idempotencia: si el texto correcto ya está, no es un error.
      if (text.includes(to)) log.push(`  · ya reparado: «${to}»`);
      else errors.push(`codificación: no se encontró «${from.replace(/\uFFFD/g, '?')}» (esperaba ${expected})`);
      continue;
    }
    if (count !== expected) {
      errors.push(`codificación: «${from.replace(/\uFFFD/g, '?')}» aparece ${count} veces (esperaba ${expected})`);
    }
    text = text.split(from).join(to);
    changed += count;
    log.push(`  · ${count}× «${from.replace(/\uFFFD/g, '?')}» → «${to}»`);
    lines = text.split(/\r?\n/);
  }
}

/* --- 2. jerarquía -------------------------------------------------------- */
if (STEPS.has('headings')) {
  for (const [re, to, expected] of HEADING_FIXES) {
    let count = 0;
    lines = lines.map(line => {
      if (!re.test(line)) return line;
      count += 1;
      return line.replace(re, to);
    });
    if (count !== expected) {
      errors.push(`jerarquía: ${re} coincidió ${count} veces (esperaba ${expected})`);
    }
    if (count) {
      changed += count;
      log.push(`  · ${count}× ${String(re).slice(0, 58)}… → ${to.slice(0, 46)}`);
    }
  }
}

/* --- 3. títulos de obra ausentes ----------------------------------------- */
if (STEPS.has('titles')) {
  const chapterOneIdx = [];
  lines.forEach((line, i) => {
    if (line === '**Capítulo 1**') chapterOneIdx.push(i);
  });
  if (chapterOneIdx.length !== Object.keys(WORK_TITLES).length) {
    errors.push(`títulos de obra: encontrados ${chapterOneIdx.length} inicios de obra (esperaba 3)`);
  } else {
    // de atrás hacia delante para no desplazar los índices
    for (let n = chapterOneIdx.length; n >= 1; n -= 1) {
      lines.splice(chapterOneIdx[n - 1], 0, '', WORK_TITLES[n], '');
      log.push(`  · insertado «${WORK_TITLES[n]}» antes del capítulo 1 de la obra ${n}`);
      changed += 1;
    }
  }
}

/* --- validación final ---------------------------------------------------- */
// Sin pasos estructurales se escribe el texto tal cual: así los finales de línea
// del original (que pueden ser mixtos) quedan intactos y el arreglo es mínimo.
const structural = STEPS.has('headings') || STEPS.has('titles');
const result = structural ? lines.join(eol) : text;
if (STEPS.has('encoding') && result.includes(R)) {
  const rest = (result.match(/\uFFFD/g) || []).length;
  errors.push(`quedan ${rest} caracteres U+FFFD sin reparar`);
}
if (STEPS.has('headings')) {
  for (const [i, line] of lines.entries()) {
    if (/^#{2}\s/.test(line) && !/^##\s+Parte\b/.test(line)) {
      errors.push(`línea ${i + 1}: encabezado h2 inesperado → ${line}`);
    }
  }
  if (/^##\s+\?\?\s/m.test(result)) errors.push('quedan encabezados «## ??» sin reparar');
}

/* --- salida -------------------------------------------------------------- */
console.log(`\nBiblia Patrística — reparación del documento fuente`);
console.log(`archivo: ${DOC === resolve(ROOT, 'public/textos/biblia-patristica.md') ? relative(ROOT, DOC) : DOC}`);
console.log(`pasos: ${[...STEPS].join(', ')}`);
console.log(`cambios: ${changed}\n`);
for (const line of log) console.log(line);

if (errors.length) {
  console.error(`\n✗ ${errors.length} problema(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

if (!WRITE) {
  console.log('\n(simulación) ejecuta con --write para aplicar los cambios');
  process.exit(0);
}

if (changed === 0) {
  console.log('\n✓ El documento ya estaba reparado; no se escribió nada.');
  process.exit(0);
}

/* Copia de seguridad junto al original (nunca se sobrescribe una anterior). */
const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
let backup = `${DOC}.bak`;
if (existsSync(backup)) backup = `${DOC}.${stamp}.bak`;
writeFileSync(backup, source, 'utf8');
writeFileSync(DOC, bom + result, 'utf8');
console.log(`\n✓ Documento reparado y guardado.`);
console.log(`  copia de seguridad: ${backup}`);
