import { useCallback, useEffect, useRef } from 'react';

import './ConcaveCarousel.css';

/**
 * Muro curvo de tarjetas ("concave carousel").
 *
 * Recreado en CSS/JS propios: no depende de Tailwind, shadcn ni de la licencia
 * de React Bits Pro. La idea es la de una pared que se curva alrededor del
 * espectador: cada tarjeta gira hacia el centro y se hunde en Z según su
 * distancia al centro de la ventana, con una `perspective` compartida en el
 * contenedor (así el punto de fuga no viaja con el scroll).
 *
 * Rendimiento: las posiciones de las tarjetas se miden una sola vez
 * (`offsetLeft`, que no cambia al hacer scroll) y en cada frame sólo se hace
 * aritmética. Las tarjetas fuera de rango reciben una transformación constante
 * para no generar trabajo extra.
 *
 * Interacción: rueda (vertical → horizontal cuando aún hay recorrido), arrastre
 * con puntero, botones ← →, flechas del teclado y snap. Con
 * `prefers-reduced-motion` no se aplica ninguna transformación 3D.
 */

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

// Estado de reposo para las tarjetas muy lejanas al centro (sin allocaciones).
const FAR = 'translate3d(0, 0, -420px)';

export default function ConcaveCarousel({
  items = [],
  itemWidth = 300,
  gap = 32,
  height = 360,
  label = 'Carrusel de estudios',
  hint = 'Rueda, arrastra o usa ← →',
  renderItem,
  getKey = (item, i) => item?.slug ?? i,
  onItemClick,
  className = ''
}) {
  const scrollerRef = useRef(null);
  const cardsRef = useRef([]);
  const centersRef = useRef([]);
  const rafRef = useRef(0);
  const dragRef = useRef(null);
  const movedRef = useRef(0);
  const reducedRef = useRef(false);

  const apply = useCallback(() => {
    rafRef.current = 0;
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const half = scroller.clientWidth / 2;
    if (!half) return;

    const center = scroller.scrollLeft + half;
    const cards = cardsRef.current;
    const centers = centersRef.current;

    for (let i = 0; i < cards.length; i += 1) {
      const card = cards[i];
      if (!card) continue;

      if (reducedRef.current) {
        card.style.transform = 'none';
        card.style.opacity = '1';
        continue;
      }

      const dx = (centers[i] - center) / half; // 0 = centrada, ±1 = borde de la ventana
      const adx = Math.abs(dx);

      if (adx > 2.2) {
        card.style.transform = FAR;
        card.style.opacity = '0';
        card.classList.remove('is-active');
        continue;
      }

      // Cóncavo: los laterales giran hacia dentro y se hunden.
      const rotate = clamp(dx, -1.4, 1.4) * -22;
      const depth = clamp(adx, 0, 2.2) * 132;
      const scale = 1 - clamp(adx, 0, 1) * 0.12;

      card.style.transform =
        `translate3d(0, 0, ${-depth.toFixed(1)}px) rotateY(${rotate.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
      card.style.opacity = clamp(1.04 - adx * 0.44, 0.34, 1).toFixed(3);
      card.classList.toggle('is-active', adx < 0.34);
    }
  }, []);

  const schedule = useCallback(() => {
    if (!rafRef.current) rafRef.current = requestAnimationFrame(apply);
  }, [apply]);

  const measure = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const cards = Array.from(scroller.querySelectorAll('[data-cc-item]'));
    cardsRef.current = cards;
    centersRef.current = cards.map(card => card.offsetLeft + card.offsetWidth / 2);
    apply();
  }, [apply]);

  const scrollByItem = useCallback(
    dir => {
      const scroller = scrollerRef.current;
      if (!scroller) return;
      const step = itemWidth + gap;
      scroller.scrollBy({ left: dir * step, behavior: reducedRef.current ? 'auto' : 'smooth' });
    },
    [gap, itemWidth]
  );

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return undefined;

    reducedRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(scroller);

    const onScroll = () => schedule();
    scroller.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', measure);

    return () => {
      ro.disconnect();
      scroller.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', measure);
      cancelAnimationFrame(rafRef.current);
    };
  }, [measure, schedule, items]);

  // Rueda: vertical → horizontal, pero sólo mientras quede recorrido, de modo
  // que la página siga desplazándose al llegar al extremo.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return undefined;

    const onWheel = event => {
      if (event.ctrlKey) return;
      const raw = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (!raw) return;
      const max = scroller.scrollWidth - scroller.clientWidth;
      const next = scroller.scrollLeft + raw;
      if (next < 0 || next > max) return;
      event.preventDefault();
      scroller.scrollLeft = next;
    };

    scroller.addEventListener('wheel', onWheel, { passive: false });
    return () => scroller.removeEventListener('wheel', onWheel);
  }, []);

  const onPointerDown = event => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    movedRef.current = 0;
    dragRef.current = { x: event.clientX, left: scroller.scrollLeft };
    scroller.classList.add('is-dragging');
  };

  const onPointerMove = event => {
    const scroller = scrollerRef.current;
    const drag = dragRef.current;
    if (!scroller || !drag) return;
    const dx = event.clientX - drag.x;
    movedRef.current = Math.max(movedRef.current, Math.abs(dx));
    if (!scroller.hasPointerCapture?.(event.pointerId)) {
      try {
        scroller.setPointerCapture(event.pointerId);
      } catch {
        /* sin captura: el arrastre sigue funcionando mientras el puntero esté encima */
      }
    }
    scroller.scrollLeft = drag.left - dx;
  };

  const endDrag = () => {
    dragRef.current = null;
    scrollerRef.current?.classList.remove('is-dragging');
  };

  const handleItemClick = (item, index) => event => {
    // Un arrastre no debe abrir la ficha.
    if (movedRef.current > 8) {
      event.preventDefault();
      movedRef.current = 0;
      return;
    }
    onItemClick?.(item, index);
  };

  const onKeyDown = event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    scrollByItem(event.key === 'ArrowRight' ? 1 : -1);
  };

  if (!items.length) return null;

  return (
    <div
      className={`concave-carousel ${className}`.trim()}
      style={{ '--cc-w': `${itemWidth}px`, '--cc-gap': `${gap}px`, '--cc-h': `${height}px` }}
    >
      <p className="concave-carousel__hint" aria-hidden="true">
        {hint}
      </p>

      <div className="concave-carousel__viewport">
        <div
          ref={scrollerRef}
          className="concave-carousel__scroller"
          role="region"
          aria-label={label}
          tabIndex={0}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onPointerLeave={endDrag}
        >
          {items.map((item, index) => (
            <div
              key={getKey(item, index)}
              data-cc-item=""
              className="concave-carousel__item"
              onClick={handleItemClick(item, index)}
            >
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>

      <div className="concave-carousel__nav">
        <button
          type="button"
          className="concave-carousel__btn"
          onClick={() => scrollByItem(-1)}
          aria-label="Ver anteriores"
        >
          <span aria-hidden="true">←</span>
        </button>
        <button
          type="button"
          className="concave-carousel__btn"
          onClick={() => scrollByItem(1)}
          aria-label="Ver siguientes"
        >
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
}
