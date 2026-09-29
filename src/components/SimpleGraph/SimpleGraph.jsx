import { useEffect, useId, useRef, useState } from 'react';

import './SimpleGraph.css';

function useInView(ref, once = true) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            if (once) io.disconnect();
          } else if (!once) setInView(false);
        }
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, once]);
  return inView;
}

const VB_W = 1000;
const VB_H = 400;

export default function SimpleGraph({
  data = [],
  lineColor = '#B19EEF',
  dotColor = '#B19EEF',
  width = '100%',
  height = 300,
  animationDuration = 2,
  showGrid = true,
  gridStyle = 'solid',
  gridLines = 'both',
  gridLineThickness = 1,
  showDots = true,
  dotSize = 6,
  dotHoverGlow = false,
  curved = true,
  gradientFade = false,
  graphLineThickness = 3,
  calculatePercentageDifference = false,
  animateOnScroll = false,
  animateOnce = true,
  showLabels = false,
  className = ''
}) {
  const wrapRef = useRef(null);
  const pathRef = useRef(null);
  const gradId = useId();
  const inView = useInView(wrapRef, animateOnce);
  const [hover, setHover] = useState(-1);
  const shouldAnimate = animateOnScroll ? inView : true;

  const n = data.length;
  const padX = 40;
  const padTop = 30;
  const padBottom = 56;

  const values = data.map(d => Number(d.value) || 0);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);
  const range = max - min || 1;

  const pts = data.map((d, i) => ({
    x: n <= 1 ? VB_W / 2 : padX + (i * (VB_W - padX * 2)) / (n - 1),
    y: padTop + (1 - ((Number(d.value) || 0) - min) / range) * (VB_H - padTop - padBottom),
    label: d.label || '',
    value: Number(d.value) || 0,
    tip: d.tip || ''
  }));

  const linePath = pts
    .map((p, i) => {
      if (i === 0) return `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
      if (!curved) return `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
      const prev = pts[i - 1];
      const cx = (prev.x + p.x) / 2;
      return `C ${cx.toFixed(1)} ${prev.y.toFixed(1)} ${cx.toFixed(1)} ${p.y.toFixed(1)} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    })
    .join(' ');

  const areaPath =
    n > 0
      ? `${linePath} L ${pts[n - 1].x.toFixed(1)} ${VB_H - padBottom} L ${pts[0].x.toFixed(1)} ${VB_H - padBottom} Z`
      : '';

  useEffect(() => {
    const path = pathRef.current;
    if (!path || n === 0) return;
    const reduced =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const len = path.getTotalLength();
    path.style.strokeDasharray = `${len}`;
    if (!shouldAnimate || reduced) {
      path.style.transition = 'none';
      path.style.strokeDashoffset = '0';
      return;
    }
    path.style.transition = 'none';
    path.style.strokeDashoffset = `${len}`;
    const id = requestAnimationFrame(() => {
      path.style.transition = `stroke-dashoffset ${animationDuration}s ease-out`;
      path.style.strokeDashoffset = '0';
    });
    return () => cancelAnimationFrame(id);
  }, [shouldAnimate, animationDuration, linePath, n]);

  const dash = gridStyle === 'dashed' ? '10 8' : gridStyle === 'dotted' ? '2 8' : undefined;
  const showH = gridLines === 'both' || gridLines === 'horizontal';
  const showV = gridLines === 'both' || gridLines === 'vertical';
  const gridCount = 4;

  const pctOf = i => {
    if (i <= 0 || !calculatePercentageDifference) return null;
    const a = pts[i - 1].value;
    const b = pts[i].value;
    if (!a) return null;
    const p = ((b - a) / Math.abs(a)) * 100;
    return { p, up: p >= 0 };
  };

  return (
    <div
      ref={wrapRef}
      className={['simple-graph', className].filter(Boolean).join(' ')}
      style={{ width, height: `${height}px` }}
    >
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="none"
        role="img"
        aria-label="Gráfico de línea"
      >
        {gradientFade && (
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={lineColor} stopOpacity="0.32" />
              <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
            </linearGradient>
          </defs>
        )}

        {showGrid && (
          <g stroke="rgba(255,255,255,0.12)" strokeWidth={gridLineThickness}>
            {showH &&
              Array.from({ length: gridCount + 1 }, (_, i) => {
                const y = padTop + (i * (VB_H - padTop - padBottom)) / gridCount;
                return <line key={`h${i}`} x1={padX} y1={y} x2={VB_W - padX} y2={y} strokeDasharray={dash} />;
              })}
            {showV &&
              pts.map((p, i) => (
                <line key={`v${i}`} x1={p.x} y1={padTop} x2={p.x} y2={VB_H - padBottom} strokeDasharray={dash} />
              ))}
          </g>
        )}

        {gradientFade && n > 0 && <path d={areaPath} fill={`url(#${gradId})`} />}

        <path
          ref={pathRef}
          d={linePath}
          fill="none"
          stroke={lineColor}
          strokeWidth={graphLineThickness}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />

        {showDots &&
          pts.map((p, i) => (
            <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(-1)}>
              <circle cx={p.x} cy={p.y} r={hover === i ? dotSize : dotSize / 2} fill={dotColor} />
              {dotHoverGlow && hover === i && (
                <circle cx={p.x} cy={p.y} r={dotSize * 1.8} fill={dotColor} opacity="0.3" />
              )}
            </g>
          ))}
      </svg>

      {showLabels && (
        <div className="simple-graph__labels">
          {pts.map((p, i) => (
            <div
              key={i}
              className="simple-graph__label"
              style={{
                left: `${(p.x / VB_W) * 100}%`,
                opacity: shouldAnimate ? 1 : 0,
                transitionDelay: `${((animationDuration / Math.max(1, n)) * i).toFixed(2)}s`
              }}
            >
              <span className="simple-graph__label-title">{p.label}</span>
              {pctOf(i) && (
                <span className={`simple-graph__pct ${pctOf(i).up ? 'is-up' : 'is-down'}`}>
                  {pctOf(i).up ? '▲' : '▼'} {Math.abs(pctOf(i).p).toFixed(0)}%
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <div
        className="simple-graph__tip"
        data-show={hover >= 0 ? '1' : '0'}
        style={hover >= 0 ? { left: `${(pts[hover].x / VB_W) * 100}%` } : undefined}
      >
        {hover >= 0 && (
          <>
            <strong>{pts[hover].label || `#${hover + 1}`}</strong>
            <span>{pts[hover].tip || pts[hover].value}</span>
          </>
        )}
      </div>
    </div>
  );
}
