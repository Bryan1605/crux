import { Suspense, lazy, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import LiquidSwap from '../components/LiquidSwap/LiquidSwap';
import ScrollReveal from '../components/ScrollReveal/ScrollReveal';
import { assetUrl } from '../lib/assets';
import { useSite, useSeo } from '../lib/site';

const CrossLanyard = lazy(() => import('../components/CrossLanyard/CrossLanyard'));

import { SLIDES } from '../data/slides';
import { STUDIES, STUDY_CATEGORIES } from '../data/estudios';
import { PERSONAJES } from '../data/personajes';
import { CONCILIOS, CONCILIOS_LIST } from '../data/concilios';
import { BIBLE_BOOKS, NT_BOOKS, OT_BOOKS } from '../data/exegesis';
import { VIDEOS } from '../data/videos';

import './Home.css';

/* -------------------------------------------------------------------------- */
/* Datos reales del sitio (nada escrito a mano: sale del contenido)           */
/* -------------------------------------------------------------------------- */

/** Cifras de portada. */
const CIFRAS = [
  { valor: STUDIES.length, label: 'fichas de estudio' },
  { valor: BIBLE_BOOKS.length, label: `libros de la Biblia (${OT_BOOKS.length} AT + ${NT_BOOKS.length} NT)` },
  { valor: PERSONAJES.length, label: 'personajes con ficha' },
  { valor: CONCILIOS.length, label: 'concilios y herejías' },
  { valor: STUDY_CATEGORIES.length, label: 'categorías de estudio' }
];

/** Búsquedas sugeridas bajo el buscador del héroe. */
const SUGERENCIAS = ['Trinidad', 'El hijo pródigo', 'Arrianismo', 'Juan 1:1'];

/** Categorías del mapa: de la que más fichas tiene a la que menos. */
const CATEGORIAS = [...STUDY_CATEGORIES].sort((a, b) => (b.count || 0) - (a.count || 0));

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

/** Línea de tiempo: todos los concilios por año, con los del escaparate marcados. */
const LINEA = [...CONCILIOS_LIST].sort((a, b) => (a.anio || 0) - (b.anio || 0));

/**
 * Puertas de la biblioteca: mismo orden que las tarjetas editables del panel.
 * La exégesis no lleva imagen: se presenta con Juan 1:1 en los dos testigos.
 */
const PUERTAS = [
  { href: '/biblia', image: '/img/biblia/portada.webp' },
  { href: '/biblia/ntv', image: '/img/biblia/portada-ntv.webp' },
  { href: '/exegesis', image: null }
];

/** Recorta un resumen largo sin partir la última palabra. */
function corto(texto, max = 150) {
  const t = String(texto || '').trim();
  if (t.length <= max) return t;
  const recorte = t.slice(0, max);
  return `${recorte.slice(0, recorte.lastIndexOf(' '))}…`;
}

/** «La fe se estudia, no se improvisa» → la segunda mitad va en cursiva. */
function Titulo({ texto }) {
  const corte = texto.indexOf(', ');
  if (corte < 0) return texto;
  return (
    <>
      {texto.slice(0, corte + 1)} <em>{texto.slice(corte + 2)}</em>
    </>
  );
}

function Flecha() {
  return (
    <span className="arrow" aria-hidden="true">
      →
    </span>
  );
}

export default function Home() {
  const site = useSite();
  const { home } = site;
  const navigate = useNavigate();
  const hayVideos = VIDEOS.length > 0;
  const [slide, setSlide] = useState(0);
  const actual = SLIDES[slide] || SLIDES[0];

  useSeo({ title: site.seo.title, description: site.seo.description });

  /** El buscador del héroe lleva a la búsqueda global con la consulta. */
  const onBuscar = event => {
    event.preventDefault();
    const q = event.currentTarget.elements.q.value.trim();
    if (q) navigate(`/buscar?q=${encodeURIComponent(q)}`);
  };

  return (
    <main id="main" className="home">
      {/* Hero: texto y buscador a la izquierda, la cruz ortodoxa colgando a la derecha */}
      <section className="hero" aria-labelledby="hero-title">
        <div
          className="hero__bg"
          aria-hidden="true"
          style={{ backgroundImage: `url(${assetUrl('/img/banners/herobanner4-nicodemo.webp')})` }}
        />
        <div className="hero__scrim" aria-hidden="true" />
        <div className="container hero__grid">
          <div className="hero__copy">
            <p className="eyebrow home-kicker">{home.hero.eyebrow}</p>
            <h1 id="hero-title">
              <Titulo texto={home.hero.title} />
            </h1>
            <p className="lead">{home.hero.lead}</p>

            <form className="hero__search" role="search" aria-label="Buscar en el sitio" onSubmit={onBuscar}>
              <label className="hero__search-label" htmlFor="home-buscar">
                ¿Qué quieres estudiar hoy?
              </label>
              <div className="hero__search-field">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20l-3.5-3.5" />
                </svg>
                <input
                  id="home-buscar"
                  name="q"
                  type="search"
                  placeholder="perdón, Nicea, justificación, Romanos 8…"
                  autoComplete="off"
                />
                <button className="hero__search-btn" type="submit">
                  Buscar
                </button>
              </div>
              <p className="hero__chips">
                <span>Prueba:</span>
                {SUGERENCIAS.map(s => (
                  <Link className="hero__chip" key={s} to={`/buscar?q=${encodeURIComponent(s)}`}>
                    {s}
                  </Link>
                ))}
              </p>
            </form>

            <div className="hero__actions">
              {/* Una sola acción primaria. La secundaria es un enlace discreto. */}
              <Link className="btn btn--primary" to={home.hero.ctaPrimary.href}>
                {home.hero.ctaPrimary.label} <Flecha />
              </Link>
              {hayVideos ? (
                <Link className="hero__alt" to={home.hero.ctaSecondary.href}>
                  {home.hero.ctaSecondary.label}
                </Link>
              ) : (
                <Link className="hero__alt" to="/biblia/ntv">
                  Leer la Biblia NTV
                </Link>
              )}
            </div>
          </div>

          <div className="hero__stage">
            <Suspense fallback={<div className="cross-lanyard-wrapper" aria-hidden="true" />}>
              <CrossLanyard position={[0, 0, 16]} gravity={[0, -40, 0]} />
            </Suspense>
            <p className="hero__hint" aria-hidden="true">
              Arrastra la cruz
            </p>
          </div>
        </div>
      </section>

      {/* El estudio en números, pegado al héroe */}
      <section className="stats" aria-labelledby="cifras-title">
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

      {/* La biblioteca: Biblia Patrística, NTV y exégesis comparada */}
      <section className="section puertas" aria-labelledby="biblia-title">
        <div className="container">
          <div className="home-head home-head--split">
            <div>
              <p className="eyebrow home-kicker">{home.bridges.eyebrow}</p>
              <h2 id="biblia-title">{home.bridges.title}</h2>
            </div>
            <p className="lead">
              El mismo texto desde tres lugares: los Padres que lo leyeron primero, la traducción de hoy
              y el manuscrito completo más antiguo.
            </p>
          </div>

          <div className="puertas__grid">
            {home.bridges.cards.map((card, i) => {
              const puerta = PUERTAS[i] || PUERTAS[0];
              return (
                <Link className="card puerta" key={i} to={puerta.href}>
                  {puerta.image ? (
                    <div className="puerta__img">
                      <img src={assetUrl(puerta.image)} alt="" loading="lazy" />
                    </div>
                  ) : (
                    <div className="puerta__img puerta__img--texto" aria-hidden="true">
                      <span className="puerta__testigo">Juan 1:1 · Codex Sinaiticus</span>
                      <span className="puerta__griego" lang="grc">
                        ΕΝ ΑΡΧΗ ΗΝ Ο ΛΟΓΟϹ ΚΑΙ Ο ΛΟΓΟϹ ΗΝ ΠΡΟϹ ΤΟΝ ΘΝ
                      </span>
                      <span className="puerta__regla" />
                      <span className="puerta__ntv">En el principio la Palabra ya existía. La Palabra estaba con Dios…</span>
                      <span className="puerta__testigo">NTV</span>
                    </div>
                  )}
                  <div className="puerta__body">
                    <div className="card__meta">
                      <span>{card.meta1}</span>
                      <span aria-hidden="true">·</span>
                      <span>{card.meta2}</span>
                    </div>
                    <h3 className="card__title">{card.title}</h3>
                    <p className="card__desc">{card.desc}</p>
                    <p className="puerta__cta">
                      {card.cta} <Flecha />
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Categorías: el mapa del estudio, como índice */}
      <section className="section section--alt mapa" aria-labelledby="categorias-title">
        <div className="container mapa__inner">
          <div className="home-head mapa__head">
            <p className="eyebrow home-kicker">Mapa del estudio</p>
            <h2 id="categorias-title">Diez caminos para entrar</h2>
            <p className="lead">
              Cada categoría agrupa fichas con el mismo método: pasaje clave, contexto, exégesis y
              aplicación.
            </p>
            <Link className="home-link" to="/temas">
              Ver todos los temas <Flecha />
            </Link>
          </div>

          <ol className="mapa__list">
            {CATEGORIAS.map((cat, i) => (
              <li key={cat.id}>
                <Link className="cat-card" to={`/estudio?cat=${cat.id}`}>
                  <span className="cat-card__num" aria-hidden="true">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="cat-card__text">
                    <span className="cat-card__title">{cat.label}</span>
                    <span className="cat-card__desc">{cat.short}</span>
                  </span>
                  <span className="cat-card__count">
                    {cat.count} <span className="sr-only">fichas</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
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
          onChange={setSlide}
        />
        <div className="banner__overlay">
          <div className="container banner__row">
            <span className="banner__kicker">{home.banner.kicker}</span>
            {/* El pie y el enlace siguen a la imagen que está en pantalla. */}
            {actual?.caption && (
              <span className="banner__caption" aria-live="polite">
                {actual.caption}
              </span>
            )}
            {SLIDES.length > 1 && (
              <span className="banner__dots" aria-hidden="true">
                {SLIDES.map((s, i) => (
                  <span key={s.image} className={i === slide ? 'is-on' : undefined} />
                ))}
              </span>
            )}
            {/* Enlace discreto: la acción primaria sigue siendo una sola (el estudio). */}
            {actual?.href ? (
              <Link className="banner__link" to={actual.href} aria-label={`Abrir: ${actual.caption || 'el estudio'}`}>
                Abrir <Flecha />
              </Link>
            ) : (
              <Link className="banner__link" to={home.banner.cta.href}>
                {home.banner.cta.label} <Flecha />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Personajes con la ficha completa */}
      <section className="section" aria-labelledby="personajes-title">
        <div className="container">
          <div className="home-head home-head--split">
            <div>
              <p className="eyebrow home-kicker">Vidas</p>
              <h2 id="personajes-title">Personajes con historia</h2>
            </div>
            <Link className="home-link" to="/estudio?cat=03-personajes">
              Los {PERSONAJES.length} personajes <Flecha />
            </Link>
          </div>

          <div className="chars__grid">
            {DESTACADOS.map(p => (
              <Link className="char-card" key={p.slug} to={`/estudio/personajes/${p.slug}`}>
                {p.portada && (
                  <div className="char-card__img">
                    <img src={p.portada} alt="" loading="lazy" />
                  </div>
                )}
                <p className="char-card__meta">
                  {p.rol}
                  {p.escenas?.length > 0 && ` · ${p.escenas.length} escenas`}
                </p>
                <h3 className="char-card__name">{p.nombre}</h3>
                <p className="card__desc">{p.resumen}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Concilios y herejías */}
      <section className="section--alt concilios-home" aria-labelledby="concilios-home-title">
        <div className="concilios-home__img">
          <img
            src={assetUrl('/img/banners/herobanner2-patristica.webp')}
            alt="Mosaico de los Padres de la Iglesia sosteniendo el Credo de Nicea"
            loading="lazy"
          />
        </div>
        <div className="container concilios-home__inner">
          <div className="home-head home-head--split">
            <div>
              <p className="eyebrow home-kicker">Historia de la fe</p>
              <h2 id="concilios-home-title">La fe, definida en el tiempo</h2>
            </div>
            <p className="lead">
              {CONCILIOS.length} concilios y herejías: el año, qué se decidió y contra qué error.
            </p>
          </div>

          <div className="linea">
            <ol className="linea__list" aria-label="Concilios ecuménicos por año">
              {LINEA.map(c => (
                <li key={c.id} className={HITOS.includes(c) ? 'is-hito' : undefined}>
                  <Link to={`/concilios#${c.id}`}>
                    <span className="linea__anio">{c.anio}</span>
                    <span className="linea__nombre">{c.nombre.replace(/^Concilio de /, '')}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>

          <div className="grid grid--3">
            {HITOS.map(c => (
              <Link className="card hito" key={c.id} to={`/concilios#${c.id}`}>
                <p className="hito__anio">{c.anio_label}</p>
                <h3 className="card__title">{c.nombre}</h3>
                <p className="card__desc">{corto(c.resumen)}</p>
                <p className="puerta__cta">
                  Ver el concilio <Flecha />
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Cierre: la puerta abierta */}
      <section className="closing" aria-labelledby="cierre-title">
        <div
          className="closing__bg"
          aria-hidden="true"
          style={{ backgroundImage: `url(${assetUrl('/img/banners/herobanner1.webp')})` }}
        />
        <div className="container closing__inner">
          <p className="eyebrow home-kicker">Empieza por donde quieras</p>
          <h2 id="cierre-title">Un tema, una ficha, diez minutos.</h2>
          <p className="lead">
            {STUDIES.length} fichas te esperan: elige una y sigue el hilo por donde te lleve.
          </p>
          <Link className="btn btn--primary" to={home.hero.ctaPrimary.href}>
            {home.hero.ctaPrimary.label} <Flecha />
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
