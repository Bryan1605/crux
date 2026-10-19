import { useEffect, useRef, useState } from 'react';

import './SkewedCarousel.css';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export default function SkewedCarousel({
  items = [],
  initialIndex = 0,
  cardWidth = 200,
  aspectRatio = '3 / 4',
  rotation = 60,
  inactiveScale = 0.85,
  perspective = 800,
  borderRadius = 8,
  titleBlur = 2,
  speed = 1,
  showTitles = true,
  showControls = true,
  showDots = true,
  loop = false,
  autoplay = false,
  autoplayDelay = 3000,
  enableDrag = true,
  enableKeyboard = true,
  hoverTilt = 0,
  onItemClick,
  className = '',
  onIndexChange,
  renderItem
}) {
  const n = items.length;
  const [active, setActive] = useState(() => clamp(initialIndex, 0, Math.max(0, n - 1)));
  const [dragging, setDragging] = useState(false);
  const [manualPaused, setManualPaused] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [hovering, setHovering] = useState(false);
  const idleRef = useRef(null);
  const running = autoplay && !manualPaused && !interacting && !hovering;
  const dragRef = useRef({ x: 0, start: 0, active: false, moved: 0, suppress: false });
  const rootRef = useRef(null);

  const ratio = aspectRatio
    .split('/')
    .map(s => parseFloat(s.trim()))
    .filter(v => v > 0);
  const slideH = Math.round(cardWidth * (ratio[1] ? ratio[1] / ratio[0] : 1.333));

  const go = next => {
    if (n === 0) return;
    let v = next;
    if (loop) v = ((v % n) + n) % n;
    else v = clamp(v, 0, n - 1);
    setActive(prev => (v === prev ? prev : v));
  };

  useEffect(() => {
    onIndexChange?.(active);
  }, [active, onIndexChange]);

  // El avance automático se detiene mientras alguien usa el carrusel y se
  // reanuda seis segundos después del último toque.
  const marcarInteraccion = () => {
    if (!autoplay) return;
    setInteracting(true);
    clearTimeout(idleRef.current);
    idleRef.current = setTimeout(() => setInteracting(false), 6000);
  };

  const alternarPausa = () => {
    const siguiente = !manualPaused;
    setManualPaused(siguiente);
    if (!siguiente) {
      clearTimeout(idleRef.current);
      setInteracting(false);
    }
  };

  useEffect(() => () => clearTimeout(idleRef.current), []);

  useEffect(() => {
    if (!autoplay || n < 2 || !running) return undefined;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return undefined;
    const id = setInterval(() => setActive(a => (loop ? (a + 1) % n : Math.min(n - 1, a + 1))), autoplayDelay);
    return () => clearInterval(id);
  }, [autoplay, running, autoplayDelay, loop, n]);

  useEffect(() => {
    if (!enableKeyboard) return undefined;
    const el = rootRef.current;
    if (!el) return undefined;
    const onKey = e => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        go(active + 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        go(active - 1);
      }
    };
    el.addEventListener('keydown', onKey);
    return () => el.removeEventListener('keydown', onKey);
  }, [enableKeyboard, active, n, loop]);

  if (n === 0) return null;

  const step = rotation > 0 ? cardWidth * 0.66 : cardWidth + 24;
  const reducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tiltOn = hoverTilt > 0 && !reducedMotion;

  const onTiltMove = e => {
    if (!tiltOn) return;
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty('--ry', `${(px * hoverTilt).toFixed(2)}deg`);
    el.style.setProperty('--rx', `${(-py * hoverTilt).toFixed(2)}deg`);
  };
  const onTiltLeave = e => {
    if (!tiltOn) return;
    e.currentTarget.style.setProperty('--ry', '0deg');
    e.currentTarget.style.setProperty('--rx', '0deg');
  };

  const onPointerDown = e => {
    if (!enableDrag) {
      dragRef.current.active = false;
      return;
    }
    if (e.target?.closest?.('button')) {
      dragRef.current.active = false;
      return;
    }
    const slideEl = e.target?.closest?.('.skewed-carousel__slide');
    const downIndex = slideEl && slideEl.dataset.index != null ? Number(slideEl.dataset.index) : null;
    dragRef.current = { x: e.clientX, start: active, active: true, moved: 0, suppress: false, downIndex };
    setDragging(true);
    rootRef.current?.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = e => {
    const st = dragRef.current;
    if (!st.active) return;
    const dx = e.clientX - st.x;
    st.moved += Math.abs(e.movementX || 0);
    const steps = Math.round(-dx / step);
    const target = st.start + steps;
    setActive(loop ? ((target % n) + n) % n : clamp(target, 0, n - 1));
  };
  const onPointerUp = () => {
    const st = dragRef.current;
    if (st.active) {
      st.suppress = true;
      setTimeout(() => {
        st.suppress = false;
      }, 400);
      if (st.moved <= 6 && st.downIndex != null) {
        const i = st.downIndex;
        if (i === active) onItemClick?.(items[i], i, true);
        else go(i);
      }
    }
    st.active = false;
    setDragging(false);
  };

  const classes = ['skewed-carousel', dragging ? 'is-dragging' : '', className].filter(Boolean).join(' ');

  return (
    <div
      ref={rootRef}
      className={classes}
      style={{ perspective: `${perspective}px` }}
      tabIndex={enableKeyboard ? 0 : undefined}
      role={enableKeyboard ? 'region' : undefined}
      aria-label="Carrusel de tarjetas"
      onPointerDown={e => {
        marcarInteraccion();
        onPointerDown(e);
      }}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onMouseEnter={() => {
        if (typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches) setHovering(true);
      }}
      onMouseLeave={() => setHovering(false)}
    >
      <div className="skewed-carousel__viewport" style={{ height: `${slideH}px` }}>
        {items.map((item, i) => {
          let d = i - active;
          if (loop && n > 1) {
            d = ((d % n) + n) % n;
            if (d > n / 2) d -= n;
          }
          const clampedD = clamp(d, -3, 3);
          const rotY = -clamp(clampedD * rotation, -75, 75);
          const isActive = d === 0;
          const absD = Math.abs(d);
          const scale = isActive ? 1 : inactiveScale;
          const x = d * step;
          const src = typeof item === 'string' ? item : item.src;
          const title = typeof item === 'string' ? '' : item.title || '';
          return (
            <div
              key={i}
              data-index={i}
              className={['skewed-carousel__slide', isActive ? 'is-active' : ''].filter(Boolean).join(' ')}
              style={{
                width: `${cardWidth}px`,
                aspectRatio,
                borderRadius: `${borderRadius}px`,
                zIndex: String(100 - absD),
                opacity: absD > 4 ? 0 : 1,
                transform: `translateX(-50%) translateX(${x}px) rotateY(${rotY}deg) scale(${scale})`,
                transitionDuration: dragging ? '0s' : `${0.55 / Math.max(0.2, speed)}s`
              }}
              onClick={() => {
                if (dragRef.current.suppress) return;
                if (isActive) onItemClick?.(item, i, true);
                else go(i);
              }}
            >
              <div className="skewed-carousel__tilt" onMouseMove={onTiltMove} onMouseLeave={onTiltLeave}>
                {renderItem ? (
                  renderItem(item, i, isActive)
                ) : (
                  <>
                    <img src={src} alt={title} draggable={false} />
                    {showTitles && (
                      <figcaption
                        className="skewed-carousel__caption"
                        style={{ filter: isActive ? 'none' : `blur(${titleBlur}px)` }}
                      >
                        {title}
                      </figcaption>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showControls && n > 1 && (
        <>
          <button type="button" className="skewed-carousel__nav is-prev" aria-label="Anterior" onClick={() => go(active - 1)}>
            ‹
          </button>
          <button type="button" className="skewed-carousel__nav is-next" aria-label="Siguiente" onClick={() => go(active + 1)}>
            ›
          </button>
        </>
      )}

      {showDots && n > 1 && (
        <div className="skewed-carousel__dots" role="tablist" aria-label="Diapositivas">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`Ir a ${i + 1}`}
              className={i === active ? 'is-active' : ''}
              onClick={() => go(i)}
            />
          ))}
        </div>
      )}

      {autoplay && n > 1 && (
        <button
          type="button"
          className="skewed-carousel__pause"
          aria-pressed={manualPaused}
          aria-label="Pausar el avance automático"
          title={manualPaused ? 'Reanudar el avance automático' : 'Pausar el avance automático'}
          onClick={alternarPausa}
        >
          {manualPaused ? (
            <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
              <path d="M4.5 2.8 13 8l-8.5 5.2z" fill="currentColor" />
            </svg>
          ) : (
            <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
              <rect x="3.5" y="2.5" width="3.5" height="11" rx="1" fill="currentColor" />
              <rect x="9" y="2.5" width="3.5" height="11" rx="1" fill="currentColor" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}
