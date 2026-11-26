/**
 * Utilidades del léxico hebreo/arameo (Node, sin red ni disco).
 *
 * Fuentes:
 *   - TBESH (STEPBible, CC BY 4.0; base BDB abreviado / Tyndale House)
 *   - OSHB (Open Scriptures Hebrew Bible, CC BY 4.0; lemas y morfología WLC)
 */
import { cleanDefinition, cleanGloss, cleanLemma } from './lexico-lib.mjs';

export const PREFIX_MAP = {
  b: { lemma: 'בְּ', strong: 'H9003', pos: 'P' },
  c: { lemma: 'וְ', strong: 'H9002', pos: 'C' },
  d: { lemma: 'הַ', strong: 'H9009', pos: 'T' },
  i: { lemma: 'הֲ', strong: 'H9008', pos: 'X' },
  k: { lemma: 'כְּ', strong: 'H9004', pos: 'P' },
  l: { lemma: 'לְ', strong: 'H9005', pos: 'P' },
  m: { lemma: 'מִ', strong: 'H9006', pos: 'P' },
  s: { lemma: 'שֶׁ', strong: 'H9007', pos: 'RP' }
};

/** Ajustes puntuales sobre códigos H9000–H9049 cuya etiqueta TBESH es genérica (`Prefix`/`Suffix`). */
export const PREFIX_OVERRIDES = {
  H9001: { pos: 'C', posLabel: 'conjunción' },
  H9002: { lemma: 'וְ', pos: 'C', posLabel: 'conjunción' },
  H9003: { lemma: 'בְּ', pos: 'P', posLabel: 'preposición' },
  H9004: { lemma: 'כְּ', pos: 'P', posLabel: 'preposición' },
  H9005: { lemma: 'לְ', pos: 'P', posLabel: 'preposición' },
  H9006: { lemma: 'מִ', pos: 'P', posLabel: 'preposición' },
  H9007: { lemma: 'שֶׁ', pos: 'RP', posLabel: 'pronombre relativo' },
  H9008: { lemma: 'הֲ', pos: 'X', posLabel: 'partícula interrogativa' },
  H9009: { lemma: 'הַ', pos: 'T', posLabel: 'artículo' },
  H9010: { lemma: 'אָ', pos: 'T', posLabel: 'artículo (arameo)' },
  H9011: { pos: 'X', posLabel: 'sufijo direccional' },
  H9012: { pos: 'X', posLabel: 'sufijo paragógico' },
  H9013: { pos: 'X', posLabel: 'sufijo paragógico' }
};

/** Mapa rápido de códigos de sufijo pronominal OSHB → Strong extendido TBESH. */
const SUFFIX_STRONG = {
  Sp1cs: 'H9020',
  Sp2ms: 'H9021',
  Sp2fs: 'H9022',
  Sp3ms: 'H9023',
  Sp3fs: 'H9024',
  Sp1cp: 'H9025',
  Sp2mp: 'H9026',
  Sp2fp: 'H9027',
  Sp3mp: 'H9028',
  Sp3fp: 'H9029',
  Sp1ms: 'H9020',
  Sp2cs: 'H9021',
  Sp2cp: 'H9026',
  Sp3cs: 'H9023',
  Sh: 'H9011',
  Sd: 'H9012',
  Sn: 'H9013'
};

export function cleanTbeshTranslit(value) {
  return String(value || '')
    .split(/\s*,\s*/)[0]
    .replace(/\./g, '')
    .trim();
}

/** Familia de categoría usada en filtros del diccionario (V / N / A / P / C / T / RP / D / X). */
export function hebrewMorphBucket(morphCode, fallbackTbeshPos = '') {
  const parts = String(morphCode || '').slice(1).split('/');
  const main = parts.find(p => !/^[CT]$/.test(p) && !p.startsWith('R') && !p.startsWith('T') && !p.startsWith('S'))
    || parts[0]
    || '';
  if (main.startsWith('V')) return 'V';
  if (main.startsWith('N')) return 'N';
  if (main.startsWith('A')) return 'A';
  if (main.startsWith('R')) return 'P';
  if (main.startsWith('C')) return 'C';
  if (main.startsWith('P')) return 'RP';
  if (main.startsWith('D')) return 'D';
  if (main.startsWith('T')) return 'T';
  if (main.startsWith('S')) return 'RP';

  const raw = String(fallbackTbeshPos || '').split('/')[0].replace(/^[HA]:/, '').trim();
  if (raw.startsWith('V')) return 'V';
  if (raw.startsWith('N')) return 'N';
  if (raw.startsWith('A') && !raw.startsWith('Adv') && !raw.startsWith('Art')) return 'A';
  if (raw.startsWith('Prep')) return 'P';
  if (raw.startsWith('Conj') || raw.startsWith('Cond')) return 'C';
  if (raw.startsWith('Adv')) return 'D';
  if (raw.startsWith('Art')) return 'T';
  if (raw.includes('P')) return 'RP';
  return 'X';
}

/** Etiqueta gramatical en español a partir del código de TBESH. */
export function hebrewPosEs(posRaw) {
  const first = String(posRaw || '').split('/')[0].trim();
  const raw = first.replace(/^[A-Za-z]:/, '').trim();
  if (!raw) return '';
  if (raw.startsWith('V')) return 'verbo';
  if (raw.startsWith('Prep') || raw === 'Prefix') return 'preposición';
  if (raw.startsWith('Conj') || raw.startsWith('Cond')) return 'conjunción';
  if (raw.startsWith('Art')) return 'artículo';
  if (raw.startsWith('Adv')) return 'adverbio';
  if (raw.startsWith('Intj')) return 'interjección';
  if (raw.startsWith('Intg')) return 'interrogativo';
  if (raw.startsWith('Neg')) return 'negación';
  if (raw.startsWith('RelP')) return 'pronombre relativo';
  if (raw.startsWith('DemP')) return 'pronombre demostrativo';
  if (raw.startsWith('PerP') || raw.startsWith('PosP') || raw.startsWith('RefP') || raw.startsWith('Ps') || raw.startsWith('Pp') || raw.startsWith('Os') || raw.startsWith('Op') || raw.startsWith('Ss') || raw.startsWith('Sp')) {
    return 'pronombre';
  }
  if (raw.startsWith('Part')) return 'partícula';
  if (raw.startsWith('A')) return 'adjetivo';
  if (raw.startsWith('Suffix')) return 'sufijo';
  if (raw.startsWith('N')) {
    if (raw.includes('-P') || raw.includes('-L') || raw.includes('-T') || raw.includes('-G')) {
      return raw.includes('-F') ? 'nombre propio femenino' : 'nombre propio';
    }
    if (raw.includes('-F')) return 'sustantivo femenino';
    if (raw.includes('-M')) return 'sustantivo masculino';
    return 'sustantivo';
  }
  return '';
}

/**
 * Parsea el TSV de TBESH devolviendo todas las entradas normalizadas.
 */
export function parseTbesh(raw) {
  const rows = [];
  for (const line of String(raw || '').split(/\r?\n/)) {
    if (!/^H\d{4,5}[A-Za-z]?\t/.test(line)) continue;
    const cols = line.split('\t');
    if (cols.length < 7) continue;
    const eRaw = cols[0].trim();
    const strong = eRaw.replace(/[A-Za-z]+$/, '').toUpperCase();
    const eSuffix = (eRaw.match(/([A-Za-z]+)$/)?.[1] || '').toLowerCase();
    const relation = cols[1].trim();
    const lemmaRaw = cols[3].trim();
    const lemma = lemmaRaw
      .split(/\s*[,=]\s*/)
      .map(s => cleanLemma(s).replace(/^[\/\-\s]+|[\/\-\s]+$/g, ''))
      .find(Boolean) || '';
    if (!lemma) continue;
    const translit = cleanTbeshTranslit(cols[4]);
    const posRaw = cols[5].trim();
    const gloss = cleanGloss(cols[6]).replace(/^:+/, '').trim();
    const definition = cleanDefinition(cols[7] || '');
    const isAramaic = /^A:/i.test(posRaw) || /\baramaic of\b/i.test(relation);
    const isPartOf = /\ba Part of\b|\bcombination of\b|\ba Meaning of\b/i.test(relation);
    const isProper = /^N:N-/i.test(posRaw);
    const isPrimary = /=\s*$/.test(relation) || /=\s+in Aramaic of/i.test(relation);
    const override = PREFIX_OVERRIDES[strong];
    const basePosLabel = hebrewPosEs(posRaw);
    const finalPosLabel = override?.posLabel
      || (/^H90[234]\d$/.test(strong) ? 'sufijo pronominal' : basePosLabel);

    rows.push({
      strong,
      eSuffix,
      lemma: override?.lemma || lemma,
      translit,
      posRaw,
      pos: override?.pos || hebrewMorphBucket('', posRaw),
      posLabel: finalPosLabel,
      gloss,
      definition,
      isAramaic,
      isPartOf,
      isProper,
      isPrimary
    });
  }
  return rows;
}

/**
 * Índice por `strong` (`H0430` y claves desambiguadas `H4057b` → entrada léxica TBESH).
 * Penaliza homónimos de nombre propio (`N:N-`) y subsentidos para que el lema común gane.
 */
export function indexTbesh(rows) {
  const byStrong = new Map();
  const score = r =>
    (r.isPrimary ? 8 : 0) +
    (r.isProper ? -4 : 3) +
    (r.eSuffix === '' || r.eSuffix === 'a' ? 2 : 0) +
    (r.isPartOf ? -6 : 0) +
    (r.gloss ? 1 : 0);

  for (const row of rows) {
    const prev = byStrong.get(row.strong);
    if (!prev || score(row) > score(prev)) {
      byStrong.set(row.strong, row);
    }
    if (row.eSuffix) {
      const subKey = `${row.strong}${row.eSuffix}`;
      const prevSub = byStrong.get(subKey);
      if (!prevSub || score(row) > score(prevSub)) {
        byStrong.set(subKey, row);
      }
    }
  }
  return byStrong;
}

function parseNumLemma(part) {
  const m = /^(\d+)(?:\s+([a-z]))?/i.exec(String(part || '').trim());
  if (!m) return { strong: '', disambig: '' };
  return {
    strong: `H${m[1].padStart(4, '0')}`,
    disambig: (m[2] || '').toLowerCase()
  };
}

/**
 * Resuelve los atributos `lemma` y `morph` de una palabra `<w>` de OSHB en
 * una lista ordenada de morfemas `{ lemma, strong, parse, pos }`.
 */
export function resolveOshbMorphemes(lemmaAttr, morphAttr, tbeshByStrong) {
  const rawLemma = String(lemmaAttr || '').trim();
  const rawMorph = String(morphAttr || '').trim();
  if (!rawLemma && !rawMorph) return [];

  const lang = rawMorph[0] === 'A' ? 'A' : 'H';
  const morphParts = rawMorph.length > 1 ? rawMorph.slice(1).split('/').filter(Boolean) : [];
  const lemmaParts = rawLemma.split('/').map(s => s.trim()).filter(Boolean);

  const out = [];
  let mIdx = 0;

  for (const lPart of lemmaParts) {
    const pref = PREFIX_MAP[lPart];
    if (pref) {
      const mCode = morphParts[mIdx] || '';
      if (mCode) mIdx += 1;
      const parse = mCode ? `${lang}${mCode}` : `${lang}${pref.pos}`;
      out.push({
        lemma: pref.lemma,
        strong: pref.strong,
        parse,
        pos: pref.pos
      });
      continue;
    }

    const { strong, disambig } = parseNumLemma(lPart);
    const tb = strong
      ? ((disambig && tbeshByStrong.get(`${strong}${disambig}`)) || tbeshByStrong.get(strong))
      : null;
    const mCode = morphParts[mIdx] || '';
    if (mCode) mIdx += 1;
    const parse = mCode ? `${lang}${mCode}` : '';
    const pos = parse ? hebrewMorphBucket(parse, tb?.posRaw) : tb?.pos || 'X';

    out.push({
      lemma: tb?.lemma || strong || lPart,
      strong: strong || null,
      parse: parse || null,
      pos
    });
  }

  // Morphs restantes (sufijos pronominales, artículo arameo `-א`, ה direccional…)
  while (mIdx < morphParts.length) {
    const mCode = morphParts[mIdx++];
    const parse = `${lang}${mCode}`;
    const suffixStrong = SUFFIX_STRONG[mCode] || (mCode === 'Td' && lang === 'A' ? 'H9010' : null);
    const tb = suffixStrong ? tbeshByStrong.get(suffixStrong) : null;
    out.push({
      lemma: tb?.lemma || (mCode === 'Td' ? 'אָ' : 'suf.'),
      strong: suffixStrong,
      parse,
      pos: mCode === 'Td' ? 'T' : mCode.startsWith('S') ? 'RP' : 'X'
    });
  }

  return out;
}
