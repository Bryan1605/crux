import { Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';

import LiquidSwap from '../components/LiquidSwap/LiquidSwap';
import ScrollReveal from '../components/ScrollReveal/ScrollReveal';
import { useSite, useSeo, interpolateHomeBridge } from '../lib/site';

const CrossLanyard = lazy(() => import('../components/CrossLanyard/CrossLanyard'));

import { SLIDES } from '../data/slides';
import { STUDIES, STUDY_CATEGORIES } from '../data/estudios';

import './Home.css';

export default function Home() {
  const site = useSite();
  const { home } = site;
  const total = STUDIES.length;
  const catCount = STUDY_CATEGORIES.length;

  useSeo({ title: site.seo.title, description: site.seo.description });

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
              <Link className="btn btn--primary" to={home.hero.ctaPrimary.href}>
                {home.hero.ctaPrimary.label}
              </Link>
              <Link className="btn btn--ghost" to={home.hero.ctaSecondary.href}>
                {home.hero.ctaSecondary.label}
              </Link>
            </div>
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
              baseOpacity={0.08}
              baseRotation={i % 2 === 0 ? 4 : -3}
              blurStrength={8}
            >
              {line}
            </ScrollReveal>
          ))}
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
            <span className="banner__kicker">{home.banner.kicker}</span>
            {SLIDES[0]?.caption && <span className="banner__caption">{SLIDES[0].caption}</span>}
            <Link className="btn btn--primary" to={SLIDES[0]?.href || home.banner.cta.href}>
              {home.banner.cta.label} <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Puertas de entrada */}
      <section className="section bridges">
        <div className="container">
          <div className="bridges__head">
            <p className="eyebrow">{home.bridges.eyebrow}</p>
            <h2>{home.bridges.title}</h2>
          </div>

          <div className="grid grid--2">
            <Link className="card bridge-card" to="/estudio">
              <div className="card__meta">
                <span>{interpolateHomeBridge(home.bridges.cards[0].meta1, { total, categories: catCount })}</span>
                <span aria-hidden="true">·</span>
                <span>{interpolateHomeBridge(home.bridges.cards[0].meta2, { total, categories: catCount })}</span>
              </div>
              <h3 className="card__title">{home.bridges.cards[0].title}</h3>
              <p className="card__desc">{home.bridges.cards[0].desc}</p>
              <div className="card__footer">
                <span>{home.bridges.cards[0].cta}</span>
                <span className="arrow" aria-hidden="true">→</span>
              </div>
            </Link>

            <Link className="card bridge-card" to="/videos">
              <div className="card__meta">
                <span>{home.bridges.cards[1].meta1}</span>
                <span aria-hidden="true">·</span>
                <span>{home.bridges.cards[1].meta2}</span>
              </div>
              <h3 className="card__title">{home.bridges.cards[1].title}</h3>
              <p className="card__desc">{home.bridges.cards[1].desc}</p>
              <div className="card__footer">
                <span>{home.bridges.cards[1].cta}</span>
                <span className="arrow" aria-hidden="true">→</span>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}