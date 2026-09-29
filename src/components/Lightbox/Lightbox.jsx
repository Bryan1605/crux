import { useCallback, useEffect, useRef, useState } from 'react';

import './Lightbox.css';

export default function Lightbox({ items = [], index = 0, onClose, label = 'Escena' }) {
  const total = items.length;
  const [i, setI] = useState(() => Math.min(Math.max(index, 0), Math.max(0, total - 1)));
  const rootRef = useRef(null);
  const closeRef = useRef(null);
  const swipeRef = useRef(null);

  const go = useCallback(d => {
    setI(prev => {
      const n = items.length;
      if (n === 0) return prev;
      return (prev + d + n) % n;
    });
  }, [items.length]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        go(1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        go(-1);
      } else if (e.key === 'Tab') {
        const root = rootRef.current;
        if (!root) return;
        const focusables = root.querySelectorAll('button');
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        } else if (!root.contains(document.activeElement)) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    closeRef.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [go, onClose]);

  if (total === 0) return null;
  const item = items[i] || {};

  const onPointerDown = e => {
    swipeRef.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = e => {
    const start = swipeRef.current;
    swipeRef.current = null;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
  };

  return (
    <div
      ref={rootRef}
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={`${label} ${i + 1} de ${total}`}
      onClick={onClose}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    >
      <div className="lightbox__bar" onClick={e => e.stopPropagation()}>
        <span className="lightbox__count">
          {i + 1} <span aria-hidden="true">/</span> {total}
        </span>
        <button ref={closeRef} type="button" className="lightbox__close" aria-label="Cerrar" onClick={onClose}>
          ✕
        </button>
      </div>

      {total > 1 && (
        <button
          type="button"
          className="lightbox__nav lightbox__nav--prev"
          aria-label="Anterior"
          onClick={e => {
            e.stopPropagation();
            go(-1);
          }}
        >
          ‹
        </button>
      )}

      <figure className="lightbox__figure" onClick={e => e.stopPropagation()}>
        <img src={item.src} alt={item.alt || `${label} ${i + 1} de ${total}`} draggable={false} />
        {(item.caption || item.title) && <figcaption>{item.caption || item.title}</figcaption>}
      </figure>

      {total > 1 && (
        <button
          type="button"
          className="lightbox__nav lightbox__nav--next"
          aria-label="Siguiente"
          onClick={e => {
            e.stopPropagation();
            go(1);
          }}
        >
          ›
        </button>
      )}
    </div>
  );
}
