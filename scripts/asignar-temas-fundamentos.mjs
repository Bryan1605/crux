/**
 * Asigna `subcategory` (tema) a las fichas de Fundamentos.
 *
 * Uso de un solo uso (fase D del rediseño):
 *
 *   node scripts/asignar-temas-fundamentos.mjs           # simula: no escribe nada
 *   node scripts/asignar-temas-fundamentos.mjs --write   # escribe (con backup)
 *
 * Fuente: `docs/rediseno/datos/asignacion-fundamentos.json` (slug → tema; `null`
 * = la ficha de entrada, que no lleva tema). Aborta si algún estudio de
 * `01-fundamentos` falta en la asignación o al revés, o si un tema no está en
 * `content/temas.json`. Solo añade la línea `subcategory: "…"` tras `category:`;
 * el resto del archivo queda igual. Antes de escribir copia el original a
 * `content/.history/` (mismo formato que el panel). Después: `npm run build`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = path.join(ROOT, 'content');
const ESTUDIOS = path.join(CONTENT, 'estudios');
const HISTORY = path.join(CONTENT, '.history');
const ASIGNACION = path.join(ROOT, 'docs', 'rediseno', 'datos', 'asignacion-fundamentos.json');
const CATEGORIA = '01-fundamentos';
const WRITE = process.argv.includes('--write');

const fail = msg => {
  console.error(`ERROR ${msg}`);
  process.exit(1);
};

const { asignacion } = JSON.parse(fs.readFileSync(ASIGNACION, 'utf8'));
const temas = JSON.parse(fs.readFileSync(path.join(CONTENT, 'temas.json'), 'utf8'))[CATEGORIA] || [];
const keys = new Set(temas.map(t => t.key));

/** Frontmatter: el bloque entre los dos primeros `---`. */
function frontmatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  return m ? m[1] : null;
}

const field = (fm, name) => {
  const m = new RegExp(`^${name}:\\s*"?(.*?)"?\\s*$`, 'm').exec(fm);
  return m ? m[1] : null;
};

// Estudios de la categoría, por su frontmatter (no por el nombre del archivo).
const fichas = [];
for (const f of fs.readdirSync(ESTUDIOS).filter(x => x.endsWith('.md')).sort()) {
  const file = path.join(ESTUDIOS, f);
  const text = fs.readFileSync(file, 'utf8');
  const fm = frontmatter(text);
  if (!fm || field(fm, 'category') !== CATEGORIA) continue;
  fichas.push({ slug: f.replace(/\.md$/, ''), file, text, fm });
}

const slugs = new Set(fichas.map(f => f.slug));
const faltan = fichas.filter(f => !(f.slug in asignacion)).map(f => f.slug);
const sobran = Object.keys(asignacion).filter(s => !slugs.has(s));
if (faltan.length) fail(`fichas de ${CATEGORIA} sin tema en la asignación: ${faltan.join(', ')}`);
if (sobran.length) fail(`slugs de la asignación que no son fichas de ${CATEGORIA}: ${sobran.join(', ')}`);
const desconocidos = [...new Set(Object.values(asignacion).filter(t => t !== null && !keys.has(t)))];
if (desconocidos.length) fail(`temas que no están en content/temas.json: ${desconocidos.join(', ')}`);

const cambios = [];
const iguales = [];
const sinTema = [];
for (const ficha of fichas) {
  const tema = asignacion[ficha.slug];
  const actual = field(ficha.fm, 'subcategory');
  if (tema === null) {
    if (actual) fail(`${ficha.slug} es la ficha de entrada y ya tiene subcategory "${actual}"`);
    sinTema.push(ficha.slug);
    continue;
  }
  if (actual === tema) {
    iguales.push(ficha.slug);
    continue;
  }
  if (actual) fail(`${ficha.slug} ya tiene subcategory "${actual}" (la asignación dice "${tema}"); revísalo a mano`);
  const linea = `subcategory: ${JSON.stringify(tema)}`;
  const next = ficha.text.replace(/^(category:.*)$/m, `$1\n${linea}`);
  if (next === ficha.text) fail(`${ficha.slug}: no se encontró la línea category:`);
  cambios.push({ ...ficha, tema, next, linea });
}

// Resumen por tema, en el orden de la sidebar.
console.log(`${fichas.length} fichas de ${CATEGORIA} · ${WRITE ? 'ESCRIBIENDO' : 'SIMULACIÓN (sin --write no se toca nada)'}\n`);
const porTema = new Map(temas.map(t => [t.key, []]));
for (const c of cambios) porTema.get(c.tema).push(c.slug);
for (const s of iguales) porTema.get(asignacion[s]).push(`${s} (ya lo tenía)`);
for (const [tema, lista] of porTema) {
  console.log(`${String(lista.length).padStart(3)}  ${tema}`);
  for (const s of lista) console.log(`       ${s.replace(`${CATEGORIA}--`, '')}`);
}
console.log(`${String(sinTema.length).padStart(3)}  (sin tema · «Empieza aquí»): ${sinTema.join(', ')}`);
const total = [...porTema.values()].reduce((n, l) => n + l.length, 0) + sinTema.length;
console.log(`\nTotal ${total} · ${cambios.length} archivo(s) a modificar · ${iguales.length} sin cambios`);

if (cambios[0]) {
  const c = cambios[0];
  const fmNuevo = frontmatter(c.next).split(/\r?\n/);
  console.log(`\nEjemplo (${c.slug}.md):\n---\n${fmNuevo.map(l => (l === c.linea ? `+ ${l}` : `  ${l}`)).join('\n')}\n---`);
}

if (!WRITE) {
  console.log('\nNada escrito. Repite con --write para aplicar.');
  process.exit(0);
}

fs.mkdirSync(HISTORY, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
for (const c of cambios) {
  fs.copyFileSync(c.file, path.join(HISTORY, `${path.basename(c.file)}.${stamp}`));
  fs.writeFileSync(c.file, c.next, 'utf8');
}
console.log(`\n${cambios.length} archivo(s) escritos; copias en content/.history/ (*.${stamp}). Ahora: npm run build`);
