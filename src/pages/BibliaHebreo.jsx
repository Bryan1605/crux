import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import BibleCta from '../components/BibleCta';
import BookIntroPanel from '../components/BookIntroPanel/BookIntroPanel';
import HebrewVerseTokens from '../components/HebrewVerseTokens';
import LexiconPanel from '../components/LexiconPanel';
import ReaderMenu from '../components/ReaderMenu';
import VersePopover, { KetivQereBody, LexiconBody } from '../components/VersePopover';
import { BOOK_BY_ID } from '../data/exegesis';
import { hebreoSeo } from '../lib/hebreoSeo';
import {
  loadHebreoBook,
  loadHebreoIndex,
  loadHebreoLemas,
  loadHebreoLexico,
  loadHebreoLexicoBase
} from '../lib/hebreoTexts';
import {
  EZRA_SIL_URL,
  HEBREW_BOOK_BY_ID,
  HEBREW_BOOKS,
  HEBREW_LICENSE_URL,
  HEBREW_SOURCE_URL,
  TBESH_SOURCE_URL,
  foldHebrew,
  stripCantillation,
  stripNiqqud,
  versePlainText
} from '../lib/hebrew';
import { decodeVerseLemmas, pickPrimaryMorpheme } from '../lib/lexicon';
import { hasSelection } from '../lib/selection';
import { useSeo, useSite } from '../lib/site';

import './Biblia.css';
import './Exegesis.css';
import '../components/BibleSearch.css';
import './BibliaHebreo.css';

const FS_MIN = 20;
const FS_MAX = 38;
const KEYS = {
  size: 'crux.hebreo.letra',
  theme: 'crux.hebreo.papel',
  cantillation: 'crux.hebreo.cantilacion',
  vowels: 'crux.hebreo.vocales'
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

/** Buscador en hebreo/arameo sobre el libro abierto (insensible a vocales/cantilación). */
function HebrewBookSearch({ book, onPick }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = e => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onDown = e => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [open]);

  const needle = useMemo(() => foldHebrew(query), [query]);

  const { total, hits } = useMemo(() => {
    if (!book || needle.length < 2) return { total: 0, hits: [] };
    let count = 0;
    const found = [];
    for (const ch of book.chapters) {
      for (const v of ch.verses) {
        const qText = versePlainText(v.t, { qere: true });
        const kText = versePlainText(v.t, { qere: false });
        const foldedQ = foldHebrew(qText);
        const foldedK = foldHebrew(kText);
        if (foldedQ.includes(needle) || foldedK.includes(needle)) {
          count += 1;
          if (found.length < 40) {
            found.push({
              chapter: ch.num,
              verse: v.n,
              preview: qText
            });
          }
        }
      }
    }
    return { total: count, hits: found };
  }, [book, needle]);

  return (
    <div className="bsearch heb-search" ref={rootRef}>
      <div className="bsearch__field">
        <span className="bsearch__icon" aria-hidden="true">
          ⌕
        </span>
        <input
          id="heb-search"
          type="search"
          className="bsearch__input heb-search__input"
          dir="auto"
          lang="he"
          value={query}
          aria-label={book ? `Buscar en ${book.name} en hebreo o arameo` : 'Buscar en este libro'}
          placeholder={book ? `Buscar en ${book.name} · ej. בראשית` : 'Buscar en el libro…'}
          onFocus={() => setOpen(true)}
          onChange={e => {
            setQuery(e.target.value);
            setOpen(true);
          }}
        />
        {query && (
          <button
            type="button"
            className="bsearch__clear heb-search__clear"
            aria-label="Limpiar búsqueda"
            onClick={() => {
              setQuery('');
              setOpen(false);
            }}
          >
            ×
          </button>
        )}
      </div>

      {open && query.trim().length > 0 && (
        <div className="bsearch__panel" role="region" aria-label="Resultados en el libro">
          {needle.length < 2 ? (
            <p className="bsearch__empty">Escribe al menos dos letras consonantes (sin necesitar vocales).</p>
          ) : (
            <>
              <div className="bsearch__scope">
                <span>{book?.name} (insensible a vocales)</span>
                <span>{total === 1 ? '1 versículo' : `${total} versículos`}</span>
              </div>
              {hits.length === 0 ? (
                <p className="bsearch__empty">Sin coincidencias en {book?.name}.</p>
              ) : (
                <ul className="bsearch__list">
                  {hits.map(hit => (
                    <li key={`${hit.chapter}:${hit.verse}`}>
                      <button
                        type="button"
                        className="bsearch__hit heb-search__hit"
                        onClick={() => {
                          setOpen(false);
                          onPick(hit);
                        }}
                      >
                        <span className="bsearch__ref">
                          {book?.abbr} {hit.chapter}:{hit.verse}
                        </span>
                        <span className="bsearch__text heb-search__text" dir="rtl" lang="he">
                          {hit.preview}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {total > hits.length && (
                <p className="bsearch__foot">
                  Mostrando {hits.length} de {total} coincidencias. Escribe una palabra más específica para acotar.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function BibliaHebreo() {
  const site = useSite();
  const [params, setParams] = useSearchParams();

  const [index, setIndex] = useState(null);
  const [book, setBook] = useState(null);
  const [lemas, setLemas] = useState(null);
  const [lexicon, setLexicon] = useState(null);
  const [lexiconStatus, setLexiconStatus] = useState('idle');
  const [lexiconBase, setLexiconBase] = useState(null);
  const [lexiconBaseStatus, setLexiconBaseStatus] = useState('idle');
  const [error, setError] = useState(false);

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
  const [size, setSize] = useState(() => {
    const n = Number(read(KEYS.size, 26));
    return Number.isFinite(n) ? Math.min(FS_MAX, Math.max(FS_MIN, n)) : 26;
  });
  const [showCantillation, setShowCantillation] = useState(
    () => read(KEYS.cantillation, '1') !== '0'
  );
  const [showVowels, setShowVowels] = useState(() => read(KEYS.vowels, '1') !== '0');
  const [pop, setPop] = useState(null);
  const [navOpen, setNavOpen] = useState(false);

  const gridRef = useRef(null);
  const scrolled = useRef(null);
  const topKey = useRef('');

  const bookId = params.get('libro') || 'genesis';
  const chapterNum = Math.max(1, Number(params.get('cap') || 1));
  const selected = Number(params.get('v')) || null;
  const dicOpen = params.has('dic');
  const dicValue = params.get('dic') || '';

  const isHebrewBook = HEBREW_BOOK_BY_ID.has(bookId);
  const requestedBookMeta = BOOK_BY_ID.get(bookId);
  const bookIndexMeta = index?.books?.find(b => b.id === bookId) || HEBREW_BOOK_BY_ID.get(bookId);

  useSeo(
    book
      ? {
          title: `${book.name} ${chapterNum} — Biblia Hebrea (WLC / OSHB)`,
          description: hebreoSeo(site.marca.nombre).description
        }
      : hebreoSeo(site.marca.nombre)
  );

  useEffect(() => {
    let alive = true;
    loadHebreoIndex()
      .then(data => alive && setIndex(data))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, []);

  const ensureLexicon = useCallback(() => {
    if (lexicon) return Promise.resolve(lexicon);
    setLexiconStatus(prev => (prev === 'ok' ? prev : 'loading'));
    return loadHebreoLexico()
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
    return loadHebreoLexicoBase()
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

  useEffect(() => {
    if (!isHebrewBook) {
      setBook(null);
      setLemas(null);
      setError(false);
      return undefined;
    }
    let alive = true;
    setBook(null);
    setLemas(null);
    setError(false);
    scrolled.current = null;
    loadHebreoBook(bookId)
      .then(data => alive && setBook(data))
      .catch(() => alive && setError(true));
    loadHebreoLemas(bookId)
      .then(data => alive && setLemas(data))
      .catch(() => alive && setLemas(null));
    return () => {
      alive = false;
    };
  }, [bookId, isHebrewBook]);

  useEffect(() => {
    if (dicOpen || isHebrewBook) ensureLexicon();
  }, [dicOpen, isHebrewBook, ensureLexicon]);

  useEffect(() => write(KEYS.theme, theme), [theme]);
  useEffect(() => write(KEYS.size, size), [size]);
  useEffect(() => write(KEYS.cantillation, showCantillation ? '1' : '0'), [showCantillation]);
  useEffect(() => write(KEYS.vowels, showVowels ? '1' : '0'), [showVowels]);

  const formatSurface = useCallback(
    text => {
      if (!showVowels) return stripNiqqud(text);
      if (!showCantillation) return stripCantillation(text);
      return text;
    },
    [showVowels, showCantillation]
  );

  const chapter = useMemo(
    () => (book ? book.chapters.find(c => c.num === chapterNum) || book.chapters[0] : null),
    [book, chapterNum]
  );

  const chaptersOfBook = useMemo(
    () =>
      book
        ? book.chapters.map(c => c.num)
        : index?.books?.find(b => b.id === bookId)?.chapters || [],
    [book, index, bookId]
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

  const goto = useCallback(
    (next, push = true) => {
      const q = new URLSearchParams(params);
      if (next.clearDic) q.delete('dic');
      if (next.bookId) q.set('libro', next.bookId);
      if (next.chapter) q.set('cap', String(next.chapter));
      if (next.verse) q.set('v', String(next.verse));
      else q.delete('v');
      setPop(null);
      setNavOpen(false);
      setParams(q, { replace: !push });
    },
    [params, setParams]
  );

  const openWord = useCallback(
    (anchor, data) => {
      const primary = pickPrimaryMorpheme(data.morphemes, 'heb');
      const primaryStrong = primary?.strong || null;
      setPop({ kind: 'word', anchor, ...data });
      select(data.verse, { keepPop: true });
      if (lexicon) {
        if (primaryStrong && !lexiconMap.has(primaryStrong)) ensureLexiconBase();
        return;
      }
      ensureLexicon().then(lexData => {
        if (!primaryStrong) return;
        const inCurated = lexData?.entries?.some(item => item.strong === primaryStrong);
        if (!inCurated) ensureLexiconBase();
      });
    },
    [lexicon, lexiconMap, select, ensureLexicon, ensureLexiconBase]
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

  // Si el capítulo pedido no existe en el libro, se ajusta al primero real.
  useEffect(() => {
    if (!book || !book.chapters.length) return;
    if (!book.chapters.some(c => c.num === chapterNum)) {
      goto({ chapter: book.chapters[0].num }, false);
    }
  }, [book, chapterNum, goto]);

  /* Al cambiar de capítulo la rejilla vuelve arriba. */
  useEffect(() => {
    const body = gridRef.current;
    if (!body) return;
    const key = `${bookId}.${chapterNum}`;
    if (topKey.current === key) return;
    topKey.current = key;
    body.scrollTop = 0;
  }, [bookId, chapterNum, chapter]);

  /* Lleva a la vista el versículo elegido. */
  useEffect(() => {
    if (!chapter || !selected) return;
    const key = `${bookId}.${chapterNum}.${selected}`;
    if (scrolled.current === key) return;
    scrolled.current = key;

    const body = gridRef.current;
    if (!body) return;
    const row = body.querySelector(`[data-v="${selected}"]`);
    if (!row) return;
    const head = body.querySelector('.exg-grid__head');
    const top = row.offsetTop - (head ? head.offsetHeight : 0) - 8;
    const bottom = top + row.offsetHeight;
    if (top >= body.scrollTop - 2 && bottom <= body.scrollTop + body.clientHeight) return;
    body.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  }, [chapter, selected, bookId, chapterNum]);

  const stepChapter = dir => {
    const next = chaptersOfBook[chaptersOfBook.indexOf(chapterNum) + dir];
    if (next) goto({ chapter: next });
  };

  /* Teclado: ← → pasan capítulos igual que en BibliaNtv. */
  useEffect(() => {
    const onKey = event => {
      const tag = event.target instanceof HTMLElement ? event.target.tagName : '';
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
      const at = chaptersOfBook.indexOf(chapterNum);
      if (event.key === 'ArrowRight' && at >= 0 && at < chaptersOfBook.length - 1) {
        goto({ chapter: chaptersOfBook[at + 1] });
      } else if (event.key === 'ArrowLeft' && at > 0) {
        goto({ chapter: chaptersOfBook[at - 1] });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [chaptersOfBook, chapterNum, goto]);

  const themeDef = THEMES.find(t => t.id === theme) || THEMES[0];
  const cycleTheme = () =>
    setTheme(current => THEMES[(THEMES.findIndex(t => t.id === current) + 1) % THEMES.length].id);

  const aramaicVerseNums = useMemo(
    () => (chapter ? chapter.verses.filter(v => v.ar > 0).map(v => v.n) : []),
    [chapter]
  );

  const kqVerseNums = useMemo(
    () => (chapter ? chapter.verses.filter(v => v.kq > 0).map(v => v.n) : []),
    [chapter]
  );

  if (!isHebrewBook) {
    const isCodexOnly = Boolean(requestedBookMeta?.codexOnly);
    return (
      <main id="main" className="exg heb-page">
        <div className="exg__shell">
          <div className="empty-state">
            <h1>
              {requestedBookMeta
                ? `${requestedBookMeta.name} no está en el canon hebreo`
                : 'Libro no encontrado en la Biblia Hebrea'}
            </h1>
            {requestedBookMeta && <BookIntroPanel bookId={bookId} bookName={requestedBookMeta.name} />}
            <p>
              La Biblia Hebrea (WLC / OSHB) cubre los <strong>39 libros</strong> del Antiguo Testamento
              en hebreo y arameo bíblico.{' '}
              {isCodexOnly
                ? 'Este libro se conserva en griego dentro del Codex Sinaiticus.'
                : requestedBookMeta?.testament === 'NT'
                  ? 'El Nuevo Testamento se escribió en griego koiné.'
                  : 'Elige cualquiera de los 39 libros del Antiguo Testamento para leerlo en hebreo.'}
            </p>
            <p className="empty-state__actions">
              <Link className="btn btn--primary" to="/biblia/hebreo?libro=genesis&cap=1">
                Abrir Génesis 1 en hebreo
              </Link>
              {requestedBookMeta && !isCodexOnly && (
                <Link className="btn btn--ghost" to={`/biblia/ntv?libro=${bookId}&cap=1`}>
                  Leer {requestedBookMeta.name} en la NTV
                </Link>
              )}
              {requestedBookMeta && (
                <Link className="btn btn--ghost" to={`/exegesis?libro=${bookId}&cap=1`}>
                  Ver en Exégesis comparada
                </Link>
              )}
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main id="main" className="exg heb-page">
        <div className="exg__shell">
          <div className="empty-state">
            <h1>No se pudo cargar la Biblia Hebrea</h1>
            <p>Comprueba la conexión y vuelve a intentarlo.</p>
            <p className="empty-state__actions">
              <Link className="btn btn--primary" to="/biblia/ntv">
                Ir a la Biblia NTV
              </Link>
            </p>
          </div>
        </div>
      </main>
    );
  }

  const wordPrimaryStrong =
    pop?.kind === 'word' ? pickPrimaryMorpheme(pop.morphemes, 'heb')?.strong || null : null;
  const wordEntry = wordPrimaryStrong ? lexiconMap.get(wordPrimaryStrong) || null : null;
  const wordBaseEntry =
    wordPrimaryStrong && !wordEntry ? lexiconBase?.entries?.[wordPrimaryStrong] || null : null;

  const commitShort = index?.source?.commit ? index.source.commit.slice(0, 7) : 'OSHB';

  return (
    <main id="main" className={`exg heb-page papel--${theme}`} data-theme={theme}>
      <div className="exg__shell">
        <nav className="breadcrumb exg__crumbs" aria-label="Migas de pan">
          <Link to="/">Inicio</Link>
          <span aria-hidden="true">/</span>
          <Link to="/biblia">Biblia</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">Biblia Hebrea</span>
        </nav>

        <header className="ntv__cover heb__cover">
          <p className="eyebrow">Texto masorético · WLC / OSHB · RTL</p>
          <h1>Biblia Hebrea</h1>
          <p>
            Los 39 libros del Antiguo Testamento en hebreo y arameo bíblico del{' '}
            <em>Westminster Leningrad Codex</em> (OSHB), en lectura de derecha a izquierda con
            tipografía <strong>Ezra SIL</strong>, arameo señalado palabra por palabra y variantes{' '}
            <em>ketiv / qere</em> visibles sin reescribir el texto recibido.
          </p>
          <div className="exg__tools">
            <Link
              className="exg-tool exg-tool--guide"
              to={`/exegesis/guia?lengua=hebreo&origen=hebreo&volver=${bookId}&cap=${chapterNum}`}
            >
              <span className="exg-tool__glyph heb-tool-glyph" lang="he" aria-hidden="true">
                אב
              </span>
              <span>Guía para leer hebreo y arameo</span>
            </Link>
            <Link className="exg-tool" to={`/biblia/ntv?libro=${bookId}&cap=${chapterNum}`}>
              <span className="exg-tool__glyph" aria-hidden="true">
                ✦
              </span>
              <span>Leer {bookIndexMeta?.name || bookId} en NTV</span>
            </Link>
            <Link
              className="exg-tool"
              to={`/exegesis?libro=${bookId}&cap=${chapterNum}${selected ? `&v=${selected}` : ''}${
                chapter && !chapter.ntvAligned ? '&modo=hebreo' : '&hebreo=1'
              }`}
            >
              <span className="exg-tool__glyph" aria-hidden="true">
                ⌘
              </span>
              <span>Comparar en Exégesis</span>
            </Link>
            <button
              type="button"
              className="exg-tool"
              onClick={() => openLexicon('')}
              aria-haspopup="dialog"
            >
              <span className="exg-tool__glyph heb-tool-glyph" lang="he" aria-hidden="true">
                מ
              </span>
              <span>Diccionario hebreo</span>
            </button>
          </div>
        </header>

        {bookIndexMeta && <BookIntroPanel bookId={bookId} bookName={bookIndexMeta.name} />}

        {chapter && !chapter.ntvAligned && (
          <p className="exg__notice" role="note">
            <strong>Numeración masorética:</strong> en este capítulo la división de versículos del
            texto hebreo
            {chapter.ntvVerseCount
              ? ` (${chapter.verses.length} vv.) difiere de la NTV (${chapter.ntvVerseCount} vv.).`
              : ' no tiene capítulo equivalente en la NTV (en español forma parte del capítulo anterior o siguiente).'}
          </p>
        )}

        {chapter && chapter.aramaicVerses > 0 && (
          <p className="exg__notice heb__notice--arc" role="note">
            <strong>Arameo bíblico en este capítulo:</strong> {chapter.aramaicVerses}{' '}
            {chapter.aramaicVerses === 1 ? 'versículo' : 'versículos'} ({chapter.aramaicWords}{' '}
            palabras) marcados palabra por palabra con subrayado punteado.
          </p>
        )}

        <div className="reader__bar exg__bar">
          <div className="exg__compact">
            <button
              type="button"
              className="exg__where"
              aria-expanded={navOpen}
              aria-controls="heb-nav"
              onClick={() => setNavOpen(o => !o)}
            >
              <span className="exg__where-text">
                {book?.name || bookIndexMeta?.name} {chapterNum}
              </span>
              <span className="exg__where-hint">Ir a · buscar</span>
              <span aria-hidden="true">▾</span>
            </button>
            <button
              type="button"
              className="rb-btn rb-btn--icon exg__step"
              onClick={() => stepChapter(-1)}
              disabled={chaptersOfBook.indexOf(chapterNum) <= 0}
              aria-label="Capítulo anterior"
            >
              <span aria-hidden="true">‹</span>
            </button>
            <button
              type="button"
              className="rb-btn rb-btn--icon exg__step"
              onClick={() => stepChapter(1)}
              disabled={chaptersOfBook.indexOf(chapterNum) >= chaptersOfBook.length - 1}
              aria-label="Capítulo siguiente"
            >
              <span aria-hidden="true">›</span>
            </button>
          </div>

          <div className="exg__nav" id="heb-nav" data-open={navOpen ? 'true' : 'false'}>
            <div className="reader__bar-group">
              <div className="exg__select">
                <label htmlFor="heb-book">Libro</label>
                <select
                  id="heb-book"
                  value={bookId}
                  onChange={event => goto({ bookId: event.target.value, chapter: 1 })}
                >
                  {HEBREW_BOOKS.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name} · {b.hebrewName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="exg__select">
                <label htmlFor="heb-chapter">Cap.</label>
                <select
                  id="heb-chapter"
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
                <label htmlFor="heb-verse">Versículo</label>
                <select
                  id="heb-verse"
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

            <HebrewBookSearch
              book={book}
              onPick={hit => goto({ chapter: hit.chapter, verse: hit.verse })}
            />
          </div>

          <ReaderMenu label="Opciones de lectura hebrea">
            <div className="reader__size" role="group" aria-label="Tamaño de letra">
              <button
                type="button"
                className="rb-btn rb-btn--icon"
                onClick={() => setSize(s => Math.max(FS_MIN, s - 2))}
                disabled={size <= FS_MIN}
                aria-label="Reducir el tamaño de letra: A−"
              >
                A−
              </button>
              <button
                type="button"
                className="rb-btn rb-btn--icon"
                onClick={() => setSize(s => Math.min(FS_MAX, s + 2))}
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
            <button
              type="button"
              className="rb-btn"
              onClick={() => openLexicon('')}
              title="Diccionario hebreo y arameo → español"
              aria-haspopup="dialog"
            >
              <span aria-hidden="true" lang="he">מ</span>
              <span className="rmenu__text">Diccionario</span>
            </button>
          </ReaderMenu>
        </div>

        {!chapter ? (
          <div className="exg__loading">
            <div className="loader-pulse" role="status" aria-label="Cargando">
              <span />
              <span />
              <span />
            </div>
            <p className="muted">Abriendo el texto hebreo…</p>
          </div>
        ) : (
          <div className="ntv__layout">
            <section
              className="exg-grid heb-grid"
              style={{ '--heb-fs': `${size}px` }}
              aria-label={`Lectura hebrea RTL de ${book.name} ${chapter.num}`}
            >
              <div className="exg-grid__body" ref={gridRef}>
                <header className="exg-grid__head heb-grid__head" dir="rtl">
                  <div className="heb-grid__gutter-head" aria-hidden="true">
                    פסוק
                  </div>
                  <div className="exg-grid__witness heb-grid__witness">
                    <div className="heb-grid__title-row">
                      <b lang="he">{book.hebrewName}</b>
                      <span className="heb-grid__es-title" dir="ltr">
                        {book.name} {chapter.num} · {chapter.verses.length} versículos
                      </span>
                    </div>
                    <div className="heb-legend" dir="ltr">
                      <span className="heb-legend__item">
                        <span className="heb-w heb-w--arc" lang="arc">
                          ארמית
                        </span>{' '}
                        Arameo
                      </span>
                      <span className="heb-legend__item">
                        <span className="heb-kq__k">[ketiv]</span> /{' '}
                        <span className="heb-kq__q">(qere)</span> Lectura masorética
                      </span>
                      <span className="heb-legend__item">
                        <span className="heb-parashah">פ / ס</span> Parashá
                      </span>
                    </div>
                  </div>
                </header>

                {chapter.verses.map(verse => (
                  <div
                    key={verse.n}
                    id={`v${verse.n}`}
                    data-v={verse.n}
                    dir="rtl"
                    className={`heb-row${selected === verse.n ? ' is-active' : ''}`}
                    onClick={() => {
                      if (!hasSelection()) select(verse.n);
                    }}
                  >
                    <div className="heb-row__gutter" dir="ltr">
                      <button
                        type="button"
                        className="heb-row__n"
                        aria-label={`Versículo ${verse.n}`}
                        onClick={event => {
                          event.stopPropagation();
                          select(verse.n);
                        }}
                      >
                        {verse.n}
                      </button>
                      {(verse.ar > 0 || verse.kq > 0) && (
                        <span className="heb-row__marks">
                          {verse.ar > 0 && (
                            <span className="heb-mark heb-mark--arc" title="Contiene arameo bíblico">
                              אר
                            </span>
                          )}
                          {verse.kq > 0 && (
                            <span className="heb-mark heb-mark--kq" title="Contiene ketiv/qere">
                              ק
                            </span>
                          )}
                        </span>
                      )}
                    </div>

                    <div className="heb-row__text" dir="rtl" lang="he">
                      <HebrewVerseTokens
                        tokens={verse.t}
                        verseNum={verse.n}
                        formatSurface={formatSurface}
                        verseLemmas={decodeVerseLemmas(lemas, chapter.num, verse.n)}
                        activeKqId={pop?.kind === 'kq' ? pop.id : null}
                        activeWordId={pop?.kind === 'word' ? pop.id : null}
                        onKetivQere={(anchor, data) => {
                          setPop({ kind: 'kq', anchor, ...data });
                          select(verse.n, { keepPop: true });
                        }}
                        onWord={openWord}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <aside className="ntv__rail">
              <h2>Antiguo Testamento · 39</h2>
              <div className="ntv__rail-books">
                {HEBREW_BOOKS.map(b => {
                  const hasArc = ['genesis', 'esdras', 'jeremias', 'daniel'].includes(b.id);
                  return (
                    <button
                      key={b.id}
                      type="button"
                      className={`ntv__rail-book${b.id === bookId ? ' is-on' : ''}${hasArc ? ' heb-rail-arc' : ''}`}
                      title={hasArc ? `${b.name} (incluye arameo)` : b.name}
                      onClick={() => goto({ bookId: b.id, chapter: 1 })}
                    >
                      {b.abbr}
                    </button>
                  );
                })}
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

              {aramaicVerseNums.length > 0 && (
                <>
                  <h2>Arameo en {book.abbr} {chapterNum}</h2>
                  <div className="heb__rail-verses">
                    {aramaicVerseNums.map(vn => (
                      <button
                        key={vn}
                        type="button"
                        className="heb__rail-tag heb__rail-tag--arc"
                        onClick={() => select(vn)}
                      >
                        v. {vn}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {kqVerseNums.length > 0 && (
                <>
                  <h2>Ketiv / Qere · cap. {chapterNum}</h2>
                  <div className="heb__rail-verses">
                    {kqVerseNums.map(vn => (
                      <button
                        key={vn}
                        type="button"
                        className="heb__rail-tag heb__rail-tag--kq"
                        onClick={() => select(vn)}
                      >
                        v. {vn}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </aside>
          </div>
        )}

        <footer className="exg__credits heb__credits">
          <p>
            <strong>Fuentes y licencias:</strong> texto hebreo y arameo base del{' '}
            <em>Westminster Leningrad Codex</em> (WLC, dominio público); marcado OSIS, lemas,
            morfología, arameo palabra por palabra, variantes <em>ketiv / qere</em> y mapa de
            versificación de{' '}
            <a href={HEBREW_SOURCE_URL} target="_blank" rel="noopener noreferrer">
              Open Scriptures Hebrew Bible (OSHB, rev. {commitShort})
            </a>{' '}
            bajo licencia{' '}
            <a href={HEBREW_LICENSE_URL} target="_blank" rel="noopener noreferrer">
              CC BY 4.0
            </a>
            . Léxico base de{' '}
            <a href={TBESH_SOURCE_URL} target="_blank" rel="noopener noreferrer">
              TBESH / STEPBible
            </a>{' '}
            (CC BY 4.0), con traducción y decodificación morfológica propias al español. Tipografía{' '}
            <a href={EZRA_SIL_URL} target="_blank" rel="noopener noreferrer">
              Ezra SIL 2.51
            </a>{' '}
            (SIL Open Font License 1.1).
          </p>
          <p className="exg__license">
            Conservación textual: las marcas de cantilación y niqqud se preservan sin normalizar
            (sin NFC/NFD); los filtros del menú «Aa» solo afectan a la visualización en pantalla.
          </p>
        </footer>

        <BibleCta
          exclude="hebreo"
          passage={book ? `${book.name} ${chapterNum}` : ''}
          title="El mismo pasaje, en los otros lectores"
        />

        <p className="exg__hint">
          Usa ← → para cambiar de capítulo · lectura de derecha a izquierda (RTL) · pulsa una palabra
          para ver su lema, morfología y glosa · pulsa un <em>ketiv / qere</em> para ver la nota
          masorética
        </p>
      </div>

      {pop?.kind === 'kq' && (
        <VersePopover
          anchor={pop.anchor}
          label={`Ketiv / Qere · ${book?.name} ${chapterNum}:${pop.verse}`}
          onClose={() => setPop(null)}
        >
          <KetivQereBody
            ketiv={pop.ketiv}
            qere={pop.qere}
            aramaic={pop.aramaic}
            reference={`${book?.name} ${chapterNum}:${pop.verse}`}
          />
        </VersePopover>
      )}

      {pop?.kind === 'word' && (
        <VersePopover
          anchor={pop.anchor}
          label={`Palabra · ${book?.name} ${chapterNum}:${pop.verse}`}
          onClose={() => setPop(null)}
        >
          <LexiconBody
            lang="heb"
            morphemes={pop.morphemes}
            entry={wordEntry}
            baseEntry={wordBaseEntry}
            loading={
              lexiconStatus === 'loading' ||
              (Boolean(wordPrimaryStrong) && !wordEntry && lexiconBaseStatus === 'loading')
            }
            token={pop.token}
            reference={`${book?.name} ${chapterNum}:${pop.verse}`}
            onOpenDictionary={() => openLexicon(wordPrimaryStrong || '')}
          />
        </VersePopover>
      )}

      {dicOpen && (
        <LexiconPanel
          lang="heb"
          lexicon={lexicon}
          loading={lexiconStatus === 'loading' || lexiconStatus === 'idle'}
          error={lexiconStatus === 'error'}
          value={dicValue}
          onSelect={openLexicon}
          onGoToVerse={(targetBook, cap, v) =>
            goto({ bookId: targetBook, chapter: cap, verse: v, clearDic: true })
          }
          onClose={closeLexicon}
        />
      )}
    </main>
  );
}
