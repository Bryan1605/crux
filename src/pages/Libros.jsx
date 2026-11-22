import { useEffect, useMemo, useRef, useState } from 'react';

import StudyCard from '../components/StudyCard/StudyCard';
import { LIBROS, LIBROS_CANON } from '../data/libros';
import { ERAS_BIBLICAS, LIBRO_META, LIBRO_PORTADAS, SECCIONES_BIBLICAS } from '../data/librosCatalogo';
import { assetUrl } from '../lib/assets';
import { librosIndexSeo } from '../lib/librosSeo';
import { useSite, useSeo } from '../lib/site';

import './Estudio.css';
import './Libros.css';

const numFmt = new Intl.NumberFormat('es-ES');

const normalize = s =>
  String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

function buildCardItems() {
  return LIBROS_CANON.map(({ book, ficha }) => {
    const meta = LIBRO_META[book.id] || {};
    const portadaPath = LIBRO_PORTADAS[book.id] || null;
    const label = book.codexOnly
      ? 'Codex Sinaiticus'
      : book.testament === 'AT'
        ? 'Antiguo Testamento'
        : 'Nuevo Testamento';
    return {
      book,
      ficha,
      meta,
      entry: {
        kind: 'libro',
        href: `/biblia/libros/${book.id}`,
        data: {
          abbr: book.abbr,
          title: book.name,
          portada: portadaPath ? assetUrl(portadaPath) : null,
          badge: book.codexOnly
            ? `Codex · ${meta.chapters || 0} cap.`
            : meta.chapters
              ? `${meta.chapters} cap.`
              : '',
          meta: [meta.sectionLabel, label].filter(Boolean).join(' · '),
          genre: ficha?.genre?.[0] || '',
          summary: ficha?.summary || 'Ficha en preparación.',
          chapters: meta.chapters ?? '—',
          versesFormatted: meta.verses ? numFmt.format(meta.verses) : '—',
          witnesses: meta.witnesses || (book.codexOnly ? 'Codex' : 'NTV')
        }
      }
    };
  });
}

function BloqueLibros({ id, eyebrow, title, countLabel, note, items, codex = false }) {
  if (!items.length) return null;
  return (
    <section
      id={id}
      className={`libros__bloque${codex ? ' libros__bloque--codex' : ''}`}
      aria-labelledby={`${id}-titulo`}
    >
      <header className="libros__bloque-head">
        <div>
          <p className={codex ? 'libros__codex-kicker' : 'eyebrow'}>{eyebrow}</p>
          <h2 id={`${id}-titulo`}>{title}</h2>
        </div>
        <p className="libros__bloque-count">{countLabel}</p>
      </header>
      {note && <p className="libros__bloque-note">{note}</p>}
      <ol className="estudio__grid libros__grid">
        {items.map(({ book, entry }, index) => (
          <li key={book.id} className="libros__item has-ficha">
            <StudyCard
              entry={entry}
              headingLevel={3}
              index={index}
              className={`study-card--libro${codex ? ' study-card--codex' : ''}`}
            />
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Índice cronológico y canónico de los 73 libros de la Biblia. */
export default function Libros() {
  const site = useSite();
  useSeo(librosIndexSeo(site.marca.nombre));

  const [era, setEra] = useState('todas');
  const [seccion, setSeccion] = useState('todas');
  const [query, setQuery] = useState('');
  const catalogRef = useRef(null);

  const items = useMemo(buildCardItems, []);

  const sectionCounts = useMemo(() => {
    const map = { todas: items.length };
    for (const s of SECCIONES_BIBLICAS) {
      if (s.id !== 'todas') map[s.id] = 0;
    }
    for (const { meta } of items) {
      if (meta.section && meta.section in map) map[meta.section] += 1;
    }
    return map;
  }, [items]);

  const filtrados = useMemo(() => {
    const q = normalize(query.trim());
    return items.filter(({ book, ficha, meta }) => {
      if (era !== 'todas' && meta.era !== era) return false;
      if (seccion !== 'todas' && meta.section !== seccion) return false;
      if (!q) return true;
      const hay = normalize(
        [book.name, book.abbr, meta.sectionLabel, meta.witnesses, ficha?.summary, ...(ficha?.genre || [])].join(' ')
      );
      return hay.includes(q);
    });
  }, [items, era, seccion, query]);

  const atBooks = useMemo(() => filtrados.filter(x => x.book.testament === 'AT' && !x.book.codexOnly), [filtrados]);
  const codexBooks = useMemo(() => filtrados.filter(x => Boolean(x.book.codexOnly)), [filtrados]);
  const ntBooks = useMemo(() => filtrados.filter(x => x.book.testament === 'NT'), [filtrados]);

  const hasFilter = era !== 'todas' || seccion !== 'todas' || query.trim().length > 0;
  const activeEraObj = ERAS_BIBLICAS.find(e => e.id === era) || null;
  const activeSecObj = SECCIONES_BIBLICAS.find(s => s.id === seccion) || null;

  const toggleEra = id => {
    setEra(current => (current === id ? 'todas' : id));
    setSeccion('todas');
  };

  const selectSeccion = id => {
    setSeccion(id);
    setEra('todas');
  };

  const resetAll = () => {
    setEra('todas');
    setSeccion('todas');
    setQuery('');
  };

  // Aparición progresiva e inclinación 3D al puntero igual que en `/estudio`.
  useEffect(() => {
    const root = catalogRef.current;
    if (!root) return undefined;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cards = Array.from(root.querySelectorAll('.libros__grid .study-card'));
    if (!cards.length) return undefined;

    if (reduced) {
      cards.forEach(c => c.classList.add('is-revealed'));
      return undefined;
    }

    const io = new IntersectionObserver(
      entriesToCheck => {
        for (const entry of entriesToCheck) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.05, rootMargin: '180px 0px 180px 0px' }
    );
    cards.forEach(c => io.observe(c));

    let current = null;
    const resetTilt = el => {
      el.style.setProperty('--tilt-x', '0deg');
      el.style.setProperty('--tilt-y', '0deg');
    };
    const onMove = e => {
      const card = e.target.closest?.('.libros__grid .study-card');
      if (!card || !root.contains(card)) return;
      if (card !== current) {
        if (current) resetTilt(current);
        current = card;
      }
      const r = card.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      card.style.setProperty('--tilt-x', `${(-ny * 6).toFixed(2)}deg`);
      card.style.setProperty('--tilt-y', `${(nx * 8).toFixed(2)}deg`);
    };
    const onLeave = () => {
      if (current) resetTilt(current);
      current = null;
    };
    root.addEventListener('pointermove', onMove, { passive: true });
    root.addEventListener('pointerleave', onLeave, { passive: true });

    return () => {
      io.disconnect();
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerleave', onLeave);
    };
  }, [filtrados]);

  return (
    <main id="main" className="libros">
      <header className="libros__hero">
        <div className="container libros__hero-in">
          <div className="libros__crest" aria-hidden="true">
            <span className="libros__crest-line" />
            <svg viewBox="0 0 24 32" width="18" height="24" focusable="false">
              <path
                d="M12 2v28M7.5 7.5h9M5 13h14M8.5 23.5l7-3"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <p className="libros__eyebrow">Biblia · Canon y testimonio histórico</p>
          <h1>Libros de la Biblia</h1>
          <p className="lead libros__lead">
            {LIBROS.length === LIBROS_CANON.length
              ? `Los ${LIBROS_CANON.length} libros de la tabla canónica con ficha introductoria, cronología y contexto textual (66 en la NTV y 7 conservados solo en el Codex Sinaiticus).`
              : `Una ficha por libro: género, contexto, transmisión y canon. Hay ${LIBROS.length} de ${LIBROS_CANON.length}.`}
          </p>

          <ul className="libros__pills" aria-label="Resumen de la colección">
            <li>
              <span className="libros__dot" aria-hidden="true" />
              <strong>{LIBROS_CANON.length} libros</strong> en la tabla canónica
            </li>
            <li>
              <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true" focusable="false">
                <circle cx="10" cy="10" r="7.2" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <path d="M10 6v4.2l2.8 1.6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Del Antiguo Oriente al s. I d.C.
            </li>
            <li>
              <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true" focusable="false">
                <path
                  d="M3.5 5.5h6v10h-6zM10.5 5.5h6v10h-6zM3.5 5.5c2 0 4.5.8 6 2M16.5 5.5c-2 0-4.5.8-6 2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
              </svg>
              Hebreo, arameo y griego koiné
            </li>
          </ul>

          <div className="libros__crono">
            <div className="libros__crono-head">
              <h2 id="libros-crono" className="libros__crono-title">
                <span className="libros__dot" aria-hidden="true" />
                Eje cronológico
              </h2>
              {era !== 'todas' ? (
                <button type="button" className="libros__crono-reset" onClick={() => setEra('todas')}>
                  Ver todas las eras ×
                </button>
              ) : (
                <p className="libros__crono-hint">Selecciona una era para filtrar instantáneamente</p>
              )}
            </div>

            <div className="libros__eras" role="group" aria-labelledby="libros-crono">
              {ERAS_BIBLICAS.map(item => {
                const active = era === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`libros__era${active ? ' is-active' : ''}`}
                    aria-pressed={active}
                    onClick={() => toggleEra(item.id)}
                  >
                    <span className="libros__era-node" aria-hidden="true" />
                    <span className="libros__era-tag">{item.tag}</span>
                    <span className="libros__era-title">{item.title}</span>
                    <span className="libros__era-sub">{item.sub}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      <section className="libros__catalogo" ref={catalogRef}>
        <div className="container">
          <div className="libros__toolbar">
            <div className="chips libros__filtros" role="group" aria-label="Filtrar libros por sección">
              {SECCIONES_BIBLICAS.map(sec => (
                <button
                  key={sec.id}
                  type="button"
                  className={`chip libros__chip${sec.accent ? ' libros__chip--codex' : ''}`}
                  aria-pressed={seccion === sec.id && era === 'todas'}
                  onClick={() => selectSeccion(sec.id)}
                >
                  {sec.label} <span className="chip__count">{sectionCounts[sec.id] ?? 0}</span>
                </button>
              ))}
            </div>

            <div className="libros__search-row">
              <div className="libros__search">
                <label className="sr-only" htmlFor="buscador-libros">
                  Buscar libro de la Biblia
                </label>
                <input
                  id="buscador-libros"
                  type="search"
                  className="search__input libros__search-input"
                  placeholder="Buscar por nombre, abreviatura (Gn, Sal, Ro) o género…"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  autoComplete="off"
                />
              </div>

              <div className="libros__status" role="status">
                <span>
                  {filtrados.length} {filtrados.length === 1 ? 'libro' : 'libros'}
                  {activeEraObj ? ` · ${activeEraObj.title}` : activeSecObj && seccion !== 'todas' ? ` · ${activeSecObj.label}` : ''}
                </span>
                {hasFilter && (
                  <button type="button" className="libros__clear" onClick={resetAll}>
                    Limpiar filtro
                  </button>
                )}
              </div>
            </div>
          </div>

          {filtrados.length === 0 ? (
            <div className="libros__vacio">
              <p>Ningún libro coincide con los filtros actuales.</p>
              <button type="button" className="btn btn--ghost" onClick={resetAll}>
                Mostrar los 73 libros
              </button>
            </div>
          ) : (
            <div className="libros__bloques">
              <BloqueLibros
                id="bloque-at"
                eyebrow="Escrituras Hebreas y Arameas"
                title="Antiguo Testamento"
                countLabel={`${atBooks.length} ${atBooks.length === 1 ? 'libro' : 'libros'} · NTV y fragmentos del Codex`}
                items={atBooks}
              />

              <BloqueLibros
                id="bloque-codex"
                eyebrow="Codex Sinaiticus · Testigo griego s. IV (א)"
                title="Los 7 libros adicionales del Codex Sinaiticus"
                countLabel={`${codexBooks.length} ${codexBooks.length === 1 ? 'libro preservado' : 'libros preservados'} en griego`}
                note="Obras deuterocanónicas e históricas transmitidas en el manuscrito del Codex Sinaiticus (British Library Add. 43725) y no incluidas en la NTV: 2 Esdras (Esdras–Nehemías griego), Tobit, Judit, 1 Macabeos, 4 Macabeos, Sabiduría y Sirácida."
                items={codexBooks}
                codex
              />

              <BloqueLibros
                id="bloque-nt"
                eyebrow="Canon Apostólico"
                title="Nuevo Testamento"
                countLabel={`${ntBooks.length} ${ntBooks.length === 1 ? 'libro' : 'libros'} · NTV y Codex Sinaiticus`}
                items={ntBooks}
              />
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
