import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import BibleSearch from '../components/BibleSearch';
import HebrewVerseTokens from '../components/HebrewVerseTokens';
import ReaderMenu from '../components/ReaderMenu';
import BibleCta from '../components/BibleCta';
import LexiconPanel from '../components/LexiconPanel';
import NtvInline from '../components/NtvInline';
import VersePopover, { ApparatusBody, KetivQereBody, LexiconBody, NoteBody } from '../components/VersePopover';
import {
  NT_BOOKS,
  OT_BOOKS,
  WITNESS_ATTRIBUTION,
  WITNESS_SOURCE,
  witnessLabel,
  witnessLegend
} from '../data/exegesis';
import { buildRecords } from '../lib/bibleSearch';
import { loadExegesisIndex, loadLemmas, loadLexicon, loadLexiconBase, loadWitnessBook } from '../lib/exegesisTexts';
import { loadHebreoBook } from '../lib/hebreoTexts';
import {
  EZRA_SIL_URL,
  HEBREW_BOOK_BY_ID,
  HEBREW_LICENSE_URL,
  HEBREW_SOURCE_URL,
  stripCantillation,
  stripNiqqud
} from '../lib/hebrew';
import { hasSelection } from '../lib/selection';
import { splitOverline, tokenizeGreek } from '../lib/greek';
import { decodeToken } from '../lib/lexicon';
import { useSeo } from '../lib/site';
import BookIntroPanel from '../components/BookIntroPanel/BookIntroPanel';

import './Biblia.css';
import './Exegesis.css';
import './BibliaHebreo.css';

/* -------------------------------------------------------------------------- */
/* Preferencias y constantes                                                  */
/* -------------------------------------------------------------------------- */

const FS_MIN = 14;
const FS_MAX = 26;
const KEYS = {
  size: 'crux.exegesis.letra',
  theme: 'crux.exegesis.papel',
  mode: 'crux.exegesis.columnas',
  cantillation: 'crux.hebreo.cantilacion',
  vowels: 'crux.hebreo.vocales'
};

const THEMES = [
  { id: 'claro', label: 'Papel claro', glyph: '☀' },
  { id: 'sepia', label: 'Papel sepia', glyph: '◐' },
  { id: 'noche', label: 'Papel nocturno', glyph: '☾' }
];

/**
 * Testigos que pueden ocupar una columna, en el orden en que se pintan. El id
 * es la clave del versículo en cada fila (`row.codex`, `row.ntv`) y el modo
 * «solo este testigo». Una traducción nueva (`trad`) o el hebreo se añaden aquí
 * y en `renderHead`/`renderCell`; el resto (modos, botones, rejilla) se deriva.
 *
 * `short` es lo que se lee en el botón y tiene que aparecer en `label`: el
 * nombre accesible debe contener el texto visible (`label-content-name-mismatch`).
 */
const COLUMNS = [
  { id: 'hebreo', short: 'Hebreo', label: 'Solo el Hebreo · texto masorético (WLC / OSHB)' },
  { id: 'codex', short: 'Codex', label: 'Solo el Codex Sinaiticus' },
  { id: 'ntv', short: 'NTV', label: 'Solo la NTV · Nueva Traducción Viviente' },
  { id: 'trad', short: 'Trad', label: 'Solo la Trad · traducción de trabajo del Codex (borrador)' }
];

/** Modo con todas las columnas disponibles a la vez (si hay más de una). */
const PARALLEL = { id: 'paralelo', short: null };

/**
 * Modos que ofrece un capítulo: el paralelo (si hay dos o más testigos) y uno
 * por testigo. Cada modo dice qué columnas enseña.
 */
function modesFor(available) {
  const solo = COLUMNS.filter(c => available.includes(c.id)).map(c => ({ ...c, columns: [c.id] }));
  if (solo.length < 2) return solo;
  const label = solo.length === 2 ? 'Las dos columnas, versículo a versículo' : 'Todas las columnas, versículo a versículo';
  return [{ ...PARALLEL, label, columns: solo.map(c => c.id) }, ...solo];
}

/** Avisos de numeración distinta entre la Septuaginta y la NTV. */
const NUMBERING_NOTICE = {
  salmos:
    'El Codex sigue la Septuaginta: incluye el Salmo 151 y la numeración de los Salmos puede no coincidir con la NTV.',
  jeremias:
    'La Septuaginta del Codex ordena y numera Jeremías de forma distinta a la NTV; la correspondencia no es verso a verso.',
  ester:
    'El Codex transmite Ester con las adiciones deuterocanónicas y una numeración que puede no coincidir con la NTV.',
  joel:
    'El Codex sigue la Septuaginta (4 capítulos): Joel 2:28–32 de la NTV es 3:1–5 en el Codex, y Joel 3 de la NTV corresponde a Joel 4 del Codex.'
};

const prefersReduced = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const read = (key, fallback) => {
  try {
    return window.localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
};

const write = (key, value) => {
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    /* modo privado */
  }
};

/**
 * Modo guardado. Migra el antiguo `dos`/`uno`; lo que no sea un modo conocido
 * vuelve a `paralelo`. Que el modo exista en el capítulo abierto se comprueba
 * al pintar (`modesFor`), no aquí: así la preferencia sobrevive a un libro que
 * solo tiene un testigo.
 */
const readMode = () => {
  const stored = read(KEYS.mode, 'paralelo');
  if (stored === 'dos') return 'paralelo';
  if (stored === 'uno') return 'codex';
  // La columna hebrea arranca apagada por defecto salvo que la pida la URL o el usuario.
  if (stored === 'hebreo') return 'paralelo';
  return stored === PARALLEL.id || COLUMNS.some(c => c.id === stored) ? stored : 'paralelo';
};

/* -------------------------------------------------------------------------- */
/* Iconos                                                                     */
/* -------------------------------------------------------------------------- */

/** Icono del conmutador de columnas: un rectángulo con 1 o 2 divisorias. */
function LayoutGlyph({ cols = 2, two }) {
  const n = two ? 2 : cols;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <rect x="1" y="2" width="14" height="12" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
      {n === 2 ? <line x1="8" y1="2" x2="8" y2="14" stroke="currentColor" strokeWidth="1.3" /> : null}
      {n >= 3 ? (
        <>
          <line x1="5.7" y1="2" x2="5.7" y2="14" stroke="currentColor" strokeWidth="1.3" />
          <line x1="10.3" y1="2" x2="10.3" y2="14" stroke="currentColor" strokeWidth="1.3" />
        </>
      ) : null}
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Troceado del griego y de la NTV                                            */
/* -------------------------------------------------------------------------- */

/** Índices (en el aparato) de las anclas que lleva un versículo griego. */
const anchorIndexes = grc =>
  tokenizeGreek(grc)
    .filter(t => t.k === 'sigil')
    .map(t => Number(t.v));

/** Parte el texto de la NTV en texto y marcas de nota `[x]`. */
function tokenizeNtv(text) {
  const out = [];
  const re = /\[([a-z]{1,2})\]/g;
  let last = 0;
  let m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ k: 't', v: text.slice(last, m.index) });
    out.push({ k: 'fn', v: m[1] });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ k: 't', v: text.slice(last) });
  return out;
}

/* -------------------------------------------------------------------------- */
/* Celdas de la rejilla                                                       */
/* -------------------------------------------------------------------------- */

function GreekText({ verse, onAnchor, onWord, active, interactive = true }) {
  const tokens = useMemo(() => {
    let wordIndex = -1;
    return tokenizeGreek(verse.grc).map(token => {
      if (token.k !== 'w') return token;
      wordIndex += 1;
      return { ...token, wi: wordIndex };
    });
  }, [verse.grc]);

  return (
    <>
      {tokens.map((t, i) => {
        if (t.k === 'w') {
          const content = splitOverline(t.v).map((part, j) =>
            part.overline ? (
              <i key={j} className="exg-ns">
                {part.text}
              </i>
            ) : (
              <span key={j}>{part.text}</span>
            )
          );
          if (!interactive) {
            return (
              <span key={i} className="exg-word exg-word--plain">
                {content}
              </span>
            );
          }
          return (
            <button
              key={i}
              type="button"
              className="exg-word"
              tabIndex={active ? 0 : -1}
              title="Ver el análisis de esta palabra"
              aria-haspopup="dialog"
              onClick={event => {
                event.stopPropagation();
                if (hasSelection()) return;
                onWord(event.currentTarget, verse, t.wi, t);
              }}
            >
              {content}
            </button>
          );
        }
        if (t.k === 'sigil') {
          return (
            <button
              key={i}
              type="button"
              className="exg-sigil"
              title="Ver la variante en el aparato crítico"
              aria-label={`Variante del aparato en el versículo ${verse.n}`}
              onClick={event => {
                event.stopPropagation();
                onAnchor(event.currentTarget, verse.n, Number(t.v));
              }}
            >
              ∗
            </button>
          );
        }
        if (t.k === 'mark') {
          return (
            <span key={i} className="exg-transmark" title="Marca de la transcripción del proyecto, no es una letra">
              {t.v}
            </span>
          );
        }
        return <span key={i}>{t.v}</span>;
      })}
    </>
  );
}

function NtvText({ verse, onNote }) {
  const tokens = useMemo(() => tokenizeNtv(verse.text), [verse.text]);
  return (
    <>
      {tokens.map((t, i) => {
        if (t.k !== 'fn') return <span key={i}>{t.v}</span>;
        return (
          <button
            key={i}
            type="button"
            className="exg-fn"
            title="Ver la nota del traductor"
            aria-label={`Nota ${t.v} del versículo ${verse.n}`}
            onClick={event => {
              event.stopPropagation();
              onNote(event.currentTarget, verse.n, t.v);
            }}
          >
            {t.v}
          </button>
        );
      })}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Página                                                                     */
/* -------------------------------------------------------------------------- */

export default function Exegesis() {
  const [params, setParams] = useSearchParams();

  const [index, setIndex] = useState({ status: 'loading', data: null });
  const [ntv, setNtv] = useState(null);
  const [codex, setCodex] = useState(undefined);
  const [trad, setTrad] = useState(null);
  const [hebreo, setHebreo] = useState(null);
  const [lemas, setLemas] = useState(null);
  const [lexicon, setLexicon] = useState(null);
  const [lexiconStatus, setLexiconStatus] = useState('idle');
  const [lexiconBase, setLexiconBase] = useState(null);
  const [lexiconBaseStatus, setLexiconBaseStatus] = useState('idle');
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const [theme, setTheme] = useState(() => {
    const stored = read(KEYS.theme, 'claro');
    return THEMES.some(t => t.id === stored) ? stored : 'claro';
  });
  const [size, setSize] = useState(() => Number(read(KEYS.size, 19)));
  const [mode, setMode] = useState(readMode);
  const [showCantillation, setShowCantillation] = useState(() => read(KEYS.cantillation, '1') !== '0');
  const [showVowels, setShowVowels] = useState(() => read(KEYS.vowels, '1') !== '0');
  const [pop, setPop] = useState(null);
  const [navOpen, setNavOpen] = useState(false);

  const gridRef = useRef(null);
  const chapterKey = useRef('');

  const bookId = params.get('libro') || 'juan';
  const chapterNum = Number(params.get('cap') || 3);
  const rangeParam = params.get('vv') || '';
  const selected = Number(params.get('v')) || null;
  const dicOpen = params.has('dic');
  const dicValue = params.get('dic') || '';
  const hebreoParam = params.get('hebreo') === '1' || params.get('modo') === 'hebreo';

  /* ------------------------------- índice --------------------------------- */

  useEffect(() => {
    let alive = true;
    loadExegesisIndex()
      .then(data => alive && setIndex({ status: 'ok', data }))
      .catch(() => alive && setIndex({ status: 'error', data: null }));
    return () => {
      alive = false;
    };
  }, []);

  const ensureLexicon = useCallback(() => {
    if (lexicon) return Promise.resolve(lexicon);
    setLexiconStatus(prev => (prev === 'ok' ? prev : 'loading'));
    return loadLexicon()
      .then(data => {
        if (mountedRef.current) {
          setLexicon(data);
          setLexiconStatus('ok');
        }
        return data;
      })
      .catch(() => {
        if (mountedRef.current) setLexiconStatus('error');
        return null;
      });
  }, [lexicon]);

  const ensureLexiconBase = useCallback(() => {
    if (lexiconBase) return Promise.resolve(lexiconBase);
    setLexiconBaseStatus(prev => (prev === 'ok' ? prev : 'loading'));
    return loadLexiconBase()
      .then(data => {
        if (mountedRef.current) {
          setLexiconBase(data);
          setLexiconBaseStatus('ok');
        }
        return data;
      })
      .catch(() => {
        if (mountedRef.current) setLexiconBaseStatus('error');
        return null;
      });
  }, [lexiconBase]);

  const lexiconMap = useMemo(
    () => new Map((lexicon?.entries || []).map(item => [item.strong, item])),
    [lexicon]
  );

  const bookMeta = useMemo(
    () => (index.data ? index.data.books.find(b => b.id === bookId) || index.data.books[0] : null),
    [index.data, bookId]
  );

  const hasNtv = Boolean(bookMeta?.ntv.verses);
  const hasCodex = Boolean(bookMeta?.codex.verses);
  const hasTrad = Boolean(bookMeta?.trad?.verses);
  const hasHebreo = HEBREW_BOOK_BY_ID.has(bookId);
  const hebreoMeta = HEBREW_BOOK_BY_ID.get(bookId) || null;
  const hebreoActive = hasHebreo && hebreoParam;

  /* ------------------------------- testigos ------------------------------- */

  useEffect(() => {
    if (!bookMeta) return undefined;
    let alive = true;
    if (!hasNtv) {
      setNtv(null);
      return () => {
        alive = false;
      };
    }
    setNtv(null);
    loadWitnessBook('ntv', bookId)
      .then(data => alive && setNtv(data))
      .catch(() => alive && setNtv({ error: true }));
    return () => {
      alive = false;
    };
  }, [bookId, bookMeta, hasNtv]);

  useEffect(() => {
    if (!bookMeta) return undefined;
    let alive = true;
    if (!hasCodex) {
      setCodex(null);
      return () => {
        alive = false;
      };
    }
    setCodex(undefined);
    loadWitnessBook('codex', bookId)
      .then(data => alive && setCodex(data))
      .catch(() => alive && setCodex(null));
    return () => {
      alive = false;
    };
  }, [bookId, bookMeta, hasCodex]);

  /* Traducción de trabajo (solo libros sin NTV que ya la tienen). */
  useEffect(() => {
    if (!bookMeta || !hasTrad) {
      setTrad(null);
      return undefined;
    }
    let alive = true;
    setTrad(undefined);
    loadWitnessBook('trad', bookId)
      .then(data => alive && setTrad(data))
      .catch(() => alive && setTrad(null));
    return () => {
      alive = false;
    };
  }, [bookId, bookMeta, hasTrad]);

  /* Texto masorético hebreo y arameo (WLC / OSHB): solo se descarga si está activo en el AT. */
  useEffect(() => {
    if (!bookMeta || !hebreoActive) {
      setHebreo(null);
      return undefined;
    }
    let alive = true;
    setHebreo(undefined);
    loadHebreoBook(bookId)
      .then(data => alive && setHebreo(data))
      .catch(() => alive && setHebreo(null));
    return () => {
      alive = false;
    };
  }, [bookId, bookMeta, hebreoActive]);

  /* Mapas de lemas del libro abierto: una entrada por palabra del Codex.
     MorphGNT solo cubre el NT; el AT no tiene mapas y no debe pedirlos. */
  useEffect(() => {
    if (!bookMeta || !hasCodex || bookMeta.testament !== 'NT') {
      setLemas(null);
      return undefined;
    }
    let alive = true;
    setLemas(null);
    loadLemmas(bookId)
      .then(data => alive && setLemas(data))
      .catch(() => alive && setLemas(null));
    return () => {
      alive = false;
    };
  }, [bookId, bookMeta, hasCodex]);

  const ntvChapter = useMemo(
    () => (ntv && !ntv.error ? ntv.chapters.find(c => c.num === chapterNum) || null : null),
    [ntv, chapterNum]
  );

  const codexChapter = useMemo(
    () => (codex ? codex.chapters.find(c => c.num === chapterNum) || null : null),
    [codex, chapterNum]
  );

  const tradChapter = useMemo(
    () => (trad ? trad.chapters.find(c => c.num === chapterNum) || null : null),
    [trad, chapterNum]
  );

  const hebreoChapter = useMemo(
    () => (hebreo ? hebreo.chapters.find(c => c.num === chapterNum) || null : null),
    [hebreo, chapterNum]
  );

  const chapterHasNtv = Boolean(ntvChapter);
  const chapterHasTrad = Boolean(tradChapter);
  const chapterHasCodex = Boolean(codexChapter);
  const chapterHasHebreo = Boolean(hebreoChapter);
  const hebreoAligned = Boolean(hebreoChapter?.ntvAligned);

  /* Precarga el léxico al abrir `?dic=` o en capítulos del NT con Codex para evitar parpadeos al pulsar palabras. */
  useEffect(() => {
    if (dicOpen || (bookMeta?.testament === 'NT' && chapterHasCodex)) {
      ensureLexicon();
    }
  }, [dicOpen, bookMeta?.testament, chapterHasCodex, ensureLexicon]);

  const chapterNums = useMemo(() => {
    const ntvChapters = hasNtv
      ? ntv?.chapters?.map(c => c.num) || bookMeta?.ntv.chapters || []
      : [];
    const codexChapters = hasCodex
      ? codex?.chapters?.map(c => c.num) || bookMeta?.codex.chapters || []
      : [];
    const hebreoChapters =
      hasHebreo && hebreoActive ? hebreo?.chapters?.map(c => c.num) || hebreoMeta?.chapters || [] : [];
    return [...new Set([...ntvChapters, ...codexChapters, ...hebreoChapters])].sort((a, b) => a - b);
  }, [hasNtv, hasCodex, hasHebreo, hebreoActive, ntv, codex, hebreo, bookMeta, hebreoMeta]);

  const loading =
    !bookMeta ||
    (hasNtv && !ntv) ||
    (hasCodex && codex === undefined) ||
    (hasTrad && trad === undefined) ||
    (hebreoActive && hebreo === undefined);

  /* ------------------------------- columnas ------------------------------- */

  const baseColumns = [
    chapterHasCodex && 'codex',
    chapterHasNtv && 'ntv',
    chapterHasTrad && 'trad'
  ].filter(Boolean);

  const canShowHebreo = hebreoActive && chapterHasHebreo;
  // Capítulos con versificación masorética distinta a la NTV (140/929) no se fuerzan en paralelo.
  const hebreoSoloForced = canShowHebreo && !hebreoAligned;

  const availableColumns = hebreoSoloForced
    ? ['hebreo']
    : [canShowHebreo && 'hebreo', ...baseColumns].filter(Boolean);

  const availableModes = hebreoSoloForced
    ? [COLUMNS.find(c => c.id === 'hebreo'), ...modesFor(baseColumns)]
        .filter(Boolean)
        .map(m => (m.id === 'hebreo' ? { ...m, columns: ['hebreo'] } : m))
    : modesFor(availableColumns);

  // `?modo=` (p. ej. `?modo=trad`, `?modo=hebreo`) manda sobre la preferencia guardada, sin cambiarla.
  const modeParam = params.get('modo');
  const effectiveStoredMode = canShowHebreo && !modeParam && !hebreoSoloForced ? 'paralelo' : mode;
  const view = hebreoSoloForced
    ? availableModes[0] || { id: 'hebreo', columns: ['hebreo'] }
    : availableModes.find(m => m.id === modeParam) ||
      availableModes.find(m => m.id === effectiveStoredMode) ||
      availableModes[0] || { id: 'ntv', columns: [] };
  const viewMode = view.id;
  const shown = view.columns;
  const columns = shown.length;
  const includeHebreoRows = shown.includes('hebreo');
  const soloHebreoMode = includeHebreoRows && shown.length === 1;

  /* ------------------------------- rangos --------------------------------- */

  const chapterVerseMax = useMemo(() => {
    const fromHebreo =
      includeHebreoRows && hebreoChapter ? hebreoChapter.verses.reduce((a, v) => Math.max(a, v.n), 0) : 0;
    if (soloHebreoMode) return fromHebreo;
    const fromNtv = ntvChapter ? ntvChapter.verses.reduce((a, v) => Math.max(a, v.n), 0) : 0;
    const fromCodex = codexChapter ? codexChapter.verses.reduce((a, v) => Math.max(a, v.n), 0) : 0;
    return Math.max(fromHebreo, fromNtv, fromCodex);
  }, [includeHebreoRows, soloHebreoMode, hebreoChapter, ntvChapter, codexChapter]);

  const ranges = useMemo(() => {
    if (!chapterVerseMax) return [];
    const list = [{ id: 'all', label: 'Todo el capítulo', from: 1, to: chapterVerseMax }];
    for (let from = 1; from <= chapterVerseMax; from += 12) {
      const to = Math.min(chapterVerseMax, from + 11);
      list.push({ id: `${from}-${to}`, label: `vv. ${from}–${to}`, from, to });
    }
    return list;
  }, [chapterVerseMax]);

  const range = useMemo(
    () => ranges.find(r => r.id === rangeParam) || ranges[0] || { from: 1, to: 0 },
    [ranges, rangeParam]
  );

  const visibleHebreo = useMemo(
    () => (hebreoChapter ? hebreoChapter.verses.filter(v => v.n >= range.from && v.n <= range.to) : []),
    [hebreoChapter, range]
  );

  const visibleNtv = useMemo(
    () => (ntvChapter ? ntvChapter.verses.filter(v => v.n >= range.from && v.n <= range.to) : []),
    [ntvChapter, range]
  );
  const visibleCodex = useMemo(
    () => (codexChapter ? codexChapter.verses.filter(v => v.n >= range.from && v.n <= range.to) : []),
    [codexChapter, range]
  );

  const visibleTrad = useMemo(
    () => (tradChapter ? tradChapter.verses.filter(v => v.n >= range.from && v.n <= range.to) : []),
    [tradChapter, range]
  );

  /**
   * Filas de la rejilla: una por versículo (el que falte en un testigo queda con
   * el hueco marcado) y una por título de sección, en su sitio.
   */
  const rows = useMemo(() => {
    if (soloHebreoMode) {
      return visibleHebreo.map(v => ({
        kind: 'verse',
        n: v.n,
        hebreo: v,
        codex: null,
        ntv: null,
        trad: null
      }));
    }
    const hebreoByN = includeHebreoRows ? new Map(visibleHebreo.map(v => [v.n, v])) : new Map();
    const codexByN = new Map(visibleCodex.map(v => [v.n, v]));
    const ntvByN = new Map(visibleNtv.map(v => [v.n, v]));
    const tradByN = new Map(visibleTrad.map(v => [v.n, v]));
    const numbers = [...new Set([...hebreoByN.keys(), ...codexByN.keys(), ...ntvByN.keys()])].sort((a, b) => a - b);
    const sections = new Map();
    for (const section of ntvChapter?.sections || []) {
      if (!sections.has(section.verse)) sections.set(section.verse, []);
      sections.get(section.verse).push(section.title);
    }
    const list = [];
    for (const n of numbers) {
      for (const title of sections.get(n) || []) list.push({ kind: 'section', key: `s-${n}-${title}`, title, verse: n });
      list.push({
        kind: 'verse',
        n,
        hebreo: hebreoByN.get(n) || null,
        codex: codexByN.get(n) || null,
        ntv: ntvByN.get(n) || null,
        trad: tradByN.get(n) || null
      });
    }
    return list;
  }, [soloHebreoMode, includeHebreoRows, visibleHebreo, visibleCodex, visibleNtv, visibleTrad, ntvChapter]);

  const verseNumbers = useMemo(() => rows.filter(r => r.kind === 'verse').map(r => r.n), [rows]);

  const apparatusRows = useMemo(
    () => visibleCodex.flatMap(v => v.apparatus.map((a, i) => ({ verse: v.n, index: i, ...a }))),
    [visibleCodex]
  );

  const noteRows = useMemo(
    () =>
      visibleNtv.flatMap(v =>
        (v.notes || []).map(id => ({ verse: v.n, id, text: ntv?.notes?.[id] || '' }))
      ),
    [visibleNtv, ntv]
  );

  const tradNoteRows = useMemo(
    () => visibleTrad.filter(v => v.note).map(v => ({ verse: v.n, text: v.note })),
    [visibleTrad]
  );

  const siglas = useMemo(() => witnessLegend(apparatusRows.map(r => r.w)), [apparatusRows]);

  const searchRecords = useMemo(() => {
    const records = [];
    if (ntvChapter) {
      records.push(
        ...buildRecords({
          witness: 'ntv',
          bookId,
          bookName: bookMeta?.name || bookId,
          chapters: [ntvChapter]
        })
      );
    }
    if (codexChapter) {
      records.push(
        ...buildRecords({
          witness: 'codex',
          bookId,
          bookName: bookMeta?.name || bookId,
          chapters: [codexChapter]
        })
      );
    }
    return records;
  }, [ntvChapter, codexChapter, bookId, bookMeta]);

  /* ----------------------------- preferencias ----------------------------- */

  useEffect(() => write(KEYS.theme, theme), [theme]);
  useEffect(() => write(KEYS.size, size), [size]);
  useEffect(() => write(KEYS.mode, mode), [mode]);
  useEffect(() => write(KEYS.cantillation, showCantillation ? '1' : '0'), [showCantillation]);
  useEffect(() => write(KEYS.vowels, showVowels ? '1' : '0'), [showVowels]);

  const formatHebrewSurface = useCallback(
    text => {
      if (!showVowels) return stripNiqqud(text);
      if (!showCantillation) return stripCantillation(text);
      return text;
    },
    [showVowels, showCantillation]
  );

  const themeDef = THEMES.find(t => t.id === theme) || THEMES[0];
  const cycleTheme = () =>
    setTheme(current => THEMES[(THEMES.findIndex(t => t.id === current) + 1) % THEMES.length].id);

  /* ------------------------- navegación por URL --------------------------- */

  const goto = useCallback(
    (next, push = false) => {
      const q = new URLSearchParams(params);
      if (next.bookId) {
        q.set('libro', next.bookId);
        if (!HEBREW_BOOK_BY_ID.has(next.bookId)) {
          q.delete('hebreo');
          if (q.get('modo') === 'hebreo') q.delete('modo');
        }
      }
      if (next.chapter) q.set('cap', String(next.chapter));
      if (next.range !== undefined) q.set('vv', next.range);
      else q.delete('vv');
      q.delete('v');
      setPop(null);
      setParams(q, { replace: !push });
    },
    [params, setParams]
  );

  // El panel «Ir a · buscar» de la barra compacta se cierra con Esc o al tocar fuera.
  useEffect(() => {
    if (!navOpen) return undefined;
    const onKey = e => e.key === 'Escape' && setNavOpen(false);
    const onDown = e => !e.target.closest?.('.exg__bar') && setNavOpen(false);
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [navOpen]);

  /** Capítulo anterior/siguiente (barra compacta). */
  const stepChapter = dir => {
    const next = chapterNums[chapterNums.indexOf(chapterNum) + dir];
    if (next) goto({ chapter: next, range: '' }, true);
  };

  const select = useCallback(
    (n, { keepPop = false } = {}) => {
      const q = new URLSearchParams(params);
      if (n) q.set('v', String(n));
      else q.delete('v');
      if (!keepPop) setPop(null);
      setParams(q, { replace: true });
    },
    [params, setParams]
  );

  // Si el capítulo pedido no existe en el libro, se corrige al primero que haya.
  useEffect(() => {
    if (!bookMeta || !chapterNums.length) return;
    if (!chapterNums.includes(chapterNum)) {
      goto({ chapter: chapterNums[0], range: '' }, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookMeta, chapterNums, chapterNum]);

  /* --------------------------- scroll de la rejilla ----------------------- */

  useEffect(() => {
    chapterKey.current = '';
  }, [bookId, chapterNum, range.id]);

  useEffect(() => {
    if (loading) return;
    const body = gridRef.current;
    if (!body) return;
    const key = `${bookId}|${chapterNum}|${range.id}`;
    if (chapterKey.current !== key) {
      chapterKey.current = key;
      body.scrollTop = 0;
    }
    if (!selected) return;
    const row = body.querySelector(`[data-v="${selected}"]`);
    if (!row) return;
    // La cabecera va pegada arriba dentro del contenedor: hay que descontarla o
    // la fila elegida quedaría escondida detrás.
    const head = body.querySelector('.exg-grid__head');
    const top = row.offsetTop - (head ? head.offsetHeight : 0) - 8;
    const bottom = top + row.offsetHeight;
    if (top >= body.scrollTop - 2 && bottom <= body.scrollTop + body.clientHeight) return;
    body.scrollTo({ top: Math.max(0, top), behavior: prefersReduced() ? 'auto' : 'smooth' });
  }, [loading, selected, bookId, chapterNum, range.id, rows]);

  /* ------------------------- controles de columnas ------------------------ */

  const toggleHebreo = useCallback(() => {
    const q = new URLSearchParams(params);
    if (hebreoActive) {
      q.delete('hebreo');
      if (q.get('modo') === 'hebreo') q.delete('modo');
      if (mode === 'hebreo') setMode('paralelo');
    } else {
      q.delete('modo');
      q.set('hebreo', '1');
      setMode('paralelo');
    }
    setPop(null);
    setParams(q, { replace: true });
  }, [params, setParams, hebreoActive, mode]);

  const hebreoToggleButton = hasHebreo ? (
    <button
      type="button"
      className={`rb-btn exg-heb-toggle${hebreoActive ? ' is-active' : ''}`}
      aria-pressed={hebreoActive}
      title={
        hebreoActive
          ? 'Ocultar la columna hebrea (WLC / OSHB)'
          : 'Mostrar el texto hebreo y arameo (WLC / OSHB)'
      }
      onClick={toggleHebreo}
    >
      <span className="exg-heb-toggle__glyph" aria-hidden="true">
        א
      </span>
      <span>Hebreo</span>
      <span className="sr-only">
        {hebreoActive ? ' (columna activa, pulsar para ocultar)' : ' (activar testigo WLC)'}
      </span>
    </button>
  ) : null;

  /** Botones de columnas (en la barra o, en móvil, dentro del menú «Aa»). */
  const modeButtons = (
    <>
      {availableModes.map(m => (
        <button
          key={m.id}
          type="button"
          className={`rb-btn rb-btn--icon${viewMode === m.id ? ' is-active' : ''}`}
          aria-pressed={viewMode === m.id}
          title={m.label}
          aria-label={m.label}
          onClick={() => {
            if (m.id === 'hebreo') {
              setMode('paralelo');
              const q = new URLSearchParams(params);
              q.set('modo', 'hebreo');
              q.delete('hebreo');
              setParams(q, { replace: true });
              return;
            }
            if (!m.columns.includes('hebreo') && (params.has('hebreo') || modeParam === 'hebreo')) {
              setMode(m.id);
              const q = new URLSearchParams(params);
              q.delete('hebreo');
              q.delete('modo');
              setParams(q, { replace: true });
              return;
            }
            setMode(m.id);
            const q = new URLSearchParams(params);
            if (m.id === 'paralelo' && canShowHebreo) {
              q.delete('modo');
              q.set('hebreo', '1');
              setParams(q, { replace: true });
              return;
            }
            if (modeParam) {
              q.delete('modo');
              setParams(q, { replace: true });
            }
          }}
        >
          {m.columns.length > 1 ? <LayoutGlyph cols={m.columns.length} /> : m.short}
        </button>
      ))}
    </>
  );

  /* --------------------------------- SEO ---------------------------------- */

  const seoWitness = includeHebreoRows
    ? shown.includes('codex') && shown.includes('ntv')
      ? 'Hebreo (WLC), Codex Sinaiticus y NTV'
      : shown.includes('ntv')
        ? 'Hebreo (WLC) y NTV'
        : 'Biblia Hebrea (WLC / OSHB)'
    : chapterHasCodex && chapterHasNtv
      ? 'Codex Sinaiticus y NTV'
      : chapterHasCodex && chapterHasTrad
        ? 'Codex Sinaiticus y traducción de trabajo'
        : chapterHasCodex
          ? 'Codex Sinaiticus'
          : 'NTV';
  const seoTitle = bookMeta
    ? `Exégesis · ${bookMeta.name} ${chapterNum} — ${seoWitness}`
    : `Exégesis comparada — ${seoWitness}`;

  useSeo({
    title: seoTitle,
    description: includeHebreoRows
      ? 'Lectura comparada con el texto masorético hebreo y arameo (WLC / OSHB) en tipografía Ezra SIL, junto al Codex Sinaiticus y la Nueva Traducción Viviente.'
      : chapterHasCodex && chapterHasNtv
        ? 'Lectura paralela de la Biblia, versículo a versículo: la transcripción del Codex Sinaiticus con su aparato crítico frente a la Nueva Traducción Viviente.'
        : chapterHasCodex
          ? 'Transcripción diplomática del Codex Sinaiticus, versículo a versículo, con su aparato crítico.'
          : 'Lectura de la Nueva Traducción Viviente, versículo a versículo, con sus notas del traductor.'
  });

  /* ------------------------------ facsímil -------------------------------- */

  const facsimile = bookMeta?.codexNo && chapterHasCodex
    ? `https://www.codexsinaiticus.org/en/manuscript.aspx?book=${bookMeta.codexNo}&chapter=${chapterNum}&verse=${selected || range.from || 1}`
    : null;

  /* ------------------------------ popovers -------------------------------- */

  const openApparatus = useCallback((anchor, verse, index) => {
    const verseData = visibleCodex.find(v => v.n === verse);
    const anchors = verseData ? anchorIndexes(verseData.grc) : [];
    const next = anchors.filter(a => a > index).sort((a, b) => a - b)[0];
    setPop({
      kind: 'apparatus',
      anchor,
      verse,
      index,
      end: next ?? verseData?.apparatus.length ?? index + 1
    });
    select(verse, { keepPop: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleCodex, select]);

  const openNote = useCallback(
    (anchor, verse, id) => {
      setPop({ kind: 'note', anchor, verse, id });
      select(verse, { keepPop: true });
    },
    [select]
  );

  const openKetivQere = useCallback(
    (anchor, data) => {
      setPop({ kind: 'kq', anchor, ...data });
      select(data.verse, { keepPop: true });
    },
    [select]
  );

  /** Ficha de una palabra del Codex: lema, morfología y glosa curada o base TBESG. */
  const openWord = useCallback(
    (anchor, verse, wordIndex, token) => {
      const map = lemas?.verses?.[`${chapterNum}:${verse.n}`];
      const morphemes = decodeToken(map?.[wordIndex], lemas?.dict);
      const primaryStrong = morphemes[0]?.strong;
      setPop({ kind: 'word', anchor, verse: verse.n, wordIndex, token, morphemes });
      select(verse.n, { keepPop: true });
      if (lexicon) {
        if (primaryStrong && !lexiconMap.has(primaryStrong)) {
          ensureLexiconBase();
        }
        return;
      }
      ensureLexicon().then(lexData => {
        if (!primaryStrong) return;
        const inCurated = lexData?.entries?.some(item => item.strong === primaryStrong);
        if (!inCurated) ensureLexiconBase();
      });
    },
    [lemas, chapterNum, lexicon, lexiconMap, select, ensureLexicon, ensureLexiconBase]
  );

  const goToVerseFromLexicon = useCallback(
    (targetBookId, cap, verse) => {
      const q = new URLSearchParams(params);
      q.delete('dic');
      q.delete('vv');
      if (!HEBREW_BOOK_BY_ID.has(targetBookId)) {
        q.delete('hebreo');
        if (q.get('modo') === 'hebreo') q.delete('modo');
      }
      q.set('libro', targetBookId);
      q.set('cap', String(cap));
      q.set('v', String(verse));
      setPop(null);
      setNavOpen(false);
      setParams(q);
    },
    [params, setParams]
  );

  const openLexicon = useCallback(
    (strong = '') => {
      const q = new URLSearchParams(params);
      q.set('dic', strong);
      setPop(null);
      setParams(q, { replace: true });
    },
    [params, setParams]
  );

  const closeLexicon = useCallback(() => {
    const q = new URLSearchParams(params);
    q.delete('dic');
    setParams(q, { replace: true });
  }, [params, setParams]);

  const guiaBook = bookMeta?.id || bookId;
  const guiaHref = `/exegesis/guia?lengua=${bookMeta?.testament === 'AT' && !chapterHasCodex ? 'hebreo' : 'griego'}&volver=${guiaBook}&cap=${chapterNum}`;

  /* ------------------------------ estados --------------------------------- */

  if (index.status === 'error') {
    return (
      <main id="main" className="exg">
        <div className="exg__shell">
          <div className="empty-state">
            <h1>No se pudo cargar la exégesis</h1>
            <p>Comprueba la conexión y vuelve a intentarlo.</p>
            <p>
              <Link className="btn btn--primary" to="/biblia">
                Ir a la Biblia Patrística
              </Link>
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (index.status !== 'ok' || !index.data) {
    return (
      <main id="main" className={`exg papel--${theme}`} data-theme={theme}>
        <div className="exg__shell">
          <div className="exg__loading">
            <div className="loader-pulse" role="status" aria-label="Cargando">
              <span />
              <span />
              <span />
            </div>
            <p className="muted">Abriendo los testigos…</p>
          </div>
        </div>
      </main>
    );
  }

  const wordPrimaryStrong = pop?.kind === 'word' ? pop.morphemes?.[0]?.strong : null;
  const wordEntry = wordPrimaryStrong ? lexiconMap.get(wordPrimaryStrong) || null : null;
  const wordBaseEntry =
    wordPrimaryStrong && !wordEntry ? lexiconBase?.entries?.[wordPrimaryStrong] || null : null;

  /** Cabecera de la columna de un testigo. */
  const renderHead = id => {
    if (id === 'hebreo') {
      return (
        <>
          <b>
            Hebreo (WLC) ·{' '}
            <span className="exg-grid__heb-name" lang="he" dir="rtl">
              {hebreoMeta?.hebrewName || hebreo?.hebrewName}
            </span>
          </b>
          <span>
            Westminster Leningrad Codex · OSHB
            {hebreoAligned ? '' : ' · numeración masorética'}
          </span>
        </>
      );
    }
    if (id === 'trad') {
      return (
        <>
          <b>Traducción de trabajo · Borrador</b>
          <span>
            Del griego del Codex · no es la NTV · CC BY-NC-SA 3.0
          </span>
        </>
      );
    }
    if (id === 'codex') {
      return (
        <>
          <b>Codex Sinaiticus</b>
          <span>
            Transcripción diplomática
            {codexChapter?.folio ? ` · f. ${codexChapter.folio}${codexChapter.side}` : ''} · la sobrelínea
            marca los <i>nomina sacra</i>
          </span>
        </>
      );
    }
    return (
      <>
        <b>Nueva Traducción Viviente</b>
        <span>
          {bookMeta?.name} {chapterNum}:{range.from}–{range.to} · notas del traductor en superíndice
        </span>
      </>
    );
  };

  /** Celda de un testigo en una fila (o el aviso de que no trae el versículo). */
  const renderCell = (id, row) => {
    if (id === 'hebreo') {
      return row.hebreo ? (
        <div className="exg-hebreo" dir="rtl" lang="he">
          <HebrewVerseTokens
            tokens={row.hebreo.t}
            verseNum={row.n}
            formatSurface={formatHebrewSurface}
            activeKqId={pop?.kind === 'kq' ? pop.id : null}
            onKetivQere={openKetivQere}
          />
        </div>
      ) : (
        <span className="exg-gap">El texto hebreo no trae este versículo.</span>
      );
    }
    if (id === 'trad') {
      return row.trad ? (
        <p className="exg-trad">
          {row.trad.text}
          {row.trad.note && (
            <sup className="exg-trad__mark" title="Nota de traducción (ver el panel)">
              *
            </sup>
          )}
        </p>
      ) : (
        <span className="exg-gap">La traducción de trabajo aún no cubre este versículo.</span>
      );
    }
    if (id === 'codex') {
      return row.codex ? (
        <GreekText
          verse={row.codex}
          onAnchor={openApparatus}
          onWord={openWord}
          active={selected === row.n}
          interactive={bookMeta?.testament === 'NT'}
        />
      ) : (
        <span className="exg-gap">El Codex no conserva este versículo.</span>
      );
    }
    return row.ntv ? (
      <NtvText verse={row.ntv} onNote={openNote} />
    ) : (
      <span className="exg-gap">La NTV no trae este versículo.</span>
    );
  };

  return (
    <main id="main" className={`exg papel--${theme}${columns >= 3 ? ' exg--cols-3' : ''}`} data-theme={theme}>
      <div className="exg__shell">
        <nav className="breadcrumb exg__crumbs" aria-label="Migas de pan">
          <Link to="/">Inicio</Link>
          <span aria-hidden="true">/</span>
          <Link to="/biblia">Biblia</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">Exégesis comparada</span>
        </nav>

        <header className="exg__head">
          <p className="eyebrow">
            {includeHebreoRows
              ? shown.length > 1
                ? 'Exégesis comparada'
                : 'Texto masorético · WLC / OSHB'
              : chapterHasCodex && chapterHasNtv
                ? 'Exégesis comparada'
                : chapterHasCodex
                  ? 'Codex Sinaiticus'
                  : 'Biblia NTV'}
          </p>
          <h1>
            {includeHebreoRows
              ? shown.includes('codex') && shown.includes('ntv')
                ? 'Hebreo (WLC) × Codex Sinaiticus × NTV'
                : shown.includes('ntv')
                  ? 'Hebreo (WLC) × Nueva Traducción Viviente'
                  : 'Biblia Hebrea (WLC / OSHB)'
              : chapterHasCodex && chapterHasNtv
                ? 'Codex Sinaiticus × Nueva Traducción Viviente'
                : chapterHasCodex && chapterHasTrad
                  ? 'Codex Sinaiticus × traducción de trabajo'
                  : chapterHasCodex
                    ? 'Codex Sinaiticus'
                    : 'Nueva Traducción Viviente'}
          </h1>
          <p className="exg__lead">
            {includeHebreoRows ? (
              shown.length >= 3 ? (
                <>
                  El mismo pasaje leído en tres testigos, versículo a versículo: el texto
                  masorético hebreo y arameo (WLC / OSHB) en lectura RTL, el uncial griego del
                  siglo &nbsp;IV y la Nueva Traducción Viviente.
                </>
              ) : shown.includes('ntv') ? (
                <>
                  El mismo pasaje leído en dos testigos, versículo a versículo: el texto masorético
                  hebreo y arameo (WLC / OSHB) en lectura RTL con tipografía <b>Ezra SIL</b> y la
                  Nueva Traducción Viviente.
                </>
              ) : (
                <>
                  Texto masorético hebreo y arameo del <em>Westminster Leningrad Codex</em> (OSHB)
                  en lectura de derecha a izquierda con tipografía <b>Ezra SIL</b>, arameo señalado
                  palabra por palabra y variantes <em>ketiv / qere</em> visibles.
                </>
              )
            ) : chapterHasCodex && chapterHasNtv ? (
              <>
                El mismo pasaje leído en dos testigos, versículo a versículo: el uncial griego del
                siglo &nbsp;IV, con su aparato crítico, y la traducción al español. Pulsa un versículo
                para seguirlo en las dos columnas, y los sigilos <b>∗</b> o las marcas de nota para
                leer la variante o la nota en su sitio.
              </>
            ) : chapterHasCodex ? (
              <>
                Transcripción diplomática del Codex Sinaiticus, versículo a versículo, con su aparato
                crítico.{' '}
                {hasNtv
                  ? 'Este pasaje solo se conserva en el Codex: la NTV no lo incluye.'
                  : chapterHasTrad
                    ? 'Este libro no forma parte de la NTV: junto al griego se ofrece una traducción de trabajo hecha desde él (borrador, sin revisar).'
                    : 'Este libro no forma parte de la NTV: se ofrece solo el testigo griego.'}
              </>
            ) : (
              <>
                El texto de la Nueva Traducción Viviente, versículo a versículo, con sus notas del
                traductor. El Codex Sinaiticus no conserva este capítulo, así que aquí no hay columna
                griega.
              </>
            )}
          </p>
          <div className="exg__tools" role="group" aria-label="Herramientas de lectura">
            <button
              type="button"
              className="exg-tool"
              onClick={() => openLexicon('')}
              aria-haspopup="dialog"
            >
              <span className="exg-tool__glyph" aria-hidden="true">
                α
              </span>
              <span>Diccionario griego</span>
            </button>
            <Link className="exg-tool exg-tool--guide" to={guiaHref}>
              <span className="exg-tool__glyph" aria-hidden="true">
                Αא
              </span>
              <span>Guía de lectura (griego · hebreo)</span>
            </Link>
          </div>
        </header>

        {!(hebreoSoloForced) && (bookMeta?.notice || (hasNtv && !chapterHasCodex) || (hasCodex && !chapterHasNtv)) && (
          <p className="exg__notice">
            {bookMeta?.notice ||
              (hasNtv && !chapterHasCodex
                ? `El Codex Sinaiticus no conserva ${bookMeta?.name} ${chapterNum}; se muestra la NTV.`
                : chapterHasTrad
                  ? `La NTV no incluye ${hasNtv ? `${bookMeta?.name} ${chapterNum}` : bookMeta?.name}; junto al Codex se muestra una traducción de trabajo hecha desde su griego (borrador, sin revisar).`
                  : hasTrad
                    ? `La NTV no incluye ${hasNtv ? `${bookMeta?.name} ${chapterNum}` : bookMeta?.name}. La traducción de trabajo cubre por ahora ${bookMeta.trad.chapters.length === 1 ? 'el capítulo' : 'los capítulos'} ${bookMeta.trad.chapters.join(', ')}; aquí se muestra solo el Codex.`
                    : `La NTV no incluye ${bookMeta?.name} ${chapterNum}; se muestra solo el Codex.`)}
          </p>
        )}

        {hebreoSoloForced && (
          <p className="exg__notice exg__notice--hebreo" role="note">
            <strong>Numeración masorética:</strong> en {bookMeta?.name} {chapterNum}, la división de
            versículos del hebreo ({hebreoChapter.verses.length} vv.)
            {hebreoChapter.ntvVerseCount
              ? ` difiere de la NTV (${hebreoChapter.ntvVerseCount} vv.)`
              : ' no tiene capítulo equivalente en la NTV'}
            , así que no se fuerza un paralelo versículo a versículo.{' '}
            <Link to={`/biblia/hebreo?libro=${bookId}&cap=${chapterNum}${selected ? `&v=${selected}` : ''}`}>
              Abrir en Biblia Hebrea
            </Link>
            .
          </p>
        )}

        {includeHebreoRows && hebreoChapter?.aramaicVerses > 0 && (
          <p className="exg__notice heb__notice--arc" role="note">
            <strong>Arameo bíblico en este capítulo:</strong> {hebreoChapter.aramaicVerses}{' '}
            {hebreoChapter.aramaicVerses === 1 ? 'versículo' : 'versículos'} ({hebreoChapter.aramaicWords}{' '}
            palabras) marcados palabra por palabra con subrayado punteado.
          </p>
        )}

        {bookMeta && NUMBERING_NOTICE[bookMeta.id] && (chapterHasCodex || includeHebreoRows) && (
          <p className="exg__notice">{NUMBERING_NOTICE[bookMeta.id]}</p>
        )}

        {bookMeta && <BookIntroPanel bookId={bookMeta.id} bookName={bookMeta.name} />}

        {/* ------------------------------- barra ------------------------------- */}
        <div className="reader__bar exg__bar">
          {/* En pantallas estrechas: «Juan 3 ▾» abre selectores y buscador, y ‹ ›
              pasan de capítulo. En anchas no se ven (todo cabe en la fila). */}
          <div className="exg__compact">
            <button
              type="button"
              className="exg__where"
              aria-expanded={navOpen}
              aria-controls="exg-nav"
              onClick={() => setNavOpen(o => !o)}
            >
              <span className="exg__where-text">
                {bookMeta?.name} {chapterNum}
              </span>
              <span className="exg__where-hint">Ir a · buscar</span>
              <span aria-hidden="true">▾</span>
            </button>
            <button
              type="button"
              className="rb-btn rb-btn--icon exg__step"
              onClick={() => stepChapter(-1)}
              disabled={chapterNums.indexOf(chapterNum) <= 0}
              aria-label="Capítulo anterior"
            >
              <span aria-hidden="true">‹</span>
            </button>
            <button
              type="button"
              className="rb-btn rb-btn--icon exg__step"
              onClick={() => stepChapter(1)}
              disabled={chapterNums.indexOf(chapterNum) >= chapterNums.length - 1}
              aria-label="Capítulo siguiente"
            >
              <span aria-hidden="true">›</span>
            </button>
          </div>

          <div className="exg__nav" id="exg-nav" data-open={navOpen ? 'true' : 'false'}>
          <div className="reader__bar-group">
            <div className="exg__select">
              <label htmlFor="exg-book">Libro</label>
              <select
                id="exg-book"
                value={bookId}
                onChange={event => goto({ bookId: event.target.value, chapter: 1, range: '' }, true)}
              >
                <optgroup label={`Antiguo Testamento (${OT_BOOKS.length})`}>
                  {index.data.books
                    .filter(b => b.testament === 'AT' && b.ntv.verses)
                    .map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                </optgroup>
                <optgroup label={`Nuevo Testamento (${NT_BOOKS.length})`}>
                  {index.data.books
                    .filter(b => b.testament === 'NT' && b.ntv.verses)
                    .map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                </optgroup>
                <optgroup
                  label={`Solo en el Codex (${index.data.books.filter(b => b.codexOnly && b.codex.verses).length})`}
                >
                  {index.data.books
                    .filter(b => b.codexOnly && b.codex.verses)
                    .map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                </optgroup>
              </select>
            </div>
            <div className="exg__select">
              <label htmlFor="exg-chapter">Cap.</label>
              <select
                id="exg-chapter"
                value={chapterNum}
                onChange={event => goto({ chapter: Number(event.target.value), range: '' }, true)}
              >
                {chapterNums.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="exg__select">
              <label htmlFor="exg-range">vv.</label>
              <select
                id="exg-range"
                value={range.id}
                onChange={event => goto({ range: event.target.value }, true)}
                disabled={ranges.length < 2}
              >
                {ranges.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="exg__select">
              <label htmlFor="exg-verse">Versículo</label>
              <select
                id="exg-verse"
                value={selected ?? ''}
                onChange={event => select(Number(event.target.value))}
                disabled={!verseNumbers.length}
              >
                <option value="" disabled>
                  Ir a…
                </option>
                {verseNumbers.map(n => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <BibleSearch
            id="exg-search"
            localRecords={searchRecords}
            scopeLabel={`${bookMeta?.name || ''} (libro abierto)`}
            testament={bookMeta?.testament || 'NT'}
            includeCodexOnly
            onPick={record => {
              const q = new URLSearchParams(params);
              q.set('libro', record.bookId);
              q.set('cap', String(record.chapter));
              if (!HEBREW_BOOK_BY_ID.has(record.bookId)) {
                q.delete('hebreo');
                if (q.get('modo') === 'hebreo') q.delete('modo');
              }
              q.delete('vv');
              q.set('v', String(record.verse));
              setPop(null);
              setNavOpen(false);
              setParams(q);
            }}
          />
          </div>

          <div className="reader__bar-group exg__modes-bar">
            {hebreoToggleButton}
            <div className="exg__modes" role="group" aria-label="Columnas que se ven">
              {modeButtons}
            </div>
          </div>

          <ReaderMenu>
            {hasHebreo && <div className="exg__heb-menu">{hebreoToggleButton}</div>}
            <div className="exg__modes exg__modes--menu" role="group" aria-label="Columnas que se ven">
              {modeButtons}
            </div>
            <div className="reader__size" role="group" aria-label="Tamaño de letra">
              <button
                type="button"
                className="rb-btn rb-btn--icon"
                onClick={() => setSize(s => Math.max(FS_MIN, s - 1))}
                disabled={size <= FS_MIN}
                aria-label="Reducir el tamaño de letra: A−"
              >
                A−
              </button>
              <button
                type="button"
                className="rb-btn rb-btn--icon"
                onClick={() => setSize(s => Math.min(FS_MAX, s + 1))}
                disabled={size >= FS_MAX}
                aria-label="Aumentar el tamaño de letra: A+"
              >
                A+
              </button>
            </div>
            <button
              type="button"
              className="rb-btn"
              onClick={cycleTheme}
              aria-label={`Tema del papel: ${themeDef.label}. Cambiar`}
            >
              <span aria-hidden="true">{themeDef.glyph}</span>
              <span className="rmenu__text">{themeDef.label}</span>
            </button>
            {includeHebreoRows && (
              <>
                <button
                  type="button"
                  className="rb-btn"
                  aria-pressed={showCantillation}
                  disabled={!showVowels}
                  onClick={() => setShowCantillation(v => !v)}
                >
                  <span aria-hidden="true">{showCantillation && showVowels ? '☑' : '☐'}</span>
                  <span className="rmenu__text">Cantilación (te&apos;amim)</span>
                </button>
                <button
                  type="button"
                  className="rb-btn"
                  aria-pressed={showVowels}
                  onClick={() => setShowVowels(v => !v)}
                >
                  <span aria-hidden="true">{showVowels ? '☑' : '☐'}</span>
                  <span className="rmenu__text">Vocales (niqqud)</span>
                </button>
              </>
            )}
            <button
              type="button"
              className="rb-btn"
              onClick={() => openLexicon('')}
              title="Diccionario griego → español"
              aria-haspopup="dialog"
            >
              <span aria-hidden="true">α</span>
              <span className="rmenu__text">Diccionario</span>
            </button>
            <Link className="rb-btn" to={guiaHref} title="Guía didáctica para leer griego, hebreo y arameo">
              <span aria-hidden="true">Αא</span>
              <span className="rmenu__text">Guía de lectura</span>
            </Link>
            {facsimile && (
              <a
                className="rb-btn"
                href={facsimile}
                target="_blank"
                rel="noopener noreferrer"
                title="Facsímil del Codex Sinaiticus en codexsinaiticus.org"
              >
                <span aria-hidden="true">↗</span>
                <span className="rmenu__text">Facsímil</span>
              </a>
            )}
          </ReaderMenu>
        </div>

        {/* ------------------------------ testigos ----------------------------- */}
        <div className="exg__witness">
          {includeHebreoRows && (
            <span className="exg-chip">
              א <b>Hebreo (WLC / OSHB)</b> · texto masorético RTL · Ezra SIL
            </span>
          )}
          {!hebreoSoloForced && chapterHasCodex && (
            <span className="exg-chip">
              📜 <b>Codex Sinaiticus</b> · s. IV · uncial griego
            </span>
          )}
          {!hebreoSoloForced && chapterHasCodex && codexChapter?.folio && (
            <span className="exg-chip">
              Cuaderno <b>{codexChapter.quire}</b> · folio <b>{codexChapter.folio}{codexChapter.side}</b>
              {codexChapter.library ? ` · ${codexChapter.library}` : ''}
              {codexChapter.scribe ? ` · escriba ${codexChapter.scribe}` : ''}
            </span>
          )}
          {!hebreoSoloForced && chapterHasNtv && (
            <span className="exg-chip">
              NTV · <b>Nueva Traducción Viviente</b> (es)
            </span>
          )}
          {!hebreoSoloForced && chapterHasTrad && (
            <span className="exg-chip">
              Trad · <b>traducción de trabajo</b> (es) · borrador
            </span>
          )}
          {!hebreoSoloForced && !chapterHasNtv && chapterHasCodex && !chapterHasTrad && (
            <span className="exg-chip">Solo Codex · pasaje no incluido en la NTV</span>
          )}
        </div>

        {/* ------------------------------- rejilla ----------------------------- */}
        {loading ? (
          <div className="exg__loading">
            <div className="loader-pulse" role="status" aria-label="Cargando">
              <span />
              <span />
              <span />
            </div>
            <p className="muted">Abriendo los testigos…</p>
          </div>
        ) : rows.length === 0 ? (
          <p className="exg-empty">Este pasaje no está en ninguno de los dos testigos.</p>
        ) : (
          <section className={`exg-grid exg-grid--${columns}`} style={{ '--exg-fs': `${size}px` }} aria-label="Lectura paralela por versículo">
            <div className="exg-grid__body" ref={gridRef}>
              <header className="exg-grid__head">
                <div className="exg-grid__gutter" aria-hidden="true" />
                {shown.map(id => (
                  <div key={id} className={`exg-grid__witness exg-grid__witness--${id}`}>
                    {renderHead(id)}
                  </div>
                ))}
              </header>

              {rows.map(row =>
                row.kind === 'section' ? (
                  <p className="exg-grid__section" key={row.key}>
                    <NtvInline text={row.title} verse={row.verse || 1} onNote={openNote} />
                  </p>
                ) : (
                  <div
                    key={row.n}
                    data-v={row.n}
                    className={`exg-row${selected === row.n ? ' is-active' : ''}`}
                    onClick={() => {
                      // Marcar texto con el ratón termina en un clic sobre la
                      // fila: si hay selección viva, no fijamos ni movemos nada.
                      if (!hasSelection()) select(row.n);
                    }}
                  >
                    <div className="exg-row__gutter">
                      <button
                        type="button"
                        className="exg-row__n"
                        aria-label={`Versículo ${row.n}`}
                        onClick={event => {
                          event.stopPropagation();
                          select(row.n);
                        }}
                      >
                        {row.n}
                      </button>
                      <span className="exg-row__marks">
                        {includeHebreoRows && row.hebreo?.ar > 0 ? (
                          <span className="heb-mark heb-mark--arc" title="Contiene arameo bíblico">
                            אר
                          </span>
                        ) : null}
                        {includeHebreoRows && row.hebreo?.kq > 0 ? (
                          <span className="heb-mark heb-mark--kq" title="Contiene ketiv/qere">
                            ק
                          </span>
                        ) : null}
                        {row.codex?.apparatus?.length ? (
                          <span
                            className="exg-mark-chip exg-mark-chip--codex"
                            title={`${row.codex.apparatus.length} variantes en el aparato crítico`}
                          >
                            ◆
                          </span>
                        ) : null}
                        {row.ntv?.notes?.length ? (
                          <span
                            className="exg-mark-chip exg-mark-chip--ntv"
                            title={`${row.ntv.notes.length} notas del traductor`}
                          >
                            †
                          </span>
                        ) : null}
                      </span>
                    </div>

                    {shown.map(id => (
                      <div key={id} className={`exg-row__cell exg-row__cell--${id}`}>
                        <span className="exg-cell__tag" aria-hidden="true">
                          {COLUMNS.find(c => c.id === id).short}
                        </span>
                        {renderCell(id, row)}
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </section>
        )}

        {/* ------------------------------ paneles ------------------------------ */}
        {!loading &&
          rows.length > 0 &&
          (!soloHebreoMode || hebreoAligned) &&
          (chapterHasCodex || chapterHasNtv || chapterHasTrad) && (
          <div
            className={`exg__panels${[chapterHasCodex, chapterHasNtv, chapterHasTrad].filter(Boolean).length > 1 ? '' : ' exg__panels--one'}`}
          >
            {chapterHasCodex && (
            <section className="exg-panel" aria-label="Aparato crítico">
              <h2>
                <span>Aparato crítico · Codex</span>
                <span className="exg-panel__hint">
                  {apparatusRows.length} {apparatusRows.length === 1 ? 'variante' : 'variantes'} en este pasaje
                </span>
              </h2>
              {apparatusRows.length === 0 ? (
                <p className="exg-empty">Sin variantes registradas en este pasaje.</p>
              ) : (
                <ol className="exg-notes">
                  {apparatusRows.map(row => {
                    const marked =
                      pop?.kind === 'apparatus' && pop.verse === row.verse && row.index >= pop.index && row.index < pop.end;
                    const active = selected === row.verse;
                    return (
                      <li
                        key={`${row.verse}.${row.index}`}
                        className={`exg-note${active ? ' is-active' : ''}${marked ? ' is-marked' : ''}`}
                      >
                        <button type="button" className="exg-note__ref" onClick={() => select(row.verse)}>
                          {row.verse}
                        </button>
                        <div>
                          <span className="exg-witness">{witnessLabel(row.w)}</span>{' '}
                          {row.t === 'omitted' ? <em>omite</em> : <span className="exg-variant">{row.t}</span>}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
              <div className="exg-sigla">
                {siglas.map(s => (
                  <span key={s.sigla} title={s.note || ''}>
                    <b>{s.sigla}</b> {s.label}
                  </span>
                ))}
                <span>
                  <b>omite</b> no está en ese testigo
                </span>
                <span className="exg-sigla__src">
                  Siglas y manos según la{' '}
                  <a href={WITNESS_SOURCE} target="_blank" rel="noopener noreferrer">
                    tabla del proyecto
                  </a>
                  .
                </span>
              </div>
            </section>
            )}

            {chapterHasTrad && (
            <section className="exg-panel" aria-label="Notas de la traducción de trabajo">
              <h2>
                <span>Notas de la traducción · borrador</span>
                <span className="exg-panel__hint">
                  {tradNoteRows.length} {tradNoteRows.length === 1 ? 'nota' : 'notas'} en este pasaje
                </span>
              </h2>
              {tradNoteRows.length === 0 ? (
                <p className="exg-empty">Este pasaje no tiene notas de traducción.</p>
              ) : (
                <ol className="exg-notes">
                  {tradNoteRows.map(row => (
                    <li key={row.verse} className={`exg-note${selected === row.verse ? ' is-active' : ''}`}>
                      <button type="button" className="exg-note__ref" onClick={() => select(row.verse)}>
                        {row.verse}
                      </button>
                      <div>{row.text}</div>
                    </li>
                  ))}
                </ol>
              )}
              <p className="exg-trad__about">
                Traducción de trabajo del proyecto Crux desde la transcripción del Codex Sinaiticus.
                Explica decisiones; no traduce el aparato crítico. Estado: {trad?.status || 'borrador'}.
              </p>
            </section>
            )}

            {chapterHasNtv && (
            <section className="exg-panel" aria-label="Notas de la NTV">
              <h2>
                <span>Notas de la NTV</span>
                <span className="exg-panel__hint">
                  {noteRows.length} {noteRows.length === 1 ? 'nota' : 'notas'} en este pasaje
                </span>
              </h2>
              {noteRows.length === 0 ? (
                <p className="exg-empty">Este pasaje no tiene notas del traductor.</p>
              ) : (
                <ol className="exg-notes">
                  {noteRows.map(row => (
                    <li
                      key={`${row.verse}.${row.id}`}
                      className={`exg-note${selected === row.verse ? ' is-active' : ''}${
                        pop?.kind === 'note' && pop.verse === row.verse && pop.id === row.id ? ' is-marked' : ''
                      }`}
                    >
                      <button
                        type="button"
                        className="exg-note__ref exg-note__ref--fn"
                        onClick={() => select(row.verse)}
                      >
                        {row.id}
                      </button>
                      <div>
                        <b>
                          {bookMeta?.abbr} {chapterNum}:{row.verse}
                        </b>{' '}
                        {row.text}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>
            )}
          </div>
        )}

        <BibleCta
          exclude="exegesis"
          passage={`${bookMeta?.name} ${chapterNum}${selected ? `:${selected}` : ''}`}
          title={
            chapterHasNtv
              ? hasHebreo
                ? 'El mismo pasaje, en los otros tres lectores'
                : 'El mismo pasaje, en los otros dos lectores'
              : 'El mismo pasaje, en el otro lector'
          }
        />

        <footer className="exg__credits">
          <p>
            <strong>Codex Sinaiticus:</strong> transcripción del{' '}
            <a href="https://www.codexsinaiticus.org/" target="_blank" rel="noopener noreferrer">
              Codex Sinaiticus Project
            </a>
            , propiedad de la British Library, la Universidad de Leipzig, el Monasterio de Santa
            Catalina (Sinaí) y la Biblioteca Nacional de Rusia. Uso personal, educativo y no
            comercial, con atribución.
          </p>
          <p className="exg__license">{WITNESS_ATTRIBUTION}</p>
          <p>
            <strong>NTV:</strong> Nueva Traducción Viviente, con sus notas del traductor.
          </p>
          {hasHebreo && (
            <p>
              <strong>Biblia Hebrea (WLC / OSHB):</strong> texto hebreo y arameo base del{' '}
              <em>Westminster Leningrad Codex</em> (dominio público); marcado OSIS, arameo palabra
              por palabra, <em>ketiv / qere</em> y mapa de versificación de{' '}
              <a href={HEBREW_SOURCE_URL} target="_blank" rel="noopener noreferrer">
                Open Scriptures Hebrew Bible
              </a>{' '}
              (
              <a href={HEBREW_LICENSE_URL} target="_blank" rel="noopener noreferrer">
                CC BY 4.0
              </a>
              ). Tipografía{' '}
              <a href={EZRA_SIL_URL} target="_blank" rel="noopener noreferrer">
                Ezra SIL 2.51
              </a>{' '}
              (SIL Open Font License 1.1), conservando el texto Unicode masorético sin normalizar
              (sin NFC/NFD).
            </p>
          )}
          {hasTrad && (
            <p>
              <strong>Traducción de trabajo · Borrador:</strong> traducción española de {bookMeta?.name}{' '}
              hecha por el proyecto Crux desde el griego del Codex Sinaiticus. Es una obra derivada de su
              transcripción y se distribuye con la misma licencia (CC BY-NC-SA 3.0), con uso no comercial.
              No es la NTV ni una traducción oficial; está pendiente de revisión.
            </p>
          )}
        </footer>

        <p className="exg__hint">
          Pulsa un versículo para fijarlo · <b>∗</b> abre la variante · un número en azul abre la nota
          del traductor
          {includeHebreoRows ? ' · un ketiv/qere abre su explicación masorética' : ''}
        </p>
      </div>

      {pop?.kind === 'kq' && (
        <VersePopover
          anchor={pop.anchor}
          label={`Ketiv / Qere · ${bookMeta?.name} ${chapterNum}:${pop.verse}`}
          onClose={() => setPop(null)}
        >
          <KetivQereBody
            ketiv={pop.ketiv}
            qere={pop.qere}
            aramaic={pop.aramaic}
            reference={`${bookMeta?.name} ${chapterNum}:${pop.verse}`}
          />
        </VersePopover>
      )}

      {pop?.kind === 'apparatus' && (
        <VersePopover
          anchor={pop.anchor}
          label={`Aparato crítico · ${bookMeta?.abbr} ${chapterNum}:${pop.verse}`}
          onClose={() => setPop(null)}
        >
          <ApparatusBody
            entries={visibleCodex.find(v => v.n === pop.verse)?.apparatus || []}
            start={pop.index}
            end={pop.end}
          />
        </VersePopover>
      )}

      {pop?.kind === 'note' && (
        <VersePopover
          anchor={pop.anchor}
          label={`Nota ${pop.id} · ${bookMeta?.abbr} ${chapterNum}:${pop.verse}`}
          onClose={() => setPop(null)}
        >
          <NoteBody
            note={ntv?.notes?.[pop.id]}
            reference={`${bookMeta?.name} ${chapterNum}:${pop.verse} · nota ${pop.id}`}
          />
        </VersePopover>
      )}

      {pop?.kind === 'word' && (
        <VersePopover
          anchor={pop.anchor}
          label={`Palabra · ${bookMeta?.abbr} ${chapterNum}:${pop.verse}`}
          onClose={() => setPop(null)}
        >
          <LexiconBody
            morphemes={pop.morphemes}
            entry={wordEntry}
            baseEntry={wordBaseEntry}
            loading={
              lexiconStatus === 'loading' ||
              (Boolean(wordPrimaryStrong) && !wordEntry && lexiconBaseStatus === 'loading')
            }
            token={pop.token}
            reference={`${bookMeta?.name} ${chapterNum}:${pop.verse}`}
            onOpenDictionary={() => openLexicon(wordPrimaryStrong || '')}
          />
        </VersePopover>
      )}

      {dicOpen && (
        <LexiconPanel
          lexicon={lexicon}
          loading={lexiconStatus === 'loading' || lexiconStatus === 'idle'}
          error={lexiconStatus === 'error'}
          value={dicValue}
          onSelect={openLexicon}
          onGoToVerse={goToVerseFromLexicon}
          onClose={closeLexicon}
        />
      )}
    </main>
  );
}
