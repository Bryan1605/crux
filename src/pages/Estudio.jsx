import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import ConcaveCarousel from '../components/ConcaveCarousel/ConcaveCarousel';
import SkewedCarousel from '../components/SkewedCarousel/SkewedCarousel';
import StudyCard from '../components/StudyCard/StudyCard';
import Timeline from '../components/Timeline/Timeline';
import ViewToggle from '../components/ViewToggle/ViewToggle';
import { STUDIES, STUDY_CATEGORIES } from '../data/estudios';
import { PERSONAJES } from '../data/personajes';
import { ENTRADAS, temaId, temasDeCategoria } from '../data/temas';
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


/** Fila de la vista de lista: índice tipo libro (Nº · Ficha · Pasaje). */
function ListRow({ entry, index }) {
  const isPersonaje = entry.kind === 'personaje';
  const d = entry.data;
  const desc = isPersonaje ? d.resumen : d.description;
  const aside = isPersonaje ? d.rol : d.passage || 'Ficha de estudio';

  return (
    <Link className="row-card" to={entry.href}>
      <span className="row-card__num" aria-hidden="true">
        {String(index + 1).padStart(2, '0')}
      </span>
      <span className="row-card__body">
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

function ListHead() {
  return (
    <div className="estudio__list-head" aria-hidden="true">
      <span>Nº</span>
      <span>Ficha</span>
      <span>Pasaje</span>
    </div>
  );
}

const fichas = (n, kind = 'estudio') =>
  `${n} ${kind === 'personaje' ? (n === 1 ? 'personaje' : 'personajes') : n === 1 ? 'ficha' : 'fichas'}`;

/**
 * Agrupa el índice por tema (`content/temas.json`, en su orden). Arriba la
 * ficha de entrada («Empieza aquí») y los retratos de personajes; los temas que
 * no están en `temas.json` van después, y las fichas sin tema al final. Los
 * grupos vacíos (p. ej. con una búsqueda) no se devuelven. `null` si la
 * categoría no tiene temas: entonces el índice va sin agrupar.
 */
function buildGroups(entries, catId) {
  if (catId === 'all') return null;
  const temas = temasDeCategoria(catId);
  const estudios = entries.filter(e => e.kind === 'estudio');
  if (!temas.length && !estudios.some(e => e.data.subcategory)) return null;

  const entradas = new Set(ENTRADAS[catId] || []);
  const entrada = [];
  const retratos = [];
  const otras = [];
  const porTema = new Map(temas.map(t => [t.key, []]));
  const extra = new Map();

  for (const e of entries) {
    const sub = e.data.subcategory;
    if (e.kind === 'personaje') retratos.push(e);
    else if (entradas.has(e.slug)) entrada.push(e);
    else if (!sub) otras.push(e);
    else if (porTema.has(sub)) porTema.get(sub).push(e);
    else {
      if (!extra.has(sub)) extra.set(sub, []);
      extra.get(sub).push(e);
    }
  }

  const groups = [
    { id: 'tema-empieza-aqui', label: 'Empieza aquí', kind: 'entrada', items: entrada },
    { id: 'tema-personajes', label: 'Personajes con historia', kind: 'personaje', items: retratos },
    ...temas.map(t => ({ id: temaId(t.key), label: t.label, lema: t.lema, kind: 'tema', items: porTema.get(t.key) })),
    ...[...extra.entries()]
      .sort(([a], [b]) => a.localeCompare(b, 'es'))
      .map(([key, items]) => ({ id: temaId(key), label: key, kind: 'tema', items })),
    { id: 'tema-otras', label: 'Otras fichas', kind: 'otras', items: otras }
  ].filter(g => g.items.length);

  let start = 0;
  for (const g of groups) {
    g.start = start;
    start += g.items.length;
  }
  return groups;
}

/** Encabezado de un grupo: «Salvación · 17 fichas» + lema. */
function GroupHead({ group }) {
  return (
    <div className="estudio__group-head">
      <h2 id={group.id} tabIndex={-1}>
        {group.label} <span className="estudio__group-count">· {fichas(group.items.length, group.kind)}</span>
      </h2>
      {group.lema && <p className="estudio__group-lema">{group.lema}</p>}
    </div>
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
    description: `${STUDIES.length} fichas en ${STUDY_CATEGORIES.length} categorías: ${STUDY_CATEGORIES.map(c => c.label).join(', ')}.`
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

  /** Grupos por tema (o `null`) y la secuencia ordenada que comparten las tres vistas. */
  const groups = useMemo(() => buildGroups(entries, activeCat), [entries, activeCat]);
  const ordered = useMemo(() => (groups ? groups.flatMap(g => g.items) : entries), [groups, entries]);
  const showSide = Boolean(groups) && view !== 'carousel';

  const [activeTema, setActiveTema] = useState(null);
  const clickLockRef = useRef(0);
  const carouselRef = useRef(null);
  const [carIndex, setCarIndex] = useState(0);
  const carGroup = groups?.find(g => carIndex >= g.start && carIndex < g.start + g.items.length);

  // Scrollspy: el tema activo es el primer grupo que cruza la franja superior.
  useEffect(() => {
    if (!showSide) return undefined;
    const sections = groups.map(g => document.querySelector(`[data-group="${g.id}"]`)).filter(Boolean);
    if (!sections.length) return undefined;
    setActiveTema(groups[0].id);
    const visible = new Set();
    const io = new IntersectionObserver(
      list => {
        for (const e of list) {
          if (e.isIntersecting) visible.add(e.target);
          else visible.delete(e.target);
        }
        if (Date.now() < clickLockRef.current) return;
        const first = sections.find(s => visible.has(s));
        if (first) setActiveTema(first.dataset.group);
      },
      { rootMargin: '-140px 0px -50% 0px' }
    );
    sections.forEach(s => io.observe(s));
    return () => io.disconnect();
  }, [groups, showSide]);

  // Entrar con #tema-… en la URL: bajar a ese grupo cuando ya está pintado.
  useEffect(() => {
    if (!showSide) return;
    const id = window.location.hash.slice(1);
    if (id.startsWith('tema-')) document.getElementById(id)?.scrollIntoView({ block: 'start' });
  }, [activeCat, showSide]);

  const goToTema = id => event => {
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    clickLockRef.current = Date.now() + 1000;
    setActiveTema(id);
    target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    target.focus({ preventScroll: true });
  };

  // Reveal al entrar en pantalla + inclinación 3D siguiendo el puntero.
  // Sólo aplica a la rejilla: lista y carrusel tienen su propia animación.
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid || !showGrid) return undefined;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cards = Array.from(grid.querySelectorAll('.estudio__grid .study-card'));

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
      const card = e.target.closest?.('.estudio__grid .study-card');
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
  }, [ordered, showGrid]);

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
              aspectRatio="300 / 572"
              rotation={0}
              inactiveScale={0.9}
              hoverTilt={9}
              autoplay
              autoplayDelay={3500}
              loop
              showTitles={false}
              onItemClick={s => navigate(`/estudio/${s.slug}`)}
              renderItem={s => (
                <StudyCard
                  entry={{ kind: 'estudio', data: s, href: `/estudio/${s.slug}` }}
                  headingLevel={3}
                  linked={false}
                  className="featured-card"
                />
              )}
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

              {view === 'carousel' ? (
                <>
                  <ConcaveCarousel
                    ref={carouselRef}
                    items={ordered}
                    itemWidth={300}
                    height={572}
                    label={isPersonajesCat ? 'Carrusel de personajes y estudios' : 'Carrusel de estudios'}
                    getKey={entry => `${entry.kind}-${entry.slug}`}
                    renderItem={(entry, i) => <StudyCard entry={entry} index={i} headingLevel={3} />}
                    onIndexChange={setCarIndex}
                  />
                  <div className="estudio__carousel-info">
                    <p className="estudio__carousel-count">
                      {Math.min(carIndex + 1, ordered.length)} de {ordered.length}
                      {carGroup && <> · {carGroup.label}</>}
                    </p>
                    <div className="estudio__progress" aria-hidden="true">
                      <span style={{ width: `${(Math.min(carIndex + 1, ordered.length) / ordered.length) * 100}%` }} />
                    </div>
                    {groups && groups.length > 1 && (
                      <nav className="estudio__jump" aria-label="Saltar a un tema del carrusel">
                        <span className="estudio__jump-label">Saltar a:</span>
                        {groups.map(g => (
                          <button
                            key={g.id}
                            type="button"
                            className="estudio__jump-btn"
                            aria-current={carGroup?.id === g.id ? 'true' : undefined}
                            onClick={() => carouselRef.current?.scrollToIndex(g.start)}
                          >
                            {g.label}
                          </button>
                        ))}
                      </nav>
                    )}
                  </div>
                </>
              ) : (
                <div className={showSide ? 'estudio__layout' : undefined}>
                  {showSide && (
                    <nav className="estudio__side" aria-label={`Temas de ${activeLabel}`}>
                      <ul>
                        {groups.map(g => (
                          <li key={g.id}>
                            <a
                              href={`#${g.id}`}
                              data-kind={g.kind}
                              aria-current={activeTema === g.id ? 'true' : undefined}
                              onClick={goToTema(g.id)}
                            >
                              <span className="estudio__side-label">{g.label}</span>
                              <span className="estudio__side-count">{g.items.length}</span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    </nav>
                  )}

                  <div ref={gridRef} className="estudio__results">
                    {(groups || [{ id: 'todo', items: entries, start: 0 }]).map(g => (
                      <section
                        key={g.id}
                        className="estudio__group"
                        data-group={groups ? g.id : undefined}
                        aria-labelledby={groups ? g.id : undefined}
                      >
                        {groups && <GroupHead group={g} />}
                        {view === 'list' ? (
                          <div className="estudio__list">
                            <ListHead />
                            {g.items.map((entry, i) => (
                              <ListRow key={`${entry.kind}-${entry.slug}`} entry={entry} index={g.start + i} />
                            ))}
                          </div>
                        ) : (
                          <div className="grid grid--3 estudio__grid">
                            {g.items.map((entry, i) => (
                              <StudyCard
                                key={`${entry.kind}-${entry.slug}`}
                                entry={entry}
                                index={i}
                                headingLevel={groups ? 3 : 2}
                              />
                            ))}
                          </div>
                        )}
                      </section>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
