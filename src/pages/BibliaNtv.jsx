import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import BibleSearch from '../components/BibleSearch';
import BibleCta from '../components/BibleCta';
import ChapterAudio from '../components/ChapterAudio';
import VersePopover, { NoteBody } from '../components/VersePopover';
import { narracionDe } from '../data/narraciones';
import { buildRecords } from '../lib/bibleSearch';
import { loadExegesisIndex, loadWitnessBook } from '../lib/exegesisTexts';
import { hasSelection } from '../lib/selection';
import { useSeo } from '../lib/site';

import './Biblia.css';
import './Exegesis.css';

const FS_MIN = 15;
const FS_MAX = 26;
const KEYS = {
  size: 'crux.ntv.letra',
  theme: 'crux.ntv.papel',
  // Clave nueva: en la versión anterior `crux.ntv.paginas` guardaba «una»/«dos» y
  // se escribía sola con el valor por defecto, así que no distinguía una elección
  // del visitante. Con clave nueva, la rejilla estrena la vista por defecto.
  view: 'crux.ntv.vista'
};

const THEMES = [
  { id: 'claro', label: 'Papel claro', glyph: '☀' },
  { id: 'sepia', label: 'Papel sepia', glyph: '◐' },
  { id: 'noche', label: 'Papel nocturno', glyph: '☾' }
];

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

/** Icono del conmutador de páginas: un rectángulo con (o sin) divisoria. */
function LayoutGlyph({ two }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <rect x="1" y="2" width="14" height="12" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
      {two ? <line x1="8" y1="2" x2="8" y2="14" stroke="currentColor" strokeWidth="1.3" /> : null}
    </svg>
  );
}

/** Parte el texto en tramos de texto y marcas de nota `[x]`. */
function tokenize(text) {
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

/** Agrupa los versículos en filas: cada versículo estrena fila y los títulos de
 *  sección ocupan una propia. Si la NTV omite el versículo de una sección, el
 *  título cuelga del siguiente que sí existe. */
function verseRows(chapter) {
  const sections = [...(chapter.sections || [])].sort((a, b) => a.verse - b.verse);
  const rows = [];
  let at = 0;
  const flushUntil = n => {
    while (at < sections.length && sections[at].verse <= n) {
      rows.push({ kind: 'section', key: `s${sections[at].verse}-${at}`, title: sections[at].title });
      at += 1;
    }
  };
  for (const verse of chapter.verses) {
    flushUntil(verse.n);
    rows.push({ kind: 'verse', key: `v${verse.n}`, verse });
  }
  flushUntil(Number.POSITIVE_INFINITY);
  return rows;
}

/**
 * Rejilla por versículo de la NTV: la misma estructura que `/exegesis` —de ahí
 * que comparta sus clases— con el texto de cada versículo en su fila, los
 * títulos de sección dentro y las notas del traductor en superíndice.
 */
function NtvGrid({ book, chapter, selected, onSelect, onNote, size, gridRef }) {
  const rows = useMemo(() => verseRows(chapter), [chapter]);

  return (
    <section
      className="exg-grid exg-grid--1 ntv-grid"
      style={{ '--exg-fs': `${size}px` }}
      aria-label={`Lectura por versículo de ${book.name} ${chapter.num}`}
    >
      <div className="exg-grid__body" ref={gridRef}>
        <header className="exg-grid__head">
          <div className="exg-grid__gutter" aria-hidden="true" />
          <div className="exg-grid__witness exg-grid__witness--ntv">
            <b>Nueva Traducción Viviente</b>
            <span>
              {book.name} {chapter.num} · {chapter.verses.length} versículos · notas del traductor en
              superíndice
            </span>
          </div>
        </header>

        {rows.map(row =>
          row.kind === 'section' ? (
            <p className="exg-grid__section" key={row.key}>
              {row.title}
            </p>
          ) : (
            <div
              key={row.key}
              id={`v${row.verse.n}`}
              data-v={row.verse.n}
              className={`exg-row${selected === row.verse.n ? ' is-active' : ''}`}
              onClick={() => {
                // Marcar texto termina en un clic sobre la fila: con selección
                // viva no fijamos el versículo ni movemos la vista.
                if (!hasSelection()) onSelect(row.verse.n);
              }}
            >
              <div className="exg-row__gutter">
                <button
                  type="button"
                  className="exg-row__n"
                  aria-label={`Versículo ${row.verse.n}`}
                  onClick={event => {
                    event.stopPropagation();
                    onSelect(row.verse.n);
                  }}
                >
                  {row.verse.n}
                </button>
                {/\[[a-z]{1,2}\]/.test(row.verse.text) ? (
                  <span className="exg-row__marks">
                    <span className="exg-mark-chip exg-mark-chip--ntv" title="Nota del traductor">
                      †
                    </span>
                  </span>
                ) : null}
              </div>

              <div className="exg-row__cell exg-row__cell--ntv">
                <span className="exg-cell__tag" aria-hidden="true">
                  NTV
                </span>
                {tokenize(row.verse.text).map((t, i) =>
                  t.k === 'fn' ? (
                    <button
                      key={i}
                      type="button"
                      className="ntv-fn"
                      title="Ver la nota del traductor"
                      aria-label={`Nota ${t.v} del versículo ${row.verse.n}`}
                      onClick={event => {
                        event.stopPropagation();
                        onNote(event.currentTarget, row.verse.n, t.v);
                      }}
                    >
                      {t.v}
                    </button>
                  ) : (
                    <span key={i}>{t.v}</span>
                  )
                )}
              </div>
            </div>
          )
        )}
      </div>
    </section>
  );
}

/**
 * Modo libro: los versículos repartidos en dos pliegos, con el número delante.
 * Es la vista clásica del lector; la rejilla (`NtvGrid`) es la vista por defecto.
 */
function PageText({ verses, sections, activeVerse, onSelect, onNote }) {
  const bySection = useMemo(() => {
    const map = new Map();
    for (const s of sections || []) {
      const key = s.verse;
      map.set(key, [...(map.get(key) || []), s.title]);
    }
    return map;
  }, [sections]);

  return (
    <>
      {verses.map(v => (
        <div key={v.n} id={`v${v.n}`} data-v={v.n} className={`ntv-vs${activeVerse === v.n ? ' is-active' : ''}`}>
          {(bySection.get(v.n) || []).map(title => (
            <span key={title} className="ntv-h">
              {title}
            </span>
          ))}
          <p
            onClick={() => {
              if (!hasSelection()) onSelect(v.n);
            }}
          >
            <button
              type="button"
              className="ntv-v"
              aria-label={`Versículo ${v.n}`}
              onClick={event => {
                event.stopPropagation();
                onSelect(v.n);
              }}
            >
              {v.n}
            </button>
            {tokenize(v.text).map((t, i) =>
              t.k === 'fn' ? (
                <button
                  key={i}
                  type="button"
                  className="ntv-fn"
                  title="Ver la nota del traductor"
                  aria-label={`Nota ${t.v} del versículo ${v.n}`}
                  onClick={event => {
                    event.stopPropagation();
                    onNote(event.currentTarget, v.n, t.v);
                  }}
                >
                  {t.v}
                </button>
              ) : (
                <span key={i}>{t.v}</span>
              )
            )}
          </p>
        </div>
      ))}
    </>
  );
}

export default function BibliaNtv() {
  const [params, setParams] = useSearchParams();

  const [index, setIndex] = useState(null);
  const [book, setBook] = useState(null);
  const [error, setError] = useState(false);

  const [theme, setTheme] = useState(() => {
    const stored = read(KEYS.theme, 'claro');
    return THEMES.some(t => t.id === stored) ? stored : 'claro';
  });
  const [size, setSize] = useState(() => Number(read(KEYS.size, 18)));
  const [mode, setMode] = useState(() => (read(KEYS.view, 'rejilla') === 'dos' ? 'dos' : 'rejilla'));
  const [pop, setPop] = useState(null);

  const railRef = useRef(null);
  const gridRef = useRef(null);
  const scrolled = useRef(null);
  const topKey = useRef('');

  const bookId = params.get('libro') || 'mateo';
  const chapterNum = Number(params.get('cap') || 1);
  const selected = Number(params.get('v')) || null;

  useEffect(() => {
    let alive = true;
    loadExegesisIndex()
      .then(data => alive && setIndex(data))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    setBook(null);
    scrolled.current = null;
    loadWitnessBook('ntv', bookId)
      .then(data => alive && setBook(data))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, [bookId]);

  useEffect(() => write(KEYS.theme, theme), [theme]);
  useEffect(() => write(KEYS.size, size), [size]);
  useEffect(() => write(KEYS.view, mode), [mode]);

  const chapter = useMemo(
    () => (book ? book.chapters.find(c => c.num === chapterNum) || book.chapters[0] : null),
    [book, chapterNum]
  );

  const chaptersOfBook = useMemo(
    () => (book ? book.chapters.map(c => c.num) : index?.books.find(b => b.id === bookId)?.ntv.chapters || []),
    [book, index, bookId]
  );

  /* Narración del capítulo abierto (hoy solo la Carta de Judas). */
  const narracion = useMemo(() => narracionDe(bookId, chapterNum), [bookId, chapterNum]);

  const spread = useMemo(() => {
    if (!chapter) return [[], []];
    const mid = Math.ceil(chapter.verses.length / 2);
    return [chapter.verses.slice(0, mid), chapter.verses.slice(mid)];
  }, [chapter]);

  const searchRecords = useMemo(
    () =>
      book
        ? buildRecords({ witness: 'ntv', bookId, bookName: book.name, chapters: book.chapters })
        : [],
    [book, bookId]
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

  const goto = (next, push = true) => {
    const q = new URLSearchParams(params);
    if (next.bookId) q.set('libro', next.bookId);
    if (next.chapter) q.set('cap', String(next.chapter));
    q.delete('v');
    setPop(null);
    setParams(q, { replace: !push });
  };

  // Si el capítulo pedido no existe en el libro, se corrige al primero disponible.
  useEffect(() => {
    if (!book || !book.chapters.length) return;
    if (!book.chapters.some(c => c.num === chapterNum)) {
      goto({ chapter: book.chapters[0].num }, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book, chapterNum]);

  /* En la rejilla, cambiar de capítulo devuelve la lectura arriba. */
  useEffect(() => {
    if (mode !== 'rejilla') return;
    const body = gridRef.current;
    if (!body) return;
    const key = `${bookId}.${chapterNum}`;
    if (topKey.current === key) return;
    topKey.current = key;
    body.scrollTop = 0;
  }, [mode, bookId, chapterNum, chapter]);

  /* El versículo elegido se lleva a la vista (una vez por cambio y modo). */
  useEffect(() => {
    if (!chapter || !selected) return;
    const key = `${mode}:${bookId}.${chapterNum}.${selected}`;
    if (scrolled.current === key) return;
    scrolled.current = key;

    if (mode === 'rejilla') {
      const body = gridRef.current;
      if (!body) return;
      const row = body.querySelector(`[data-v="${selected}"]`);
      if (!row) return;
      // La cabecera va pegada dentro del contenedor: hay que descontarla.
      const head = body.querySelector('.exg-grid__head');
      const top = row.offsetTop - (head ? head.offsetHeight : 0) - 8;
      const bottom = top + row.offsetHeight;
      if (top >= body.scrollTop - 2 && bottom <= body.scrollTop + body.clientHeight) return;
      body.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
      return;
    }

    const el = document.getElementById(`v${selected}`);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 132;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  }, [chapter, selected, bookId, chapterNum, mode]);

  /* Teclado: ← → cambian de capítulo. */
  useEffect(() => {
    const onKey = event => {
      const tag = event.target instanceof HTMLElement ? event.target.tagName : '';
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
      const list = chaptersOfBook;
      const at = list.indexOf(chapterNum);
      if (event.key === 'ArrowRight' && at >= 0 && at < list.length - 1) goto({ chapter: list[at + 1] });
      else if (event.key === 'ArrowLeft' && at > 0) goto({ chapter: list[at - 1] });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chaptersOfBook, chapterNum, params]);

  const themeDef = THEMES.find(t => t.id === theme) || THEMES[0];
  const cycleTheme = () =>
    setTheme(current => THEMES[(THEMES.findIndex(t => t.id === current) + 1) % THEMES.length].id);

  const bookMeta = index?.books.find(b => b.id === bookId);

  useSeo({
    title: book ? `${book.name} ${chapterNum} — Biblia NTV` : 'Biblia NTV',
    description:
      'La Nueva Traducción Viviente versículo a versículo, en rejilla o en pliego de dos páginas, con sus notas del traductor y un buscador por palabras.'
  });

  if (error) {
    return (
      <main id="main" className="exg">
        <div className="exg__shell">
          <div className="empty-state">
            <h1>No se pudo cargar la Biblia NTV</h1>
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

  return (
    <main id="main" className={`exg ntv papel--${theme}`} data-theme={theme}>
      <div className="exg__shell">
        <nav className="breadcrumb exg__crumbs" aria-label="Migas de pan">
          <Link to="/">Inicio</Link>
          <span aria-hidden="true">/</span>
          <Link to="/biblia">Biblia</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">Nueva Traducción Viviente</span>
        </nav>

        <header className="ntv__cover">
          <p className="eyebrow">Texto bíblico · español</p>
          <h1>Biblia NTV</h1>
          <p>
            La Nueva Traducción Viviente, versículo a versículo en una rejilla —o en pliego de dos
            páginas, si lo prefieres—, con las notas del traductor y un buscador por las palabras que
            recuerdes.
          </p>
        </header>

        <div className="reader__bar exg__bar">
          <div className="reader__bar-group">
            <div className="exg__select">
              <label htmlFor="ntv-book">Libro</label>
              <select
                id="ntv-book"
                value={bookId}
                onChange={event => goto({ bookId: event.target.value, chapter: 1 })}
              >
                {(index?.books || []).map(b => (
                  <option key={b.id} value={b.id} disabled={!b.ntv.verses}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="exg__select">
              <label htmlFor="ntv-chapter">Cap.</label>
              <select
                id="ntv-chapter"
                value={chapterNum}
                onChange={event => goto({ chapter: Number(event.target.value) })}
              >
                {chaptersOfBook.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="exg__select">
              <label htmlFor="ntv-verse">Versículo</label>
              <select
                id="ntv-verse"
                value={selected ?? ''}
                onChange={event => select(Number(event.target.value))}
                disabled={!chapter}
              >
                <option value="" disabled>
                  Ir a…
                </option>
                {(chapter?.verses || []).map(v => (
                  <option key={v.n} value={v.n}>
                    {v.n}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <BibleSearch
            id="ntv-search"
            localRecords={searchRecords}
            scopeLabel={book ? `${book.name} (libro abierto)` : 'este libro'}
            onPick={record => {
              const q = new URLSearchParams(params);
              q.set('libro', record.bookId);
              q.set('cap', String(record.chapter));
              q.set('v', String(record.verse));
              setPop(null);
              setParams(q);
            }}
          />

          <div className="reader__bar-group">
            <button
              type="button"
              className="rb-btn rb-btn--icon"
              aria-pressed={mode === 'dos'}
              title={mode === 'dos' ? 'Ver en rejilla, versículo a versículo' : 'Ver como libro, en dos páginas'}
              aria-label={mode === 'dos' ? 'Ver en rejilla, versículo a versículo' : 'Ver como libro, en dos páginas'}
              onClick={() => {
                setPop(null);
                setMode(current => (current === 'dos' ? 'rejilla' : 'dos'));
              }}
            >
              <LayoutGlyph two={mode === 'dos'} />
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
          </div>
        </div>

        {!chapter ? (
          <div className="exg__loading">
            <div className="loader-pulse" role="status" aria-label="Cargando">
              <span />
              <span />
              <span />
            </div>
            <p className="muted">Abriendo el libro…</p>
          </div>
        ) : (
          <div className="ntv__layout">
            {mode === 'rejilla' ? (
              <NtvGrid
                book={book}
                chapter={chapter}
                selected={selected}
                onSelect={select}
                onNote={(anchor, verse, id) => {
                  setPop({ anchor, verse, id });
                  select(verse, { keepPop: true });
                }}
                size={size}
                gridRef={gridRef}
              />
            ) : (
              <div className="ntv__spread">
                {spread.map((verses, pi) =>
                  verses.length === 0 && pi === 1 ? null : (
                    <article className="ntv-page" key={pi} style={{ '--ntv-fs': `${size}px` }}>
                      <header className="ntv-page__head">
                        <span>{book.name}</span>
                        <span>Capítulo {chapter.num}</span>
                      </header>
                      <div className="ntv-page__body">
                        <PageText
                          verses={verses}
                          sections={chapter.sections}
                          activeVerse={selected}
                          onSelect={select}
                          onNote={(anchor, verse, id) => {
                            setPop({ anchor, verse, id });
                            select(verse, { keepPop: true });
                          }}
                        />
                      </div>
                      <footer className="ntv-page__foot">
                        <span>Biblia NTV</span>
                        <span>
                          {book.name} {chapter.num} · {pi + 1}/{spread.filter(s => s.length).length}
                        </span>
                      </footer>
                    </article>
                  )
                )}
              </div>
            )}

            <aside className="ntv__rail" ref={railRef}>
              {narracion ? <ChapterAudio key={narracion.id} narracion={narracion} /> : null}
              <h2>Libros del NT</h2>
              <div className="ntv__rail-books">
                {(index?.books || []).map(b => (
                  <button
                    key={b.id}
                    type="button"
                    className={`ntv__rail-book${b.id === bookId ? ' is-on' : ''}`}
                    onClick={() => goto({ bookId: b.id, chapter: 1 })}
                    disabled={!b.ntv.verses}
                  >
                    {b.abbr}
                  </button>
                ))}
              </div>
              <h2>Capítulos · {book.name}</h2>
              <div className="ntv__rail-chapters">
                {chaptersOfBook.map(c => (
                  <button
                    key={c}
                    type="button"
                    className={`ntv__rail-chapter${c === chapterNum ? ' is-on' : ''}`}
                    onClick={() => goto({ chapter: c })}
                  >
                    {c}
                  </button>
                ))}
              </div>
              {chapter.sections?.length > 0 && (
                <>
                  <h2>Secciones</h2>
                  <ul className="ntv__rail-sections">
                    {chapter.sections.map(s => (
                      <li key={`${s.verse}-${s.title}`}>
                        <a
                          href={`#v${s.verse}`}
                          onClick={event => {
                            event.preventDefault();
                            select(s.verse);
                          }}
                        >
                          <span>{s.title}</span>
                          <span>{s.verse}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </aside>
          </div>
        )}

        <BibleCta
          exclude="ntv"
          passage={book ? `${book.name} ${chapterNum}` : ''}
          title="El mismo pasaje, en los otros dos lectores"
        />

        <p className="exg__hint">
          Usa ← → para cambiar de capítulo · el texto se puede seleccionar y buscar
        </p>
      </div>

      {pop && (
        <VersePopover
          anchor={pop.anchor}
          label={`Nota ${pop.id} · ${book?.name} ${chapterNum}:${pop.verse}`}
          onClose={() => setPop(null)}
        >
          <NoteBody
            note={book?.notes?.[pop.id]}
            reference={`${book?.name} ${chapterNum}:${pop.verse} · nota ${pop.id}`}
          />
        </VersePopover>
      )}
    </main>
  );
}
