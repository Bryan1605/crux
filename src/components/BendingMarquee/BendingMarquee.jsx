import { useLayoutEffect, useRef, useState } from 'react';

import './BendingMarquee.css';

/**
 * Marquee "bending": banda de3 paneles (alas plegadas + centro plano) con
 * texto en scroll continuo. Reimplementación propia a partir de la spec
 * pública del componente (sin licencia Pro).
 *
 * - `speed`: píxeles por segundo de desplazamiento.
 * - La sincronía entre paneles se mide en px (mismo contenido, mismo offset)
 *   para que el texto continúe de forma fluida en las costuras.
 */
export default function BendingMarquee({
  items = [],
  speed = 42,
  fontSize,
  height,
  bend,
  separator = ' ✝ ',
  bandColor = '#111113',
  textColor = '#fafafa',
  pauseOnHover = true,
  className = '',
  style
}) {
  const stageRef = useRef(null);
  const centerStripRef = useRef(null);
  const [ready, setReady] = useState(false);

  const phrase = items.filter(Boolean).join(separator) || 'Crux';
  const run = `${phrase}${separator}`;

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;

    const measure = () => {
      const panelW = stage.clientWidth / 3;
      const strip = centerStripRef.current;
      const half = strip ? strip.scrollWidth / 2 : 0;
      if (!panelW || !half) return;
      stage.style.setProperty('--bm-panel-w', `${panelW}px`);
      stage.style.setProperty('--bm-distance', `${half}px`);
      stage.style.setProperty('--bm-duration', `${Math.max(4, half / speed).toFixed(2)}s`);
      setReady(true);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    if (document.fonts?.ready) document.fonts.ready.then(measure).catch(() => {});
    return () => ro.disconnect();
  }, [speed, phrase]);

  return (
    <div
      ref={stageRef}
      className={['bm', ready ? 'is-ready' : '', pauseOnHover ? 'bm--pause' : '', className]
        .filter(Boolean)
        .join(' ')}
      aria-hidden="true"
      style={{
        ...(fontSize != null ? { '--bm-font': `${fontSize}px` } : {}),
        ...(height != null ? { '--bm-height': `${height}px` } : {}),
        ...(bend != null ? { '--bm-bend': `${bend}deg` } : {}),
        '--bm-band': bandColor,
        '--bm-text': textColor,
        ...style
      }}
    >
      <div className="bm__panel bm__panel--left">
        <div className="bm__strip">
          <span className="bm__run">{run}</span>
          <span className="bm__run">{run}</span>
        </div>
      </div>

      <div className="bm__panel bm__panel--center">
        <div className="bm__strip" ref={centerStripRef}>
          <span className="bm__run">{run}</span>
          <span className="bm__run">{run}</span>
        </div>
      </div>

      <div className="bm__panel bm__panel--right">
        <div className="bm__strip">
          <span className="bm__run">{run}</span>
          <span className="bm__run">{run}</span>
        </div>
      </div>
    </div>
  );
}
