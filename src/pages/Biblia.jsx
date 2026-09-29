import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { renderProse } from '../lib/markdown';
import { assetUrl } from '../lib/assets';
import { loadBiblia, searchBiblia } from '../data/biblia';
import { PERSONAJES } from '../data/personajes';

import DomeGallery from '../components/DomeGallery/DomeGallery';
import BranchedMenu from '../components/BranchedMenu/BranchedMenu';
import TextType from '../components/TextType/TextType';
import CountUp from '../components/CountUp/CountUp';

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

const prefersReduced = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function SearchBox({ query, setQuery, results, onPick }) {
  return (
    <div className="biblia__search">
      <div className="search">
        <label className="sr-only" htmlFor="buscador-biblia">
          Buscar en la Biblia Patrística
        </label>
        <input
          id="buscador-biblia"
          type="search"
          className="search__input"
          placeholder="Buscar un autor, obra, herejía o palabra…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          autoComplete="off"
        />
      </div>

      {query.trim().length >= 2 && (
        <div className="biblia__results" role="region" aria-label="Resultados de búsqueda">
          {results.length === 0 ? (
            <p className="muted">Sin coincidencias para «{query.trim()}».</p>
          ) : (
            <ul>
              {results.map(r => (
                <li key={r.page.id}>
                  <button type="button" className="biblia__result" onClick={() => onPick(r.page.id)}>
                    <span className="biblia__result-title">{r.page.title}</span>
                    <span className="biblia__result-snippet">
                      {r.snippet.before}
                      <mark>{r.snippet.hit}</mark>
                      {r.snippet.after}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function BibliaMenu({ book, activeId, onSelect, className = '' }) {
  const detailsRef = useRef(null);

  const items = useMemo(
    () =>
      book.chapters
        .filter(ch => ch.pages.length > 0)
        .map(ch => ({
          label: ch.title,
          children: ch.pages.map(id => {
            const p = book.pages.find(x => x.id === id);
            return {
              value: id,
              label: p.title.replace(`${ch.title} — `, ''),
              title: p.title
            };
          })
        })),
    [book]
  );

  const filteredChapters = useMemo(
    () => book.chapters.filter(ch => ch.pages.length > 0),
    [book]
  );

  const activeChapterIdx = activeId
    ? Math.max(0, filteredChapters.findIndex(ch => ch.pages.includes(activeId)))
    : 0;

  useEffect(() => {
    const el = detailsRef.current;
    if (!el) return undefined;
    el.open = window.innerWidth > 960;
    const sync = () => {
      if (window.innerWidth > 960 && !el.open) el.open = true;
    };
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, []);

  return (
    <details ref={detailsRef} className={`biblia__menu ${className}`.trim()}>
      <summary className="biblia__menu-summary">
        <span aria-hidden="true">☰</span> Índice de la obra
      </summary>
      <div className="biblia__menu-body">
        <BranchedMenu
          key={activeId || 'landing'}
          items={items}
          defaultActive={activeId || '__none__'}
          defaultOpen={activeChapterIdx}
          onSelect={onSelect}
          color="var(--text)"
          accentColor="#ca8700"
          lineColor="rgba(255, 255, 255, 0.18)"
          width={272}
          fontSize={13.5}
        />
      </div>
    </details>
  );
}

export default function Biblia() {
  const [params, setParams] = useSearchParams();
  const pagId = params.get('pag');
  const [doc, setDoc] = useState({ status: 'idle', book: null });
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    let alive = true;
    setDoc(prev => (prev.status === 'ok' ? prev : { status: 'loading', book: null }));
    loadBiblia()
      .then(book => {
        if (alive) setDoc({ status: 'ok', book });
      })
      .catch(() => {
        if (alive) setDoc({ status: 'error', book: null });
      });
    return () => {
      alive = false;
    };
  }, []);

  const book = doc.book;

  useEffect(() => {
    if (!book || query.trim().length < 2) {
      setResults([]);
      return undefined;
    }
    const id = setTimeout(() => setResults(searchBiblia(book, query)), 250);
    return () => clearTimeout(id);
  }, [book, query]);

  const page = book && pagId ? book.pages.find(p => p.id === pagId) || null : null;
  const pageIdx = page ? book.pages.indexOf(page) : -1;
  const html = useMemo(() => (page ? renderProse(page.body) : ''), [page]);

  useEffect(() => {
    if (page) window.scrollTo(0, 0);
  }, [pagId, page]);

  const go = id => {
    const next = new URLSearchParams(params);
    if (id) next.set('pag', id);
    else next.delete('pag');
    setParams(next);
    setQuery('');
    setResults([]);
    if (id && window.innerWidth <= 960) {
      const menu = document.querySelector('.biblia__menu');
      if (menu instanceof HTMLDetailsElement) menu.open = false;
    }
  };

  const chapterList = useMemo(() => (book ? book.chapters.filter(ch => ch.pages.length > 0) : []), [book]);

  const domeImages = useMemo(() => {
    if (!book) return [];
    return chapterList.map((ch, i) => ({
      src: DOME_POOL[i % DOME_POOL.length],
      alt: ch.title,
      value: ch.pages[0]
    }));
  }, [book, chapterList]);

  const totalPages = book ? book.pages.length : 0;
  const totalChapters = chapterList.length;

  if (doc.status === 'loading' || doc.status === 'idle') {
    return (
      <main id="main" className="biblia">
        <div className="container biblia__loading">
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
        <div className="container">
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

  if (page) {
    const prev = pageIdx > 0 ? book.pages[pageIdx - 1] : null;
    const next = pageIdx < book.pages.length - 1 ? book.pages[pageIdx + 1] : null;
    return (
      <main id="main" className="biblia biblia--reader">
        <div className="container biblia__reader-grid">
          <BibliaMenu book={book} activeId={page.id} onSelect={go} className="biblia__menu--reader" />

          <article className="biblia__reader">
            <nav className="breadcrumb" aria-label="Migas de pan">
              <Link to="/">Inicio</Link>
              <span aria-hidden="true">/</span>
              <Link to="/biblia">Biblia Patrística</Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page">{page.chapter}</span>
            </nav>

            <header className="study-detail__head">
              <p className="eyebrow">{page.chapter}</p>
              <h1>{page.title}</h1>
              <div className="study-detail__facts">
                <span className="fact">
                  Página <strong>{pageIdx + 1} de {book.pages.length}</strong>
                </span>
              </div>
            </header>

            <div className="biblia__toolbar">
              <Link className="btn btn--ghost" to="/biblia">
                ← Índice
              </Link>
              <div className="biblia__pager">
                <button type="button" className="btn btn--ghost" disabled={!prev} onClick={() => prev && go(prev.id)}>
                  ← Anterior
                </button>
                <button type="button" className="btn btn--ghost" disabled={!next} onClick={() => next && go(next.id)}>
                  Siguiente →
                </button>
              </div>
            </div>

            <div className="study-prose biblia__prose" dangerouslySetInnerHTML={{ __html: html }} />

            <div className="biblia__toolbar biblia__toolbar--end">
              <button type="button" className="btn btn--ghost" disabled={!prev} onClick={() => prev && go(prev.id)}>
                ← Anterior
              </button>
              <button type="button" className="btn btn--ghost" disabled={!next} onClick={() => next && go(next.id)}>
                Siguiente →
              </button>
            </div>
          </article>
        </div>
      </main>
    );
  }

  const reduced = prefersReduced();

  return (
    <main id="main" className="biblia">
      <section className="biblia__dome" aria-label="Índice visual de capítulos">
        <DomeGallery
          images={domeImages}
          overlayBlurColor="#0a0a0b"
          grayscale={false}
          openedImageWidth="min(78vw, 560px)"
          openedImageHeight="min(62vh, 560px)"
          imageBorderRadius="18px"
          openedImageBorderRadius="22px"
          enlargeTransitionMs={reduced ? 0 : 300}
          ctaLabel="Leer capítulo →"
          onNavigate={value => value && go(value)}
        />
        <div className="biblia__dome-head">
          <p className="eyebrow">Padres de la Iglesia</p>
          <h1>Biblia Patrística</h1>
          <p className="biblia__dome-lead">Del periodo apostólico al siglo VIII, una sola obra para recorrer la fe de los primeros siglos.</p>
        </div>
        <a className="biblia__dome-cue" href="#biblia-acerca">
          Acerca de esta obra <span aria-hidden="true">↓</span>
        </a>
      </section>

      <section className="section biblia__about" id="biblia-acerca">
        <div className="container biblia__about-grid">
          <figure className="biblia__cover">
            <img src={assetUrl('/img/biblia/portada.webp')} alt="Portada de la Biblia Patrística" loading="lazy" />
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
              No es una enciclopedia fría: es el pulso de Ignacio, Policarpo, Justino, Atanasio y Agustín latiendo
              página tras página. Recórrela como quien camina de sala en sala.
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
                  <CountUp to={totalChapters} duration={1.2} delay={0.15} />
                </span>
                <span className="biblia__stat-label">capítulos</span>
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

      <section className="section biblia__index-section">
        <div className="container biblia__index-grid">
          <BibliaMenu book={book} activeId={null} onSelect={go} />

          <div className="biblia__index-side">
            <p className="eyebrow">Navega por la obra</p>
            <h2>Índice</h2>
            <p className="biblia__index-hint">
              Despliega una parte en el menú y elige una página, o busca directamente una voz, una herejía o una
              cita.
            </p>
            <SearchBox query={query} setQuery={setQuery} results={results} onPick={go} />
          </div>
        </div>
      </section>
    </main>
  );
}
