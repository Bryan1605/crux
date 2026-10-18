import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import BibleSearch from '../components/BibleSearch';
import BibleCta from '../components/BibleCta';
import VersePopover, { ApparatusBody, NoteBody } from '../components/VersePopover';
import { WITNESS_ATTRIBUTION, WITNESS_SOURCE, witnessLabel, witnessLegend } from '../data/exegesis';
import { buildRecords } from '../lib/bibleSearch';
import { loadExegesisIndex, loadWitnessBook } from '../lib/exegesisTexts';
import { useSeo } from '../lib/site';

import './Biblia.css';
import './Exegesis.css';

/* -------------------------------------------------------------------------- */
/* Preferencias y constantes                                                  */
/* -------------------------------------------------------------------------- */

const FS_MIN = 14;
const FS_MAX = 26;
const KEYS = {
  size: 'crux.exegesis.letra',
  theme: 'crux.exegesis.papel',
  mode: 'crux.exegesis.columnas'
};

const THEMES = [
  { id: 'claro', label: 'Papel claro', glyph: '☀' },
  { id: 'sepia', label: 'Papel sepia', glyph: '◐' },
  { id: 'noche', label: 'Papel nocturno', glyph: '☾' }
];

/**
 * Columnas que se pueden ver. `short` es lo que se lee en el botón y tiene que
 * aparecer en `label`: el nombre accesible debe contener el texto visible
 * (axioma de `label-content-name-mismatch`).
 */
const MODES = [
  { id: 'paralelo', label: 'Las dos columnas, versículo a versículo', short: null },
  { id: 'codex', label: 'Solo el Codex Sinaiticus', short: 'Codex' },
  { id: 'ntv', label: 'Solo la NTV · Nueva Traducción Viviente', short: 'NTV' }
];

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

/** Migra el antiguo `dos`/`uno` a los modos actuales. */
const readMode = () => {
  const stored = read(KEYS.mode, 'paralelo');
  if (stored === 'dos') return 'paralelo';
  if (stored === 'uno') return 'codex';
  return MODES.some(m => m.id === stored) ? stored : 'paralelo';
};

/* -------------------------------------------------------------------------- */
/* Iconos                                                                     */
/* -------------------------------------------------------------------------- */

/** Icono del conmutador de columnas: un rectángulo con (o sin) divisoria. */
function LayoutGlyph({ two }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <rect x="1" y="2" width="14" height="12" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
      {two ? <line x1="8" y1="2" x2="8" y2="14" stroke="currentColor" strokeWidth="1.3" /> : null}
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Troceado del griego y de la NTV                                            */
/* -------------------------------------------------------------------------- */

const NS_OPEN = '\u2039';
const NS_CLOSE = '\u203A';
const SIGIL = '\u00a7';

/**
 * Convierte el griego del Codex en nodos:
 *   { k:'t' } texto · { k:'ns' } nomina sacra · { k:'sigil' } ancla del aparato
 *   { k:'mark' } marca de la transcripción (no es una letra)
 */
function tokenizeGreek(text) {
  const out = [];
  let buf = '';
  let i = 0;
  const flush = () => {
    if (buf) out.push({ k: 't', v: buf });
    buf = '';
  };
  while (i < text.length) {
    const ch = text[i];
    if (ch === NS_OPEN) {
      const end = text.indexOf(NS_CLOSE, i + 1);
      const value = text.slice(i + 1, end < 0 ? text.length : end);
      flush();
      out.push({ k: 'ns', v: value });
      i = end < 0 ? text.length : end + 1;
    } else if (ch === SIGIL) {
      let j = i + 1;
      while (j < text.length && text[j] >= '0' && text[j] <= '9') j += 1;
      flush();
      out.push({ k: 'sigil', v: text.slice(i + 1, j) });
      i = j;
    } else if (ch === '>') {
      // El proyecto marca así un punto de la transcripción: no es una letra.
      flush();
      out.push({ k: 'mark', v: ch });
      i += 1;
    } else {
      buf += ch;
      i += 1;
    }
  }
  flush();
  return out;
}

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

/** Índices (en el aparato) de las anclas que lleva un versículo griego. */
const anchorIndexes = grc =>
  tokenizeGreek(grc)
    .filter(t => t.k === 'sigil')
    .map(t => Number(t.v));

/* -------------------------------------------------------------------------- */
/* Celdas de la rejilla                                                       */
/* -------------------------------------------------------------------------- */

function GreekText({ verse, onAnchor }) {
  const tokens = useMemo(() => tokenizeGreek(verse.grc), [verse.grc]);
  return (
    <>
      {tokens.map((t, i) => {
        if (t.k === 'ns') {
          return (
            <i key={i} className="exg-ns">
              {t.v}
            </i>
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
  const [codex, setCodex] = useState(null);

  const [theme, setTheme] = useState(() => {
    const stored = read(KEYS.theme, 'claro');
    return THEMES.some(t => t.id === stored) ? stored : 'claro';
  });
  const [size, setSize] = useState(() => Number(read(KEYS.size, 19)));
  const [mode, setMode] = useState(readMode);
  const [pop, setPop] = useState(null);

  const gridRef = useRef(null);
  const chapterKey = useRef('');

  const bookId = params.get('libro') || 'juan';
  const chapterNum = Number(params.get('cap') || 3);
  const rangeParam = params.get('vv') || '';
  const selected = Number(params.get('v')) || null;

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

  const bookMeta = useMemo(
    () => (index.data ? index.data.books.find(b => b.id === bookId) || index.data.books[0] : null),
    [index.data, bookId]
  );

  /* ------------------------------- testigos ------------------------------- */

  useEffect(() => {
    let alive = true;
    setNtv(null);
    loadWitnessBook('ntv', bookId)
      .then(data => alive && setNtv(data))
      .catch(() => alive && setNtv({ error: true }));
    return () => {
      alive = false;
    };
  }, [bookId]);

  useEffect(() => {
    let alive = true;
    setCodex(undefined);
    loadWitnessBook('codex', bookId)
      .then(data => alive && setCodex(data))
      .catch(() => alive && setCodex(null));
    return () => {
      alive = false;
    };
  }, [bookId]);

  const ntvChapter = useMemo(
    () => (ntv && !ntv.error ? ntv.chapters.find(c => c.num === chapterNum) || null : null),
    [ntv, chapterNum]
  );

  const codexChapter = useMemo(
    () => (codex ? codex.chapters.find(c => c.num === chapterNum) || null : null),
    [codex, chapterNum]
  );

  const loading = !ntv || (codex === undefined && Boolean(bookMeta?.codex.verses));

  /* ------------------------------- rangos --------------------------------- */

  const chapterVerseMax = useMemo(() => {
    const fromNtv = ntvChapter ? ntvChapter.verses.reduce((a, v) => Math.max(a, v.n), 0) : 0;
    const fromCodex = codexChapter ? codexChapter.verses.reduce((a, v) => Math.max(a, v.n), 0) : 0;
    return Math.max(fromNtv, fromCodex);
  }, [ntvChapter, codexChapter]);

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

  const visibleNtv = useMemo(
    () => (ntvChapter ? ntvChapter.verses.filter(v => v.n >= range.from && v.n <= range.to) : []),
    [ntvChapter, range]
  );
  const visibleCodex = useMemo(
    () => (codexChapter ? codexChapter.verses.filter(v => v.n >= range.from && v.n <= range.to) : []),
    [codexChapter, range]
  );

  /**
   * Filas de la rejilla: una por versículo (el que falte en un testigo queda con
   * el hueco marcado) y una por título de sección, en su sitio.
   */
  const rows = useMemo(() => {
    const codexByN = new Map(visibleCodex.map(v => [v.n, v]));
    const ntvByN = new Map(visibleNtv.map(v => [v.n, v]));
    const numbers = [...new Set([...codexByN.keys(), ...ntvByN.keys()])].sort((a, b) => a - b);
    const sections = new Map();
    for (const section of ntvChapter?.sections || []) {
      if (!sections.has(section.verse)) sections.set(section.verse, []);
      sections.get(section.verse).push(section.title);
    }
    const list = [];
    for (const n of numbers) {
      for (const title of sections.get(n) || []) list.push({ kind: 'section', key: `s-${n}-${title}`, title, verse: n });
      list.push({ kind: 'verse', n, codex: codexByN.get(n) || null, ntv: ntvByN.get(n) || null });
    }
    return list;
  }, [visibleCodex, visibleNtv, ntvChapter]);

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

  const themeDef = THEMES.find(t => t.id === theme) || THEMES[0];
  const cycleTheme = () =>
    setTheme(current => THEMES[(THEMES.findIndex(t => t.id === current) + 1) % THEMES.length].id);

  /* ------------------------- navegación por URL --------------------------- */

  const goto = useCallback(
    (next, push = false) => {
      const q = new URLSearchParams(params);
      if (next.bookId) q.set('libro', next.bookId);
      if (next.chapter) q.set('cap', String(next.chapter));
      if (next.range !== undefined) q.set('vv', next.range);
      else q.delete('vv');
      q.delete('v');
      setPop(null);
      setParams(q, { replace: !push });
    },
    [params, setParams]
  );

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
    if (!ntv || ntv.error || !ntv.chapters.length) return;
    if (!ntv.chapters.some(c => c.num === chapterNum)) goto({ chapter: ntv.chapters[0].num, range: '' }, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ntv, chapterNum]);

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
    const top = row.offsetTop - 8;
    const bottom = top + row.offsetHeight;
    if (top >= body.scrollTop - 2 && bottom <= body.scrollTop + body.clientHeight) return;
    body.scrollTo({ top: Math.max(0, top), behavior: prefersReduced() ? 'auto' : 'smooth' });
  }, [loading, selected, bookId, chapterNum, range.id, rows]);

  /* --------------------------------- SEO ---------------------------------- */

  const seoTitle = bookMeta
    ? `Exégesis · ${bookMeta.name} ${chapterNum} — Codex Sinaiticus y NTV`
    : 'Exégesis comparada — Codex Sinaiticus y NTV';

  useSeo({
    title: seoTitle,
    description:
      'Lectura paralela del Nuevo Testamento, versículo a versículo: la transcripción del Codex Sinaiticus con su aparato crítico frente a la Nueva Traducción Viviente.'
  });

  /* ------------------------------ facsímil -------------------------------- */

  const facsimile = bookMeta
    ? `https://www.codexsinaiticus.org/en/manuscript.aspx?book=${bookMeta.codexNo}&chapter=${chapterNum}&verse=${selected || range.from || 1}`
    : 'https://www.codexsinaiticus.org/';

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

  const modeDef = MODES.find(m => m.id === mode) || MODES[0];
  const showCodex = mode !== 'ntv';
  const showNtv = mode !== 'codex';
  const columns = [showCodex, showNtv].filter(Boolean).length;

  return (
    <main id="main" className={`exg papel--${theme}`} data-theme={theme}>
      <div className="exg__shell">
        <nav className="breadcrumb exg__crumbs" aria-label="Migas de pan">
          <Link to="/">Inicio</Link>
          <span aria-hidden="true">/</span>
          <Link to="/biblia">Biblia</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">Exégesis comparada</span>
        </nav>

        <header className="exg__head">
          <p className="eyebrow">Exégesis comparada</p>
          <h1>Codex Sinaiticus × Nueva Traducción Viviente</h1>
          <p className="exg__lead">
            El mismo pasaje leído en dos testigos, versículo a versículo: el uncial griego del siglo
            &nbsp;IV, con su aparato crítico, y la traducción al español. Pulsa un versículo para
            seguirlo en las dos columnas, y los sigilos <b>∗</b> o las marcas de nota para leer la
            variante o la nota en su sitio.
          </p>
        </header>

        {/* ------------------------------- barra ------------------------------- */}
        <div className="reader__bar exg__bar">
          <div className="reader__bar-group">
            <div className="exg__select">
              <label htmlFor="exg-book">Libro</label>
              <select
                id="exg-book"
                value={bookId}
                onChange={event => goto({ bookId: event.target.value, chapter: 1, range: '' }, true)}
              >
                {index.data.books.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="exg__select">
              <label htmlFor="exg-chapter">Cap.</label>
              <select
                id="exg-chapter"
                value={chapterNum}
                onChange={event => goto({ chapter: Number(event.target.value), range: '' }, true)}
              >
                {(ntv?.chapters?.length ? ntv.chapters.map(c => c.num) : bookMeta?.codex.chapters || []).map(c => (
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
            onPick={record => {
              const q = new URLSearchParams(params);
              q.set('libro', record.bookId);
              q.set('cap', String(record.chapter));
              q.delete('vv');
              q.set('v', String(record.verse));
              setPop(null);
              setParams(q);
            }}
          />

          <div className="reader__bar-group">
            <div className="exg__modes" role="group" aria-label="Columnas que se ven">
              {MODES.map(m => (
                <button
                  key={m.id}
                  type="button"
                  className={`rb-btn rb-btn--icon${mode === m.id ? ' is-active' : ''}`}
                  aria-pressed={mode === m.id}
                  title={m.label}
                  aria-label={m.label}
                  onClick={() => setMode(m.id)}
                >
                  {m.id === 'paralelo' ? <LayoutGlyph two /> : m.short}
                </button>
              ))}
            </div>
          </div>

          <div className="reader__bar-group">
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
              className="rb-btn rb-btn--icon"
              onClick={cycleTheme}
              title={themeDef.label}
              aria-label={`Tema del papel: ${themeDef.label}. Cambiar`}
            >
              {themeDef.glyph}
            </button>
            <a
              className="rb-btn"
              href={facsimile}
              target="_blank"
              rel="noopener noreferrer"
              title="Facsímil del Codex Sinaiticus en codexsinaiticus.org"
            >
              <span className="rb-btn__text">Facsímil</span>
              <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>

        {/* ------------------------------ testigos ----------------------------- */}
        <div className="exg__witness">
          <span className="exg-chip">
            📜 <b>Codex Sinaiticus</b> · s. IV · uncial griego
          </span>
          {codexChapter?.folio && (
            <span className="exg-chip">
              Cuaderno <b>{codexChapter.quire}</b> · folio <b>{codexChapter.folio}{codexChapter.side}</b>
              {codexChapter.library ? ` · ${codexChapter.library}` : ''}
              {codexChapter.scribe ? ` · escriba ${codexChapter.scribe}` : ''}
            </span>
          )}
          <span className="exg-chip">
            NTV · <b>Nueva Traducción Viviente</b> (es)
          </span>
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
            <header className="exg-grid__head">
              <div className="exg-grid__gutter" aria-hidden="true" />
              {showCodex && (
                <div className="exg-grid__witness exg-grid__witness--codex">
                  <b>Codex Sinaiticus</b>
                  <span>
                    Transcripción diplomática
                    {codexChapter?.folio ? ` · f. ${codexChapter.folio}${codexChapter.side}` : ''} · la
                    sobrelínea marca los <i>nomina sacra</i>
                  </span>
                </div>
              )}
              {showNtv && (
                <div className="exg-grid__witness exg-grid__witness--ntv">
                  <b>Nueva Traducción Viviente</b>
                  <span>
                    {bookMeta?.name} {chapterNum}:{range.from}–{range.to} · notas del traductor en
                    superíndice
                  </span>
                </div>
              )}
            </header>

            <div className="exg-grid__body" ref={gridRef}>
              {rows.map(row =>
                row.kind === 'section' ? (
                  <p className="exg-grid__section" key={row.key}>
                    {row.title}
                  </p>
                ) : (
                  <div
                    key={row.n}
                    data-v={row.n}
                    className={`exg-row${selected === row.n ? ' is-active' : ''}`}
                    onClick={() => select(row.n)}
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

                    {showCodex && (
                      <div className="exg-row__cell exg-row__cell--codex">
                        <span className="exg-cell__tag" aria-hidden="true">
                          Codex
                        </span>
                        {row.codex ? (
                          <GreekText verse={row.codex} onAnchor={openApparatus} />
                        ) : (
                          <span className="exg-gap">El Codex no conserva este versículo.</span>
                        )}
                      </div>
                    )}

                    {showNtv && (
                      <div className="exg-row__cell exg-row__cell--ntv">
                        <span className="exg-cell__tag" aria-hidden="true">
                          NTV
                        </span>
                        {row.ntv ? (
                          <NtvText verse={row.ntv} onNote={openNote} />
                        ) : (
                          <span className="exg-gap">La NTV no trae este versículo.</span>
                        )}
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          </section>
        )}

        {/* ------------------------------ paneles ------------------------------ */}
        {!loading && rows.length > 0 && (
          <div className="exg__panels">
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
          </div>
        )}

        <BibleCta
          exclude="exegesis"
          passage={`${bookMeta?.name} ${chapterNum}${selected ? `:${selected}` : ''}`}
          title="El mismo pasaje, en los otros dos lectores"
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
        </footer>

        <p className="exg__hint">
          Pulsa un versículo para fijarlo · <b>∗</b> abre la variante · un número en azul abre la nota
          del traductor
        </p>
      </div>

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
    </main>
  );
}
