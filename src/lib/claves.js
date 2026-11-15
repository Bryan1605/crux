/**
 * Palabras clave resaltadas en los versículos de /apologetica/shincheonji
 * (content/apologetica/shincheonji-claves.json). Módulo puro: lo usan la página,
 * el validador del build y qa:shincheonji, así que lo que se valida es lo que se pinta.
 */
import { foldGreek, greekWords, tokenizeGreek } from './greek.js';

const foldWord = w => foldGreek(w.plain);

/**
 * Índices (en `tokenizeGreek(text)`) de las palabras griegas que forman alguna
 * de las secuencias `specs`. Se comparan plegadas: sin acentos, tildes ni rayas.
 */
export function greekMarks(text, specs = []) {
  const tokens = tokenizeGreek(text);
  const words = [];
  tokens.forEach((t, i) => t.k === 'w' && words.push({ i, f: foldWord(t) }));
  const marked = new Set();
  const found = specs.map(() => false);
  specs.forEach((spec, s) => {
    const want = greekWords(spec).map(foldWord);
    if (!want.length) return;
    for (let a = 0; a + want.length <= words.length; a++) {
      if (want.every((w, k) => words[a + k].f === w)) {
        for (let k = 0; k < want.length; k++) marked.add(words[a + k].i);
        found[s] = true;
      }
    }
  });
  return { tokens, marked, found };
}

/**
 * Trocea un texto en tramos normales y resaltados según las frases `specs`
 * (literales, la primera aparición de cada una). Devuelve también cuáles se hallaron.
 */
export function spanishMarks(text, specs = []) {
  const ranges = [];
  const found = specs.map(spec => {
    const at = spec ? text.indexOf(spec) : -1;
    if (at >= 0) ranges.push([at, at + spec.length]);
    return at >= 0;
  });
  ranges.sort((a, b) => a[0] - b[0]);
  const parts = [];
  let last = 0;
  for (const [from, to] of ranges) {
    if (from < last) continue;
    if (from > last) parts.push({ text: text.slice(last, from), mark: false });
    parts.push({ text: text.slice(from, to), mark: true });
    last = to;
  }
  if (last < text.length) parts.push({ text: text.slice(last), mark: false });
  return { parts, found };
}

/**
 * Comprueba que cada clave apunta a una referencia de su pregunta y que todas
 * sus frases aparecen en el versículo. Devuelve la lista de problemas.
 */
export function checkClaves(preguntas, claves) {
  const problemas = [];
  for (const p of preguntas) {
    const lista = claves[String(p.n)];
    if (!lista?.length) {
      problemas.push(`pregunta ${p.n}: sin palabra clave`);
      continue;
    }
    for (const c of lista) {
      const r = p.refs.find(x => x.label === c.ref);
      if (!r) {
        problemas.push(`pregunta ${p.n}: «${c.ref}» no es una referencia de la pregunta`);
        continue;
      }
      const es = (c.es || []).map(spec => r.ntv.some(v => spanishMarks(v.text, [spec]).found[0]));
      es.forEach((ok, i) => ok || problemas.push(`pregunta ${p.n}: «${c.es[i]}» no está en la NTV de ${r.label}`));
      if (c.grc?.length && !r.grc?.length) problemas.push(`pregunta ${p.n}: ${r.label} no tiene griego del Codex`);
      (c.grc || []).forEach(spec => {
        if (!r.grc?.some(v => greekMarks(v.grc, [spec]).found[0])) {
          problemas.push(`pregunta ${p.n}: «${spec}» no está en el griego de ${r.label}`);
        }
      });
      if (!c.es?.length && !c.grc?.length) problemas.push(`pregunta ${p.n}: ${r.label} sin frases`);
    }
  }
  return problemas;
}
