import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';

import './ChapterAudio.css';

/* La onda se dibuja en un lienzo SVG de ancho fijo: así las barras no se
   deforman al cambiar el ancho del raíl y basta con recortar el progreso. */
const WAVE_W = 240;
const WAVE_H = 100;
const WAVE_BUCKETS = 240;

/** Segundos → «m:ss». */
export function clock(seconds) {
  const total = Number.isFinite(seconds) && seconds > 0 ? Math.round(seconds) : 0;
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

/** Reduce los picos a `WAVE_BUCKETS` tramos conservando los extremos de cada uno. */
function reduce(peaks) {
  if (!Array.isArray(peaks) || !peaks.length) return [];
  if (peaks.length <= WAVE_BUCKETS) return peaks;
  const step = peaks.length / WAVE_BUCKETS;
  const out = [];
  for (let b = 0; b < WAVE_BUCKETS; b += 1) {
    let lo = 0;
    let hi = 0;
    for (let i = Math.floor(b * step); i < Math.min(peaks.length, Math.floor((b + 1) * step)); i += 1) {
      lo = Math.min(lo, peaks[i][0]);
      hi = Math.max(hi, peaks[i][1]);
    }
    out.push([lo, hi]);
  }
  return out;
}

/** Camino SVG: un trazo vertical por tramo, del mínimo al máximo. */
function wavePath(peaks) {
  if (!peaks.length) return '';
  const step = WAVE_W / peaks.length;
  const mid = WAVE_H / 2;
  const amp = WAVE_H / 2 - 3;
  return peaks
    .map(([lo, hi], i) => {
      const x = ((i + 0.5) * step).toFixed(2);
      const y1 = mid - Math.max(hi, 0) * amp;
      const y2 = mid - Math.min(lo, 0) * amp;
      return `M${x} ${y1.toFixed(2)}V${Math.max(y2, y1 + 0.8).toFixed(2)}`;
    })
    .join('');
}

/**
 * Reproductor de la narración de un capítulo.
 *
 * La onda son los picos reales del audio (scripts/build-audio-peaks.mjs), se
 * puede pinchar o arrastrar para moverse y responde al teclado como un
 * deslizador. Si el navegador no reproduce Ogg/Opus (Safari), en vez del
 * reproductor se ofrece la descarga.
 */
export default function ChapterAudio({ narracion }) {
  const uid = `wave-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const audioRef = useRef(null);
  const clipRef = useRef(null);
  const headRef = useRef(null);
  const trackRef = useRef(null);
  const dragging = useRef(false);

  const [peaks, setPeaks] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [total, setTotal] = useState(narracion?.duration || 0);
  const [failed, setFailed] = useState(false);
  const [supported, setSupported] = useState(true);

  /* Ogg/Opus lo reproducen Chrome, Edge y Firefox; Safari no. */
  useEffect(() => {
    try {
      const probe = document.createElement('audio');
      setSupported(Boolean(probe.canPlayType('audio/ogg; codecs="opus"')) || Boolean(probe.canPlayType('audio/ogg')));
    } catch {
      setSupported(false);
    }
  }, []);

  /* La onda del audio: picos medidos, no inventados. */
  useEffect(() => {
    if (!narracion?.peaks) return undefined;
    let alive = true;
    fetch(narracion.peaks)
      .then(response => (response.ok ? response.json() : null))
      .then(data => {
        if (!alive || !data) return;
        if (Array.isArray(data.peaks) && data.peaks.length) setPeaks(reduce(data.peaks));
        if (data.duration) setTotal(current => (current || data.duration));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [narracion?.peaks]);

  const path = useMemo(() => wavePath(peaks || []), [peaks]);

  const paint = useCallback(percent => {
    const ratio = Math.min(1, Math.max(0, percent));
    if (clipRef.current) clipRef.current.setAttribute('width', String(Math.max(0.01, ratio * WAVE_W)));
    if (headRef.current) {
      const x = (ratio * WAVE_W).toFixed(2);
      headRef.current.setAttribute('x1', x);
      headRef.current.setAttribute('x2', x);
    }
  }, []);

  const seekTo = useCallback(
    seconds => {
      const audio = audioRef.current;
      const value = Math.min(Math.max(seconds, 0), total || 0);
      setTime(value);
      paint(total ? value / total : 0);
      if (audio) audio.currentTime = value;
    },
    [paint, total]
  );

  const seekAt = useCallback(
    event => {
      const el = trackRef.current;
      if (!el || !total) return;
      const box = el.getBoundingClientRect();
      seekTo(((event.clientX - box.left) / box.width) * total);
    },
    [seekTo, total]
  );

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().then(
        () => setPlaying(true),
        () => setFailed(true)
      );
    } else {
      audio.pause();
      setPlaying(false);
    }
  }, []);

  const onKeyDown = event => {
    const steps = { ArrowLeft: -5, ArrowRight: 5, ArrowDown: -10, ArrowUp: 10, PageDown: -30, PageUp: 30 };
    if (event.key in steps) {
      event.preventDefault();
      seekTo(time + steps[event.key]);
      return;
    }
    if (event.key === 'Home') {
      event.preventDefault();
      seekTo(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      seekTo(total);
    } else if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      toggle();
    }
  };

  const onPointerDown = event => {
    if (!total) return;
    dragging.current = true;
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* punteros sintéticos sin captura */
    }
    seekAt(event);
  };

  const onPointerMove = event => {
    if (dragging.current) seekAt(event);
  };

  const onPointerUp = event => {
    dragging.current = false;
    try {
      if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch {
      /* sin captura previa */
    }
  };

  if (!narracion) return null;

  const percent = total ? Math.round((time / total) * 100) : 0;

  return (
    <section className="ntv-audio" aria-label={`Narración: ${narracion.title}`}>
      <header className="ntv-audio__head">
        <span className="ntv-audio__kicker">Audio</span>
        <b>{narracion.title}</b>
        <span className="ntv-audio__meta">
          {narracion.subtitle ? `${narracion.subtitle} · ` : ''}
          {clock(total)}
        </span>
      </header>

      {!supported || failed ? (
        <div className="ntv-audio__fallback">
          <p>
            Este navegador no reproduce Ogg/Opus. Descarga el audio y escúchalo en tu reproductor
            habitual.
          </p>
          <a className="ntv-audio__download" href={narracion.src} download>
            Descargar {clock(total)} (Ogg/Opus)
          </a>
        </div>
      ) : (
        <>
          <div
            className="ntv-audio__track"
            ref={trackRef}
            role="slider"
            tabIndex={0}
            aria-label={`Posición de ${narracion.title}`}
            aria-valuemin={0}
            aria-valuemax={Math.round(total)}
            aria-valuenow={Math.round(time)}
            aria-valuetext={`${clock(time)} de ${clock(total)}`}
            onKeyDown={onKeyDown}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <svg
              className="ntv-audio__wave"
              viewBox={`0 0 ${WAVE_W} ${WAVE_H}`}
              preserveAspectRatio="none"
              aria-hidden="true"
              focusable="false"
            >
              <clipPath id={uid}>
                <rect ref={clipRef} x="0" y="0" width="0.01" height={WAVE_H} />
              </clipPath>
              {path ? <path className="ntv-audio__path" d={path} /> : null}
              {path ? <path className="ntv-audio__path ntv-audio__path--done" d={path} clipPath={`url(#${uid})`} /> : null}
              <line className="ntv-audio__playhead" ref={headRef} x1="0" y1="3" x2="0" y2={WAVE_H - 3} />
            </svg>
            <span className="ntv-audio__pct" aria-hidden="true">
              {percent} %
            </span>
          </div>

          <div className="ntv-audio__controls">
            <button
              type="button"
              className="ntv-audio__play"
              onClick={toggle}
              aria-label={playing ? `Pausar ${narracion.title}` : `Reproducir ${narracion.title}`}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                {playing ? (
                  <path d="M7 5h4v14H7zM13 5h4v14h-4z" fill="currentColor" />
                ) : (
                  <path d="M8 5.5v13l11-6.5z" fill="currentColor" />
                )}
              </svg>
            </button>
            <span className="ntv-audio__time">
              <b>{clock(time)}</b> / {clock(total)}
            </span>
            <a className="ntv-audio__download ntv-audio__download--icon" href={narracion.src} download title="Descargar el audio (Ogg/Opus)">
              ⤓
              <span className="sr-only">Descargar el audio en Ogg/Opus</span>
            </a>
          </div>

          {narracion.note ? <p className="ntv-audio__note">{narracion.note}</p> : null}
        </>
      )}

      <audio
        ref={audioRef}
        className="ntv-audio__el"
        src={narracion.src}
        preload="metadata"
        onLoadedMetadata={event => {
          const value = event.currentTarget.duration;
          if (Number.isFinite(value) && value > 0) setTotal(value);
        }}
        onTimeUpdate={event => {
          const audio = event.currentTarget;
          setTime(audio.currentTime);
          paint(audio.duration ? audio.currentTime / audio.duration : 0);
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setTime(0);
          paint(0);
        }}
        onError={() => setFailed(true)}
      />
    </section>
  );
}
