/**
 * Parser determinista de XML OSIS (Open Scriptures Hebrew Bible / WLC) y
 * mapa de versificación (`VerseMap.xml`) para generar `public/textos/hebreo/`.
 *
 * REGLA FUNDAMENTAL: ninguna función de este módulo normaliza Unicode (ni NFC
 * ni NFD). Los puntos vocálicos y cantilación se conservan en el orden exacto
 * transmitido por el Westminster Leningrad Codex.
 */

const ENTITY_MAP = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'"
};

function decodeXml(str) {
  return String(str || '').replace(/&(amp|lt|gt|quot|apos);/g, (_, name) => ENTITY_MAP[name]);
}

function parseAttrs(attrText) {
  const attrs = {};
  for (const m of String(attrText || '').matchAll(/([A-Za-z0-9:_-]+)\s*=\s*"([^"]*)"/g)) {
    attrs[m[1]] = decodeXml(m[2]);
  }
  return attrs;
}

/**
 * Extrae el texto limpio de una palabra `<w>...</w>`, preservando cualquier
 * letra dentro de `<seg type="x-large|x-suspended|x-small">...</seg>` y
 * eliminando únicamente el separador morfológico `/` de OSHB.
 */
function extractWordText(innerXml) {
  const withoutInnerTags = String(innerXml || '').replace(/<[^>]+>/g, '');
  return decodeXml(withoutInnerTags).replace(/\//g, '');
}

/**
 * Lee el contenido de `<rdg type="x-qere">...</rdg>` devolviendo el texto y si
 * alguna palabra del qere tiene prefijo morfológico arameo (`A...`).
 */
function parseQereBody(rdgInnerXml) {
  const body = String(rdgInnerXml || '').trim();
  if (!body) return { qereText: '', isAramaic: false };

  const tokenRe = /<w\b([^>]*)>([\s\S]*?)<\/w>|<seg\b([^>]*)\/>|<seg\b([^>]*)>([\s\S]*?)<\/seg>/g;
  const pieces = [];
  let isAramaic = false;
  let lastEnd = 0;
  let m;

  while ((m = tokenRe.exec(body))) {
    const gap = body.slice(lastEnd, m.index);
    const hadSpace = /\s/.test(gap);
    lastEnd = tokenRe.lastIndex;

    if (m[0].startsWith('<w')) {
      const attrs = parseAttrs(m[1]);
      if (attrs.morph?.startsWith('A')) isAramaic = true;
      const word = extractWordText(m[2]);
      if (word) pieces.push({ type: 'w', text: word, spaceBefore: hadSpace });
    } else {
      const segAttrs = parseAttrs(m[3] || m[4] || '');
      const segText = decodeXml(m[5] || '');
      if (segAttrs.type === 'x-maqqef') {
        pieces.push({ type: 'maqqef', text: segText || '\u05BE', spaceBefore: false });
      } else if (segAttrs.type === 'x-paseq') {
        pieces.push({ type: 'paseq', text: segText || '\u05C0', spaceBefore: true });
      } else if (segText) {
        pieces.push({ type: 'w', text: segText, spaceBefore: hadSpace });
      }
    }
  }

  let qereText = '';
  for (let i = 0; i < pieces.length; i += 1) {
    const cur = pieces[i];
    const prev = pieces[i - 1];
    if (prev && cur.type !== 'maqqef' && prev.type !== 'maqqef') {
      if (cur.spaceBefore || cur.type === 'paseq' || prev.type === 'paseq') qereText += ' ';
    }
    qereText += cur.text;
  }

  return { qereText, isAramaic };
}

/**
 * Recorre los nodos hijo top-level de un `<verse>...</verse>` en orden exacto.
 */
function iterateVerseNodes(body) {
  const nodes = [];
  let pos = 0;
  const len = body.length;

  while (pos < len) {
    const lt = body.indexOf('<', pos);
    if (lt === -1) break;
    const rawGap = body.slice(pos, lt);
    const gt = body.indexOf('>', lt);
    if (gt === -1) break;

    const tagText = body.slice(lt + 1, gt);
    const openMatch = /^([A-Za-z0-9:_-]+)([\s\S]*?)(\/?)$/.exec(tagText);
    if (!openMatch) {
      pos = gt + 1;
      continue;
    }

    const [, tagName, attrStr, selfClose] = openMatch;
    if (selfClose === '/') {
      nodes.push({ tag: tagName, attrs: parseAttrs(attrStr), inner: '', gapBefore: rawGap });
      pos = gt + 1;
      continue;
    }

    // Buscar cierre balanceado de `tagName`
    let depth = 1;
    let scan = gt + 1;
    const tagSearch = new RegExp(`<(\\/?)${tagName}(?=[\\s/>])([^>]*)>`, 'g');
    tagSearch.lastIndex = scan;
    let tm;
    let closeStart = -1;
    let closeEnd = -1;
    while ((tm = tagSearch.exec(body))) {
      const isClose = tm[1] === '/';
      const isSelf = !isClose && tm[2].trimEnd().endsWith('/');
      if (isClose) {
        depth -= 1;
        if (depth === 0) {
          closeStart = tm.index;
          closeEnd = tagSearch.lastIndex;
          break;
        }
      } else if (!isSelf) {
        depth += 1;
      }
    }

    if (closeStart === -1) {
      pos = gt + 1;
      continue;
    }

    nodes.push({
      tag: tagName,
      attrs: parseAttrs(attrStr),
      inner: body.slice(gt + 1, closeStart),
      gapBefore: rawGap
    });
    pos = closeEnd;
  }

  return nodes;
}

/**
 * Parsea un único `<verse>` OSIS devolviendo `{ n, tokens, stats }`.
 */
export function parseOsisVerse(verseNum, verseBody, osisID) {
  const nodes = iterateVerseNodes(verseBody);
  const tokens = [];
  const lemmas = [];
  let ketivParts = [];

  const stats = {
    words: 0,
    aramaicWords: 0,
    ketivQere: 0,
    ketivPlusQere: 0,
    ketivOnly: 0,
    qereOnly: 0
  };

  const flushOrphanCheck = () => {
    if (ketivParts.length > 0) {
      throw new Error(`${osisID}: palabras x-ketiv sin <note type="variant"> siguiente`);
    }
  };

  for (const node of nodes) {
    if (node.tag === 'w') {
      const isAramaic = Boolean(node.attrs.morph?.startsWith('A'));
      const wordText = extractWordText(node.inner);
      if (node.attrs.type === 'x-ketiv') {
        ketivParts.push({
          kind: 'w',
          text: wordText,
          aramaic: isAramaic,
          spaceBefore: ketivParts.length > 0 && /\s/.test(node.gapBefore)
        });
        continue;
      }

      flushOrphanCheck();
      if (!wordText) continue;
      stats.words += 1;
      if (isAramaic) {
        stats.aramaicWords += 1;
        tokens.push({ a: wordText });
      } else {
        tokens.push(wordText);
      }
      lemmas.push({
        lemma: node.attrs.lemma || '',
        morph: node.attrs.morph || ''
      });
      continue;
    }

    if (node.tag === 'seg') {
      const segType = node.attrs.type || '';
      const subType = node.attrs.subType || '';
      const segText = decodeXml(node.inner).trim();

      if (ketivParts.length > 0 && subType.includes('x-ketiv')) {
        ketivParts.push({
          kind: 'maqqef',
          text: segText || '\u05BE',
          aramaic: false,
          spaceBefore: false
        });
        continue;
      }

      flushOrphanCheck();

      if (segType === 'x-maqqef') {
        tokens.push(segText || '\u05BE');
        lemmas.push(null);
      } else if (segType === 'x-sof-pasuq') {
        tokens.push(segText || '\u05C3');
        lemmas.push(null);
      } else if (segType === 'x-paseq') {
        tokens.push(segText || '\u05C0');
        lemmas.push(null);
      } else if (segType === 'x-pe') {
        tokens.push({ p: segText || '\u05E4' });
        lemmas.push(null);
      } else if (segType === 'x-samekh') {
        tokens.push({ p: segText || '\u05E1' });
        lemmas.push(null);
      } else if (segType === 'x-reversednun') {
        tokens.push({ p: segText || '\u05C6', t: 'nun' });
        lemmas.push(null);
      } else if (segText) {
        tokens.push({ p: segText, t: segType.replace(/^x-/, '') });
        lemmas.push(null);
      }
      continue;
    }

    if (node.tag === 'note') {
      if (node.attrs.type !== 'variant') {
        // Notas de crítica textual / formato de OSHB-WLC (`alternative`, `exegesis`, KJV refs...)
        continue;
      }

      // `<note type="variant">`: extrae <rdg type="x-qere">
      const rdgMatch = /<rdg\b[^>]*type="x-qere"[^>]*>([\s\S]*?)<\/rdg>|<rdg\b[^>]*type="x-qere"[^>]*\/>/.exec(
        node.inner
      );
      const rdgInner = rdgMatch && rdgMatch[1] ? rdgMatch[1] : '';
      const { qereText, isAramaic: qereAramaic } = parseQereBody(rdgInner);

      let ketivText = '';
      let ketivAramaic = false;
      for (let i = 0; i < ketivParts.length; i += 1) {
        const part = ketivParts[i];
        const prev = ketivParts[i - 1];
        if (part.aramaic) ketivAramaic = true;
        if (prev && part.kind !== 'maqqef' && prev.kind !== 'maqqef' && part.spaceBefore) {
          ketivText += ' ';
        }
        ketivText += part.text;
      }
      ketivParts = [];

      const isAramaic = ketivAramaic || qereAramaic;
      const entry = { k: ketivText, q: qereText };
      if (isAramaic) {
        entry.a = 1;
        stats.aramaicWords += 1;
      }
      stats.words += 1;
      stats.ketivQere += 1;
      if (ketivText && qereText) stats.ketivPlusQere += 1;
      else if (ketivText && !qereText) stats.ketivOnly += 1;
      else if (!ketivText && qereText) stats.qereOnly += 1;
      else throw new Error(`${osisID}: note variant vacía (sin ketiv ni qere)`);

      tokens.push(entry);
      lemmas.push(null);
    }
  }

  flushOrphanCheck();

  if (tokens.length === 0) {
    throw new Error(`${osisID}: versículo vacío tras parsear`);
  }

  return { n: verseNum, tokens, lemmas, stats };
}

/**
 * Parsea `VerseMap.xml` devolviendo un Set de capítulos WLC que tienen
 * diferencias explícitas respecto al esquema estándar KJV (`Gen.32`, etc.).
 */
export function parseVerseMapDiffs(verseMapXml) {
  const diffChapters = new Set();
  const entriesByBook = new Map();
  for (const bm of verseMapXml.matchAll(/<book\s+osisID="([^"]+)">([\s\S]*?)<\/book>/g)) {
    const osis = bm[1];
    let count = 0;
    for (const vm of bm[2].matchAll(/wlc="([^."]+)\.(\d+)\.(\d+)"/g)) {
      diffChapters.add(`${vm[1]}.${Number(vm[2])}`);
      count += 1;
    }
    entriesByBook.set(osis, count);
  }
  return { diffChapters, entriesByBook };
}

/**
 * Parsea un libro completo `<Osis>.xml` y cruza cada capítulo contra la NTV y
 * `VerseMap.xml`.
 */
export function parseOsisBook(xml, bookMeta, ntvBook, verseMapDiffChapters) {
  const ntvChapMap = new Map(
    (ntvBook?.chapters || []).map(c => [c.num, c.verses.map(v => v.n)])
  );

  const bookStats = {
    chapters: 0,
    verses: 0,
    words: 0,
    aramaicVerses: 0,
    aramaicWords: 0,
    ketivQere: 0,
    ketivPlusQere: 0,
    ketivOnly: 0,
    qereOnly: 0,
    ntvAlignedChapters: 0,
    ntvDiffChapters: []
  };

  const chapters = [];
  const chapRe = /<chapter\s+osisID="[^."]+\.(\d+)"[^>]*>([\s\S]*?)<\/chapter>/g;
  let cm;
  while ((cm = chapRe.exec(xml))) {
    const chNum = Number(cm[1]);
    const chBody = cm[2];
    const verses = [];
    let chWords = 0;
    let chAramaicWords = 0;
    let chAramaicVerses = 0;
    let chKetivQere = 0;

    const verseRe = /<verse\s+osisID="([^"]+)"[^>]*>([\s\S]*?)<\/verse>/g;
    let vm;
    while ((vm = verseRe.exec(chBody))) {
      const osisID = vm[1];
      const vNum = Number(osisID.split('.')[2]);
      const parsed = parseOsisVerse(vNum, vm[2], osisID);

      const verseObj = { n: vNum, t: parsed.tokens };
      if (parsed.stats.aramaicWords > 0) verseObj.ar = parsed.stats.aramaicWords;
      if (parsed.stats.ketivQere > 0) verseObj.kq = parsed.stats.ketivQere;
      verses.push(verseObj);

      chWords += parsed.stats.words;
      chAramaicWords += parsed.stats.aramaicWords;
      if (parsed.stats.aramaicWords > 0) chAramaicVerses += 1;
      chKetivQere += parsed.stats.ketivQere;

      bookStats.verses += 1;
      bookStats.words += parsed.stats.words;
      bookStats.aramaicWords += parsed.stats.aramaicWords;
      if (parsed.stats.aramaicWords > 0) bookStats.aramaicVerses += 1;
      bookStats.ketivQere += parsed.stats.ketivQere;
      bookStats.ketivPlusQere += parsed.stats.ketivPlusQere;
      bookStats.ketivOnly += parsed.stats.ketivOnly;
      bookStats.qereOnly += parsed.stats.qereOnly;
    }

    const wlcNums = verses.map(v => v.n);
    const ntvNums = ntvChapMap.get(chNum) || null;
    const ntvAligned = Boolean(
      ntvNums && wlcNums.length === ntvNums.length && wlcNums.join(',') === ntvNums.join(',')
    );
    const hasVerseMapNote = verseMapDiffChapters.has(`${bookMeta.osis}.${chNum}`);

    if (ntvAligned) {
      bookStats.ntvAlignedChapters += 1;
    } else {
      bookStats.ntvDiffChapters.push(chNum);
    }

    chapters.push({
      num: chNum,
      verses,
      aramaicVerses: chAramaicVerses,
      aramaicWords: chAramaicWords,
      ketivQere: chKetivQere,
      words: chWords,
      ntvAligned,
      ...(hasVerseMapNote ? { verseMapDiff: true } : {}),
      ...(!ntvAligned && ntvNums ? { ntvVerseCount: ntvNums.length } : {})
    });
    bookStats.chapters += 1;
  }

  return {
    book: {
      id: bookMeta.id,
      osis: bookMeta.osis,
      name: bookMeta.name,
      hebrewName: bookMeta.hebrewName,
      abbr: bookMeta.abbr,
      order: bookMeta.order,
      lang: 'he',
      normalization: 'none',
      chapters
    },
    stats: bookStats
  };
}
