/**
 * Hidrata y verifica los fascículos de apologética (Adventismo, Dispensacionalismo…)
 * a partir de las definiciones en `scripts/apologetica-data/<slug>.mjs` y los
 * textos reales de `public/textos/exegesis/{ntv,codex}/`.
 *
 * Uso:
 *   node scripts/build-apologetica.mjs                    → simulación (sin escribir)
 *   node scripts/build-apologetica.mjs --write            → escribe los JSON en content/apologetica/
 *   node scripts/build-apologetica.mjs --slug adventismo --write
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ALL_BOOKS, BOOK_BY_ID, BOOK_BY_NAME } from '../src/data/exegesis.js';
import { checkClaves } from '../src/lib/claves.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TEXTOS = join(ROOT, 'public', 'textos', 'exegesis');
const OUT_DIR = join(ROOT, 'content', 'apologetica');

const args = process.argv.slice(2);
const WRITE = args.includes('--write');
const slugIdx = args.indexOf('--slug');
const TARGET_SLUG = slugIdx >= 0 ? args[slugIdx + 1] : 'all';

const SLUGS = TARGET_SLUG === 'all' ? ['adventismo', 'dispensacionalismo'] : [TARGET_SLUG];

/* ----------------------------------------------------------- referencias */

const plain = v =>
  String(v)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.\s]/g, '');

const ALIAS = new Map();
for (const b of ALL_BOOKS) {
  ALIAS.set(plain(b.name), b.id);
  ALIAS.set(plain(b.abbr), b.id);
}
// Formas corrientes y abreviaturas extra.
const EXTRA_ALIASES = {
  salmo: 'salmos',
  gl: 'galatas',
  ga: 'galatas',
  ap: 'apocalipsis',
  dt: 'deuteronomio',
  ex: 'exodo',
  lv: 'levitico',
  gn: 'genesis',
  mr: 'marcos',
  mc: 'marcos',
  ec: 'eclesiastes',
  is: 'isaias',
  jer: 'jeremias',
  ez: 'ezequiel',
  dn: 'daniel',
  jl: 'joel',
  zac: 'zacarias',
  mal: 'malaquias',
  he: 'hebreos',
  heb: 'hebreos',
  flm: 'filemon',
  jud: 'judas'
};
for (const [k, v] of Object.entries(EXTRA_ALIASES)) ALIAS.set(k, v);

const RAW_NAMES = [
  ...ALL_BOOKS.flatMap(b => [b.name, b.abbr]),
  'Salmo',
  'Gl',
  'Ap',
  'Dt',
  'Éx',
  'Ex',
  'Gn',
  'Lv',
  'Is',
  'Jer',
  'Ez',
  'Dn',
  'Jl',
  'Zac',
  'Mal',
  'Ec',
  'Heb',
  'Mr'
];
const names = [...new Set(RAW_NAMES)]
  .sort((a, b) => b.length - a.length)
  .map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
const REF = new RegExp(`(?<![\\p{L}\\d])(${names.join('|')})\\.?\\s+(\\d+):(\\d+)(?:-(\\d+))?`, 'gu');

const label = r => `${BOOK_BY_ID.get(r.libro).name} ${r.cap}:${r.desde}${r.hasta > r.desde ? `-${r.hasta}` : ''}`;

/**
 * Mapeos comprobados a mano entre NTV/Masorético y Codex Sinaiticus (LXX / griego).
 * Cada entrada cubre un libro y devuelve `{ codex, nota }` cuando aplica.
 */
function resolveLxxEquiv(r) {
  if (r.libro === '2-corintios' && r.cap === 13 && r.desde === 14 && r.hasta === 14) {
    return {
      codex: { cap: 13, desde: 13, hasta: 13 },
      nota: 'En el griego es el 13:13: las biblias en español parten en dos el versículo 12.'
    };
  }
  if (r.libro === 'joel' && r.cap === 2 && r.desde >= 28 && r.hasta <= 32) {
    const cd = r.desde - 27;
    const ch = r.hasta - 27;
    const rng = ch > cd ? `${cd}-${ch}` : `${cd}`;
    return {
      codex: { cap: 3, desde: cd, hasta: ch },
      nota: `En la Septuaginta (Codex Sinaiticus) corresponde a Joel 3:${rng}: la división de capítulos hebrea y griega difiere aquí de las biblias en español.`
    };
  }
  if (r.libro === 'jeremias' && r.cap === 31 && r.desde >= 31 && r.hasta <= 34) {
    const rng = r.hasta > r.desde ? `${r.desde}-${r.hasta}` : `${r.desde}`;
    return {
      codex: { cap: 38, desde: r.desde, hasta: r.hasta },
      nota: `En la Septuaginta (Codex Sinaiticus) corresponde a Jeremías 38:${rng}: la ordenación de capítulos en la segunda mitad de Jeremías difiere entre la Septuaginta y el texto masorético.`
    };
  }
  if (r.libro === 'salmos' && r.cap === 110 && r.desde >= 1 && r.hasta <= 7) {
    const rng = r.hasta > r.desde ? `${r.desde}-${r.hasta}` : `${r.desde}`;
    return {
      codex: { cap: 109, desde: r.desde, hasta: r.hasta },
      nota: `En la Septuaginta (Codex Sinaiticus) es el Salmo 109:${rng}: entre el Salmo 10 y el 147 la numeración griega va un número detrás.`
    };
  }
  if (r.libro === 'malaquias' && r.cap === 3 && r.desde >= 1 && r.hasta <= 18) {
    return {
      codex: { cap: 3, desde: r.desde, hasta: r.hasta }
    };
  }
  if (r.libro === 'malaquias' && r.cap === 4 && r.desde >= 1 && r.hasta <= 6) {
    // Mal 4:1-6 en NTV corresponde a Mal 3:19-24 en LXX (v.5->3:22 o 3:23 según códice).
    // Si hiciera falta en preguntas, mapear versículo a versículo; por ahora se bloquea si no está mapeado.
  }
  return null;
}

function assertSafeCodexMapping(r) {
  const book = BOOK_BY_ID.get(r.libro);
  if (!book?.codexNo) return;
  const unmappedOffset =
    (r.libro === 'salmos' && r.cap >= 10 && !r.codex) ||
    (r.libro === 'jeremias' && r.cap >= 25 && !r.codex) ||
    (r.libro === 'joel' && r.cap >= 2 && !r.codex) ||
    (r.libro === 'malaquias' && r.cap >= 3 && !r.codex) ||
    (r.libro === 'ester' && !r.codex);
  if (unmappedOffset) {
    throw new Error(
      `Desfase LXX sin mapear en ${r.label}: verifica el capítulo/versículo en public/textos/exegesis/codex/${r.libro}.json y añádelo a resolveLxxEquiv().`
    );
  }
}

const mk = (libro, cap, desde, hasta) => {
  const r = { libro, cap: Number(cap), desde: Number(desde), hasta: Number(hasta || desde) };
  const eq = resolveLxxEquiv(r);
  const out = { ...r, label: label(r), ...(eq ? { codex: eq.codex, ...(eq.nota ? { nota: eq.nota } : {}) } : {}) };
  assertSafeCodexMapping(out);
  return out;
};

/** Referencias de un texto, en orden. `base` resuelve «(v. 29)». */
function extractRefs(text, base = null) {
  const out = [];
  REF.lastIndex = 0;
  let m;
  while ((m = REF.exec(text))) {
    const libro = ALIAS.get(plain(m[1]));
    if (!libro) continue;
    let cap = m[2];
    out.push(mk(libro, cap, m[3], m[4]));
    let rest = text.slice(REF.lastIndex);
    for (;;) {
      const c =
        /^\s*(?:y|,|;)\s*(\d+):(\d+)(?:-(\d+))?/.exec(rest) ||
        /^\s*(?:y|,)\s*(\d+)(?:-(\d+))?(?!\d)(?!:\d)(?!\s+\p{L})/u.exec(rest);
      if (!c) break;
      if (c.length === 4) {
        cap = c[1];
        out.push(mk(libro, cap, c[2], c[3]));
      } else {
        out.push(mk(libro, cap, c[1], c[2]));
      }
      rest = rest.slice(c[0].length);
      REF.lastIndex += c[0].length;
    }
  }
  for (const s1 of text.matchAll(/(?<![\p{L}\d])(Judas|Filemón|2 Juan|3 Juan|Abdías)\s+(\d+)(?:-(\d+))?(?!\d)(?!:\d)/gu)) {
    const libro = ALIAS.get(plain(s1[1]));
    if (libro) out.push(mk(libro, 1, s1[2], s1[3]));
  }
  if (base) {
    for (const v of text.matchAll(/\bv\.\s*(\d+)(?:-(\d+))?/g)) out.push(mk(base.libro, base.cap, v[1], v[2]));
  }
  const seen = new Set();
  return out.filter(r => !seen.has(r.label) && seen.add(r.label));
}

/* ----------------------------------------------------------- carga exégesis */

const cache = new Map();
const load = (dir, id) => {
  const key = `${dir}/${id}`;
  if (!cache.has(key)) {
    const f = join(TEXTOS, dir, `${id}.json`);
    cache.set(key, existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : null);
  }
  return cache.get(key);
};

const hasVerses = (dir, r) => {
  const ch = load(dir, r.libro)?.chapters?.find(c => (c.num ?? c.n) === r.cap);
  if (!ch) return 0;
  let n = 0;
  for (let v = r.desde; v <= r.hasta; v++) if (ch.verses.some(x => x.n === v)) n++;
  return n;
};

const withTexts = r => {
  const pick = (dir, ref) =>
    (load(dir, ref.libro)?.chapters?.find(c => (c.num ?? c.n) === ref.cap)?.verses || []).filter(
      v => v.n >= ref.desde && v.n <= ref.hasta
    );
  const g = r.codex ? { ...r, ...r.codex } : r;
  const grc = BOOK_BY_ID.get(r.libro)?.codexNo ? pick('codex', g) : [];
  const complete = grc.length === g.hasta - g.desde + 1;
  return {
    ...r,
    ntv: pick('ntv', r).map(v => ({ n: v.n, text: v.text.replace(/\[[a-z]{1,2}\]/g, '') })),
    grc: complete ? grc.map(v => ({ n: v.n, grc: v.grc })) : [],
    pagina: complete ? grc[0].pages?.[0] || '' : ''
  };
};

const ntvRango = textRef => {
  const m = /^(.+?)\s(\d+):(\d+)(?:-(\d+))?$/.exec(textRef);
  const book = m && BOOK_BY_NAME.get(m[1]);
  if (!book) return null;
  const data = load('ntv', book.id);
  const ch = data?.chapters?.find(c => (c.num ?? c.n) === Number(m[2]));
  const desde = Number(m[3]);
  const hasta = Number(m[4] || m[3]);
  return (ch?.verses || [])
    .filter(v => v.n >= desde && v.n <= hasta)
    .map(v => v.text.replace(/\[[a-z]{1,2}\]/g, ''))
    .join(' ');
};

/* ----------------------------------------------------------- proceso por fascículo */

let failed = false;

for (const slug of SLUGS) {
  const modPath = join(ROOT, 'scripts', 'apologetica-data', `${slug}.mjs`);
  if (!existsSync(modPath)) {
    console.error(`No existe ${modPath}`);
    process.exit(1);
  }
  const spec = (await import(`file://${modPath.replace(/\\/g, '/')}`)).default;

  const bloques = spec.bloques.map(b => ({
    id: b.id,
    titulo: b.titulo,
    desde: b.preguntas[0].n,
    hasta: b.preguntas[b.preguntas.length - 1].n,
    preguntas: b.preguntas.map(p => {
      const refs = p.refs ? p.refs.flatMap(x => extractRefs(x)) : extractRefs(p.texto);
      const claveRefs = p.claveRefs
        ? p.claveRefs.flatMap(x => extractRefs(x, refs[0])).filter(r => !refs.some(x => x.label === r.label))
        : extractRefs(p.clave, refs[0]).filter(r => !refs.some(x => x.label === r.label));
      return {
        n: p.n,
        texto: p.texto,
        clave: p.clave,
        refs: refs.map(withTexts),
        claveRefs
      };
    })
  }));

  const preguntas = bloques.flatMap(b => b.preguntas);
  const problemas = [];
  preguntas.forEach((p, i) => {
    if (p.n !== i + 1) problemas.push(`numeración: pregunta ${p.n} en la posición ${i + 1}`);
    if (!p.clave?.trim()) problemas.push(`pregunta ${p.n}: sin clave`);
    if (!p.refs.length) problemas.push(`pregunta ${p.n}: sin referencia bíblica`);
  });

  let ntvOk = 0;
  let ntvTotal = 0;
  let codexCount = 0;
  const faltan = [];
  const sinCodex = [];
  const allRefs = [];
  for (const p of preguntas) {
    for (const r of [...p.refs, ...p.claveRefs]) {
      allRefs.push(r);
      const want = r.hasta - r.desde + 1;
      const got = hasVerses('ntv', r);
      ntvTotal += want;
      ntvOk += got;
      if (got < want) faltan.push(`p.${p.n}: ${r.label} (NTV ${got}/${want})`);
      const cTarget = r.codex ? { ...r, ...r.codex } : r;
      if (hasVerses('codex', cTarget) === want) codexCount++;
      else sinCodex.push(`p.${p.n}: ${r.label}`);
    }
  }

  console.log(`\n=== ${slug.toUpperCase()} ===`);
  console.log(`Bloques: ${bloques.length} · preguntas: ${preguntas.length} · reglas: ${spec.reglas.length}`);
  console.log(`Versículos NTV: ${ntvOk}/${ntvTotal} · refs completas en Codex: ${codexCount}/${allRefs.length}`);
  if (sinCodex.length) console.log(`Sin griego completo en Codex (solo NTV + aviso): ${sinCodex.join(', ')}`);
  if (faltan.length) {
    console.error(`FALTAN en NTV:\n  ${faltan.join('\n  ')}`);
    failed = true;
  }
  if (problemas.length) {
    console.error(`PROBLEMAS:\n  ${problemas.join('\n  ')}`);
    failed = true;
  }

  // Comprobar claves si existe el archivo
  const clavesPath = join(OUT_DIR, `${slug}-claves.json`);
  if (existsSync(clavesPath)) {
    const claves = JSON.parse(readFileSync(clavesPath, 'utf8')).claves || {};
    const malClaves = checkClaves(preguntas, claves);
    if (malClaves.length) {
      console.error(`CLAVES INVÁLIDAS (${slug}):\n  ${malClaves.join('\n  ')}`);
      failed = true;
    } else {
      console.log(`Claves OK: ${preguntas.length}/${preguntas.length} verificadas contra NTV y Codex`);
    }
  } else {
    console.log(`Aviso: aún no existe ${slug}-claves.json (se validará tras crearlo)`);
  }

  // Comprobar citas NTV de doctrina si existe el archivo
  const docPath = join(OUT_DIR, `${slug}-doctrina.json`);
  if (existsSync(docPath)) {
    const doc = JSON.parse(readFileSync(docPath, 'utf8'));
    const malNtv = [];
    for (const part of doc.partes || []) {
      const cita = part.biblia?.cita;
      if (cita && !ntvRango(cita.ref)?.includes(cita.texto)) {
        malNtv.push(`Parte ${part.id}: cita de ${cita.ref}`);
      }
      for (const punto of part.biblia?.puntos || []) {
        for (const r of punto.refs || []) {
          if (!ntvRango(r)) malNtv.push(`Parte ${part.id}: ${r} no existe en la NTV`);
        }
        const texto = (punto.refs || []).map(ntvRango).join(' ');
        for (const frase of punto.cita || []) {
          if (!texto.includes(frase)) malNtv.push(`Parte ${part.id}: «${frase}» no está en ${punto.ref}`);
        }
      }
    }
    for (const q of doc.preguntas || []) {
      if (q.ref && !ntvRango(q.ref)) malNtv.push(`Pregunta p.${q.pagina}: ${q.ref} no existe en la NTV`);
    }
    if (malNtv.length) {
      console.error(`DOCTRINA NTV INVÁLIDA (${slug}):\n  ${malNtv.join('\n  ')}`);
      failed = true;
    } else {
      const citasTotal = (doc.partes || []).reduce((n, p) => n + (p.citas || p.lee || []).length, 0);
      console.log(`Doctrina OK: ${doc.partes.length} partes · ${citasTotal} citas · citas NTV literales`);
    }
  }

  const outData = {
    version: 1,
    fuente: {
      archivo: `scripts/apologetica-data/${slug}.mjs`,
      actualizado: spec.actualizado
    },
    fuentes: ['csp-acerca-del-codex', 'csp-codex-sinaiticus'],
    reglas: spec.reglas,
    bloques
  };

  const outFile = join(OUT_DIR, `${slug}-preguntas.json`);
  if (WRITE && !faltan.length && !problemas.length) {
    mkdirSync(OUT_DIR, { recursive: true });
    writeFileSync(outFile, `${JSON.stringify(outData, null, 2)}\n`, 'utf8');
    console.log(`Escrito content/apologetica/${slug}-preguntas.json`);
  }
}

if (!WRITE) {
  console.log('\nSimulación: añade --write para escribir los JSON.');
}
if (failed) process.exit(1);
