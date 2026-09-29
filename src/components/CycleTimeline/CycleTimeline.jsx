import { useEffect, useRef } from 'react';

import CountUp from '../CountUp/CountUp';

import './CycleTimeline.css';

const parseYear = raw => {
  const m = /^([^\d]*)(\d+)(.*)$/.exec(String(raw).trim());
  if (!m) return null;
  return { prefix: m[1], n: Number(m[2]), tail: m[3] };
};

export default function CycleTimeline({ items = [], images = [], className = '' }) {
  const rootRef = useRef(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return undefined;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      el.style.setProperty('--ct-progress', '1');
      return undefined;
    }
    let raf = 0;
    const update = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || 800;
      const total = r.height + vh * 0.45;
      const passed = vh * 0.72 - r.top;
      const p = Math.min(1, Math.max(0, passed / Math.max(total, 1)));
      el.style.setProperty('--ct-progress', p.toFixed(4));
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const cls = ['cycle-timeline', className].filter(Boolean).join(' ');

  return (
    <div className={cls} ref={rootRef}>
      <div className="cycle-timeline__rail" aria-hidden="true">
        <span className="cycle-timeline__rail-bar" />
      </div>
      <ol className="cycle-timeline__list">
        {items.map((item, i) => {
          const raw = item.anio ?? item.year ?? '';
          const parsed = parseYear(raw);
          const src = images.length > 0 ? images[i % images.length] : null;
          const flip = i % 2 === 1;
          const initial = (item.evento || item.title || '?').trim().charAt(0);
          return (
            <li className={`cycle-timeline__row${flip ? ' is-flipped' : ''}`} key={`${raw}-${i}`}>
              <div className="cycle-timeline__text">
                <span className="cycle-timeline__year">
                  {parsed ? (
                    <>
                      {parsed.prefix}
                      <CountUp to={parsed.n} duration={1.1} delay={0.1 + i * 0.06} />
                      {parsed.tail}
                    </>
                  ) : (
                    raw
                  )}
                </span>
                <p className="cycle-timeline__event">{item.evento ?? item.title ?? ''}</p>
              </div>
              <div className="cycle-timeline__media">
                {src ? (
                  <figure className="cycle-timeline__frame">
                    <img src={src} alt="" loading="lazy" draggable={false} />
                  </figure>
                ) : (
                  <div className="cycle-timeline__frame cycle-timeline__frame--ph" aria-hidden="true">
                    <span className="cycle-timeline__ph-letter">{initial}</span>
                    <span className="cycle-timeline__ph-year">{raw}</span>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
