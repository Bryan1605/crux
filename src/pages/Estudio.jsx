import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import DollyGallery from '../components/DollyGallery/DollyGallery';
import SkewedCarousel from '../components/SkewedCarousel/SkewedCarousel';
import { STUDIES, STUDY_CATEGORIES } from '../data/estudios';
import { PERSONAJES } from '../data/personajes';

import './Estudio.css';

const normalize = s =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const COVERED_SLUGS = new Set(PERSONAJES.map(p => p.estudio).filter(Boolean));

function pickFeatured(count) {
  const pool = [...STUDIES];
  const picks = [];
  while (picks.length < count && pool.length) {
    picks.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return picks;
}

function cardBody(s, Tag = 'h2') {
  return (
    <>
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

export default function Estudio() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const activeCat = params.get('cat') || 'all';
  const initialQuery = params.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const gridRef = useRef(null);

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
      if (activeCat === '03-personajes' && COVERED_SLUGS.has(s.slug)) return false;
      if (activeCat !== 'all' && s.category !== activeCat) return false;
      if (!q) return true;
      const haystack = normalize(
        [s.title, s.description, s.passage, s.subcategory, s.tags.join(' '), s.aliases.join(' ')].join(' ')
      );
      return haystack.includes(q);
    });
  }, [activeCat, query]);

  const isFiltered = activeCat !== 'all' || query.trim().length > 0;
  const isPersonajesCat = activeCat === '03-personajes';

  const personajes = useMemo(() => {
    if (!isPersonajesCat) return [];
    const q = normalize(query.trim());
    if (!q) return PERSONAJES;
    return PERSONAJES.filter(p =>
      normalize([p.nombre, p.epoca, p.rol, p.resumen, p.tags.join(' ')].join(' ')).includes(q)
    );
  }, [isPersonajesCat, query]);

  const personajeItems = useMemo(() => {
    if (!isPersonajesCat) return [];
    return [
      ...personajes.map(p => ({ kind: 'personaje', slug: p.slug, data: p })),
      ...filtered.map(s => ({ kind: 'estudio', slug: s.slug, data: s }))
    ];
  }, [isPersonajesCat, personajes, filtered]);

  const dollyItems = isPersonajesCat
    ? personajeItems
    : filtered.map(s => ({ kind: 'estudio', slug: s.slug, data: s }));
  const isDolly = isFiltered && dollyItems.length >= 2 && dollyItems.length <= 9;
  const isEmpty = filtered.length === 0 && personajes.length === 0;

  const activeLabel =
    activeCat === 'all' ? 'Todos' : STUDY_CATEGORIES.find(c => c.id === activeCat)?.label || 'Todos';

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid || isDolly) return undefined;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cards = Array.from(grid.querySelectorAll('.study-card'));

    if (reduced) {
      cards.forEach(c => c.classList.add('is-revealed'));
      return undefined;
    }

    const io = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
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
  }, [filtered, personajes, isDolly]);

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
                  <span className="chip__count">{cat.id === '03-personajes' ? PERSONAJES.length : cat.count}</span>
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
              renderItem={s => <article className="card study-card featured-card">{cardBody(s, 'h3')}</article>}
            />
          </div>
        </section>
      )}

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
          ) : isDolly ? (
            <>
              <p className="estudio__dolly-hint" aria-hidden="true">
                Rueda, arrastra o usa ← → · Enter para abrir
              </p>
              <DollyGallery
                images={dollyItems}
                itemWidth={330}
                aspectRatio={0.78}
                grayscale={0}
                spacing={720}
                infinite={dollyItems.length > 5}
                onItemClick={item =>
                  navigate(item.kind === 'personaje' ? `/estudio/personajes/${item.slug}` : `/estudio/${item.slug}`)
                }
                renderItem={item =>
                  item.kind === 'personaje' ? (
                    <article className="card study-card dolly-card personaje-card">
                      <div className="personaje-card__img">
                        <img src={item.data.portada} alt="" draggable={false} />
                      </div>
                      <div className="card__meta">
                        <span>{item.data.epoca}</span>
                      </div>
                      <h3 className="card__title">{item.data.nombre}</h3>
                      <div className="card__footer">
                        <span>{item.data.rol}</span>
                        <span className="arrow" aria-hidden="true">
                          →
                        </span>
                      </div>
                    </article>
                  ) : (
                    <article className="card study-card dolly-card">{cardBody(item.data)}</article>
                  )
                }
              />
            </>
          ) : (
            <>
              <h2 className="sr-only">
                {isPersonajesCat ? 'Índice de personajes y estudios' : 'Índice de estudios'}
              </h2>
              <div ref={gridRef} className="grid grid--3 estudio__grid">
                {personajes.map((p, i) => (
                  <Link
                    key={`p-${p.slug}`}
                    className="card study-card personaje-card"
                    to={`/estudio/personajes/${p.slug}`}
                    style={{ '--reveal-d': `${(i % 9) * 55}ms` }}
                  >
                    <div className="personaje-card__img">
                      <img src={p.portada} alt="" loading="lazy" />
                    </div>
                    <div className="card__meta">
                      <span>{p.epoca}</span>
                    </div>
                    <h3 className="card__title">{p.nombre}</h3>
                    <p className="card__desc">{p.resumen}</p>
                    <div className="card__footer">
                      <span>{p.rol}</span>
                      <span className="arrow" aria-hidden="true">
                        →
                      </span>
                    </div>
                  </Link>
                ))}
                {filtered.map((s, i) => (
                  <Link
                    key={s.slug}
                    className="card study-card"
                    to={`/estudio/${s.slug}`}
                    style={{ '--reveal-d': `${((i + personajes.length) % 9) * 55}ms` }}
                  >
                    {cardBody(s)}
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
