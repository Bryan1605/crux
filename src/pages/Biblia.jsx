import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { loadBiblia, searchBiblia } from '../data/biblia';
import { bookGeometry, packBook, resolvePage } from '../lib/bookPages';
import { assetUrl } from '../lib/assets';
import { PERSONAJES } from '../data/personajes';
import { useSite, useSeo } from '../lib/site';

import DomeGallery from '../components/DomeGallery/DomeGallery';
import TextType from '../components/TextType/TextType';
import CountUp from '../components/CountUp/CountUp';
import Book from '../components/Book/Book';
import BlockView from '../components/Book/BlockView';
import BookMeasurer from '../components/Book/BookMeasurer';
import BookIndex from '../components/BookIndex/BookIndex';

import './Estudio.css';
import './Biblia.css';

const DOME_POOL = [
  assetUrl('/img/biblia/portada.webp'),
  assetUrl('/img/banners/herobanner2-patristica.webp'),
  ...PERSONAJES.map(p => p.portada),
  assetUrl('/img/banners/herobanner1.webp'),
  ...PERSONAJES.flatMap(p => (p.escenas || []).slice(0, 2)),
  assetUrl('/img/banners/herobanner3-reforma.webp')
];

const FS_MIN = 14;
const FS_MAX = 23;
const FS_STEP = 1;

const FS_KEY = 'crux.biblia.letra';
const MODE_KEY = 'crux.biblia.modo';
const THEME_KEY = 'crux.biblia.papel';
const LAST_KEY = 'crux.biblia.ultima';

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
    /* modo privado: seguimos sin persistir */
  }
};

const clampSize = value => Math.min(FS_MAX, Math.max(FS_MIN, Number(value) || 17));

/** Una página impresa: encabezado, cuerpo y folio. */
function PageView({ page, book, fontSize, side = 'single' }) {
  const part = book.partById.get(page.partId) || null;
  const section = page.sectionId ? book.sectionById.get(page.sectionId) || null : null;

  return (
    <div className="book-page__frame">
      <header className="book-page__head">
        <span>{part && part.num ? `Parte ${part.num}` : ''}</span>
        <span>{section ? section.label : part ? part.label : ''}</span>
      </header>

      <div className="book-page__body" style={{ fontSize: `${fontSize}px` }}>
        {page.blocks.map(index => (
          <BlockView key={index} block={book.blocks[index]} />
        ))}
      </div>

      <footer className={`book-page__foot book-page__foot--${side}`}>
        <span>{page.folio}</span>
      </footer>
    </div>
  );
}

export default function Biblia() {
  const site = useSite();
  const [params, setParams] = useSearchParams();
  const pagParam = params.get('pag');

  const [doc, setDoc] = useState({ status: 'idle', book: null });
  const [fontSize, setFontSize] = useState(() => clampSize(read(FS_KEY, 17)));
  const [mode, setMode] = useState(() => (read(MODE_KEY, 'libro') === 'scroll' ? 'scroll' : 'libro'));
  const [theme, setTheme] = useState(() => {
    const stored = read(THEME_KEY, 'claro');
    return THEMES.some(t => t.id === stored) ? stored : 'claro';
  });

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [indexOpen, setIndexOpen] = useState(false);

  const [stageW, setStageW] = useState(0);
  const [viewportH, setViewportH] = useState(() =>
    typeof window === 'undefined' ? 800 : window.innerHeight
  );
  const [pendingKey, setPendingKey] = useState('');
  const [measure, setMeasure] = useState(null);
  const [pagination, setPagination] = useState(null);

  const [rulerEl, setRulerEl] = useState(null);
  const readerRef = useRef(null);
  const bookApiRef = useRef(null);
  const searchInputRef = useRef(null);

  /* ------------------------------- datos ---------------------------------- */

  useEffect(() => {
    let alive = true;
    setDoc(prev => (prev.status === 'ok' ? prev : { status: 'loading', book: null }));
    loadBiblia(assetUrl('/textos/biblia-patristica.md'))
      .then(book => alive && setDoc({ status: 'ok', book }))
      .catch(() => alive && setDoc({ status: 'error', book: null }));
    return () => {
      alive = false;
    };
  }, []);

  const book = doc.book;

  useEffect(() => {
    write(FS_KEY, fontSize);
  }, [fontSize]);

  useEffect(() => {
    write(MODE_KEY, mode);
  }, [mode]);

  useEffect(() => {
    write(THEME_KEY, theme);
  }, [theme]);

  /* --------------------------- geometría y paginado ------------------------ */

  // La regla invisible existe en todas las vistas y mide el ancho real de la
  // columna: con eso se calcula la geometría del libro (y por tanto los folios),
  // de modo que portada y lector numeran igual.
  useLayoutEffect(() => {
    if (!rulerEl) return undefined;
    const apply = () => setStageW(rulerEl.clientWidth);
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(rulerEl);
    return () => observer.disconnect();
  }, [rulerEl]);

  useEffect(() => {
    const onResize = () => setViewportH(window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const geometry = useMemo(
    () => bookGeometry({ width: Math.max(stageW, 320), height: viewportH, fontSize }),
    [stageW, viewportH, fontSize]
  );

  const measureKey = `${geometry.pageW}|${fontSize}`;

  useEffect(() => {
    if (!stageW) return undefined;
    const id = window.setTimeout(() => setPendingKey(measureKey), 180);
    return () => window.clearTimeout(id);
  }, [measureKey, stageW]);

  const handlePacked = useCallback((key, extents) => setMeasure({ key, extents }), []);

  useEffect(() => {
    if (!book || !measure || !pendingKey || measure.key !== pendingKey) return;
    setPagination(packBook(book, measure.extents, geometry.bodyH));
  }, [book, measure, pendingKey, geometry.bodyH]);

  const needsMeasure = Boolean(book && pendingKey && (!measure || measure.key !== pendingKey));

  /* -------------------------------- rutas --------------------------------- */

  const pageIndex = useMemo(() => (pagination ? resolvePage(pagination, pagParam) : -1), [pagination, pagParam]);
  const page = pagination && pageIndex >= 0 ? pagination.pages[pageIndex] : null;
  const spread = geometry.wide;
  const bookIndex = page ? (spread ? Math.floor(page.index / 2) : page.index) : 0;
  const totalPages = pagination ? pagination.pages.length : 0;

  const gotoPage = useCallback(
    (rawIndex, push = false) => {
      if (!pagination) return;
      const index = Math.max(0, Math.min(pagination.pages.length - 1, rawIndex));
      const target = pagination.pages[index];
      write(LAST_KEY, target.id);
      const next = new URLSearchParams(params);
      next.set('pag', target.id);
      setParams(next, { replace: !push });
    },
    [pagination, params, setParams]
  );

  const gotoId = useCallback(
    (id, push = true) => {
      if (!pagination) return;
      const index = resolvePage(pagination, id);
      gotoPage(index >= 0 ? index : 0, push);
      const el = readerRef.current;
      if (el) el.scrollIntoView({ behavior: prefersReduced() ? 'auto' : 'smooth', block: 'start' });
    },
    [pagination, gotoPage]
  );

  useEffect(() => {
    if (page) write(LAST_KEY, page.id);
  }, [page]);

  /* ------------------------------- búsqueda ------------------------------- */

  useEffect(() => {
    if (!book || query.trim().length < 2) {
      setResults([]);
      return undefined;
    }
    const id = window.setTimeout(() => setResults(searchBiblia(book, query)), 220);
    return () => window.clearTimeout(id);
  }, [book, query]);

  const openResult = result => {
    const index = pagination ? pagination.pageOfBlock.get(result.block.i) : -1;
    if (index !== undefined && index >= 0) gotoPage(index, true);
    setSearchOpen(false);
    setQuery('');
    setResults([]);
  };

  /* -------------------------------- teclado ------------------------------- */

  useEffect(() => {
    if (!page || mode !== 'libro') return undefined;
    const onKey = event => {
      const tag = event.target instanceof HTMLElement ? event.target.tagName : '';
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
      const api = bookApiRef.current;
      if (!api) return;
      if (event.key === 'ArrowRight' || event.key === 'PageDown') {
        event.preventDefault();
        api.turn(1);
      } else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
        event.preventDefault();
        api.turn(-1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [page, mode]);

  /* --------------------- modo scroll: llevar al ancla --------------------- */

  useEffect(() => {
    if (mode !== 'scroll' || !page) return undefined;
    const el = document.getElementById(`b${page.blocks[0]}`);
    if (el) el.scrollIntoView({ behavior: prefersReduced() ? 'auto' : 'smooth', block: 'start' });
    return undefined;
  }, [mode, page]);

  /* --------------------------------- SEO ---------------------------------- */

  const seoSection = page
    ? page.sectionId
      ? book.sectionById.get(page.sectionId)?.label
      : book.partById.get(page.partId)?.label
    : null;

  useSeo({
    title: seoSection
      ? `${seoSection} — Biblia Patrística`
      : `Biblia Patrística — ${site.marca.nombre}`,
    description: page
      ? `Biblia Patrística, página ${page.folio} de ${totalPages}: ${seoSection || ''}`.trim()
      : 'Los Padres de la Iglesia: la Biblia comentada por los primeros siglos, capítulo a capítulo.'
  });

  /* ------------------------------ sub-render ------------------------------ */

  const themeDef = THEMES.find(t => t.id === theme) || THEMES[0];

  const cycleTheme = () => {
    const at = THEMES.findIndex(t => t.id === theme);
    setTheme(THEMES[(at + 1) % THEMES.length].id);
  };

  const renderPage = useCallback(
    p => (
      <PageView
        page={p}
        book={book}
        fontSize={fontSize}
        side={spread ? (p.index % 2 === 0 ? 'left' : 'right') : 'single'}
      />
    ),
    [book, fontSize, spread]
  );

  const indexPanel = pagination ? (
    <BookIndex
      parts={book.parts}
      sectionById={book.sectionById}
      folioOfPart={pagination.folioOfPart}
      folioOfSection={pagination.folioOfSection}
      activePartId={page ? page.partId : null}
      activeSectionId={page ? page.sectionId : null}
      onSelect={gotoId}
      compact={!spread}
    />
  ) : (
    <div className="biblia__loading biblia__loading--inline">
      <div className="loader-pulse" role="status" aria-label="Preparando el índice">
        <span />
        <span />
        <span />
      </div>
      <p className="muted">Componiendo el libro…</p>
    </div>
  );

  const measurer = needsMeasure ? (
    <BookMeasurer
      key={pendingKey}
      packKey={pendingKey}
      book={book}
      pageW={geometry.pageW}
      pad={geometry.pad}
      fontSize={fontSize}
      onPacked={handlePacked}
    />
  ) : null;

  /* ------------------------------- estados -------------------------------- */

  if (doc.status === 'loading' || doc.status === 'idle') {
    return (
      <main id="main" className="biblia">
        <div className="biblia__shell biblia__loading">
          <div className="loader-pulse" role="status" aria-label="Cargando">
            <span />
            <span />
            <span />
          </div>
          <p className="muted">Cargando la Biblia Patrística…</p>
        </div>
      </main>
    );
  }

  if (doc.status === 'error') {
    return (
      <main id="main" className="biblia">
        <div className="biblia__shell">
          <div className="empty-state">
            <h1>No se pudo cargar la Biblia Patrística</h1>
            <p>Comprueba la conexión y vuelve a intentarlo.</p>
            <p>
              <Link className="btn btn--primary" to="/biblia">
                Reintentar
              </Link>
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (pagParam && !pagination) {
    return (
      <main id="main" className="biblia">
        <div className="biblia__shell" ref={setRulerEl} style={{ height: '1px' }} aria-hidden="true" />
        {measurer}
        <div className="biblia__shell biblia__loading">
          <div className="loader-pulse" role="status" aria-label="Componiendo el libro">
            <span />
            <span />
            <span />
          </div>
          <p className="muted">Componiendo el libro página a página…</p>
        </div>
      </main>
    );
  }

  if (pagParam && pagination && !page) {
    return (
      <main id="main" className="biblia">
        <div className="biblia__shell" ref={setRulerEl} style={{ height: '1px' }} aria-hidden="true" />
        {measurer}
        <div className="biblia__shell biblia__notfound">
          <p className="eyebrow">Página no encontrada</p>
          <h1>Esa página no existe en este libro</h1>
          <p className="muted">
            El enlace «{pagParam}» no corresponde a ninguna parte de la obra. Consulta el índice para
            encontrar lo que buscas.
          </p>
          <p>
            <Link className="btn btn--primary" to="/biblia">
              Volver al índice
            </Link>
          </p>
        </div>
      </main>
    );
  }

  /* -------------------------------- lector -------------------------------- */

  if (page) {
    const sectionLabel = page.sectionId
      ? book.sectionById.get(page.sectionId)?.label
      : book.partById.get(page.partId)?.label;

    return (
      <main id="main" className={`biblia biblia--reader papel--${theme}`}>
        <div className="biblia__shell" ref={setRulerEl} style={{ height: '1px' }} aria-hidden="true" />
        {measurer}

        <div className="biblia__shell biblia__reader" ref={readerRef} data-theme={theme}>
          <nav className="breadcrumb biblia__crumbs" aria-label="Migas de pan">
            <Link to="/">Inicio</Link>
            <span aria-hidden="true">/</span>
            <Link to="/biblia">Biblia Patrística</Link>
            <span aria-hidden="true">/</span>
            <Link to="/biblia">{page.partId === 'p-intro' ? 'Introducción' : `Parte ${book.partById.get(page.partId)?.num || ''}`}</Link>
            {page.sectionId && (
              <>
                <span aria-hidden="true">/</span>
                <span aria-current="page">{sectionLabel}</span>
              </>
            )}
          </nav>

          <div className="reader__bar">
            <div className="reader__bar-group">
              <Link className="rb-btn" to="/biblia" title="Volver al índice">
                <span aria-hidden="true">☰</span>
                <span className="rb-btn__text">Índice</span>
              </Link>
              <button
                type="button"
                className={`rb-btn ${searchOpen ? 'is-active' : ''}`.trim()}
                onClick={() => {
                  setSearchOpen(open => !open);
                  setIndexOpen(false);
                  window.setTimeout(() => searchInputRef.current?.focus(), 0);
                }}
                aria-expanded={searchOpen}
                aria-label="Buscar en la obra"
              >
                <span aria-hidden="true">🔍</span>
                <span className="rb-btn__text">Buscar</span>
              </button>
              <button
                type="button"
                className={`rb-btn ${indexOpen ? 'is-active' : ''}`.trim()}
                onClick={() => {
                  setIndexOpen(open => !open);
                  setSearchOpen(false);
                }}
                aria-expanded={indexOpen}
                aria-label="Abrir el índice rápido"
              >
                <span aria-hidden="true">📑</span>
                <span className="rb-btn__text">Índice rápido</span>
              </button>
            </div>

            <div className="reader__bar-group reader__bar-group--center">
              <button
                type="button"
                className="rb-btn rb-btn--icon"
                onClick={() => gotoPage(page.index - 1)}
                disabled={page.index <= 0}
                aria-label="Página anterior"
              >
                ‹
              </button>
              <span className="reader__status" aria-live="polite">
                <strong>{page.folio}</strong>
                <span className="reader__of">de {totalPages}</span>
                <span className="reader__where">{sectionLabel}</span>
              </span>
              <button
                type="button"
                className="rb-btn rb-btn--icon"
                onClick={() => gotoPage(page.index + 1)}
                disabled={page.index >= totalPages - 1}
                aria-label="Página siguiente"
              >
                ›
              </button>
            </div>

            <div className="reader__bar-group">
              <div className="reader__size" role="group" aria-label="Tamaño de letra">
                <button
                  type="button"
                  className="rb-btn rb-btn--icon"
                  onClick={() => setFontSize(size => clampSize(size - FS_STEP))}
                  disabled={fontSize <= FS_MIN}
                  aria-label="Reducir el tamaño de letra"
                >
                  A−
                </button>
                <button
                  type="button"
                  className="rb-btn rb-btn--icon"
                  onClick={() => setFontSize(size => clampSize(size + FS_STEP))}
                  disabled={fontSize >= FS_MAX}
                  aria-label="Aumentar el tamaño de letra"
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
              <button
                type="button"
                className="rb-btn"
                onClick={() => setMode(current => (current === 'libro' ? 'scroll' : 'libro'))}
                aria-pressed={mode === 'scroll'}
                aria-label="Cambiar entre lectura de libro y scroll continuo"
                title={mode === 'libro' ? 'Leer en scroll continuo' : 'Leer como un libro'}
              >
                <span className="rb-btn__text">{mode === 'libro' ? 'Scroll' : 'Libro'}</span>
              </button>
            </div>
          </div>

          {searchOpen && (
            <div className="reader__panel reader__search">
              <div className="search">
                <label className="sr-only" htmlFor="buscador-biblia">
                  Buscar en la Biblia Patrística
                </label>
                <input
                  id="buscador-biblia"
                  ref={searchInputRef}
                  type="search"
                  className="search__input"
                  placeholder="Buscar un autor, una obra, una herejía o una palabra…"
                  value={query}
                  onChange={event => setQuery(event.target.value)}
                  autoComplete="off"
                />
              </div>

              {query.trim().length >= 2 && (
                <div className="reader__results" role="region" aria-label="Resultados de búsqueda">
                  {results.length === 0 ? (
                    <p className="muted">Sin coincidencias para «{query.trim()}».</p>
                  ) : (
                    <ul>
                      {results.map(result => (
                        <li key={result.block.i}>
                          <button type="button" className="reader__result" onClick={() => openResult(result)}>
                            <span className="reader__result-title">
                              {result.section ? result.section.label : result.part ? result.part.label : ''}
                              <span className="reader__result-folio">
                                p. {pagination.folioOfSection.get(result.section?.id) ?? ''}
                              </span>
                            </span>
                            <span className="reader__result-snippet">
                              {result.snippet.before}
                              <mark>{result.snippet.hit}</mark>
                              {result.snippet.after}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}

          {indexOpen && <div className="reader__panel">{indexPanel}</div>}

          {mode === 'libro' ? (
            <div className="reader__stage" style={{ '--book-pad': `${geometry.pad}px` }}>
              <Book
                pages={pagination.pages}
                mode={spread ? 'spread' : 'single'}
                index={bookIndex}
                onIndex={next => gotoPage(spread ? next * 2 : next)}
                renderPage={renderPage}
                reduced={prefersReduced()}
                pageW={geometry.pageW}
                apiRef={bookApiRef}
                theme={theme}
              />
              <p className="reader__hint">
                Arrastra o usa ← → para pasar la hoja · el texto se puede seleccionar y buscar
              </p>
            </div>
          ) : (
            <div className="reader__scroll">
              {book.blocks.map(block => (
                <div
                  key={block.i}
                  id={`b${block.i}`}
                  className={`scroll-block scroll-block--${block.type}`}
                >
                  <BlockView block={block} />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    );
  }

  /* -------------------------------- portada ------------------------------- */

  const domeImages = book.parts.map((part, i) => ({
    src: DOME_POOL[i % DOME_POOL.length],
    alt: part.label,
    value: part.id
  }));

  const lastId = read(LAST_KEY, '');
  const lastIndex = pagination && lastId ? resolvePage(pagination, lastId) : -1;
  const lastPage = lastIndex >= 0 ? pagination.pages[lastIndex] : null;
  const reduced = prefersReduced();

  return (
    <main id="main" className="biblia">
      <div className="biblia__shell" ref={setRulerEl} style={{ height: '1px' }} aria-hidden="true" />
      {measurer}

      <section className="biblia__dome" aria-label="Índice visual de la obra">
        <DomeGallery
          images={domeImages}
          overlayBlurColor="#0a0a0b"
          grayscale={false}
          openedImageWidth="min(78vw, 560px)"
          openedImageHeight="min(62vh, 560px)"
          imageBorderRadius="18px"
          openedImageBorderRadius="22px"
          enlargeTransitionMs={reduced ? 0 : 300}
          ctaLabel="Abrir esta parte →"
          onNavigate={value => value && gotoId(value)}
        />
        <div className="biblia__dome-head">
          <p className="eyebrow">Padres de la Iglesia</p>
          <h1>Biblia Patrística</h1>
          <p className="biblia__dome-lead">
            Del periodo apostólico al siglo VIII, una sola obra para recorrer la fe de los primeros
            siglos.
          </p>
          {lastPage && (
            <p className="biblia__resume">
              <button type="button" className="btn btn--primary" onClick={() => gotoPage(lastIndex)}>
                Continuar leyendo · p. {lastPage.folio}
              </button>
            </p>
          )}
        </div>
        <a className="biblia__dome-cue" href="#biblia-indice">
          Índice de la obra <span aria-hidden="true">↓</span>
        </a>
      </section>

      <section className="section biblia__about">
        <div className="biblia__shell biblia__about-grid">
          <figure className="biblia__cover">
            <img
              src={assetUrl('/img/biblia/portada.webp')}
              alt="Portada de la Biblia Patrística"
              loading="lazy"
            />
          </figure>

          <div className="biblia__about-copy">
            <p className="eyebrow">📖 Acerca de esta obra</p>
            <h2>Del fuego de los primeros siglos a tu biblioteca</h2>

            <TextType
              as="p"
              className="biblia__about-lead"
              text="Esta Biblia Patrística reúne los escritos que dieron forma a la fe cristiana: resúmenes claros, citas clave explicadas y obras completas traducidas, del periodo apostólico al siglo VIII."
              typingSpeed={13}
              initialDelay={250}
              loop={false}
              showCursor={false}
              startOnVisible
            />

            <p className="biblia__about-note">
              No es una enciclopedia fría: es el pulso de Ignacio, Policarpo, Justino, Atanasio y
              Agustín latiendo página tras página. Ábrela como un libro: se lee pasando hojas.
            </p>

            <div className="biblia__stats">
              <div className="biblia__stat">
                <span className="biblia__stat-value">
                  <CountUp to={totalPages} duration={1.6} separator="." />
                </span>
                <span className="biblia__stat-label">páginas de lectura</span>
              </div>
              <div className="biblia__stat">
                <span className="biblia__stat-value">
                  <CountUp to={book.parts.length} duration={1.2} delay={0.15} />
                </span>
                <span className="biblia__stat-label">partes de la obra</span>
              </div>
              <div className="biblia__stat">
                <span className="biblia__stat-value">
                  <CountUp to={700} duration={1.8} delay={0.3} />
                </span>
                <span className="biblia__stat-label">años de tradición · ss. I–VIII</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section biblia__index-section" id="biblia-indice">
        <div className="biblia__shell">
          <header className="biblia__index-head">
            <p className="eyebrow">Navega por la obra</p>
            <h2>Índice</h2>
            <p className="biblia__index-hint">
              Elige una parte o una sección y se abrirá en la página exacta del libro. Los números de
              la derecha son los folios.
            </p>
          </header>
          {indexPanel}
        </div>
      </section>
    </main>
  );
}
