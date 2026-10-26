/**
 * Exégesis — parsers puros (Node, sin red ni disco).
 *
 *   parseNtv(raw)          → los 66 libros con capítulos, versículos, secciones y notas
 *   parseCodexFolio(html)  → versículos griegos + aparato desde una página del Codex
 *
 * Los usan `scripts/build-ntv.mjs`, `scripts/fetch-codex.mjs` y `scripts/qa-exegesis.mjs`.
 * Al ser puros, se pueden probar sin tocar la red.
 */
import { BOOK_BY_NAME, BOOK_BY_CODEX_NO, BOOK_BY_ID } from '../src/data/exegesis.js';

/* ========================================================================== */
/* NTV — Nueva Traducción Viviente                                            */
/* ========================================================================== */

const isNoise = t =>
  t === '```' ||
  /^www\.lectulandia\.com\s*-\s*P[aá]gina/i.test(t) ||
  /^-{3,}$/.test(t);

/**
 * La NTV titula algunos libros de forma distinta a la forma canónica corta
 * (`Hechos de los Apóstoles`, `Cantar de los Cantares`…). Aquí se mapean.
 */
const BOOK_ALIASES = new Map([
  ['Hechos de los Apóstoles', 'hechos'],
  ['Hechos de los apóstoles', 'hechos'],
  ['Hechos', 'hechos'],
  ['Cantar de los Cantares', 'cantares']
]);

const resolveBookName = t => BOOK_BY_NAME.get(t) || BOOK_BY_ID.get(BOOK_ALIASES.get(t)) || null;

/**
 * Busca en una línea los arranques de versículo a partir de `last` (último
 * versículo ya iniciado, 0 si es el primero del capítulo).
 *
 * Solo cuenta un número aislado que siga la secuencia con un salto máximo de 3
 * —la NTV omite versículos sueltos, p. ej. Mateo 17:21—, de modo que una cifra
 * casual dentro del texto no rompe el versículo.
 *
 * @returns {Array<{ num:number, index:number, end:number }>}
 */
function findVerseStarts(line, last) {
  const re = /(?:^|\s)(\d{1,3})(?=\s+\S)/g;
  const out = [];
  let prev = last;
  let m;
  while ((m = re.exec(line))) {
    const n = Number(m[1]);
    const before = line.slice(0, m.index);
    const opensLine = m.index === 0;
    const afterStop = /[.!?…»”"')]\s*$/.test(before);
    const ok = (opensLine || afterStop) && (prev === 0 ? n === 1 : n > prev && n <= prev + 3);
    if (ok) {
      const index = m.index + m[0].length - m[1].length;
      out.push({ num: n, index, end: index + m[1].length });
      prev = n;
    }
  }
  return out;
}

/**
 * ¿La línea `t` es un encabezado de sección de la NTV?
 *
 * Devuelve `false` cuando no lo es, `'next-verse'` cuando encabeza el versículo
 * siguiente y `'mid-verse'` cuando la NTV lo coloca **dentro** de un versículo,
 * entre su primera frase y la continuación (p. ej. Hechos 9:19, «Saulo en Damasco
 * y Jerusalén»). El caso ambiguo es el último renglón de un versículo partido en
 * dos líneas: también es una línea corta con mayúscula inicial precedida del
 * final de una frase. Se distingue porque un cierre de versículo termina en
 * puntuación de cierre de frase o lleva una marca de nota, y un título nunca hace
 * ni una cosa ni la otra. Sin esta guarda se perdía el final de 96 versículos
 * (Juan 5:45, la genealogía de Lucas 3:26-37, Hechos 9:19, Apocalipsis 22:21…)
 * que además aparecían como secciones falsas en el índice.
 */
function headingKind(t, prev, next) {
  if (!prev || !next) return false;
  const endsSentence = /[.!?…»"'\u2019)\]]$/.test(prev);
  if (!endsSentence) return false;
  if (t.length > 64) return false;
  if (!/^[A-ZÁÉÍÓÚÜÑ¿¡«"']/.test(t)) return false;
  if (/[,;:·—-]$/.test(t)) return false;
  if (/[.!?…»]$/.test(t)) return false; // cierra frase: es texto de versículo
  if (/\[[a-z]{1,2}\]/.test(t)) return false; // lleva marca de nota
  if (/^\d{1,3}\s+\S/.test(next)) return 'next-verse';
  // Título dentro del propio versículo: el renglón siguiente abre y cierra frase.
  if (/^[A-ZÁÉÍÓÚÜÑ¿¡«"']/.test(next) && /[.!?…»"']$/.test(next)) return 'mid-verse';
  return false;
}

/**
 * Los volcados de la NTV cierran cada nota al pie con un resto del maquetado
 * (`<<`, `<>`, `<`). No aporta nada y se veía tal cual en la interfaz.
 */
const cleanNoteText = t => String(t).replace(/[\s\u00a0]*[<>\u2039\u203A]{1,3}\s*$/, '').trim();

/** Corrige separaciones de versalita que dejó el volcado del PDF (`S eñor`). */
const cleanSmallCaps = t => String(t).replace(/\bS eñor\b/g, 'Señor');

/**
 * Convierte el volcado en texto de la NTV en libros navegables de la Biblia.
 *
 * El fichero es un flujo plano (sin líneas en blanco) donde:
 *   - el nombre de un libro ocupa su propia línea y le sigue el capítulo `1`;
 *   - un capítulo es una línea con solo un número;
 *   - un versículo empieza por `N ` y continúa en las líneas siguientes;
 *   - los encabezados de sección son líneas sueltas sin número;
 *   - `www.lectulandia.com - Página N` y las cercas ``` son ruido.
 *
 * @param {string} raw
 * @returns {{ books: object[], notes: Map<string, Map<string,string>>, stats: object }}
 */
export function parseNtv(raw) {
  const lines = String(raw).split(/\r?\n/).map(l => l.trim().replace(/\s+/g, ' ')).filter(l => l && !isNoise(l));

  const books = [];
  const notesByBook = new Map();
  let book = null;
  let chap = null;
  let verse = null;
  let inNotes = false;
  // Los cinco «Libro…» de los Salmos se guardan hasta que empieza el salmo
  // siguiente, para que el título caiga dentro de su capítulo y no al final del
  // anterior.
  let pendingPsalmSection = null;
  // Texto que la extracción del PDF dejó antes del número «1» del versículo
  // (pasa, por ejemplo, al comienzo de Nehemías 8). Se recupera al abrir el
  // versículo 1 en vez de perderlo como si fuera un epígrafe.
  let preVerse = '';

  for (let i = 0; i < lines.length; i += 1) {
    const t = lines[i];
    const prev = lines[i - 1] || '';
    const next = lines[i + 1] || '';

    // 1) Nota al pie: «[z] Juan 3:21 O …». Van tras el texto, con referencia bíblica.
    const note = /^\[([a-z]{1,2})\]\s+([\s\S]+)$/.exec(t);
    if (note && /[1-3]?\s?[A-ZÁÉÍÓÚÑ][\wáéíóúñÁÉÍÓÚÑ\s]*\s\d+:\d+/.test(note[2].slice(0, 40))) {
      let text = note[2];
      // Las notas largas siguen en las líneas siguientes (hasta la próxima nota
      // o hasta el encabezado de la sección de notas del libro siguiente).
      while (
        i + 1 < lines.length &&
        !/^\[[a-z]{1,2}\]\s/.test(lines[i + 1]) &&
        !/^(Notas de|ANÓNIMO|ANTIGUO TESTAMENTO|NUEVO TESTAMENTO|Índice)/.test(lines[i + 1])
      ) {
        i += 1;
        text += ' ' + lines[i];
      }
      const ref = /^([1-4]?\s?[A-ZÁÉÍÓÚÑ][\wáéíóúñÁÉÍÓÚÑ\s]*?)\s(\d+):(\d+)\b/.exec(text);
      const target = ref ? resolveBookName(ref[1].trim()) : null;
      const body = cleanNoteText(ref ? text.slice(ref.index + ref[0].length) : text);
      if (target) {
        if (!notesByBook.has(target.id)) notesByBook.set(target.id, new Map());
        notesByBook.get(target.id).set(note[1], body);
      }
      continue;
    }

    // Fin del texto bíblico: a partir de aquí solo vienen el aparato de notas y
    // los apéndices (autoría, fechas…). Nada de eso pertenece a un versículo.
    if (/^Notas de /.test(t)) inNotes = true;
    if (inNotes) continue;

    // 2) Libro: nombre exacto seguido de un capítulo (`1`), de un versículo 1
    //    (libros de un solo capítulo) o, en Salmos, del primer «Salmo N».
    //    Se exige el orden canónico para que un título de sección que coincida
    //    con el nombre de otro libro no abra un libro falso.
    const meta2 = resolveBookName(t);
    const nextIsChapter = /^\d{1,3}$/.test(next);
    const nextIsOneChapterVerse = /^1\s+\S/.test(next);
    const nextIsPsalmStart = meta2?.id === 'salmos' && /^(?:Libro\b|Salmo\s+\d)/.test(next);
    const expectedOrder = book ? book.order + 1 : 1;
    if (
      meta2 &&
      meta2.ntv &&
      meta2.order === expectedOrder &&
      (nextIsChapter || nextIsOneChapterVerse || nextIsPsalmStart)
    ) {
      book = { ...meta2, chapters: [] };
      books.push(book);
      verse = null;
      pendingPsalmSection = null;
      preVerse = '';
      if (nextIsPsalmStart) {
        chap = null;
      } else if (nextIsChapter) {
        chap = null;
      } else {
        // Libro de un solo capítulo: el capítulo 1 ya está implícito y la línea
        // siguiente (que empieza por «1 ») se procesa como su versículo 1.
        chap = { num: 1, sections: [], verses: [] };
        book.chapters.push(chap);
      }
      continue;
    }

    if (!book) continue; // introducción anterior a Génesis

    // 3) Salmos: la NTV no numera los capítulos con una línea suelta, sino con
    //    «Salmo N» (a veces con una marca de nota: «Salmo 25[ah]»).
    if (book.id === 'salmos') {
      const psalm = /^Salmo\s+(\d{1,3})(?:\[[a-z]{1,2}\])?$/.exec(t);
      if (psalm) {
        chap = { num: Number(psalm[1]), sections: [], verses: [] };
        if (pendingPsalmSection) {
          chap.sections.push({ title: pendingPsalmSection, verse: 1 });
          pendingPsalmSection = null;
        }
        book.chapters.push(chap);
        verse = null;
        preVerse = '';
        continue;
      }
      if (/^Libro\s+(?:Primero|Segundo|Tercero|Cuarto|Quinto)\b/.test(t)) {
        pendingPsalmSection = t;
        continue;
      }
    }

    // 4) Capítulo: línea con solo un número. Se exige que sea el siguiente
    //    capítulo y que no lo siga otro número: así se descartan los números de
    //    página sueltos que la extracción dejó entre versículos (p. ej. «139»
    //    en Esdras 2 o los «74» de Nehemías 7).
    const nextChapter = (chap?.num || 0) + 1;
    if (
      /^\d{1,3}$/.test(t) &&
      Number(t) === nextChapter &&
      !/^\d{1,3}$/.test(next)
    ) {
      chap = { num: Number(t), sections: [], verses: [] };
      book.chapters.push(chap);
      verse = null;
      preVerse = '';
      continue;
    }

    if (!chap) continue;

    // 5) Salmos: todo lo que hay entre «Salmo N» y el versículo 1 es la
    //    sobrescritura (a veces partida en varias líneas por el volcado del
    //    PDF). Se acumula y se publica como un único título de sección, no como
    //    fragmentos sueltos («cuerda.», «Benjamín.», «del hijo.»).
    if (book.id === 'salmos' && !verse) {
      const earlyStarts = /^\d{1,3}$/.test(t) ? [] : findVerseStarts(t, 0);
      if (!earlyStarts.length && !/^\d{1,3}$/.test(t)) {
        preVerse += (preVerse ? ' ' : '') + t;
        continue;
      }
    }

    // 6) Una línea de texto puede contener 0..N arranques de versículo: los
    //    versículos cortos comparten renglón («20 … 21 …»). Se buscan los números
    //    consecutivos esperados y se corta la línea en cada uno de ellos.
    const starts = /^\d{1,3}$/.test(t) ? [] : findVerseStarts(t, verse ? verse.n : 0);
    if (starts.length) {
      let cursor = 0;
      for (const s of starts) {
        const before = t.slice(cursor, s.index).trim();
        if (before) {
          if (verse) verse.text += ' ' + before;
          else preVerse += (preVerse ? ' ' : '') + before;
        }
        if (!verse && book.id === 'salmos' && preVerse) {
          chap.sections.push({ title: preVerse.trim(), verse: 1 });
          preVerse = '';
        }
        verse = { n: s.num, text: s.num === 1 ? preVerse : '' };
        if (s.num === 1) preVerse = '';
        chap.verses.push(verse);
        cursor = s.end;
      }
      const after = t.slice(cursor).trim();
      if (after) verse.text += (verse.text ? ' ' : '') + after;
      continue;
    }

    // 7) Encabezado de sección, texto previo al versículo 1 o continuación.
    if (!verse) {
      const nextStartsVerse = /^\d{1,3}\s+\S/.test(next);
      const looksLikePreamble =
        t.length > 64 ||
        /[,;:]$/.test(t) ||
        /(?:^|\s)(?:y|o|que|de|en|con|para|por|sobre|como|cuando|mientras|desde|hasta)$/iu.test(t);
      if (nextStartsVerse && looksLikePreamble) {
        preVerse += (preVerse ? ' ' : '') + t;
        continue;
      }
      if (t.length <= 64) chap.sections.push({ title: t, verse: 1 });
      continue;
    }
    const kind = headingKind(t, prev, next);
    if (kind) {
      chap.sections.push({ title: t, verse: kind === 'mid-verse' ? verse.n : verse.n + 1 });
      continue;
    }
    verse.text += ' ' + t;
  }

  // Comillas tipográficas y limpieza final.
  for (const b of books) {
    for (const c of b.chapters) {
      for (const s of c.sections || []) s.title = cleanSmallCaps(s.title);
      for (const v of c.verses) {
        v.text = cleanSmallCaps(
          v.text
            .replace(/\s+([.,;:!?»])/g, '$1')
            .replace(/\s{2,}/g, ' ')
            .trim()
        );
      }
    }
  }

  const stats = {
    books: books.length,
    chapters: books.reduce((a, b) => a + b.chapters.length, 0),
    verses: books.reduce((a, b) => a + b.chapters.reduce((x, c) => x + c.verses.length, 0), 0),
    sections: books.reduce((a, b) => a + b.chapters.reduce((x, c) => x + c.sections.length, 0), 0),
    notes: [...notesByBook.values()].reduce((a, m) => a + m.size, 0)
  };

  return { books, notes: notesByBook, stats };
}

/** Sugiere el id de libro a partir del nombre del Codex (`JOHN` → `juan`). */
export const bookByCodexNo = no => BOOK_BY_CODEX_NO.get(Number(no)) || null;
export const bookById = id => BOOK_BY_ID.get(id) || null;

/* ========================================================================== */
/* Codex Sinaiticus — transcripción con aparato                               */
/* ========================================================================== */

const decodeEntities = s =>
  s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ');

/** Convierte la información de un `overlib` en pares testigo → variante. */
function parseApparatusTip(tip) {
  const raw = decodeEntities(tip);
  // Cada testigo abre con `<span class="writer">SIGLA: </span>`: es el separador
  // más fiable. Si no hay ninguno, se cae al separador por doble salto.
  let parts = raw.split(/<span class="writer">/).slice(1);
  if (!parts.length) parts = raw.split(/<br\s*\/?>\s*<br\s*\/?>/);
  return parts
    .map(chunk => {
      const clean = chunk.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      const m = /^([^:]{1,6}):\s*(.*)$/.exec(clean);
      if (!m) return null;
      return { w: m[1].trim(), t: m[2].trim() };
    })
    .filter(Boolean);
}

/**
 * Extrae los versículos de una página del Codex (vista «by verse»).
 *
 * El griego conserva los *nomina sacra* sobrelineados entre `‹` y `›` para que
 * la interfaz pueda pintarlos con una raya superior, como en el manuscrito.
 *
 * @param {string} html respuesta de `handler/transcription.ashx?…&type=1`
 * @returns {Array<{ codexNo:number, bookId:string, chapter:number, verse:number,
 *                   grc:string, apparatus:Array<{w:string,t:string}> }>}
 */
export function parseCodexFolio(html) {
  const out = [];
  const paras = html.match(/<p id="V-B\d+K\d+V\d+-[^"]*"[\s\S]*?<\/p>/g) || [];

  for (const para of paras) {
    const head = /<p id="V-B(\d+)K(\d+)V(\d+)-\d+-[A-Z0-9]+"/.exec(para);
    if (!head) continue;
    if (Number(head[2]) === 0) continue; // el «capítulo 0» es el título del libro (Κατὰ …)
    const meta = BOOK_BY_CODEX_NO.get(Number(head[1]));
    if (!meta) continue;

    const apparatus = [];
    let body = para.replace(/<b>[\d:]+<\/b>/, '');

    // Anclas del aparato: el texto visible es la lectura del códice; el tooltip
    // (overlib) lleva las variantes por testigo. Se inserta un marcador §N con el
    // índice de la primera variante para poder pintar el sigilo en su sitio.
    body = body.replace(/<a [^>]*overlib\('([\s\S]*?)'\)[^>]*>([\s\S]*?)<\/a>/g, (_m, tip, visible) => {
      const entries = parseApparatusTip(tip);
      if (!entries.length) return visible;
      const start = apparatus.length;
      apparatus.push(...entries);
      return `\u00a7${start}` + visible;
    });

    // Nomina sacra y abreviaturas sobrelineadas → marcadores ‹…›.
    body = body.replace(
      /<span class="[^"]*ol2[^"]*"><span[^>]*>([\s\S]*?)<\/span><\/span>/g,
      (_m, inner) => `\u2039${inner}\u203A`
    );

    const grc = decodeEntities(
      body
        .replace(/<span class="[^"]*kwhyphen[^"]*"><\/span>/g, '') // une palabras partidas
        .replace(/<sup[\s\S]*?<\/sup>/g, '') // marcas de omisión
        .replace(/<[^>]+>/g, '')
    )
      .replace(/\s+/g, ' ')
      .trim();

    if (!grc) continue;

    out.push({
      codexNo: Number(head[1]),
      bookId: meta.id,
      chapter: Number(head[2]),
      verse: Number(head[3]),
      grc,
      apparatus
    });
  }

  return out;
}

/** Extrae quire/folio/cara y metadatos del visor (`manuscript.aspx`). */
export function parseManuscriptPage(html) {
  const init = /transcription\.init\((\d+),(\d+),'([rv])'/.exec(html);
  const info = /id="manuscriptVerseInfo">([\s\S]*?)<input/.exec(html);
  const meta = {};
  if (init) {
    meta.quire = Number(init[1]);
    meta.folio = Number(init[2]);
    meta.side = init[3];
  }
  if (info) {
    const clean = decodeEntities(info[1]).replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
    const lib = /library\s*:\s*([A-Za-z]+)/.exec(clean);
    const fol = /folio\s*:\s*(\d+)/.exec(clean);
    const scr = /scribe\s*:\s*([A-Za-z0-9]+)/.exec(clean);
    const passage = /^([^,]+),\s*([\d:.\s-]+?)\s{2,}/.exec(clean);
    if (lib) meta.library = lib[1];
    if (fol) meta.folioNumber = fol[1];
    if (scr) meta.scribe = scr[1];
    if (passage) meta.passage = `${passage[1].trim()} ${passage[2].trim()}`;
  }
  return meta;
}

export default parseNtv;
