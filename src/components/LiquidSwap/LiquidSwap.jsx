import { useEffect, useRef, useState } from 'react';

import './LiquidSwap.css';

const easeInOut = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export default function LiquidSwap({
  images = [],
  transitionDuration = 2.5,
  glassRefractionStrength = 1,
  glassChromaticAberration = 0,
  glassBubbleClarity = 1,
  glassEdgeGlow = 1,
  glassLiquidFlow = 1,
  startAtCursor = false,
  autoCycle = false,
  autoCycleDelay = 3000,
  className = '',
  children
}) {
  const [idx, setIdx] = useState(0);
  const [swap, setSwap] = useState(null); // { next, ox, oy }
  const wrapRef = useRef(null);
  const clipRef = useRef(null);
  const ballRef = useRef(null);
  const rafRef = useRef(0);
  const swappingRef = useRef(false);

  const n = images.length;

  const trigger = (originX, originY) => {
    if (n < 2 || swappingRef.current) return;
    const next = (idx + 1) % n;
    swappingRef.current = true;
    setSwap({ next, ox: originX, oy: originY });
  };

  useEffect(() => {
    if (!autoCycle || n < 2) return undefined;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return undefined;
    const id = setInterval(() => {
      const rect = wrapRef.current?.getBoundingClientRect();
      trigger(rect ? rect.width / 2 : 0, rect ? rect.height / 2 : 0);
    }, autoCycleDelay);
    return () => clearInterval(id);
  }, [autoCycle, autoCycleDelay, n, idx]);

  useEffect(() => {
    if (!swap) return undefined;
    const wrap = wrapRef.current;
    const clip = clipRef.current;
    const ball = ballRef.current;
    if (!wrap || !clip || !ball) return undefined;
    const rect = wrap.getBoundingClientRect();
    const ox = swap.ox;
    const oy = swap.oy;
    const corners = [
      [0, 0],
      [rect.width, 0],
      [0, rect.height],
      [rect.width, rect.height]
    ];
    const rMax = Math.max(...corners.map(([x, y]) => Math.hypot(x - ox, y - oy))) * 1.05;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const D = reduced ? 0.4 : Math.max(0.4, transitionDuration);
    const growEnd = 0.78;
    const start = performance.now();
    clip.style.opacity = '1';
    ball.style.opacity = '1';

    const frame = now => {
      const t = Math.min(1, (now - start) / (D * 1000));
      const rg = t <= growEnd ? easeInOut(t / growEnd) : 1;
      const r = rg * rMax;
      clip.style.clipPath = `circle(${r.toFixed(1)}px at ${ox.toFixed(1)}px ${oy.toFixed(1)}px)`;

      const size = Math.max(1, r * 2);
      ball.style.width = `${size}px`;
      ball.style.height = `${size}px`;
      ball.style.left = `${ox}px`;
      ball.style.top = `${oy}px`;
      ball.style.opacity = t < growEnd ? '1' : String(Math.max(0, 1 - (t - growEnd) / (1 - growEnd)));

      if (t < 1) {
        rafRef.current = requestAnimationFrame(frame);
      } else {
        setIdx(swap.next);
        setSwap(null);
        swappingRef.current = false;
      }
    };
    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
  }, [swap, transitionDuration]);

  if (n === 0) return null;

  const current = images[idx];
  const next = swap ? images[swap.next] : null;

  const onClick = e => {
    if (!startAtCursor) return;
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    trigger(e.clientX - rect.left, e.clientY - rect.top);
  };

  const onKeyDown = e => {
    if (!startAtCursor || (e.key !== 'Enter' && e.key !== ' ')) return;
    e.preventDefault();
    const rect = wrapRef.current?.getBoundingClientRect();
    trigger(rect ? rect.width / 2 : 0, rect ? rect.height / 2 : 0);
  };

  const refraction = glassRefractionStrength;

  return (
    <div
      ref={wrapRef}
      className={['liquid-swap', className].filter(Boolean).join(' ')}
      onClick={onClick}
      onKeyDown={onKeyDown}
      role={startAtCursor ? 'button' : undefined}
      tabIndex={startAtCursor ? 0 : undefined}
      aria-label={startAtCursor ? 'Cambiar imagen' : undefined}
    >
      <div className="liquid-swap__layer" style={{ backgroundImage: `url(${current})` }} />
      {next && (
        <div
          ref={clipRef}
          className="liquid-swap__layer liquid-swap__layer--next"
          style={{ backgroundImage: `url(${next})` }}
        />
      )}
      {next && (
        <div
          ref={ballRef}
          className="liquid-swap__ball"
          style={{
            '--ls-blur': `${(refraction * 5).toFixed(1)}px`,
            '--ls-sat': String(1 + refraction * 0.5),
            '--ls-clarity': `${(60 * glassBubbleClarity).toFixed(0)}%`,
            '--ls-glow': glassEdgeGlow,
            '--ls-flow': `${(2.4 / Math.max(0.2, glassLiquidFlow)).toFixed(2)}s`,
            '--ls-chroma': glassChromaticAberration
          }}
        />
      )}
      {children && <div className="liquid-swap__content">{children}</div>}
    </div>
  );
}
