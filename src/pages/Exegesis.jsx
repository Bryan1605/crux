import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { loadExegesisIndex, loadWitnessBook } from '../lib/exegesisTexts';
import { witnessLabel } from '../data/exegesis';
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
  cols: 'crux.exegesis.columnas'
};

const THEMES = [
  { id: 'claro', label: 'Papel claro', glyph: '☀' },
  { id: 'sepia', label: 'Papel sepia', glyph: '◐' },
  { id: 'noche', label: 'Papel nocturno', glyph: '☾' }
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
/* Troceado del griego y de las notas                                         */
/* -------------------------------------------------------------------------- */

const NS_OPEN = '\u2039';
const NS_CLOSE = '\u203A';
const SIGIL = '\u00a7';

/**
 * Convierte el griego del Codex en nodos de React-friendly:
 *   { k:'t' } texto · { k:'ns' } nomina sacra (sobrelínea) · { k:'sigil' } ancla del aparato
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

/** Índices de arranque de las anclas del aparato dentro de un versículo. */
function anchorStarts(tokens) {
  return tokens.filter(t => t.k === 'sigil').map(t => Number(t.v));
}

/* -------------------------------------------------------------------------- */
/* Subcomponentes                                                             */
/* -------------------------------------------------------------------------- */

function GreekVerse({ verse, active, onSelect, onAnchor }) {
  const tokens = useMemo(() => tokenizeGreek(verse.grc), [verse.grc]);
  return (
    <div className={`exg-verse${active ? ' is-active' : ''}`} onClick={() => onSelect(verse.n)}>
      <div className="exg-verse__n">{verse.n}</div>
      <div className="exg-verse__text">
        {tokens.map((t, i) => {
          if (t.k === 'ns') return <i key={i} className="exg-ns">{t.v}</i>;
          if (t.k === 'sigil')
            return (
              <button
                key={i}
                type="button"
                className="exg-sigil"
                title="Ver la variante en el aparato"
                onClick={event => {
                  event.stopPropagation();
                  onAnchor(verse.n, Number(t.v));
                }}
              >
                ∗
              </button>
            );
          return <span key={i}>{t.v}</span>;
        })}
      </div>
    </div>
  );
}

function NtvVerse({ verse, notes, active, onSelect, onNote }) {
  const tokens = useMemo(() => tokenizeNtv(verse.text), [verse.text]);
  return (
    <div className={`exg-verse${active ? ' is-active' : ''}`} onClick={() => onSelect(verse.n)}>
      <div className="exg-verse__n">{verse.n}</div>
      <div className="exg-verse__text">
        {tokens.map((t, i) => {
          if (t.k === 'fn')
            return (
              <button
                key={i}
                type="button"
                className="exg-fn"
                title={notes[t.v] ? `Nota ${t.v}` : 'Nota del traductor'}
                onClick={event => {
                  event.stopPropagation();
                  onNote(verse.n, t.v);
                }}
              >
                {t.v}
              </button>
            );
          return <span key={i}>{t.v}</span>;
        })}
      </div>
    </div>
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
  const [columns, setColumns] = useState(() => (read(KEYS.cols, 'dos') === 'uno' ? 'uno' : 'dos'));

  const [selected, setSelected] = useState(null); // { n, i } del aparato
  const [note, setNote] = useState(null); // { n, id } de la NTV
  const [activeVerse, setActiveVerse] = useState(null);

  const bodyRefs = { codex: useRef(null), ntv: useRef(null) };
  const syncing = useRef(false);

  const bookId = params.get('libro') || 'juan';
  const chapterNum = Number(params.get('cap') || 3);
  const rangeParam = params.get('vv') || '';

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
    () => (ntv && !ntv.error ? ntv.chapters.find(c => c.num === chapterNum) || ntv.chapters[0] : null),
    [ntv, chapterNum]
  );

  const codexChapter = useMemo(
    () => (codex ? codex.chapters.find(c => c.num === chapterNum) || null : null),
    [codex, chapterNum]
  );

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

  /* ----------------------------- preferencias ----------------------------- */

  useEffect(() => write(KEYS.theme, theme), [theme]);
  useEffect(() => write(KEYS.size, size), [size]);
  useEffect(() => write(KEYS.cols, columns), [columns]);

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
      setSelected(null);
      setNote(null);
      setParams(q, { replace: !push });
    },
    [params, setParams]
  );

  // Si el capítulo pedido no existe en el libro (p. ej. `?libro=judas` sin `cap`),
  // se corrige la URL al primer capítulo disponible.
  useEffect(() => {
    if (!ntv || ntv.error || !ntv.chapters.length) return;
    if (!ntv.chapters.some(c => c.num === chapterNum)) {
      goto({ chapter: ntv.chapters[0].num, range: '' }, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ntv, chapterNum]);

  /* --------------------- scroll sincronizado entre columnas ---------------- */

  const onScroll = useCallback(source => {
    const a = bodyRefs.codex.current;
    const b = bodyRefs.ntv.current;
    if (!a || !b || syncing.current) return;
    syncing.current = true;
    const from = source === 'codex' ? a : b;
    const to = source === 'codex' ? b : a;
    const ratio = from.scrollTop / Math.max(1, from.scrollHeight - from.clientHeight);
    to.scrollTop = ratio * Math.max(0, to.scrollHeight - to.clientHeight);
    window.requestAnimationFrame(() => {
      syncing.current = false;
    });
  }, []);

  const alignVerse = useCallback(n => {
    setActiveVerse(n);
    for (const key of ['codex', 'ntv']) {
      const body = bodyRefs[key].current;
      if (!body) continue;
      const row = body.querySelector(`[data-v="${n}"]`);
      if (row) body.scrollTo({ top: row.offsetTop - 12, behavior: prefersReduced() ? 'auto' : 'smooth' });
    }
  }, []);

  /* --------------------------------- SEO ---------------------------------- */

  const seoTitle = bookMeta
    ? `Exégesis · ${bookMeta.name} ${chapterNum} — Codex Sinaiticus y NTV`
    : 'Exégesis comparada — Codex Sinaiticus y NTV';

  useSeo({
    title: seoTitle,
    description:
      'Lectura paralela del Nuevo Testamento: la transcripción del Codex Sinaiticus con su aparato crítico frente a la Nueva Traducción Viviente.'
  });

  /* ------------------------------ facsímil -------------------------------- */

  const facsimile = bookMeta
    ? `https://www.codexsinaiticus.org/en/manuscript.aspx?book=${bookMeta.codexNo}&chapter=${chapterNum}&verse=${range.from || 1}`
    : 'https://www.codexsinaiticus.org/';

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

  // El índice es lo primero que hace falta: sin él no hay barra de navegación.
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

  const loading = !ntv || (codex === undefined && bookMeta?.codex.verses);

  const apparatusRows = visibleCodex.flatMap(v =>
    v.apparatus.map((a, i) => ({ verse: v.n, index: i, ...a }))
  );

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
            La misma página leída en dos testigos: el uncial griego del siglo&nbsp;IV, con su aparato
            crítico, y la traducción al español. Pulsa un versículo para alinear las dos columnas.
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
          </div>

          <div className="reader__bar-group">
            <button
              type="button"
              className="rb-btn rb-btn--icon"
              aria-pressed={columns === 'uno'}
              title={columns === 'dos' ? 'Ver una columna' : 'Ver dos columnas'}
              aria-label={columns === 'dos' ? 'Ver una sola columna' : 'Ver dos columnas'}
              onClick={() => setColumns(c => (c === 'dos' ? 'uno' : 'dos'))}
            >
              <LayoutGlyph two={columns === 'dos'} />
            </button>
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

        {/* ------------------------------ columnas ----------------------------- */}
        {loading ? (
          <div className="exg__loading">
            <div className="loader-pulse" role="status" aria-label="Cargando">
              <span />
              <span />
              <span />
            </div>
            <p className="muted">Abriendo los testigos…</p>
          </div>
        ) : (
          <div className={`exg__cols${columns === 'uno' ? ' is-single' : ''}`}>
            <article className="exg-card exg-card--codex">
              <header className="exg-card__head">
                <h2>Codex Sinaiticus</h2>
                <p>
                  Transcripción diplomática
                  {codexChapter?.folio ? ` · f. ${codexChapter.folio}${codexChapter.side}` : ''} · la
                  sobrelínea marca los <i>nomina sacra</i>
                </p>
              </header>
              <div
                className="exg-card__body"
                ref={bodyRefs.codex}
                onScroll={() => onScroll('codex')}
                style={{ '--exg-fs': `${size}px` }}
              >
                {visibleCodex.length === 0 ? (
                  <p className="exg-empty">
                    El Codex Sinaiticus no conserva este pasaje en su transcripción digital.
                  </p>
                ) : (
                  visibleCodex.map(v => (
                    <div key={v.n} data-v={v.n}>
                      <GreekVerse
                        verse={v}
                        active={activeVerse === v.n || selected?.n === v.n}
                        onSelect={alignVerse}
                        onAnchor={(n, i) => {
                          setSelected({ n, i });
                          setNote(null);
                          setActiveVerse(n);
                        }}
                      />
                    </div>
                  ))
                )}
              </div>
            </article>

            <article className="exg-card exg-card--ntv">
              <header className="exg-card__head">
                <h2>Nueva Traducción Viviente</h2>
                <p>
                  {bookMeta?.name} {chapterNum}:{range.from}–{range.to} · notas del traductor en
                  superíndice
                </p>
              </header>
              <div
                className="exg-card__body"
                ref={bodyRefs.ntv}
                onScroll={() => onScroll('ntv')}
                style={{ '--exg-fs': `${size}px` }}
              >
                {visibleNtv.length === 0 ? (
                  <p className="exg-empty">Sin texto de la NTV para este rango.</p>
                ) : (
                  visibleNtv.map(v => (
                    <div key={v.n} data-v={v.n}>
                      <NtvVerse
                        verse={v}
                        notes={ntv.notes || {}}
                        active={activeVerse === v.n || note?.n === v.n}
                        onSelect={alignVerse}
                        onNote={(n, id) => {
                          setNote({ n, id });
                          setSelected(null);
                          setActiveVerse(n);
                        }}
                      />
                    </div>
                  ))
                )}
              </div>
            </article>
          </div>
        )}

        {/* ------------------------------ paneles ------------------------------ */}
        {!loading && (
          <div className="exg__panels">
            <section className="exg-panel" aria-label="Aparato crítico">
              <h3>
                <span>Aparato crítico · Codex</span>
                <span className="exg-panel__hint">lecturas de los testigos</span>
              </h3>
              {apparatusRows.length === 0 ? (
                <p className="exg-empty">Sin variantes registradas en este rango.</p>
              ) : (
                <ol className="exg-notes">
                  {apparatusRows.map((row, i) => (
                    <li
                      key={`${row.verse}.${row.index}`}
                      className={`exg-note${selected && selected.n === row.verse && selected.i <= row.index ? ' is-active' : ''}`}
                    >
                      <button type="button" className="exg-note__ref" onClick={() => alignVerse(row.verse)}>
                        {row.verse}
                      </button>
                      <div>
                        <span className="exg-witness">{witnessLabel(row.w)}</span>{' '}
                        {row.t === 'omitted' ? <em>omite</em> : <span className="exg-variant">{row.t}</span>}
                      </div>
                      {i === 0 ? null : null}
                    </li>
                  ))}
                </ol>
              )}
              <div className="exg-sigla">
                <span><b>∗</b> {witnessLabel('*')}</span>
                <span><b>ca</b> {witnessLabel('ca')}</span>
                <span><b>omite</b> no está en ese testigo</span>
              </div>
            </section>

            <section className="exg-panel" aria-label="Notas de la NTV">
              <h3>
                <span>Notas de la NTV</span>
                <span className="exg-panel__hint">notas al pie del traductor</span>
              </h3>
              {visibleNtv.every(v => !(v.notes || []).length) ? (
                <p className="exg-empty">Este pasaje no tiene notas del traductor.</p>
              ) : (
                <ol className="exg-notes">
                  {visibleNtv.flatMap(v =>
                    (v.notes || []).map(id => (
                      <li
                        key={`${v.n}.${id}`}
                        className={`exg-note${note && note.n === v.n && note.id === id ? ' is-active' : ''}`}
                      >
                        <button type="button" className="exg-note__ref exg-note__ref--fn" onClick={() => alignVerse(v.n)}>
                          {id}
                        </button>
                        <div>
                          <b>
                            {bookMeta?.abbr} {chapterNum}:{v.n}
                          </b>{' '}
                          {ntv.notes?.[id] || ''}
                        </div>
                      </li>
                    ))
                  )}
                </ol>
              )}
            </section>
          </div>
        )}

        <footer className="exg__credits">
          <p>
            <strong>Codex Sinaiticus:</strong> transcripción del{' '}
            <a href="https://www.codexsinaiticus.org/" target="_blank" rel="noopener noreferrer">
              Codex Sinaiticus Project
            </a>
            , propiedad de la British Library, la Universidad de Leipzig, el Monasterio de Santa
            Catalina (Sinaí) y la Biblioteca Nacional de Rusia. Uso personal, educativo y no comercial,
            con atribución.
          </p>
          <p>
            <strong>NTV:</strong> Nueva Traducción Viviente, con sus notas del traductor.
          </p>
        </footer>
      </div>
    </main>
  );
}
