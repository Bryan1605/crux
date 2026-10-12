import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import SkewedCarousel from '../components/SkewedCarousel/SkewedCarousel';
import ScrapbookGallery from '../components/ScrapbookGallery/ScrapbookGallery';
import Lightbox from '../components/Lightbox/Lightbox';
import CycleTimeline from '../components/CycleTimeline/CycleTimeline';
import { parseFrontmatter } from '../lib/frontmatter';
import { renderProse } from '../lib/markdown';
import { PERSONAJES, personajeBySlug } from '../data/personajes';
import { useSite, useSeo } from '../lib/site';

import './Estudio.css';
import './Personaje.css';

const contentModules = import.meta.glob('../../content/estudios/*.md', {
  query: '?raw',
  import: 'default'
});

export default function Personaje() {
  const { slug } = useParams();
  const site = useSite();
  const personajesCat = site.personajesCategoryId;
  const personaje = personajeBySlug(slug);

  useSeo({
    title: personaje ? `${personaje.nombre} — ${site.marca.nombre}` : `${site.marca.nombre} — Personaje`,
    description: personaje ? personaje.resumen : site.seo.description
  });

  const [doc, setDoc] = useState({ status: 'idle', html: '' });
  const [lightboxIndex, setLightboxIndex] = useState(null);

  useEffect(() => {
    if (!personaje?.estudio) {
      setDoc({ status: 'idle', html: '' });
      return undefined;
    }
    let alive = true;
    setDoc({ status: 'loading', html: '' });
    const load = contentModules[`../../content/estudios/${personaje.estudio}.md`];
    if (!load) {
      setDoc({ status: 'missing', html: '' });
      return undefined;
    }
    load()
      .then(raw => {
        if (!alive) return;
        const { body } = parseFrontmatter(raw);
        setDoc({ status: 'ok', html: renderProse(body) });
      })
      .catch(() => {
        if (alive) setDoc({ status: 'missing', html: '' });
      });
    return () => {
      alive = false;
    };
  }, [personaje]);

  if (!personaje) {
    return (
      <main id="main" className="study-detail personaje">
        <div className="container">
          <div className="empty-state">
            <h1 className="study-detail__missing">Personaje no encontrado</h1>
            <p>La ficha que buscas no existe o cambió de nombre.</p>
            <p>
              <Link className="btn btn--primary" to={`/estudio?cat=${personajesCat}`}>
                Volver a personajes
              </Link>
            </p>
          </div>
        </div>
      </main>
    );
  }

  const escenas = personaje.escenas || [];
  const carouselItems = escenas.map((src, i) => ({
    src,
    title: `Escena ${i + 1} de ${personaje.nombre}`
  }));
  const others = PERSONAJES.filter(p => p.slug !== personaje.slug).slice(0, 6);

  return (
    <main id="main" className="study-detail personaje">
      <article className="container">
        <nav className="breadcrumb" aria-label="Migas de pan">
          <Link to="/">Inicio</Link>
          <span aria-hidden="true">/</span>
          <Link to="/estudio">Estudio</Link>
          <span aria-hidden="true">/</span>
          <Link to={`/estudio?cat=${personajesCat}`}>Personajes</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{personaje.nombre}</span>
        </nav>

        <header className="study-detail__head">
          <p className="eyebrow">Personajes · {personaje.epoca}</p>
          <h1>{personaje.nombre}</h1>
          <p className="lead">{personaje.resumen}</p>

          <div className="study-detail__facts">
            <span className="fact">
              Rol <strong>{personaje.rol}</strong>
            </span>
            <span className="fact">
              Época <strong>{personaje.epoca}</strong>
            </span>
            <span className="fact">
              Escenas <strong>{escenas.length}</strong>
            </span>
          </div>
        </header>

        <div className="study-detail__meta">
          <div className="study-detail__meta-group">
            <h2>Etiquetas</h2>
            <div className="tag-list">
              {personaje.tags.map(t => (
                <span className="tag" key={t}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="study-detail__body">
          <div className="study-detail__main">
            <figure className="personaje__portada">
              <img src={personaje.portada} alt={`Retrato de ${personaje.nombre}`} />
            </figure>

            {personaje.bio.map(par => (
              <p className="personaje__bio" key={par.slice(0, 32)}>
                {par}
              </p>
            ))}

            {escenas.length >= 2 && (
              <section className="personaje__section" aria-label="Escenas de vida">
                <div className="personaje__section-head">
                  <h2>Escenas de vida</h2>
                  <p className="personaje__hint" aria-hidden="true">
                    Arrastra o usa ← → para explorar
                  </p>
                </div>
                <SkewedCarousel
                  items={carouselItems}
                  cardWidth={230}
                  aspectRatio="4 / 5"
                  rotation={48}
                  inactiveScale={0.84}
                  autoplay={lightboxIndex === null}
                  autoplayDelay={3800}
                  loop
                  showTitles={false}
                  showDots={carouselItems.length > 3}
                  onItemClick={(_item, i) => setLightboxIndex(i)}
                />
              </section>
            )}

            {escenas.length === 1 && (
              <section className="personaje__section" aria-label="Escenas de vida">
                <h2>Escenas de vida</h2>
                <figure
                  className="personaje__escena personaje__escena--zoomable"
                  role="button"
                  tabIndex={0}
                  aria-label="Ver escena en grande"
                  onClick={() => setLightboxIndex(0)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setLightboxIndex(0);
                    }
                  }}
                >
                  <img src={escenas[0]} alt={`Escena de ${personaje.nombre}`} loading="lazy" />
                </figure>
              </section>
            )}

            <section className="personaje__section" aria-label="Línea de tiempo">
              <h2>Línea de tiempo</h2>
              <CycleTimeline items={personaje.timeline} images={escenas} />
            </section>

            {doc.status === 'loading' && (
              <section className="personaje__section" aria-label="Estudio completo">
                <h2>Estudio completo</h2>
                <div className="study-detail__loading">
                  <div className="loader-pulse" role="status" aria-label="Cargando">
                    <span />
                    <span />
                    <span />
                  </div>
                  <p className="muted">Cargando el estudio…</p>
                </div>
              </section>
            )}

            {doc.status === 'ok' && (
              <section className="personaje__section" aria-label="Estudio completo">
                <h2>Estudio completo</h2>
                <div className="study-prose" dangerouslySetInnerHTML={{ __html: doc.html }} />
              </section>
            )}
          </div>
        </div>

        <ScrapbookGallery
          items={others.map(p => ({
            to: `/estudio/personajes/${p.slug}`,
            image: p.portada,
            title: p.nombre,
            caption: `${p.nombre} · ${p.epoca}`
          }))}
          footer={
            <Link className="btn btn--ghost" to={`/estudio?cat=${personajesCat}`}>
              Ver todos
            </Link>
          }
        />

        {lightboxIndex !== null && escenas.length > 0 && (
          <Lightbox
            items={carouselItems}
            index={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
            label={`Escena de ${personaje.nombre}`}
          />
        )}
      </article>
    </main>
  );
}
