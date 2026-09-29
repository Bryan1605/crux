import { Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';

import LiquidSwap from '../components/LiquidSwap/LiquidSwap';
import ScrollReveal from '../components/ScrollReveal/ScrollReveal';

const CrossLanyard = lazy(() => import('../components/CrossLanyard/CrossLanyard'));

import { SLIDES } from '../data/slides';
import { STUDIES, STUDY_CATEGORIES } from '../data/estudios';

import './Home.css';

export default function Home() {
  const total = STUDIES.length;

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
            <p className="eyebrow">Crux</p>
            <h1>La fe se estudia, no se improvisa</h1>
            <p className="lead">
              Estudios, videos y notas reunidos en un solo lugar para abrir la Escritura con tiempo,
              método y contexto.
            </p>
            <div className="hero__actions">
              <Link className="btn btn--primary" to="/estudio">
                Explorar el estudio
              </Link>
              <Link className="btn btn--ghost" to="/videos">
                Ver los videos
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Textos que aparecen al bajar */}
      <section className="section manifesto">
        <div className="container manifesto__inner">
          <ScrollReveal containerClassName="manifesto__line" baseOpacity={0.08} baseRotation={4} blurStrength={8}>
            Crux es el punto de partida: una sola cruz, y debajo todo lo que he aprendido estudiando la
            Biblia.
          </ScrollReveal>
          <ScrollReveal containerClassName="manifesto__line" baseOpacity={0.08} baseRotation={-3} blurStrength={8}>
            Cada ficha resume un tema completo: pasaje clave, contexto, exégesis y aplicación, lista para
            leer en diez minutos o para estudiar con calma.
          </ScrollReveal>
          <ScrollReveal containerClassName="manifesto__line" baseOpacity={0.08} baseRotation={3} blurStrength={8}>
            Y los videos acompañan lo que la página enseña: lo mismo, contado en voz alta.
          </ScrollReveal>
        </div>
      </section>

      {/* Hero-banner (LiquidSwap) → página de estudio */}
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
            <span className="banner__kicker">Del banner al estudio</span>
            <Link className="btn btn--primary" to={SLIDES[0]?.href || '/estudio'}>
              Abrir el estudio <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Puertas de entrada */}
      <section className="section bridges">
        <div className="container">
          <div className="bridges__head">
            <p className="eyebrow">Por dónde seguir</p>
            <h2>Dos puertas: el estudio y los videos</h2>
          </div>

          <div className="grid grid--2">
            <Link className="card bridge-card" to="/estudio">
              <div className="card__meta">
                <span>{total} estudios</span>
                <span aria-hidden="true">·</span>
                <span>{STUDY_CATEGORIES.length} categorías</span>
              </div>
              <h3 className="card__title">El estudio</h3>
              <p className="card__desc">
                Fundamentos doctrinales, parábolas, personajes, apologética y Apocalipsis: fichas ordenadas
                con pasaje clave y resumen.
              </p>
              <div className="card__footer">
                <span>Entrar al índice</span>
                <span className="arrow" aria-hidden="true">
                  →
                </span>
              </div>
            </Link>

            <Link className="card bridge-card" to="/videos">
              <div className="card__meta">
                <span>Video</span>
                <span aria-hidden="true">·</span>
                <span>Clases y explicaciones</span>
              </div>
              <h3 className="card__title">Los videos</h3>
              <p className="card__desc">
                Las clases grabadas, ordenadas en una sola parrilla: el mismo contenido del estudio,
                dicho en voz alta.
              </p>
              <div className="card__footer">
                <span>Ver los videos</span>
                <span className="arrow" aria-hidden="true">
                  →
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
