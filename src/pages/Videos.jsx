import { useEffect, useRef, useState } from 'react';

import { VIDEOS } from '../data/videos';
import { useSite, useSeo } from '../lib/site';

import './Videos.css';

const thumb = id => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
const embed = id => `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;

export default function Videos() {
  const site = useSite();
  const [active, setActive] = useState(null);
  const dialogRef = useRef(null);

  useSeo({ title: `${site.marca.nombre} — Videos`, description: site.seo.description });

  useEffect(() => {
    if (!active) return undefined;
    const onKey = e => {
      if (e.key === 'Escape') setActive(null);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [active]);

  return (
    <main id="main" className="videos-page">
      <header className="page-head">
        <div className="container">
          <p className="eyebrow">Clases en video</p>
          <h1>Videos</h1>
          <p className="lead">
            Las clases y explicaciones del estudio, ordenadas en una sola parrilla. Pasa el cursor sobre
            una tarjeta y ábrela para verla.
          </p>
        </div>
      </header>

      <section className="section">
        <div className="container">
          {VIDEOS.length === 0 ? (
            <div className="empty-state">
              <h3>Todavía no hay videos publicados</h3>
              <p>
                Añade el primero en <code>content/videos.json</code>
                {import.meta.env.DEV && <> (o desde el panel en desarrollo: <code>/admin</code>)</>} con su
                id de YouTube y aparecerá aquí.
              </p>
            </div>
          ) : (
            <div className="grid grid--3">
              {VIDEOS.map(v => (
                <button
                  type="button"
                  key={v.id}
                  className="card video-card"
                  onClick={() => setActive(v)}
                  aria-label={`Reproducir: ${v.title}`}
                >
                  <div className="video-card__thumb">
                    <img src={thumb(v.id)} alt="" loading="lazy" />
                    <span className="video-card__play" aria-hidden="true">
                      ▶
                    </span>
                  </div>
                  <div className="card__meta">{v.date}</div>
                  <h2 className="card__title">{v.title}</h2>
                  {v.description && <p className="card__desc">{v.description}</p>}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {active && (
        <div
          className="video-modal"
          role="dialog"
          aria-modal="true"
          aria-label={active.title}
          tabIndex={-1}
          ref={dialogRef}
          onClick={e => {
            if (e.target === e.currentTarget) setActive(null);
          }}
        >
          <div className="video-modal__panel">
            <div className="video-modal__bar">
              <span>{active.title}</span>
              <button
                type="button"
                className="video-modal__close"
                onClick={() => setActive(null)}
                aria-label="Cerrar video"
              >
                ✕
              </button>
            </div>
            <div className="video-modal__frame">
              <iframe
                src={embed(active.id)}
                title={active.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
