import { Suspense, lazy } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import LiquidSwap from '../components/LiquidSwap/LiquidSwap';
import ScrollReveal from '../components/ScrollReveal/ScrollReveal';
import { useSite, useSeo } from '../lib/site';

const CrossLanyard = lazy(() => import('../components/CrossLanyard/CrossLanyard'));

import { SLIDES } from '../data/slides';
import { STUDIES, STUDY_CATEGORIES } from '../data/estudios';
import { PERSONAJES } from '../data/personajes';
import { CONCILIOS, CONCILIOS_LIST } from '../data/concilios';
import { NARRACIONES } from '../data/narraciones';
import { NT_BOOKS } from '../data/exegesis';
import { VIDEOS } from '../data/videos';

import './Home.css';

/* -------------------------------------------------------------------------- */
/* Datos reales del sitio (nada escrito a mano: sale del contenido)           */
/* -------------------------------------------------------------------------- */

/** Cifras de portada. */
const CIFRAS = [
  { valor: STUDIES.length, label: 'fichas de estudio' },
  { valor: STUDY_CATEGORIES.length, label: 'categorías' },
  { valor: PERSONAJES.length, label: 'personajes con ficha' },
  { valor: NT_BOOKS.length, label: 'libros del Nuevo Testamento' },
  { valor: CONCILIOS.length, label: 'concilios y herejías' },
  { valor: NARRACIONES.length, label: 'capítulos con audio' }
];

/**
 * Personajes destacados: primero los que ya tienen la ficha ilustrada (escenas
 * de su vida), y se completa con el resto si algún día faltan. Nunca inventa: si
 * no hay portada, la tarjeta se pinta sin imagen.
 */
const DESTACADOS = (() => {
  const ilustrados = PERSONAJES.filter(p => (p.escenas?.length || 0) >= 7);
  return [...ilustrados, ...PERSONAJES.filter(p => !ilustrados.includes(p))].slice(0, 4);
})();

/** Concilios del escaparate: el primero, Nicea y Calcedonia (con su ancla real). */
const HITOS = (() => {
  const ids = ['jerusalen', 'nicea', 'calcedonia'];
  const elegidos = ids.map(id => CONCILIOS_LIST.find(c => c.id === id)).filter(Boolean);
  for (const c of CONCILIOS_LIST) {
    if (elegidos.length >= 3) break;
    if (!elegidos.includes(c)) elegidos.push(c);
  }
  return elegidos.slice(0, 3);
})();

/** Puertas de la biblioteca: mismo orden que las tarjetas editables del panel. */
const PUERTAS = ['/biblia', '/biblia/ntv', '/exegesis'];

/** Recorta un resumen largo sin partir la última palabra. */
function corto(texto, max = 150) {
  const t = String(texto || '').trim();
  if (t.length <= max) return t;
  const recorte = t.slice(0, max);
  return `${recorte.slice(0, recorte.lastIndexOf(' '))}…`;
}

export default function Home() {
  const site = useSite();
  const { home } = site;
  const navigate = useNavigate();
  const hayVideos = VIDEOS.length > 0;

  useSeo({ title: site.seo.title, description: site.seo.description });

  /** El buscador del héroe lleva a la búsqueda global con la consulta. */
  const onBuscar = event => {
    event.preventDefault();
    const q = event.currentTarget.elements.q.value.trim();
    if (q) navigate(`/buscar?q=${encodeURIComponent(q)}`);
  };

  return (
    <main id="main">
      {/* Hero: la cruz ortodoxa colgando, arrastrable */}
      <section className="hero">
        <div className="hero__stage">
          <Suspense fallback={<div className="cross-lanyard-wrapper" aria-hidden="true" />}>
            <CrossLanyard position={[0, 0, 16]} gravity={[0, -40, 0]} />
          </Suspense>
        </div>

        <div className="hero__copy">
          <div className="container">
            <p className="eyebrow">{home.hero.eyebrow}</p>
            <h1>{home.hero.title}</h1>
            <p className="lead">{home.hero.lead}</p>

            <div className="hero__actions">
              {/* Una sola acción primaria. La secundaria solo existe si hay videos. */}
              <Link className="btn btn--primary" to={home.hero.ctaPrimary.href}>
                {home.hero.ctaPrimary.label}
              </Link>
              {hayVideos && (
                <Link className="btn btn--ghost" to={home.hero.ctaSecondary.href}>
                  {home.hero.ctaSecondary.label}
                </Link>
              )}
            </div>

            <form className="hero__search" aria-label="Buscar en el sitio" onSubmit={onBuscar}>
              <label className="sr-only" htmlFor="home-buscar">
                Buscar en el sitio
              </label>
              <input
                id="home-buscar"
                name="q"
                type="search"
                placeholder="Busca: perdón, Nicea, justificación…"
                autoComplete="off"
              />
              <button className="btn btn--ghost" type="submit">
                Buscar
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Textos que aparecen al bajar */}
      <section className="section manifesto">
        <div className="container manifesto__inner">
          {home.manifesto.map((line, i) => (
            <ScrollReveal
              key={i}
              containerClassName="manifesto__line"
              baseOpacity={0.4}
              baseRotation={i % 2 === 0 ? 4 : -3}
              blurStrength={8}
            >
              {line}
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* El estudio en números */}
      <section className="section section--alt stats" aria-labelledby="cifras-title">
        <div className="container">
          <h2 id="cifras-title" className="sr-only">
            El estudio en números
          </h2>
          <dl className="stats__grid">
            {CIFRAS.map(c => (
              <div className="stats__item" key={c.label}>
                <dt className="stats__label">{c.label}</dt>
                <dd className="stats__value">{c.valor}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Categorías: el mapa del estudio */}
      <section className="section" aria-labelledby="categorias-title">
        <div className="container">
          <div className="home-head">
            <p className="eyebrow">Mapa del estudio</p>
            <h2 id="categorias-title">Diez caminos para entrar</h2>
            <p className="lead">
              Cada categoría agrupa fichas con el mismo método: pasaje clave, contexto, exégesis y
              aplicación.
            </p>
          </div>

          <div className="cats__grid">
            {STUDY_CATEGORIES.map(cat => (
              <Link className="card cat-card" key={cat.id} to={`/estudio?cat=${cat.id}`}>
                <div className="card__meta">
                  <span>{cat.count} fichas</span>
                </div>
                <h3 className="card__title">{cat.label}</h3>
                <p className="card__desc">{cat.short}</p>
                <div className="card__footer">
                  <span>Ver la categoría</span>
                  <span className="arrow" aria-hidden="true">
                    →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Hero-banner (LiquidSwap) */}
      <section className="banner" aria-label="Banner de estudios">
        <LiquidSwap
          images={SLIDES.map(s => s.image)}
          transitionDuration={2.2}
          autoCycle={SLIDES.length > 1}
          autoCycleDelay={5000}
          startAtCursor
        />
        <div className="banner__overlay">
          <div className="container banner__row">
            <span className="banner__kicker">{home.banner.kicker}</span>
            {SLIDES[0]?.caption && <span className="banner__caption">{SLIDES[0].caption}</span>}
            {/* Enlace discreto: la acción primaria sigue siendo una sola (el estudio). */}
            <Link className="banner__link" to={SLIDES[0]?.href || home.banner.cta.href}>
              {home.banner.cta.label} <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* La biblioteca: Biblia Patrística, NTV y exégesis comparada */}
      <section className="section section--alt" aria-labelledby="biblia-title">
        <div className="container">
          <div className="home-head">
            <p className="eyebrow">{home.bridges.eyebrow}</p>
            <h2 id="biblia-title">{home.bridges.title}</h2>
          </div>

          <div className="grid grid--3">
            {home.bridges.cards.map((card, i) => (
              <Link className="card" key={i} to={PUERTAS[i] || PUERTAS[0]}>
                <div className="card__meta">
                  <span>{card.meta1}</span>
                  <span aria-hidden="true">·</span>
                  <span>{card.meta2}</span>
                </div>
                <h3 className="card__title">{card.title}</h3>
                <p className="card__desc">{card.desc}</p>
                <div className="card__footer">
                  <span>{card.cta}</span>
                  <span className="arrow" aria-hidden="true">
                    →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Personajes con la ficha completa */}
      <section className="section" aria-labelledby="personajes-title">
        <div className="container">
          <div className="home-head">
            <p className="eyebrow">Vidas</p>
            <h2 id="personajes-title">Personajes con historia</h2>
            <p className="lead">
              Biografía, línea de tiempo y escenas ilustradas de su vida, con el pasaje donde
              aparece.
            </p>
          </div>

          <div className="chars__grid">
            {DESTACADOS.map(p => (
              <Link className="card char-card" key={p.slug} to={`/estudio/personajes/${p.slug}`}>
                {p.portada && (
                  <div className="char-card__img">
                    <img src={p.portada} alt="" loading="lazy" />
                  </div>
                )}
                <div className="card__meta">
                  <span>{p.rol}</span>
                </div>
                <h3 className="card__title">{p.nombre}</h3>
                <p className="card__desc">{p.resumen}</p>
                <div className="card__footer">
                  <span>Ver la ficha</span>
                  <span className="arrow" aria-hidden="true">
                    →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Concilios y herejías */}
      <section className="section section--alt" aria-labelledby="concilios-home-title">
        <div className="container">
          <div className="home-head">
            <p className="eyebrow">Historia de la fe</p>
            <h2 id="concilios-home-title">La fe, definida en el tiempo</h2>
            <p className="lead">
              {CONCILIOS.length} concilios y herejías: el año, qué se decidió y contra qué error.
            </p>
          </div>

          <div className="grid grid--3">
            {HITOS.map(c => (
              <Link className="card" key={c.id} to={`/concilios#${c.id}`}>
                <div className="card__meta">
                  <span>{c.anio_label}</span>
                </div>
                <h3 className="card__title">{c.nombre}</h3>
                <p className="card__desc">{corto(c.resumen)}</p>
                <div className="card__footer">
                  <span>Ver el concilio</span>
                  <span className="arrow" aria-hidden="true">
                    →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Cierre: el mismo camino, sin ruido */}
      <section className="section closing" aria-labelledby="cierre-title">
        <div className="container closing__inner">
          <p className="eyebrow">Empieza por donde quieras</p>
          <h2 id="cierre-title">Un tema, una ficha, diez minutos.</h2>
          <p className="lead">
            {STUDIES.length} fichas te esperan: elige una y sigue el hilo por donde te lleve.
          </p>
          <Link className="btn btn--primary" to={home.hero.ctaPrimary.href}>
            {home.hero.ctaPrimary.label}
          </Link>
          <p className="closing__links">
            <Link to="/buscar">
              <span>Buscar en todo el sitio</span>
            </Link>
            <span aria-hidden="true">·</span>
            <Link to="/temas">
              <span>Mapa de temas</span>
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
