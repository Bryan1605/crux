/**
 * Léxico griego — parsers y alineación (Node, sin red ni disco).
 *
 * Fuentes:
 *   - TBESG (STEPBible, CC BY 4.0; base Abbott-Smith 1922, dominio público)
 *   - MorphGNT (CC BY-SA 3.0; solo se usan lema y morfología, no el texto SBLGNT)
 *
 * El Codex escribe sin acentos, con sigma lunada (ϲ) y con abreviaturas
 * sobrelineadas. El mapa `NS_MAP` solo contiene *nomina sacra* verificados en el
 * propio códice; las abreviaturas no sagradas (ἐν, ἤ, ᾧ, ὁ, περί…) las resuelve
 * la alineación por contexto. `ιβ` (12) va aparte para no marcarlo como sacro.
 */
import { foldGreek, greekWords } from '../src/lib/greek.js';

/* ========================================================================== */
/* TBESG                                                                      */
/* ========================================================================== */

/** Limpia un lema: sin etiquetas, sin paréntesis de formas alternativas. */
export function cleanLemma(value) {
  return String(value || '')
    .replace(/<[^>]+>/g, '')
    .replace(/[†*‡]/g, '')
    .replace(/[()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function cleanGloss(value) {
  return String(value || '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

export function cleanDefinition(value) {
  return String(value || '')
    .replace(/<BR\s*\/?>/gi, ' ')
    .replace(/<ref='[^']*'>/gi, '')
    .replace(/<\/?[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Familia gramatical de TBESG (`G:N-M` → `N`, `G:P-1` → `RP`…). */
export function posFamily(posRaw) {
  const raw = String(posRaw || '').replace(/^[A-Z]:/, '').trim();
  if (!raw) return '';
  if (raw.startsWith('N')) return 'N';
  if (raw.startsWith('V')) return 'V';
  if (raw.startsWith('ADV')) return 'D';
  if (raw.startsWith('A')) return 'A';
  if (raw.startsWith('D')) return 'RD';
  if (raw.startsWith('T')) return 'RA';
  if (raw.startsWith('PRT')) return 'X';
  if (raw.startsWith('P-')) return 'RP';
  if (raw.startsWith('PREP')) return 'P';
  if (raw.startsWith('P')) return 'P';
  if (raw.startsWith('CONJ')) return 'C';
  if (raw.startsWith('R')) return 'RR';
  if (raw.startsWith('I')) return 'RI';
  if (raw.startsWith('X')) return 'RI';
  return raw[0] || '';
}

/** Etiqueta española a partir de la categoría de TBESG. */
export function posEs(posRaw, fallback = '') {
  let raw = String(posRaw || '').replace(/^[A-Z]:/, '').trim();
  if (!raw) return fallback;
  if (raw.includes('+')) raw = raw.split('+')[0].replace(/^[A-Z]:/, '').trim();
  if (raw.startsWith('PREP')) return 'preposición';
  if (raw === 'P' || raw.startsWith('P-')) return 'pronombre personal';
  if (raw.startsWith('F-')) return 'pronombre reflexivo';
  if (raw.startsWith('S-')) return 'pronombre posesivo';
  if (raw.startsWith('PRT-I')) return 'adverbio interrogativo';
  if (raw.startsWith('PRT')) return 'partícula';
  if (raw.startsWith('CONJ') || raw.startsWith('COND')) return 'conjunción';
  if (raw.startsWith('T')) return 'artículo';
  if (raw.startsWith('D')) return 'pronombre demostrativo';
  if (raw.startsWith('R')) return 'pronombre relativo';
  if (raw.startsWith('INJ')) return 'interjección';
  if (raw.startsWith('I')) return 'pronombre interrogativo';
  if (raw.startsWith('ADV')) return 'adverbio';
  if (raw.startsWith('A')) return raw.includes('/') ? 'adjetivo/adverbio' : 'adjetivo';
  if (raw.startsWith('V')) return 'verbo';
  if (raw.startsWith('K')) return 'pronombre relativo';
  if (raw.startsWith('C')) return raw.startsWith('C-') ? 'pronombre recíproco' : 'conjunción';
  if (raw.startsWith('N')) {
    const tail = raw.split(':').pop() || '';
    const parts = tail.split(/[-/]/);
    if (parts[0] === 'N') parts.shift();
    const genders = parts.filter(part => part === 'M' || part === 'F' || part === 'N');
    const unique = [...new Set(genders)];
    const gender =
      unique.includes('M') && unique.includes('F')
        ? 'masculino/femenino'
        : unique.includes('F')
          ? 'femenino'
          : unique.includes('N')
            ? 'neutro'
            : unique.includes('M')
              ? 'masculino'
              : '';
    if (tail.includes('--L') || tail.includes('--P')) {
      return gender ? `sustantivo propio ${gender}` : 'sustantivo propio';
    }
    return gender ? `sustantivo ${gender}` : 'sustantivo';
  }
  return fallback;
}

/** Corrige la transcripción de TBESG para las aspiradas iniciales. */
export function cleanTranslit(value) {
  return String(value || '')
    .replace(/^oh/, 'ho')
    .replace(/^uh/, 'hu')
    .replace(/^eh/, 'he')
    .replace(/^ih/, 'hi')
    .replace(/^ah/, 'ha');
}

/**
 * Parsea el TSV de TBESG. Devuelve una entrada por cada lema alternativo
 * (`α, Ἀλφα` produce dos), con la misma numeración Strong.
 */
export function parseTbesg(raw) {
  const entries = [];
  for (const line of String(raw || '').split(/\r?\n/)) {
    if (!/^G\d{4,5}[A-Z]?\t/.test(line)) continue;
    const cols = line.split('\t');
    if (cols.length < 8) continue;
    const strongFull = cols[0].trim();
    let strong = strongFull.replace(/[A-Z]+$/, '');
    const relation = cols[1].trim();
    const parent = cols[2].trim();
    const ownNumber = Number(strong.replace(/\D/g, ''));
    if (
      ownNumber > 5624 &&
      /a (?:form|meaning|spelling) of/i.test(relation) &&
      /^G\d{4,5}[A-Z]?$/.test(parent)
    ) {
      strong = parent.replace(/[A-Z]+$/, '');
    }
    const lemmaRaw = cols[3].trim();
    const translit = cols[4].trim().split(/\s*,\s*/)[0] || '';
    const posRaw = cols[5].trim();
    const gloss = cleanGloss(cols[6]);
    const definition = cleanDefinition(cols[7]);
    const lemmas = lemmaRaw
      .split(/\s*[,=]\s*/)
      .map(cleanLemma)
      .filter(Boolean);
    for (const lemma of lemmas) {
      entries.push({
        strongFull,
        strong,
        lemma,
        translit,
        posRaw,
        pos: posFamily(posRaw),
        gloss,
        definition
      });
    }
  }
  return entries;
}

export function indexTbesg(entries) {
  const byLemma = new Map();
  const byLemmaExact = new Map();
  const byStrong = new Map();
  const byPrefix = new Map();
  const add = (map, key, value) => {
    if (!key) return;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(value);
  };
  for (const entry of entries) {
    const folded = foldGreek(entry.lemma);
    add(byLemma, folded, entry);
    add(byLemmaExact, entry.lemma.normalize('NFC'), entry);
    add(byPrefix, folded.slice(0, 4), entry);
    add(byStrong, entry.strongFull, entry);
    if (entry.strong !== entry.strongFull) add(byStrong, entry.strong, entry);
  }
  return { entries, byLemma, byLemmaExact, byStrong, byPrefix, cache: new Map() };
}

/** Variantes morfológicas con las que TBESG suele lematizar. */
function lemmaVariants(lemma) {
  const folded = foldGreek(lemma);
  const out = new Set([folded]);
  const add = value => {
    if (value.length >= 2) out.add(value);
  };
  if (folded.endsWith('ομαι')) add(folded.slice(0, -4) + 'ω');
  if (folded.endsWith('μαι')) add(folded.slice(0, -3) + 'ω');
  if (folded.endsWith('μι')) add(folded.slice(0, -2) + 'ω');
  if (folded.endsWith('ω')) {
    add(folded.slice(0, -1) + 'ομαι');
    add(folded.slice(0, -1) + 'μι');
  }
  if (folded.endsWith('ν')) add(folded.slice(0, -1));
  return [...out];
}

/**
 * Elige la entrada TBESG más probable para un lema y una categoría MorphGNT.
 * Prioriza la numeración Strong original (1–5624), sin sufijo y con glosa.
 */
function tbesgScore(entry, pos) {
  let score = 0;
  if (!/[A-Z]$/.test(entry.strongFull)) score += 4;
  const num = Number(entry.strong.replace(/\D/g, ''));
  if (num >= 1 && num <= 5624) score += 2;
  if (entry.gloss) score += 1;
  if (pos && entry.pos === pos) score += 3;
  return score;
}

function bestTbesg(list, pos) {
  return list
    .slice()
    .sort(
      (a, b) =>
        tbesgScore(b, pos) - tbesgScore(a, pos) ||
        a.strongFull.length - b.strongFull.length ||
        a.strongFull.localeCompare(b.strongFull)
    )[0];
}

/**
 * Elige la entrada TBESG más probable para un lema y una categoría MorphGNT.
 * Prioriza la numeración Strong original (1–5624), sin sufijo y con glosa.
 * Prueba variantes activa/media (`πορεύομαι` → `πορεύω`) y, si falla, busca
 * por prefijo con distancia mínima (nombres como `Μαριάμ` → `Μαρία`).
 */
export function pickTbesg(lemma, pos = '', index) {
  if (!index) return null;
  const cacheKey = `${String(lemma || '').normalize('NFC')}|${pos}`;
  if (index.cache?.has(cacheKey)) return index.cache.get(cacheKey);
  let found = null;
  const exact = index.byLemmaExact?.get(String(lemma || '').normalize('NFC'));
  if (exact?.length) found = bestTbesg(exact, pos);
  if (!found) {
    for (const variant of lemmaVariants(lemma)) {
      const list = index.byLemma.get(variant);
      if (list?.length) {
        found = bestTbesg(list, pos);
        break;
      }
    }
  }
  if (!found) {
    const folded = foldGreek(lemma);
    if (folded.length >= 4) {
      const candidates = index.byPrefix.get(folded.slice(0, 4)) || [];
      let best = null;
      let bestDistance = 99;
      for (const entry of candidates) {
        const distance = levenshtein(folded, foldGreek(entry.lemma));
        if (distance < bestDistance) {
          bestDistance = distance;
          best = entry;
        } else if (
          distance === bestDistance &&
          best &&
          tbesgScore(entry, pos) > tbesgScore(best, pos)
        ) {
          best = entry;
        }
      }
      if (best && bestDistance <= 2) found = best;
    }
  }
  index.cache?.set(cacheKey, found);
  return found;
}

/** Entrada TBESG por número Strong (completo o base). */
export function pickTbesgByStrong(strong, index) {
  const list = index?.byStrong?.get(String(strong || '').trim()) || [];
  return list[0] || null;
}

/* ========================================================================== */
/* MorphGNT                                                                   */
/* ========================================================================== */

/**
 * Parsea un fichero de MorphGNT (7 columnas separadas por espacios):
 * bcv · POS · parse(8) · texto · palabra · normalizada · lema.
 */
export function parseMorphGnt(raw) {
  const verses = new Map();
  for (const line of String(raw || '').split(/\r?\n/)) {
    if (!line.trim()) continue;
    const cols = line.split(/\s+/);
    if (cols.length !== 7) continue;
    const [bcv, posRaw, parse, , word, , lemmaRaw] = cols;
    const chapter = Number(bcv.slice(2, 4));
    const verse = Number(bcv.slice(4, 6));
    if (!chapter || !verse) continue;
    const lemma = cleanLemma(lemmaRaw);
    if (!lemma) continue;
    const key = `${chapter}:${verse}`;
    if (!verses.has(key)) verses.set(key, []);
    verses.get(key).push({
      pos: posRaw.replace(/-$/, ''),
      parse,
      word,
      norm: foldGreek(word),
      lemma
    });
  }
  return verses;
}

/* ========================================================================== */
/* Nomina sacra verificados en el Codex                                       */
/* ========================================================================== */

const NS_ROWS = [
  // θεός
  ['θσ', 'θεός', 'θεός'],
  ['θυ', 'θεοῦ', 'θεός'],
  ['θω', 'θεῷ', 'θεός'],
  ['θν', 'θεόν', 'θεός'],
  ['θε', 'θεέ', 'θεός'],
  ['θεοσ', 'θεός', 'θεός'],
  ['θεου', 'θεοῦ', 'θεός'],
  ['θεω', 'θεῷ', 'θεός'],
  ['θεον', 'θεόν', 'θεός'],
  ['θεε', 'θεέ', 'θεός'],
  // κύριος
  ['κσ', 'κύριος', 'κύριος'],
  ['κυ', 'κυρίου', 'κύριος'],
  ['κω', 'κυρίῳ', 'κύριος'],
  ['κν', 'κύριον', 'κύριος'],
  ['κε', 'κύριε', 'κύριος'],
  ['κυριοσ', 'κύριος', 'κύριος'],
  ['κυριου', 'κυρίου', 'κύριος'],
  ['κυριω', 'κυρίῳ', 'κύριος'],
  ['κυριον', 'κύριον', 'κύριος'],
  ['κυριε', 'κύριε', 'κύριος'],
  // Ἰησοῦς
  ['ισ', 'Ἰησοῦς', 'Ἰησοῦς'],
  ['ιυ', 'Ἰησοῦ', 'Ἰησοῦς'],
  ['ιν', 'Ἰησοῦν', 'Ἰησοῦς'],
  ['ιησουσ', 'Ἰησοῦς', 'Ἰησοῦς'],
  ['ιησου', 'Ἰησοῦ', 'Ἰησοῦς'],
  ['ιησουν', 'Ἰησοῦν', 'Ἰησοῦς'],
  // Χριστός
  ['χσ', 'Χριστός', 'Χριστός'],
  ['χυ', 'Χριστοῦ', 'Χριστός'],
  ['χω', 'Χριστῷ', 'Χριστός'],
  ['χν', 'Χριστόν', 'Χριστός'],
  ['χριστοσ', 'Χριστός', 'Χριστός'],
  ['χριστου', 'Χριστοῦ', 'Χριστός'],
  ['χριστω', 'Χριστῷ', 'Χριστός'],
  ['χριστον', 'Χριστόν', 'Χριστός'],
  // πνεῦμα
  ['πνα', 'πνεῦμα', 'πνεῦμα'],
  ['πνσ', 'πνεύματος', 'πνεῦμα'],
  ['πνι', 'πνεύματι', 'πνεῦμα'],
  ['πν', 'πνεῦμα', 'πνεῦμα'],
  ['πνευμα', 'πνεῦμα', 'πνεῦμα'],
  ['πνευματοσ', 'πνεύματος', 'πνεῦμα'],
  ['πνευματι', 'πνεύματι', 'πνεῦμα'],
  ['πνευματα', 'πνεύματα', 'πνεῦμα'],
  ['πνευματων', 'πνευμάτων', 'πνεῦμα'],
  ['πνευμασιν', 'πνεύμασιν', 'πνεῦμα'],
  ['πνευμασι', 'πνεύμασι', 'πνεῦμα'],
  ['πνατα', 'πνεύματα', 'πνεῦμα'],
  ['πνατων', 'πνευμάτων', 'πνεῦμα'],
  ['πνασιν', 'πνεύμασιν', 'πνεῦμα'],
  ['πνασι', 'πνεύμασι', 'πνεῦμα'],
  ['πνατω', 'πνεύματι', 'πνεῦμα'],
  // υἱός
  ['υσ', 'υἱός', 'υἱός'],
  ['υυ', 'υἱοῦ', 'υἱός'],
  ['υω', 'υἱῷ', 'υἱός'],
  ['υν', 'υἱόν', 'υἱός'],
  ['υιοσ', 'υἱός', 'υἱός'],
  ['υιου', 'υἱοῦ', 'υἱός'],
  ['υιω', 'υἱῷ', 'υἱός'],
  ['υιον', 'υἱόν', 'υἱός'],
  // ἄνθρωπος
  ['ανοσ', 'ἄνθρωπος', 'ἄνθρωπος'],
  ['ανου', 'ἀνθρώπου', 'ἄνθρωπος'],
  ['ανω', 'ἀνθρώπῳ', 'ἄνθρωπος'],
  ['ανον', 'ἄνθρωπον', 'ἄνθρωπος'],
  ['ανοι', 'ἄνθρωποι', 'ἄνθρωπος'],
  ['ανων', 'ἀνθρώπων', 'ἄνθρωπος'],
  ['ανουσ', 'ἀνθρώπους', 'ἄνθρωπος'],
  ['ανθρωποσ', 'ἄνθρωπος', 'ἄνθρωπος'],
  ['ανθρωπου', 'ἀνθρώπου', 'ἄνθρωπος'],
  ['ανθρωπω', 'ἀνθρώπῳ', 'ἄνθρωπος'],
  ['ανθρωπον', 'ἄνθρωπον', 'ἄνθρωπος'],
  ['ανθρωποι', 'ἄνθρωποι', 'ἄνθρωπος'],
  ['ανθρωπων', 'ἀνθρώπων', 'ἄνθρωπος'],
  ['ανθρωπουσ', 'ἀνθρώπους', 'ἄνθρωπος'],
  // μήτηρ
  ['μηρ', 'μήτηρ', 'μήτηρ'],
  ['μρα', 'μητέρα', 'μήτηρ'],
  ['μρσ', 'μητρός', 'μήτηρ'],
  ['μητηρ', 'μήτηρ', 'μήτηρ'],
  ['μητερα', 'μητέρα', 'μήτηρ'],
  ['μητροσ', 'μητρός', 'μήτηρ'],
  // Δαυίδ
  ['δαδ', 'Δαυίδ', 'Δαυίδ'],
  ['δαυιδ', 'Δαυίδ', 'Δαυίδ'],
  // Ἰσραήλ
  ['ιηλ', 'Ἰσραήλ', 'Ἰσραήλ'],
  ['ισλ', 'Ἰσραήλ', 'Ἰσραήλ'],
  ['ισραηλ', 'Ἰσραήλ', 'Ἰσραήλ'],
  // Ἰερουσαλήμ
  ['ιηλμ', 'Ἰερουσαλήμ', 'Ἰερουσαλήμ'],
  ['ηλμ', 'Ἰερουσαλήμ', 'Ἰερουσαλήμ'],
  ['λημ', 'Ἰερουσαλήμ', 'Ἰερουσαλήμ'],
  ['ιερουσαλημ', 'Ἰερουσαλήμ', 'Ἰερουσαλήμ'],
  // οὐρανός
  ['ουνοσ', 'οὐρανός', 'οὐρανός'],
  ['ουνου', 'οὐρανοῦ', 'οὐρανός'],
  ['ουνω', 'οὐρανῷ', 'οὐρανός'],
  ['ουνον', 'οὐρανόν', 'οὐρανός'],
  ['ουνων', 'οὐρανῶν', 'οὐρανός'],
  ['ουνουσ', 'οὐρανούς', 'οὐρανός'],
  ['ουρανοσ', 'οὐρανός', 'οὐρανός'],
  ['ουρανου', 'οὐρανοῦ', 'οὐρανός'],
  ['ουρανω', 'οὐρανῷ', 'οὐρανός'],
  ['ουρανον', 'οὐρανόν', 'οὐρανός'],
  ['ουρανων', 'οὐρανῶν', 'οὐρανός'],
  ['ουρανουσ', 'οὐρανούς', 'οὐρανός'],
  // πατήρ (¡πρσ es πατρός, no πρός!)
  ['πρσ', 'πατρός', 'πατήρ'],
  ['πρι', 'πατρί', 'πατήρ'],
  ['πρα', 'πατέρα', 'πατήρ'],
  ['πηρ', 'πατήρ', 'πατήρ'],
  ['πατηρ', 'πατήρ', 'πατήρ'],
  ['πατροσ', 'πατρός', 'πατήρ'],
  ['πατρι', 'πατρί', 'πατήρ'],
  ['πατερα', 'πατέρα', 'πατήρ']
];

/** Abreviaturas no sagradas que la alineación no puede resolver por forma. */
const ABBR_ROWS = [['ιβ', 'δώδεκα', 'δώδεκα']];

export const NS_MAP = new Map(
  NS_ROWS.map(([key, form, lemma]) => [foldGreek(key), { form, lemma, ns: true }])
);

export const ABBR_MAP = new Map(
  ABBR_ROWS.map(([key, form, lemma]) => [foldGreek(key), { form, lemma, ns: false }])
);

/** Devuelve la abreviatura conocida de una palabra sobrelineada, si la hay. */
export function abbreviationForWord(word) {
  if (!word || !Array.isArray(word.ns) || word.ns.length === 0) return null;
  const key = foldGreek(word.plain);
  return NS_MAP.get(key) || ABBR_MAP.get(key) || null;
}

/** Prepara una palabra del Codex con su forma de comparación y su abreviatura. */
export function prepareCodexWord(word) {
  const nsMatch = abbreviationForWord(word);
  return {
    ...word,
    nsMatch,
    match: foldGreek(nsMatch ? nsMatch.form : word.plain)
  };
}

export const prepareCodexWords = words => words.map(prepareCodexWord);

/* ========================================================================== */
/* Formas flexionadas (respaldo para variantes del Codex)                     */
/* ========================================================================== */

/**
 * Índice forma → lema/parse/POS más frecuente en todo el NT.
 * Sirve para palabras que el Codex añade y que no existen en su versículo de
 * MorphGNT (crasis deshechas, artículos, partículas): la forma ya aparece en
 * otro lugar del corpus.
 */
export function indexMorphForms(verseMaps) {
  const forms = new Map();
  const maps = Array.isArray(verseMaps) ? verseMaps : [verseMaps];
  for (const verses of maps) {
    for (const words of verses.values()) {
      for (const w of words) {
        let combos = forms.get(w.norm);
        if (!combos) {
          combos = new Map();
          forms.set(w.norm, combos);
        }
        const key = `${w.lemma}\u0000${w.parse}\u0000${w.pos}`;
        const item = combos.get(key) || {
          lemma: w.lemma,
          parse: w.parse,
          pos: w.pos,
          count: 0
        };
        item.count += 1;
        combos.set(key, item);
      }
    }
  }
  const best = new Map();
  for (const [form, combos] of forms) {
    best.set(
      form,
      [...combos.values()].sort((a, b) => b.count - a.count)[0]
    );
  }
  const byPrefix = new Map();
  for (const form of best.keys()) {
    const prefix = form.slice(0, 2);
    if (!byPrefix.has(prefix)) byPrefix.set(prefix, []);
    byPrefix.get(prefix).push(form);
  }
  best.byPrefix = byPrefix;
  return best;
}

/** Busca una forma parecida (itacismos y variantes ortográficas del Codex). */
function fuzzyForm(formIndex, key) {
  if (!key || key.length < 2 || !formIndex.byPrefix) return null;
  const candidates = formIndex.byPrefix.get(key.slice(0, 2)) || [];
  const maxDistance = key.length <= 5 ? 1 : key.length <= 9 ? 2 : 3;
  let best = null;
  let bestDistance = maxDistance + 1;
  for (const form of candidates) {
    const distance = levenshtein(key, form);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = form;
    }
    if (distance === 0) break;
  }
  return best ? formIndex.get(best) : null;
}

/* ========================================================================== */
/* Alineación Codex ↔ MorphGNT                                                */
/* ========================================================================== */

function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  let prev = new Array(n + 1);
  let curr = new Array(n + 1);
  for (let j = 0; j <= n; j += 1) prev[j] = j;
  for (let i = 1; i <= m; i += 1) {
    curr[0] = i;
    for (let j = 1; j <= n; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

/** Similitud 0–1 pensada para variantes ortográficas del Codex. */
export function similarity(a, b) {
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.startsWith(b) || b.startsWith(a)) {
    const ratio = Math.min(a.length, b.length) / Math.max(a.length, b.length);
    return 0.78 + 0.18 * ratio;
  }
  const ratio = 1 - levenshtein(a, b) / Math.max(a.length, b.length);
  return ratio >= 0.74 ? ratio * 0.9 : 0;
}

/**
 * Alineación global (Needleman-Wunsch) de las palabras del Codex con las de
 * MorphGNT. Devuelve pares `[codexIndex, morphIndex, score]` ordenados.
 */
export function alignVerse(codexWords, morphWords) {
  const n = codexWords.length;
  const m = morphWords.length;
  if (!n || !m) return [];
  const dp = Array.from({ length: n + 1 }, () => new Float64Array(m + 1));
  const back = Array.from({ length: n + 1 }, () => new Int8Array(m + 1));
  const gap = -0.65;
  for (let i = 1; i <= n; i += 1) {
    dp[i][0] = i * gap;
    back[i][0] = 1;
  }
  for (let j = 1; j <= m; j += 1) {
    dp[0][j] = j * gap;
    back[0][j] = 2;
  }
  for (let i = 1; i <= n; i += 1) {
    for (let j = 1; j <= m; j += 1) {
      const sim = similarity(codexWords[i - 1].match, morphWords[j - 1].norm);
      const diag = dp[i - 1][j - 1] + (sim > 0 ? sim * 2 - 0.35 : -2);
      const up = dp[i - 1][j] + gap;
      const left = dp[i][j - 1] + gap;
      if (diag >= up && diag >= left) {
        dp[i][j] = diag;
        back[i][j] = 0;
      } else if (up >= left) {
        dp[i][j] = up;
        back[i][j] = 1;
      } else {
        dp[i][j] = left;
        back[i][j] = 2;
      }
    }
  }
  const pairs = [];
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && back[i][j] === 0) {
      const sim = similarity(codexWords[i - 1].match, morphWords[j - 1].norm);
      if (sim >= 0.6) pairs.push([i - 1, j - 1, sim]);
      i -= 1;
      j -= 1;
    } else if (i > 0 && (j === 0 || back[i][j] === 1)) {
      i -= 1;
    } else {
      j -= 1;
    }
  }
  return pairs.reverse();
}

/** Construye la entrada compacta del mapa de lemas. */
export function makeEntry(codexWord, morphWord, tbesgIndex) {
  const ns = codexWord.nsMatch;
  const lemma = ns ? ns.lemma : morphWord?.lemma;
  if (!lemma) return null;
  const tbesg = pickTbesg(lemma, morphWord?.pos || '', tbesgIndex);
  const pos = morphWord?.pos || tbesg?.pos || '';
  return [
    lemma,
    tbesg?.strong || null,
    morphWord?.parse || null,
    ns && ns.ns ? 1 : 0,
    pos || null
  ];
}

/**
 * Mapea un versículo completo. Primero alinea; después resuelve las palabras
 * que quedaron sueltas (abreviaturas sobrelineadas, itacismos, omisiones).
 */
export function mapVerse(codexWords, morphWords, tbesgIndex, formIndex) {
  const n = codexWords.length;
  const m = morphWords.length;
  const map = new Array(n).fill(null);
  if (!n) return map;
  const pairs = alignVerse(codexWords, morphWords);
  const used = new Set();
  for (const [ci, mi] of pairs) {
    map[ci] = makeEntry(codexWords[ci], morphWords[mi], tbesgIndex);
    used.add(mi);
  }

  for (let ci = 0; ci < n; ci += 1) {
    if (map[ci]) continue;
    const cw = codexWords[ci];
    if (cw.nsMatch) {
      map[ci] = makeEntry(cw, null, tbesgIndex);
      continue;
    }
    if (!m) continue;
    const prev = pairs.filter(pair => pair[0] < ci).pop();
    const next = pairs.find(pair => pair[0] > ci);
    const from = prev ? prev[1] + 1 : 0;
    const to = next ? next[1] - 1 : m - 1;
    if (from > to) continue;

    const plain = foldGreek(cw.plain);
    let best = -1;
    let bestScore = 0;
    if (cw.ns.length > 0 && plain.length === 1) {
      for (let j = from; j <= to; j += 1) {
        if (used.has(j)) continue;
        if (foldGreek(morphWords[j].word).startsWith(plain)) {
          best = j;
          break;
        }
      }
      if (best < 0) {
        for (let j = from; j <= to; j += 1) {
          if (!used.has(j)) {
            best = j;
            break;
          }
        }
      }
      bestScore = 1;
    } else {
      for (let j = from; j <= to; j += 1) {
        if (used.has(j)) continue;
        const score = similarity(cw.match, morphWords[j].norm);
        if (score > bestScore) {
          bestScore = score;
          best = j;
        }
      }
      if (bestScore < 0.5) best = -1;
    }
    if (best >= 0) {
      map[ci] = makeEntry(cw, morphWords[best], tbesgIndex);
      used.add(best);
    }
  }
  if (formIndex) {
    for (let ci = 0; ci < n; ci += 1) {
      if (map[ci]) continue;
      const cw = codexWords[ci];
      const key = cw.nsMatch ? foldGreek(cw.nsMatch.form) : foldGreek(cw.plain);
      const hit = formIndex.get(key) || fuzzyForm(formIndex, key);
      if (hit) map[ci] = makeEntry(cw, hit, tbesgIndex);
    }
  }
  return map;
}

/* ========================================================================== */
/* Estadísticas y orden griego                                                */
/* ========================================================================== */

/** Frecuencias, POS y formas de todos los lemas del códice. */
export function collectStats(bookData) {
  const byLemma = new Map();
  let tokens = 0;
  let mapped = 0;
  let ns = 0;
  let withStrong = 0;

  for (const { codex, map } of bookData) {
    for (const chapter of codex.chapters) {
      for (const verse of chapter.verses) {
        const words = greekWords(verse.grc);
        const entries = map.verses[`${chapter.num}:${verse.n}`] || [];
        for (let i = 0; i < words.length; i += 1) {
          tokens += 1;
          const entry = entries[i];
          if (!entry) continue;
          mapped += 1;
          if (entry[3]) ns += 1;
          if (entry[1]) withStrong += 1;
          const key = foldGreek(entry[0]);
          if (!key) continue;
          if (!byLemma.has(key)) {
            byLemma.set(key, {
              lemma: entry[0],
              strong: entry[1] || null,
              count: 0,
              ns: 0,
              pos: new Map(),
              forms: new Map()
            });
          }
          const item = byLemma.get(key);
          item.count += 1;
          if (entry[3]) item.ns += 1;
          if (!item.strong && entry[1]) item.strong = entry[1];
          if (entry[4]) item.pos.set(entry[4], (item.pos.get(entry[4]) || 0) + 1);
          const form = words[i].plain;
          item.forms.set(form, (item.forms.get(form) || 0) + 1);
        }
      }
    }
  }
  return { byLemma, tokens, mapped, ns, withStrong };
}

/** Los lemas más frecuentes, con POS dominante y formas principales. */
export function topLemmas(stats, limit = 250) {
  return [...stats.byLemma.values()]
    .sort((a, b) => b.count - a.count || foldGreek(a.lemma).localeCompare(foldGreek(b.lemma)))
    .slice(0, limit)
    .map(item => ({
      lemma: item.lemma,
      strong: item.strong,
      count: item.count,
      ns: item.ns,
      pos: [...item.pos.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || '',
      forms: [...item.forms.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([form, count]) => ({ form, count }))
    }));
}

const GREEK_ORDER = 'αβγδεζηθικλμνξοπρστυφχψω';

/** Clave de ordenación alfabética griega (ignora acentos y sigma final). */
export function greekSortKey(value) {
  return [...foldGreek(value)]
    .map(ch => {
      const index = GREEK_ORDER.indexOf(ch);
      return String(index < 0 ? 99 : index).padStart(2, '0');
    })
    .join('');
}
