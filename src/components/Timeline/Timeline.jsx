import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { TIPO_LABELS, centuryBands } from '../../lib/timeline';
import './Timeline.css';

const prefersReduced = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Línea de tiempo horizontal con línea de eras, filtros por tipo y teclado.
 * Se usa en /estudio (toda la línea) y en el panel (vista previa).
 */
export default function Timeline({ events = [], filterable = true }) {
  const [tipo, setTipo] = useState('all');
  const scrollerRef = useRef(null);

  const tipos = useMemo(() => {
    const map = new Map();
    for (const ev of events) map.set(ev.tipo, (map.get(ev.tipo) || 0) + 1);
    return [...map.entries()].map(([id, count]) => ({ id, count }));
  }, [events]);

  const visible = useMemo(
    () => (tipo === 'all' ? events : events.filter(ev => ev.tipo === tipo)),
    [events, tipo]
  );
  const bands = useMemo(() => {
    const anios = visible.map(ev => ev.anio).filter(n => n !== null);
    if (!anios.length) return [];
    return centuryBands(Math.min(...anios), Math.max(...anios));
  }, [visible]);

  const scroll = dir => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector('.timeline__card');
    const w = card ? card.getBoundingClientRect().width : 260;
    el.scrollBy({ left: dir * (w + 18), behavior: prefersReduced() ? 'auto' : 'smooth' });
  };

  const onKeyDown = e => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      scroll(-1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      scroll(1);
    }
  };

  return (
    <section className="section timeline-section" aria-label="Línea de tiempo de la historia de la fe">
      <div className="container">
        <div className="timeline__head">
          <p className="eyebrow">Historia de la fe</p>
          <h2>Línea de tiempo</h2>
          <p className="timeline__hint" aria-hidden="true">
            Desliza o usa ← → · cada hito enlaza a su ficha
          </p>
        </div>

        {filterable && tipos.length > 0 && (
          <div className="chips timeline__chips" role="group" aria-label="Filtrar la línea de tiempo por tipo">
            <button type="button" className="chip" aria-pressed={tipo === 'all'} onClick={() => setTipo('all')}>
              Todos <span className="chip__count">{events.length}</span>
            </button>
            {tipos.map(t => (
              <button
                key={t.id}
                type="button"
                className="chip"
                aria-pressed={tipo === t.id}
                onClick={() => setTipo(t.id)}
              >
                {TIPO_LABELS[t.id] || t.id} <span className="chip__count">{t.count}</span>
              </button>
            ))}
          </div>
        )}

        <div className="timeline">
          {bands.length > 0 && (
            <div className="timeline__rail" aria-hidden="true">
              <div className="timeline__line" />
              <div className="timeline__eras">
                {bands.map(band => (
                  <span key={band.label} className="timeline__era" style={{ '--p': band.p }}>
                    <i className="timeline__era-dot" />
                    {band.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="timeline__scroller-wrap">
            <button type="button" className="timeline__nav" aria-label="Hitos anteriores" onClick={() => scroll(-1)}>
              ‹
            </button>
            <div
              ref={scrollerRef}
              className="timeline__scroller"
              tabIndex={0}
              role="list"
              aria-label="Hitos en orden cronológico"
              onKeyDown={onKeyDown}
            >
              {visible.length === 0 && <p className="timeline__empty">Sin hitos para este filtro.</p>}
              {visible.map((ev, i) => (
                <div key={ev.id} className="timeline__item" role="listitem" style={{ '--i': Math.min(i, 12) }}>
                  {ev.href ? (
                    <Link className="timeline__card" to={ev.href}>
                      <TimelineCard ev={ev} />
                    </Link>
                  ) : (
                    <article className="timeline__card">
                      <TimelineCard ev={ev} />
                    </article>
                  )}
                </div>
              ))}
            </div>
            <button type="button" className="timeline__nav" aria-label="Hitos siguientes" onClick={() => scroll(1)}>
              ›
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function TimelineCard({ ev }) {
  return (
    <>
      <span className="timeline__date">
        {ev.anio_label}
        {ev.era && <em className="timeline__era-note">{ev.era}</em>}
      </span>
      <span className="timeline__badge" data-tipo={ev.tipo}>
        {TIPO_LABELS[ev.tipo] || ev.tipo}
      </span>
      <strong className="timeline__title">{ev.titulo}</strong>
      <span className="timeline__text">{ev.texto}</span>
      <span className="timeline__go" aria-hidden="true">
        →
      </span>
    </>
  );
}