import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import ConcaveCarousel from '../components/ConcaveCarousel/ConcaveCarousel';
import SkewedCarousel from '../components/SkewedCarousel/SkewedCarousel';
import Timeline from '../components/Timeline/Timeline';
import ViewToggle from '../components/ViewToggle/ViewToggle';
import { STUDIES, STUDY_CATEGORIES } from '../data/estudios';
import { PERSONAJES } from '../data/personajes';
import { TIMELINE } from '../data/timeline';
import { useSite, useSeo } from '../lib/site';

import './Estudio.css';

const normalize = s =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const COVERED_SLUGS = new Set(PERSONAJES.map(p => p.estudio).filter(Boolean));

const VIEWS = ['cards', 'list', 'carousel'];
const VIEW_KEY = 'crux:estudio-vista';

function readView() {
  try {
    const saved = localStorage.getItem(VIEW_KEY);
    return VIEWS.includes(saved) ? saved : 'cards';
  } catch {
    return 'cards';
  }
}

function pickFeatured(count) {
  const pool = [...STUDIES];
  const picks = [];
  while (picks.length < count && pool.length) {
    picks.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return picks;
}

function cardBody(s, Tag = 'h2', withCover = true) {
  return (
    <>
      {withCover && s.portada && (
        <div className="study-card__img">
          <img src={s.portada} alt="" loading="lazy" draggable={false} />
        </div>
      )}
      <div className="card__meta">
        <span>{s.categoryLabel}</span>
        {s.subcategory && (
          <>
            <span aria-hidden="true">/</span>
            <span>{s.subcategory}</span>
          </>
        )}
      </div>
      <Tag className="card__title">{s.title}</Tag>
      <p className="card__desc">{s.description}</p>
      <div className="card__footer">
        <span>{s.passage || 'Ficha de estudio'}</span>
        <span className="arrow" aria-hidden="true">
          →
        </span>
      </div>
    </>
  );
}

/** Tarjeta de la rejilla (estudio o personaje). */
function GridCard({ entry, index }) {
  const isPersonaje = entry.kind === 'personaje';
  const d = entry.data;

  return (
    <Link
      className={`card study-card${isPersonaje ? ' personaje-card' : ''}`}
      to={entry.href}
      style={{ '--reveal-d': `${(index % 9) * 55}ms` }}
    >
      {isPersonaje ? (
        <>
          <div className="personaje-card__img">
            <img src={d.portada} alt="" loading="lazy" />
          </div>
          <div className="card__meta">
            <span>{d.epoca}</span>
          </div>
          <h2 className="card__title">{d.nombre}</h2>
          <p className="card__desc">{d.resumen}</p>
          <div className="card__footer">
            <span>{d.rol}</span>
            <span className="arrow" aria-hidden="true">
              →
            </span>
          </div>
        </>
      ) : (
        cardBody(d)
      )}
    </Link>
  );
}

/** Fila compacta de la vista de lista. */
function ListRow({ entry, index }) {
  const isPersonaje = entry.kind === 'personaje';
  const d = entry.data;
  const meta = isPersonaje ? d.epoca : d.categoryLabel;
  const sub = isPersonaje ? d.rol : d.subcategory;
  const desc = isPersonaje ? d.resumen : d.description;
  const aside = isPersonaje ? d.rol : d.passage || 'Ficha de estudio';

  return (
    <Link className="row-card" to={entry.href}>
      <span className="row-card__num" aria-hidden="true">
        {String(index + 1).padStart(2, '0')}
      </span>
      <span className="row-card__thumb">
        {d.portada ? (
          <img src={d.portada} alt="" loading="lazy" />
        ) : (
          <span className="row-card__initial" aria-hidden="true">
            {(isPersonaje ? d.nombre : d.title).trim().charAt(0)}
          </span>
        )}
      </span>
      <span className="row-card__body">
        <span className="row-card__meta">
          {meta}
          {sub && (
            <>
              {' · '}
              {sub}
            </>
          )}
        </span>
        <span className="row-card__title">{isPersonaje ? d.nombre : d.title}</span>
        <span className="row-card__desc">{desc}</span>
      </span>
      <span className="row-card__aside">{aside}</span>
      <span className="arrow" aria-hidden="true">
        →
      </span>
    </Link>
  );
}

export default function Estudio() {
  const site = useSite();
  const personajesCat = site.personajesCategoryId;
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const activeCat = params.get('cat') || 'all';
  const initialQuery = params.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [view, setView] = useState(readView);
  const gridRef = useRef(null);

  useSeo({
    title: `${site.marca.nombre} — Estudio`,
    description: site.seo.description
  });

  useEffect(() => {
    try {
      localStorage.setItem(VIEW_KEY, view);
    } catch {
      /* modo privado: la preferencia vive solo en memoria */
    }
  }, [view]);

  const featured = useMemo(() => pickFeatured(5), []);

  const setCategory = id => {
    const next = new URLSearchParams(params);
    if (id === 'all') next.delete('cat');
    else next.set('cat', id);
    setParams(next, { replace: true });
  };

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    return STUDIES.filter(s => {
      if (activeCat === personajesCat && COVERED_SLUGS.has(s.slug)) return false;
      if (activeCat !== 'all' && s.category !== activeCat) return false;
      if (!q) return true;
      const haystack = normalize(
        [s.title, s.description, s.passage, s.subcategory, s.tags.join(' '), s.aliases.join(' ')].join(' ')
      );
      return haystack.includes(q);
    });
  }, [activeCat, query, personajesCat]);

  const isFiltered = activeCat !== 'all' || query.trim().length > 0;
  const isPersonajesCat = activeCat === personajesCat;

  const personajes = useMemo(() => {
    if (!isPersonajesCat) return [];
    const q = normalize(query.trim());
    if (!q) return PERSONAJES;
    return PERSONAJES.filter(p =>
      normalize([p.nombre, p.epoca, p.rol, p.resumen, p.tags.join(' ')].join(' ')).includes(q)
    );
  }, [isPersonajesCat, query]);

  /** El índice visible, en un único formato para las tres vistas. */
  const entries = useMemo(
    () => [
      ...personajes.map(p => ({
        kind: 'personaje',
        slug: p.slug,
        data: p,
        href: `/estudio/personajes/${p.slug}`
      })),
      ...filtered.map(s => ({ kind: 'estudio', slug: s.slug, data: s, href: `/estudio/${s.slug}` }))
    ],
    [personajes, filtered]
  );

  const isEmpty = entries.length === 0;
  const showGrid = view === 'cards';

  const activeCatObj = STUDY_CATEGORIES.find(c => c.id === activeCat);
  const activeLabel = activeCat === 'all' ? 'Todos' : activeCatObj?.label || 'Todos';
  const activeShort = activeCat === 'all' ? '' : activeCatObj?.short || '';

  // Reveal al entrar en pantalla + inclinación 3D siguiendo el puntero.
  // Sólo aplica a la rejilla: lista y carrusel tienen su propia animación.
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid || !showGrid) return undefined;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cards = Array.from(grid.querySelectorAll('.study-card'));

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
      { threshold: 0.12 }
    );
    cards.forEach(c => io.observe(c));

    let current = null;
    const reset = el => {
      el.style.setProperty('--tilt-x', '0deg');
      el.style.setProperty('--tilt-y', '0deg');
    };
    const onMove = e => {
      const card = e.target.closest?.('.study-card');
      if (!card || !grid.contains(card)) return;
      if (card !== current) {
        if (current) reset(current);
        current = card;
      }
      const r = card.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      card.style.setProperty('--tilt-x', `${(-ny * 7).toFixed(2)}deg`);
      card.style.setProperty('--tilt-y', `${(nx * 9).toFixed(2)}deg`);
    };
    const onLeave = () => {
      if (current) reset(current);
      current = null;
    };
    grid.addEventListener('pointermove', onMove, { passive: true });
    grid.addEventListener('pointerleave', onLeave, { passive: true });

    return () => {
      io.disconnect();
      grid.removeEventListener('pointermove', onMove);
      grid.removeEventListener('pointerleave', onLeave);
    };
  }, [entries, showGrid]);

  return (
    <main id="main" className="estudio">
      <header className="page-head">
        <div className="container">
          <p className="eyebrow">Segundo cerebro bíblico</p>
          <h1>Estudio</h1>
          <p className="lead">
            El índice completo de mis notas: {STUDIES.length} estudios organizados por categoría, cada uno
            con su pasaje clave y su resumen.
          </p>

          <div className="estudio__tools">
            <div className="estudio__toolbar">
              <div className="search">
                <label className="sr-only" htmlFor="buscador-estudio">
                  Buscar estudios
                </label>
                <input
                  id="buscador-estudio"
                  type="search"
                  className="search__input"
                  placeholder="Buscar por tema, pasaje o palabra…"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  autoComplete="off"
                />
              </div>

              <ViewToggle value={view} onChange={setView} />
            </div>

            <div className="chips" role="group" aria-label="Filtrar por categoría">
              <button
                type="button"
                className="chip"
                aria-pressed={activeCat === 'all'}
                onClick={() => setCategory('all')}
              >
                Todos <span className="chip__count">{STUDIES.length}</span>
              </button>
              {STUDY_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  className="chip"
                  aria-pressed={activeCat === cat.id}
                  onClick={() => setCategory(cat.id)}
                >
                  {cat.label}{' '}
                  <span className="chip__count">{cat.id === personajesCat ? PERSONAJES.length : cat.count}</span>
                </button>
              ))}
            </div>
          </div>

          <p className="estudio__count" role="status">
            {isPersonajesCat && (
              <>
                {personajes.length} {personajes.length === 1 ? 'personaje' : 'personajes'} ·{' '}
              </>
            )}
            {filtered.length} {filtered.length === 1 ? 'estudio' : 'estudios'} · {activeLabel}
          </p>
          {activeShort && <p className="estudio__cat-desc">{activeShort}</p>}
        </div>
      </header>

      {!isFiltered && (
        <section className="section estudio__featured" aria-label="Estudios destacados">
          <div className="container">
            <div className="estudio__featured-head">
              <p className="eyebrow">Empieza por aquí</p>
              <h2>Destacados</h2>
              <p className="estudio__featured-hint" aria-hidden="true">
                Arrastra o usa ← → para explorar
              </p>
            </div>
            <SkewedCarousel
              items={featured}
              cardWidth={300}
              aspectRatio="5 / 4"
              rotation={0}
              inactiveScale={0.9}
              hoverTilt={9}
              autoplay
              autoplayDelay={3500}
              loop
              showTitles={false}
              onItemClick={s => navigate(`/estudio/${s.slug}`)}
              renderItem={s => <article className="card study-card featured-card">{cardBody(s, 'h3', false)}</article>}
            />
          </div>
        </section>
      )}

      {!isFiltered && <Timeline events={TIMELINE} />}

      <section className="section">
        <div className="container">
          {isEmpty ? (
            <div className="empty-state">
              <h3>Ningún resultado coincide</h3>
              <p>Prueba con otra palabra o vuelve a ver todas las categorías.</p>
              <p>
                <button
                  type="button"
                  className="chip"
                  onClick={() => {
                    setQuery('');
                    setCategory('all');
                  }}
                >
                  Limpiar filtros
                </button>
              </p>
            </div>
          ) : (
            <>
              <h2 className="sr-only">
                {isPersonajesCat ? 'Índice de personajes y estudios' : 'Índice de estudios'}
              </h2>

              {view === 'list' ? (
                <div className="estudio__list">
                  {entries.map((entry, i) => (
                    <ListRow key={`${entry.kind}-${entry.slug}`} entry={entry} index={i} />
                  ))}
                </div>
              ) : view === 'carousel' ? (
                <ConcaveCarousel
                  items={entries}
                  itemWidth={300}
                  height={372}
                  label={isPersonajesCat ? 'Carrusel de personajes y estudios' : 'Carrusel de estudios'}
                  getKey={entry => `${entry.kind}-${entry.slug}`}
                  renderItem={(entry, i) => <GridCard entry={entry} index={i} />}
                />
              ) : (
                <div ref={gridRef} className="grid grid--3 estudio__grid">
                  {entries.map((entry, i) => (
                    <GridCard key={`${entry.kind}-${entry.slug}`} entry={entry} index={i} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
