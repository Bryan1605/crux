import { useEffect, useMemo, useRef } from 'react';

import './DollyGallery.css';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const mod = (n, m) => ((n % m) + m) % m;

export default function DollyGallery({
  images = [],
  infinite = true,
  itemWidth = 340,
  aspectRatio = 0.8,
  borderRadius = 7,
  grayscale = 1,
  perspective = 1000,
  spacing = 800,
  spread = 0.8,
  scatter = 0.1,
  revealRange = 1.5,
  passRange = 1,
  parallaxX = 0.12,
  parallaxY = 0.06,
  parallaxSmooth = 0.85,
  tilt = 4,
  pulse = 0.03,
  drift = 0.08,
  smooth = 0.85,
  wheelSpeed = 1,
  dragSpeed = 1.5,
  autoScroll = 0,
  pauseOnHover = true,
  backgroundColor = 'transparent',
  onIndexChange,
  onItemClick,
  className = '',
  children,
  renderItem
}) {
  const wrapRef = useRef(null);
  const itemRefs = useRef([]);
  const stateRef = useRef({
    focus: 0,
    target: 0,
    vel: 0,
    pointer: { x: 0, y: 0 },
    pcur: { x: 0, y: 0 },
    hover: false,
    dragging: false,
    lastX: 0,
    moved: 0,
    suppress: false,
    lastIndex: null,
    lastInput: 0,
    raf: 0
  });

  const n = images.length;
  const itemHeight = Math.round(itemWidth / aspectRatio);

  const sides = useMemo(
    () => images.map((_, i) => (i % 2 === 0 ? 1 : -1)),
    [images]
  );
  const scatters = useMemo(
    () => images.map(() => (Math.random() - 0.5) * 2),
    [images]
  );

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || n === 0) return undefined;
    const st = stateRef.current;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let last = performance.now();

    const apply = () => {
      const focus = st.focus;
      const vel = st.vel;
      const speed = clamp(Math.abs(vel) * spacing * 0.6, 0, 1);
      const px = reduced ? 0 : st.pcur.x;
      const py = reduced ? 0 : st.pcur.y;
      const driftY = reduced ? 0 : -clamp(vel, -3, 3) * drift * itemHeight;

      for (let i = 0; i < n; i++) {
        const el = itemRefs.current[i];
        if (!el) continue;
        let rel = infinite ? mod(i - focus + n / 2, n) - n / 2 : i - focus;
        const visible = rel <= revealRange && rel >= -passRange;
        if (!visible) {
          el.style.opacity = '0';
          el.style.visibility = 'hidden';
          continue;
        }
        el.style.visibility = 'visible';
        const alpha =
          rel >= 0 ? 1 - rel / revealRange : 1 + rel / Math.max(0.001, passRange);
        el.style.opacity = clamp(alpha, 0, 1).toFixed(3);

        const near = Math.max(0, 1 - Math.abs(rel));
        const z = -rel * spacing;
        const x = sides[i] * spread * itemWidth * clamp(Math.abs(rel), 0, 1) + px * parallaxX * itemWidth * near;
        const y = scatters[i] * scatter * itemHeight + py * parallaxY * itemHeight * near + driftY;
        const rotY = reduced ? 0 : px * tilt * near * (0.35 + speed);
        const scale = reduced ? 1 : 1 + pulse * speed * near;

        el.style.transform = `translate(-50%, -50%) translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${z.toFixed(1)}px) rotateY(${rotY.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
        el.style.zIndex = String(Math.round(1000 - rel * 10));
        el.dataset.near = near > 0.5 ? '1' : '0';
      }

      const idx = Math.round(focus);
      if (idx !== st.lastIndex) {
        st.lastIndex = idx;
        onIndexChange?.(infinite ? mod(idx, Math.max(1, n)) : clamp(idx, 0, n - 1));
      }
    };

    const tick = now => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const st = stateRef.current;

      if (autoScroll > 0 && !(pauseOnHover && st.hover) && !reduced) {
        st.target += (autoScroll * dt) / spacing;
      }
      if (
        autoScroll === 0 &&
        !st.dragging &&
        st.lastInput > 0 &&
        now - st.lastInput > 350 &&
        Math.abs(st.target - Math.round(st.target)) > 0.02
      ) {
        st.target = Math.round(st.target);
      }
      if (!infinite) st.target = clamp(st.target, 0, n - 1);

      const prev = st.focus;
      if (reduced) {
        st.focus = st.target;
      } else {
        const k = 1 - Math.pow(clamp(smooth, 0, 0.999), dt * 60);
        st.focus += (st.target - st.focus) * k;
      }
      st.vel = st.vel * 0.85 + ((st.focus - prev) / Math.max(dt, 1e-4)) * 0.15 * dt;

      const pk = reduced ? 1 : 1 - Math.pow(clamp(parallaxSmooth, 0, 0.999), dt * 60);
      st.pcur.x += (st.pointer.x - st.pcur.x) * pk;
      st.pcur.y += (st.pointer.y - st.pcur.y) * pk;

      apply();
      st.raf = requestAnimationFrame(tick);
    };

    const onWheel = e => {
      e.preventDefault();
      st.lastInput = performance.now();
      st.target += (e.deltaY * wheelSpeed) / spacing;
      if (!infinite) st.target = clamp(st.target, 0, n - 1);
    };
    const onMove = e => {
      const rect = wrap.getBoundingClientRect();
      st.pointer.x = clamp((e.clientX - rect.left) / rect.width - 0.5, -0.5, 0.5) * 2;
      st.pointer.y = clamp((e.clientY - rect.top) / rect.height - 0.5, -0.5, 0.5) * 2;
      if (st.dragging) {
        st.lastInput = performance.now();
        const dx = e.clientX - st.lastX;
        st.moved += Math.abs(dx);
        st.lastX = e.clientX;
        if (!st.captured && st.moved > 4 && st.pointerId != null) {
          st.captured = true;
          wrap.setPointerCapture?.(st.pointerId);
        }
        st.target -= (dx * dragSpeed) / spacing;
        if (!infinite) st.target = clamp(st.target, 0, n - 1);
      }
    };
    const onDown = e => {
      if (e.target?.closest?.('button')) {
        st.dragging = false;
        st.downIndex = null;
        return;
      }
      const itemEl = e.target?.closest?.('.dolly-gallery__item');
      st.dragging = true;
      st.moved = 0;
      st.captured = false;
      st.pointerId = e.pointerId;
      st.lastX = e.clientX;
      st.downIndex = itemEl && itemEl.dataset.index != null ? Number(itemEl.dataset.index) : null;
    };
    const onUp = () => {
      if (st.dragging) {
        st.suppress = true;
        setTimeout(() => {
          st.suppress = false;
        }, 400);
        if (st.moved <= 8 && st.downIndex != null && images[st.downIndex] !== undefined) {
          const i = st.downIndex;
          if (typeof onItemClick === 'function') onItemClick(images[i], i);
        }
      }
      st.dragging = false;
      st.captured = false;
      st.pointerId = null;
      st.downIndex = null;
    };
    const onCancel = () => {
      st.dragging = false;
      st.captured = false;
      st.pointerId = null;
      st.downIndex = null;
      st.moved = 0;
    };
    const onEnter = () => {
      st.hover = true;
    };
    const onLeave = () => {
      st.hover = false;
      st.pointer.x = 0;
      st.pointer.y = 0;
    };
    const onKey = e => {
      if (e.key === 'ArrowRight') st.target += 1;
      else if (e.key === 'ArrowLeft') st.target -= 1;
      else if (e.key === 'Enter') {
        const i = mod(Math.round(st.focus), Math.max(1, n));
        if (images[i] !== undefined) onItemClick?.(images[i], i);
        return;
      } else return;
      st.lastInput = performance.now();
      if (!infinite) st.target = clamp(st.target, 0, n - 1);
    };

    wrap.addEventListener('wheel', onWheel, { passive: false });
    wrap.addEventListener('pointermove', onMove, { passive: true });
    wrap.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    window.addEventListener('pointercancel', onCancel, { passive: true });
    wrap.addEventListener('pointerenter', onEnter, { passive: true });
    wrap.addEventListener('pointerleave', onLeave, { passive: true });
    wrap.addEventListener('keydown', onKey);
    st.raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(st.raf);
      wrap.removeEventListener('wheel', onWheel);
      wrap.removeEventListener('pointermove', onMove);
      wrap.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
      wrap.removeEventListener('pointerenter', onEnter);
      wrap.removeEventListener('pointerleave', onLeave);
      wrap.removeEventListener('keydown', onKey);
    };
  }, [images, n, infinite, spacing, itemWidth, itemHeight, spread, scatter, revealRange, passRange, parallaxX, parallaxY, parallaxSmooth, tilt, pulse, drift, smooth, wheelSpeed, dragSpeed, autoScroll, pauseOnHover, onIndexChange, onItemClick, sides, scatters]);

  const classes = ['dolly-gallery', className].filter(Boolean).join(' ');

  return (
    <div
      ref={wrapRef}
      className={classes}
      style={{ backgroundColor, perspective: `${perspective}px` }}
      tabIndex={0}
      aria-label="Galería con desplazamiento en profundidad"
    >
      <div className="dolly-gallery__stage">
        {images.map((img, i) => {
          const src = typeof img === 'string' ? img : img.src;
          const alt = typeof img === 'string' ? '' : img.alt || '';
          return (
            <div
              key={i}
              ref={el => {
                itemRefs.current[i] = el;
              }}
              data-index={i}
              className="dolly-gallery__item"
              style={{
                width: `${itemWidth}px`,
                height: `${itemHeight}px`,
                borderRadius: `${borderRadius}px`
              }}
              onClick={() => {
                if (stateRef.current.suppress) return;
                onItemClick?.(images[i], i);
              }}
            >
              {renderItem ? (
                renderItem(img, i)
              ) : (
                <img src={src} alt={alt} draggable={false} style={{ filter: `grayscale(${grayscale})` }} />
              )}
            </div>
          );
        })}
      </div>
      {children && <div className="dolly-gallery__overlay">{children}</div>}
    </div>
  );
}
