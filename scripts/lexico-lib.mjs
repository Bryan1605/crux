/**
 * Léxico griego — parsers y alineación (Node, sin red ni disco).
 *
 * Fuentes:
 *   - TBESG (STEPBible, CC BY 4.0; base Abbott-Smith 1922, dominio público)
 *   - MorphGNT (CC BY-SA 3.0; solo se usan lema y morfología, no el texto SBLGNT)
 *
 * El Codex escribe sin acentos, con sigma lunada (ϲ) y con abreviaturas
 * sobrelineadas. El mapa `NS_MAP` solo contiene *nomina sacra* contraídos y
 * verificados en el propio códice; las abreviaturas no sagradas (`ιβ`, etc.) van
 * en `ABBR_MAP` y las sobrelíneas de fin de línea se resuelven por contexto.
 */
import { foldGreek, greekWords } from '../src/lib/greek.js';
import { decodeVerseLemmas, greekSortKey as sharedGreekSortKey } from '../src/lib/lexicon.js';

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
  if (raw.startsWith('X')) return 'pronombre indefinido';
  if (raw.startsWith('I')) return 'pronombre interrogativo';
  if (raw.startsWith('ADV')) return 'adverbio';
  if (raw.startsWith('A-NUI')) return 'numeral';
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

/** Corrige la transcripción de TBESG para aspiradas iniciales y rho inicial. */
export function cleanTranslit(value, lemma = '') {
  let out = String(value || '')
    .replace(/^oh/, 'ho')
    .replace(/^ōh/, 'hō')
    .replace(/^uh/, 'hu')
    .replace(/^eh/, 'he')
    .replace(/^ēh/, 'hē')
    .replace(/^ih/, 'hi')
    .replace(/^ah/, 'ha');
  if (/^[ῥῬ]/.test(String(lemma || '')) && /^r(?!h)/i.test(out)) {
    out = out[0] + 'h' + out.slice(1);
  }
  return out;
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
 * Variantes ortográficas MorphGNT ↔ TBESG verificadas en `tbesg.txt`.
 * Evita que formas como Καφαρναούμ, ἔνατος o κρεμάννυμι queden sin Strong.
 */
const TBESG_LEMMA_ALIASES = new Map(
  Object.entries({
    Καφαρναούμ: 'G2584',
    ἔνατος: 'G1766',
    κρεμάννυμι: 'G2910',
    ἐραυνάω: 'G2045',
    εἴωθα: 'G1486',
    μήγε: 'G1490',
    μαμωνᾶς: 'G3126',
    λεγιών: 'G3003',
    θά: 'G3134',
    οἶμαι: 'G3633',
    ἡττάομαι: 'G2274',
    Βόες: 'G1003',
    Ἀχίμ: 'G0885',
    Νέα: 'G3501',
    λεμά: 'G2982',
    Ἰάϊρος: 'G2383',
    χρεοφειλέτης: 'G5533',
    Ἄρειος: 'G0697',
    σύμφορον: 'G4851',
    λογεία: 'G3048',
    ἔοικα: 'G1503',
    ἅλα: 'G0217',
    στασιαστής: 'G4955',
    Ἐλμαδάμ: 'G1678',
    Ἰωρίμ: 'G2497',
    Μεννά: 'G3104',
    Σερούχ: 'G4562',
    ὑπερεκχύννομαι: 'G5240',
    δανιστής: 'G1157',
    παρακαθέζομαι: 'G3869',
    κίχρημι: 'G5531',
    συκομορέα: 'G4809',
    ἐκκρέμαμαι: 'G1582',
    ἄραφος: 'G0729',
    λακάω: 'G2997',
    σφυδρόν: 'G4974',
    Ἑμμώρ: 'G1697',
    ἐνέος: 'G1769',
    εὐρακύλων: 'G2148',
    αὔξω: 'G0837',
    ἀλυπότερος: 'G0253',
    λῆμψις: 'G3028',
    καυστηριάζω: 'G2743',
    ἀνέλεος: 'G0415',
    πρόϊμος: 'G4406',
    ἀπογίνομαι: 'G0581',
    Ἰσσαχάρ: 'G2466',
    σιρικός: 'G4596',
    κιννάμωμον: 'G2792',
    ῥέδη: 'G4480',
    ἐνδώμησις: 'G1739',
    μέλει: 'G3199',
    ἀνάγαιον: 'G0508',
    Στοϊκός: 'G4770',
    ἔννυχα: 'G1773',
    Ἰτουραῖος: 'G2484',
    μαράνα: 'G3134',
    μασάομαι: 'G3145',
    ἀφθορία: 'G0090'
  }).map(([k, v]) => [k.normalize('NFC'), v])
);

/**
 * Elige la entrada TBESG más probable para un lema y una categoría MorphGNT.
 * Prioriza la numeración Strong original (1–5624), sin sufijo y con glosa.
 * Comprueba alias ortográficos verificados, coincidencia exacta (con acento),
 * variantes activa/media (`πορεύομαι` → `πορεύω`) y, como último recurso,
 * distancia por prefijo evitando mezclar categorías si existe empate.
 */
export function pickTbesg(lemma, pos = '', index) {
  if (!index) return null;
  const normLemma = String(lemma || '').normalize('NFC');
  const cacheKey = `${normLemma}|${pos}`;
  if (index.cache?.has(cacheKey)) return index.cache.get(cacheKey);
  let found = null;
  const aliasStrong = TBESG_LEMMA_ALIASES.get(normLemma);
  if (aliasStrong) found = pickTbesgByStrong(aliasStrong, index, normLemma, pos);
  const exact = !found && index.byLemmaExact?.get(normLemma);
  if (exact?.length) found = bestTbesg(exact, pos);
  if (!found) {
    for (const variant of lemmaVariants(normLemma)) {
      const list = index.byLemma.get(variant);
      if (list?.length) {
        const samePos = pos ? list.filter(e => e.pos === pos) : list;
        found = bestTbesg(samePos.length ? samePos : list, pos);
        break;
      }
    }
  }
  if (!found) {
    const folded = foldGreek(normLemma);
    if (folded.length >= 4) {
      const candidates = index.byPrefix.get(folded.slice(0, 4)) || [];
      let best = null;
      let bestDistance = 99;
      for (const entry of candidates) {
        const distance = levenshtein(folded, foldGreek(entry.lemma));
        if (distance > 2) continue;
        if (distance === 2 && pos && entry.pos && entry.pos !== pos) continue;
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

/** Entrada TBESG por número Strong (completo o base), priorizando lema y POS. */
export function pickTbesgByStrong(strong, index, lemma = '', pos = '') {
  const list = index?.byStrong?.get(String(strong || '').trim()) || [];
  if (!list.length) return null;
  if (lemma) {
    const norm = lemma.normalize('NFC');
    const exactLemma = list.filter(e => e.lemma.normalize('NFC') === norm);
    if (exactLemma.length) return bestTbesg(exactLemma, pos);
  }
  return bestTbesg(list, pos);
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

/**
 * Contracciones verificadas de *nomina sacra* en el Codex Sinaiticus.
 * No incluye formas plenas sin contraer (`θεοϲ`, `ουρανω`, `ανθρωπω`…) para no
 * clasificar por error abreviaturas de `-ν` final de línea (`ουραν‹ω›`).
 */
const NS_ROWS = [
  // θεός
  ['θσ', 'θεός', 'θεός'],
  ['θυ', 'θεοῦ', 'θεός'],
  ['θω', 'θεῷ', 'θεός'],
  ['θν', 'θεόν', 'θεός'],
  ['θε', 'θεέ', 'θεός'],
  // κύριος
  ['κσ', 'κύριος', 'κύριος'],
  ['κυ', 'κυρίου', 'κύριος'],
  ['κω', 'κυρίῳ', 'κύριος'],
  ['κν', 'κύριον', 'κύριος'],
  ['κε', 'κύριε', 'κύριος'],
  // Ἰησοῦς
  ['ισ', 'Ἰησοῦς', 'Ἰησοῦς'],
  ['ιυ', 'Ἰησοῦ', 'Ἰησοῦς'],
  ['ιν', 'Ἰησοῦν', 'Ἰησοῦς'],
  // Χριστός
  ['χσ', 'Χριστός', 'Χριστός'],
  ['χυ', 'Χριστοῦ', 'Χριστός'],
  ['χω', 'Χριστῷ', 'Χριστός'],
  ['χν', 'Χριστόν', 'Χριστός'],
  // πνεῦμα
  ['πνα', 'πνεῦμα', 'πνεῦμα'],
  ['πνσ', 'πνεύματος', 'πνεῦμα'],
  ['πνι', 'πνεύματι', 'πνεῦμα'],
  ['πν', 'πνεῦμα', 'πνεῦμα'],
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
  ['υοι', 'υἱοί', 'υἱός'],
  ['υων', 'υἱῶν', 'υἱός'],
  // ἄνθρωπος
  ['ανοσ', 'ἄνθρωπος', 'ἄνθρωπος'],
  ['ανου', 'ἀνθρώπου', 'ἄνθρωπος'],
  ['ανω', 'ἀνθρώπῳ', 'ἄνθρωπος'],
  ['ανον', 'ἄνθρωπον', 'ἄνθρωπος'],
  ['ανοι', 'ἄνθρωποι', 'ἄνθρωπος'],
  ['ανων', 'ἀνθρώπων', 'ἄνθρωπος'],
  ['ανουσ', 'ἀνθρώπους', 'ἄνθρωπος'],
  // μήτηρ
  ['μηρ', 'μήτηρ', 'μήτηρ'],
  ['μρα', 'μητέρα', 'μήτηρ'],
  ['μρσ', 'μητρός', 'μήτηρ'],
  ['μρι', 'μητρί', 'μήτηρ'],
  // Δαυίδ
  ['δαδ', 'Δαυίδ', 'Δαυίδ'],
  // Ἰσραήλ
  ['ιηλ', 'Ἰσραήλ', 'Ἰσραήλ'],
  ['ισλ', 'Ἰσραήλ', 'Ἰσραήλ'],
  // Ἰερουσαλήμ
  ['ιηλμ', 'Ἰερουσαλήμ', 'Ἰερουσαλήμ'],
  ['ηλμ', 'Ἰερουσαλήμ', 'Ἰερουσαλήμ'],
  ['λημ', 'Ἰερουσαλήμ', 'Ἰερουσαλήμ'],
  // οὐρανός
  ['ουνοσ', 'οὐρανός', 'οὐρανός'],
  ['ουνου', 'οὐρανοῦ', 'οὐρανός'],
  ['ουνω', 'οὐρανῷ', 'οὐρανός'],
  ['ουνον', 'οὐρανόν', 'οὐρανός'],
  ['ουνων', 'οὐρανῶν', 'οὐρανός'],
  ['ουνουσ', 'οὐρανούς', 'οὐρανός'],
  ['ουνοι', 'οὐρανοί', 'οὐρανός'],
  ['ουνοισ', 'οὐρανοῖς', 'οὐρανός'],
  // πατήρ (¡πρσ es πατρός, no πρός!)
  ['πρσ', 'πατρός', 'πατήρ'],
  ['πρι', 'πατρί', 'πατήρ'],
  ['πρα', 'πατέρα', 'πατήρ'],
  ['πηρ', 'πατήρ', 'πατήρ'],
  ['πρεσ', 'πατέρες', 'πατήρ'],
  ['πρων', 'πατέρων', 'πατήρ'],
  // σωτήρ
  ['σηρ', 'σωτήρ', 'σωτήρ'],
  ['σρσ', 'σωτῆρος', 'σωτήρ'],
  ['σρι', 'σωτῆρι', 'σωτήρ'],
  ['σρα', 'σωτῆρα', 'σωτήρ'],
  // σταυρός / σταυρόω
  ['στσ', 'σταυρός', 'σταυρός'],
  ['στου', 'σταυροῦ', 'σταυρός'],
  ['στω', 'σταυρῷ', 'σταυρός'],
  ['στον', 'σταυρόν', 'σταυρός'],
  ['στροσ', 'σταυροῦ', 'σταυρός'],
  ['στρω', 'σταυρῷ', 'σταυρός'],
  ['στρθη', 'σταυρωθῇ', 'σταυρόω']
];

/** Formas sagradas plenas: solo cuentan como NS si TODA la palabra va sobrelineada. */
const FULL_NS_ROWS = [
  ['θεοσ', 'θεός', 'θεός'],
  ['κυριοσ', 'κύριος', 'κύριος'],
  ['ιησουσ', 'Ἰησοῦς', 'Ἰησοῦς'],
  ['χριστοσ', 'Χριστός', 'Χριστός'],
  ['πνευμα', 'πνεῦμα', 'πνεῦμα'],
  ['ισραηλ', 'Ἰσραήλ', 'Ἰσραήλ'],
  ['ιερουσαλημ', 'Ἰερουσαλήμ', 'Ἰερουσαλήμ']
];

/** Abreviaturas no sagradas que la alineación no puede resolver por forma. */
const ABBR_ROWS = [['ιβ', 'δώδεκα', 'δώδεκα']];

export const NS_MAP = new Map(
  NS_ROWS.map(([key, form, lemma]) => [foldGreek(key), { form, lemma, ns: true }])
);

const FULL_NS_MAP = new Map(
  FULL_NS_ROWS.map(([key, form, lemma]) => [foldGreek(key), { form, lemma, ns: true }])
);

export const ABBR_MAP = new Map(
  ABBR_ROWS.map(([key, form, lemma]) => [foldGreek(key), { form, lemma, ns: false }])
);

/** Devuelve la abreviatura conocida de una palabra sobrelineada, si la hay. */
export function abbreviationForWord(word) {
  if (!word || !Array.isArray(word.ns) || word.ns.length === 0) return null;
  const key = foldGreek(word.plain);
  return NS_MAP.get(key) || (word.wholeNs ? FULL_NS_MAP.get(key) : null) || ABBR_MAP.get(key) || null;
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
/** Pliegue fonético koiné para capturar itacismos al inicio o interior de palabra. */
function itacismFold(value) {
  return foldGreek(value)
    .replace(/ει|οι|η|υ/g, 'ι')
    .replace(/αι/g, 'ε')
    .replace(/ω/g, 'ο')
    .replace(/(.)\1+/g, '$1');
}

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
  const byPhonetic = new Map();
  for (const form of best.keys()) {
    const prefix = form.slice(0, 2);
    if (!byPrefix.has(prefix)) byPrefix.set(prefix, []);
    byPrefix.get(prefix).push(form);

    const phon = itacismFold(form).slice(0, 2);
    if (phon.length >= 2) {
      if (!byPhonetic.has(phon)) byPhonetic.set(phon, []);
      byPhonetic.get(phon).push(form);
    }
  }
  best.byPrefix = byPrefix;
  best.byPhonetic = byPhonetic;
  return best;
}

/** Busca una forma parecida (itacismos iniciales y variantes ortográficas del Codex). */
function fuzzyForm(formIndex, key) {
  if (!key || key.length < 2 || !formIndex.byPrefix) return null;
  const maxDistance = key.length <= 5 ? 1 : key.length <= 9 ? 2 : 3;
  const prefixCands = formIndex.byPrefix.get(key.slice(0, 2)) || [];
  const phonKey = itacismFold(key);
  const phonCands = formIndex.byPhonetic?.get(phonKey.slice(0, 2)) || [];
  const candidates = phonCands.length ? [...new Set([...prefixCands, ...phonCands])] : prefixCands;
  let best = null;
  let bestDistance = maxDistance + 1;
  for (const form of candidates) {
    const distance = Math.min(levenshtein(key, form), levenshtein(phonKey, itacismFold(form)));
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
    const NUMERAL_LEMMA = { β: 'δυο', γ: 'τρεισ', ζ: 'επτα' };
    if (cw.ns.length > 0 && plain.length === 1) {
      for (let j = from; j <= to; j += 1) {
        if (used.has(j)) continue;
        if (
          foldGreek(morphWords[j].word).startsWith(plain) ||
          (NUMERAL_LEMMA[plain] && foldGreek(morphWords[j].lemma) === NUMERAL_LEMMA[plain])
        ) {
          best = j;
          bestScore = 1;
          break;
        }
      }
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

const KEEP_SINGLE_FORMS = new Set(['β', 'γ', 'ζ', 'ι', 'ιβ']);

function cleanFormsForEntry(formsMap, canonicalLemma) {
  const lemmaFoldedLen = foldGreek(canonicalLemma).length;
  const entries = [...formsMap.entries()].sort((a, b) => b[1] - a[1]);
  const multiFreqCount = entries.filter(([, count]) => count >= 2).length;
  return entries
    .filter(([form, count]) => {
      const f = foldGreek(form);
      if (!f) return false;
      if (f.length === 1 && lemmaFoldedLen >= 2 && !KEEP_SINGLE_FORMS.has(f)) return false;
      if (count === 1 && multiFreqCount >= 4 && !NS_MAP.has(f)) return false;
      return true;
    })
    .slice(0, 8)
    .map(([form, count]) => ({ form, count }));
}

/** Frecuencias, POS, citas representativas y formas de todos los lemas (clave Strong). */
export function collectStats(bookData) {
  const byEntry = new Map();
  let tokens = 0;
  let mapped = 0;
  let ns = 0;
  let withStrong = 0;

  for (const { codex, map } of bookData) {
    const bookId = map.book || codex.id;
    for (const chapter of codex.chapters) {
      for (const verse of chapter.verses) {
        const words = greekWords(verse.grc);
        const decoded = decodeVerseLemmas(map, chapter.num, verse.n);
        for (let i = 0; i < words.length; i += 1) {
          tokens += 1;
          const morphemes = decoded[i] || [];
          if (!morphemes.length) continue;
          mapped += 1;
          for (const morph of morphemes) {
            if (morph.ns) ns += 1;
            if (morph.strong) withStrong += 1;
            const key = morph.strong || `lemma:${String(morph.lemma || '').normalize('NFC')}`;
            if (!key || key === 'lemma:') continue;
            if (!byEntry.has(key)) {
              byEntry.set(key, {
                lemma: morph.lemma,
                lemmaCounts: new Map(),
                strong: morph.strong || null,
                count: 0,
                ns: 0,
                pos: new Map(),
                forms: new Map(),
                refs: [],
                refBooks: new Set()
              });
            }
            const item = byEntry.get(key);
            item.count += 1;
            if (morph.lemma) {
              item.lemmaCounts.set(morph.lemma, (item.lemmaCounts.get(morph.lemma) || 0) + 1);
            }
            if (morph.ns) item.ns += 1;
            if (morph.pos) item.pos.set(morph.pos, (item.pos.get(morph.pos) || 0) + 1);
            const form = words[i].plain;
            item.forms.set(form, (item.forms.get(form) || 0) + 1);

            if (item.refs.length < 5) {
              if (!item.refBooks.has(bookId)) {
                item.refBooks.add(bookId);
                item.refs.push([bookId, chapter.num, verse.n]);
              }
            }
            if (item.refs.length < 5 && !item.fallbackRefs) {
              item.fallbackRefs = [];
            }
            if (
              item.fallbackRefs &&
              item.fallbackRefs.length < 5 &&
              !item.refs.some(([b, c, v]) => b === bookId && c === chapter.num && v === verse.n) &&
              !item.fallbackRefs.some(([b, c, v]) => b === bookId && c === chapter.num && v === verse.n)
            ) {
              item.fallbackRefs.push([bookId, chapter.num, verse.n]);
            }
          }
        }
      }
    }
  }
  return { byEntry, byLemma: byEntry, tokens, mapped, ns, withStrong };
}

/** Los lemas más frecuentes (o todos si `limit = Infinity`), con POS, citas y formas limpias. */
export function topLemmas(stats, limit = Infinity) {
  const source = stats.byEntry || stats.byLemma;
  return [...source.values()]
    .map(item => {
      const canonicalLemma =
        [...(item.lemmaCounts?.entries() || [])].sort((a, b) => b[1] - a[1])[0]?.[0] || item.lemma;
      const refs = [...item.refs];
      for (const extra of item.fallbackRefs || []) {
        if (refs.length >= 5) break;
        refs.push(extra);
      }
      return {
        lemma: canonicalLemma,
        strong: item.strong,
        count: item.count,
        ns: item.ns,
        pos: [...item.pos.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || '',
        forms: cleanFormsForEntry(item.forms, canonicalLemma),
        refs
      };
    })
    .sort((a, b) => b.count - a.count || foldGreek(a.lemma).localeCompare(foldGreek(b.lemma)))
    .slice(0, limit);
}

/** Clave de ordenación alfabética griega (reexportada del núcleo compartido). */
export const greekSortKey = sharedGreekSortKey;
