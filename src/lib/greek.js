/**
 * Griego — utilidades compartidas por la web y los scripts de build.
 *
 * El Codex no trae acentos y usa sigma lunada (`ϲ`). Además, el proyecto
 * sobrelinea tanto *nomina sacra* como abreviaturas y letras añadidas:
 *
 *   ‹θϲ›          → nomen sacrum completo (θεός)
 *   κοσμ‹ο›       → letra sobrelineada dentro de una palabra
 *   ‹πρ›α         → abreviatura con la desinencia fuera de la línea
 *
 * El tokenizador devuelve palabras completas (con sus marcas) y texto suelto.
 * La UI y `scripts/build-lemas.mjs` lo usan con el mismo criterio, así que el
 * índice de la palabra pulsada coincide siempre con el del mapa de lemas.
 */

const GREEK = /[\u0370-\u03ff\u1f00-\u1fff]/;
const WORD_RUN =
  /(?:[\u0370-\u03ff\u1f00-\u1fff]|[\u0300-\u036f]|\u02d9|[()\[\]]|\u2039[^\u203A]*\u203A)+/g;

/** Abecedario para el filtro del diccionario (sigma final incluida en σ). */
export const GREEK_LETTERS = [...'αβγδεζηθικλμνξοπρστυφχψω'];

/** ¿El carácter pertenece a los bloques griegos? */
export const isGreekChar = ch => GREEK.test(ch || '');

/**
 * Normaliza una palabra griega para comparar: sin acentos ni marcas, minúscula,
 * sigma final y sigma lunada → σ, y solo letras griegas.
 */
export function foldGreek(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u03c2\u03f2]/g, '\u03c3')
    .toLowerCase()
    .replace(/[^\u0370-\u03ff\u1f00-\u1fff]/g, '');
}

/** Normaliza texto español para buscar sin acentos ni mayúsculas. */
export function foldText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/** Primera letra del lema, para el filtro alfabético. */
export function greekLetter(value) {
  const first = foldGreek(value)[0];
  return GREEK_LETTERS.includes(first) ? first : '';
}

/** Texto visible de una palabra: sin marcadores de sobrelínea ni corchetes. */
function plainFromRaw(raw) {
  return String(raw)
    .replace(/\u2039([^\u203A]*)\u203A/g, '$1')
    .replace(/[()\[\]]/g, '')
    .replace(/[\u02d9\u0307\u0323]/g, '')
    .normalize('NFC');
}

/**
 * Parte una palabra en segmentos normales y sobrelineados, para pintarla.
 * `‹θϲ›` → [{ text:'θϲ', overline:true }]
 * `κοσμ‹ο›` → [{ text:'κοσμ' }, { text:'ο', overline:true }]
 */
export function splitOverline(raw) {
  const text = String(raw || '');
  const out = [];
  let last = 0;
  const re = /\u2039([^\u203A]*)\u203A/g;
  let m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ text: text.slice(last, m.index), overline: false });
    if (m[1]) out.push({ text: m[1], overline: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last), overline: false });
  return out;
}

/**
 * Convierte un texto del Codex en nodos:
 *
 *   { k:'w', v, plain, ns:[…], wholeNs, start, end }  palabra griega
 *   { k:'t', v }                                      espacio / puntuación
 *   { k:'sigil', v }                                  ancla del aparato (§N)
 *   { k:'mark', v: '>' }                              marca de transcripción
 *
 * `plain` no lleva sobrelíneas, paréntesis ni puntos editoriales; es la forma
 * que se busca en el diccionario. `wholeNs` indica que toda la palabra está
 * sobrelineada (candidata a nomen sacrum).
 */
export function tokenizeGreek(text) {
  const source = String(text || '');
  const out = [];
  let last = 0;
  WORD_RUN.lastIndex = 0;
  let m;

  const pushText = (from, to) => {
    if (to > from) out.push({ k: 't', v: source.slice(from, to) });
  };

  while ((m = WORD_RUN.exec(source))) {
    const raw = m[0];
    const plain = plainFromRaw(raw);
    if (!GREEK.test(plain)) {
      pushText(last, m.index);
      out.push({ k: 't', v: raw });
      last = m.index + raw.length;
      continue;
    }
    pushText(last, m.index);
    const ns = [...raw.matchAll(/\u2039([^\u203A]*)\u203A/g)].map(x => x[1]);
    const nsText = ns.join('');
    out.push({
      k: 'w',
      v: raw,
      plain,
      ns,
      wholeNs: ns.length > 0 && foldGreek(plain) === foldGreek(nsText),
      start: m.index,
      end: m.index + raw.length
    });
    last = m.index + raw.length;
  }
  pushText(last, source.length);

  // Separa los sigilos §N y las marcas > del texto suelto.
  const final = [];
  for (const token of out) {
    if (token.k !== 't') {
      final.push(token);
      continue;
    }
    const value = token.v;
    let i = 0;
    let buf = '';
    const flush = () => {
      if (buf) final.push({ k: 't', v: buf });
      buf = '';
    };
    while (i < value.length) {
      const ch = value[i];
      if (ch === '\u00a7') {
        let j = i + 1;
        while (j < value.length && value[j] >= '0' && value[j] <= '9') j += 1;
        flush();
        final.push({ k: 'sigil', v: value.slice(i + 1, j) });
        i = j;
      } else if (ch === '>') {
        flush();
        final.push({ k: 'mark', v: ch });
        i += 1;
      } else {
        buf += ch;
        i += 1;
      }
    }
    flush();
  }
  return final;
}

/** Solo las palabras griegas, en el mismo orden que usa la UI. */
export const greekWords = text => tokenizeGreek(text).filter(t => t.k === 'w');

/* -------------------------------------------------------------------------- */
/* Morfología                                                                 */
/* -------------------------------------------------------------------------- */

const POS_LABEL = {
  N: 'sustantivo',
  V: 'verbo',
  A: 'adjetivo',
  D: 'adverbio',
  P: 'preposición',
  C: 'conjunción',
  X: 'partícula',
  I: 'interjección',
  RA: 'artículo',
  RD: 'demostrativo',
  RI: 'interrogativo/indefinido',
  RP: 'pronombre personal',
  RR: 'relativo'
};

const CASE_LABEL = { N: 'nominativo', G: 'genitivo', D: 'dativo', A: 'acusativo', V: 'vocativo' };
const NUMBER_LABEL = { S: 'singular', P: 'plural' };
const GENDER_LABEL = { M: 'masculino', F: 'femenino', N: 'neutro' };
const TENSE_LABEL = { P: 'presente', I: 'imperfecto', F: 'futuro', A: 'aoristo', X: 'perfecto', Y: 'pluscuamperfecto' };
const VOICE_LABEL = { A: 'activa', M: 'media', P: 'pasiva' };
const MOOD_LABEL = { I: 'indicativo', D: 'imperativo', S: 'subjuntivo', O: 'optativo', N: 'infinitivo', P: 'participio' };
const PERSON_LABEL = { 1: '1.ª', 2: '2.ª', 3: '3.ª' };

/**
 * Traduce el código de 8 caracteres de MorphGNT a una descripción breve.
 *
 * Posiciones: persona · tiempo · voz · modo · caso · número · género · grado
 *   `----NSF-` → nominativo singular femenino
 *   `3AAI-S--` → aoristo activo indicativo, 3.ª singular
 *   `-PAPNSM-` → participio presente activo, nominativo singular masculino
 *   `-AAN----` → infinitivo aoristo activo
 */
export function describeMorph(pos, parse) {
  const code = String(parse || '').trim();
  if (code.length !== 8) return '';
  const person = code[0];
  const tense = code[1];
  const voice = code[2];
  const mood = code[3];
  const grammaticalCase = code[4];
  const number = code[5];
  const gender = code[6];

  const kind = String(pos || '').replace(/-$/, '');
  const label = POS_LABEL[kind] || '';
  const nominal = [CASE_LABEL[grammaticalCase], NUMBER_LABEL[number], GENDER_LABEL[gender]]
    .filter(Boolean)
    .join(' ');

  if (kind === 'V') {
    const verbal = [TENSE_LABEL[tense], VOICE_LABEL[voice], MOOD_LABEL[mood]].filter(Boolean).join(' ');
    if (mood === 'P') {
      return [label, [MOOD_LABEL[mood], TENSE_LABEL[tense], VOICE_LABEL[voice]].filter(Boolean).join(' '), nominal]
        .filter(Boolean)
        .join(', ');
    }
    if (mood === 'N') {
      return [label, [MOOD_LABEL[mood], TENSE_LABEL[tense], VOICE_LABEL[voice]].filter(Boolean).join(' ')]
        .filter(Boolean)
        .join(', ');
    }
    const personNumber = [PERSON_LABEL[person], NUMBER_LABEL[number]].filter(Boolean).join(' ');
    return [label, verbal, personNumber].filter(Boolean).join(', ');
  }

  return [label, nominal].filter(Boolean).join(', ');
}

/** Etiqueta española de una categoría MorphGNT (`N`, `V`, `RA`…). */
export const posLabel = pos => POS_LABEL[pos] || '';
