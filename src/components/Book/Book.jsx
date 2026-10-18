import { useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';

import './Book.css';

/**
 * Libro con vuelta de página real (CSS 3D sobre texto del DOM).
 *
 * Cada hoja es un elemento con dos caras —anverso y reverso— que gira sobre el
 * lomo. Mientras gira, debajo ya están las páginas que quedan al descubierto, de
 * modo que la hoja "se apoya" sin saltos: al terminar, se retira la hoja y la
 * escena queda estática con el mismo contenido.
 *
 * En pantalla ancha se muestran dos páginas (izquierda/derecha) y la hoja ocupa
 * la mitad derecha; en móvil hay una sola página y la hoja ocupa todo el ancho.
 */

const FLIP_MS = 620;
const EASE = 'cubic-bezier(.3,.06,.22,1)';
const DRAG_MIN = 16;
const DRAG_COMMIT = 0.3;
const WHEEL_MIN = 8;

function Leaf({ innerRef, angle, animate, front, back }) {
  const mounted = useRef(false);

  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;

    if (!mounted.current) {
      // Estado inicial sin transición y reflow forzado: así la animación del
      // segundo render arranca de verdad (si no, el salto sería instantáneo).
      el.style.transition = 'none';
      el.style.transform = `rotateY(${angle}deg)`;
      el.style.setProperty('--leaf-shade', '0');
      void el.offsetWidth;
      mounted.current = true;
      return;
    }

    el.style.transition = animate
      ? `transform ${FLIP_MS}ms ${EASE}, --leaf-shade ${FLIP_MS}ms linear`
      : 'none';
    el.style.transform = `rotateY(${angle}deg)`;
    el.style.setProperty('--leaf-shade', String(Math.sin((Math.abs(angle) / 180) * Math.PI) * 0.45));
  }, [angle, animate, innerRef]);

  return (
    <div className="book__leaf" ref={innerRef}>
      <div className="book__face book__face--front">{front}</div>
      <div className="book__face book__face--back">{back}</div>
      <span className="book__shade" aria-hidden="true" />
    </div>
  );
}

export default function Book({
  pages,
  mode = 'spread',
  index,
  onIndex,
  renderPage,
  reduced = false,
  pageW = 480,
  theme = 'claro',
  apiRef = null,
  className = ''
}) {
  const spread = mode === 'spread';
  const total = spread ? Math.ceil(pages.length / 2) : pages.length;

  const [flip, setFlip] = useState(null);
  const leafRef = useRef(null);
  const stageRef = useRef(null);
  const dragRef = useRef(null);
  const timerRef = useRef(0);
  const wheelUntil = useRef(0);
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      window.clearTimeout(timerRef.current);
    };
  }, []);

  // Si el libro se repagina bajo los pies, no dejamos animaciones colgadas.
  useEffect(() => {
    window.clearTimeout(timerRef.current);
    setFlip(null);
  }, [total, mode]);

  const pageAt = useCallback(i => (i >= 0 && i < pages.length ? pages[i] : null), [pages]);

  const paint = useCallback((angle, animate) => {
    const el = leafRef.current;
    if (!el) return;
    el.style.transition = animate ? `transform ${FLIP_MS}ms ${EASE}` : 'none';
    el.style.transform = `rotateY(${angle}deg)`;
    el.style.setProperty('--leaf-shade', String(Math.sin((Math.abs(angle) / 180) * Math.PI) * 0.45));
  }, []);

  /** Pasa página. `dir` = 1 hacia delante, -1 hacia atrás. */
  const turn = useCallback(
    (dir, animate = true) => {
      const target = index + dir;
      if (target < 0 || target >= total) return false;
      if (reduced || !animate) {
        onIndex(target);
        return true;
      }

      window.clearTimeout(timerRef.current);
      setFlip({ dir, angle: dir > 0 ? 0 : -180, animate: false });
      window.requestAnimationFrame(() => {
        if (!aliveRef.current) return;
        setFlip(current => (current ? { ...current, angle: dir > 0 ? -180 : 0, animate: true } : current));
      });
      timerRef.current = window.setTimeout(() => {
        if (!aliveRef.current) return;
        onIndex(target);
        setFlip(null);
      }, FLIP_MS);
      return true;
    },
    [index, total, reduced, onIndex]
  );

  /** Cierra una animación (arrastre): confirma o devuelve la hoja a su sitio. */
  const settle = useCallback(
    (dir, commit) => {
      if (commit) {
        paint(dir > 0 ? -180 : 0, true);
        window.clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(() => {
          if (!aliveRef.current) return;
          onIndex(index + dir);
          setFlip(null);
        }, FLIP_MS);
        return;
      }
      paint(dir > 0 ? 0 : -180, true);
      window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        if (!aliveRef.current) return;
        setFlip(null);
      }, FLIP_MS);
    },
    [index, onIndex, paint]
  );

  // La página gobierna el teclado (←/→, AvPág/AvPág, Inicio/Fin) y llama aquí,
  // así una sola tecla no puede disparar dos vueltas de hoja.
  useImperativeHandle(apiRef, () => ({ turn }), [turn]);

  /* --------------------------- márgenes y puntero --------------------------- */

  /** ¿Cae `clientX` en la banda de margen exterior del pliego? */
  const bandAt = useCallback(clientX => {
    const el = stageRef.current;
    const node = el ? el.querySelector('.book') : null;
    if (!el || !node) return '';
    const box = node.getBoundingClientRect();
    const pad = Number.parseFloat(getComputedStyle(el).getPropertyValue('--book-pad')) || 28;
    const band = Math.max(pad, 24);
    if (clientX >= box.left && clientX <= box.left + band) return 'prev';
    if (clientX <= box.right && clientX >= box.right - band) return 'next';
    return '';
  }, []);

  /** Cursor: «seleccionar» sobre el texto, «pasar hoja» en los márgenes. */
  const onHover = useCallback(
    event => {
      const el = stageRef.current;
      if (!el || dragRef.current) return;
      const target = event.target instanceof HTMLElement ? event.target : null;
      const inText = Boolean(target && target.closest('.book-page__body'));
      if (inText) {
        delete el.dataset.zone;
        delete el.dataset.grab;
        return;
      }
      const band = bandAt(event.clientX);
      if (band) {
        el.dataset.zone = band;
        delete el.dataset.grab;
      } else {
        delete el.dataset.zone;
        el.dataset.grab = '1';
      }
    },
    [bandAt]
  );

  const clearHover = useCallback(() => {
    const el = stageRef.current;
    if (!el) return;
    delete el.dataset.zone;
    delete el.dataset.grab;
  }, []);

  const onPointerDown = event => {
    if (flip) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const el = event.target instanceof HTMLElement ? event.target : null;
    const tag = el ? el.tagName : '';
    if (['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(tag)) return;
    // El texto de la página se marca con el ratón; pasar hoja es cosa de los
    // márgenes (arrastre o clic), las flechas, el teclado o la rueda. En táctil
    // no hay marcar con el dedo: el arrastre sigue valiendo en toda la hoja.
    const inText = Boolean(el && el.closest('.book-page__body'));
    if (event.pointerType === 'mouse' && inText) return;
    dragRef.current = {
      x0: event.clientX,
      y0: event.clientY,
      dir: 0,
      p: 0,
      band: inText ? '' : bandAt(event.clientX)
    };
    // La captura mantiene el gesto aunque el puntero salga del pliego: sin ella,
    // soltar fuera dejaba la hoja a medio girar y sin pasar.
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* punteros sintéticos sin captura: el gesto sigue funcionando */
    }
  };

  const onPointerMove = event => {
    const drag = dragRef.current;
    if (!drag) {
      onHover(event);
      return;
    }
    const dx = event.clientX - drag.x0;
    const dy = event.clientY - drag.y0;

    if (!drag.dir) {
      if (Math.abs(dx) < DRAG_MIN || Math.abs(dx) <= Math.abs(dy)) return;
      const dir = dx < 0 ? 1 : -1;
      if (index + dir < 0 || index + dir >= total) {
        dragRef.current = null;
        return;
      }
      drag.dir = dir;
      drag.width = Math.max(pageW, 200);
      setFlip({ dir, angle: dir > 0 ? 0 : -180, animate: false });
      return;
    }

    const raw = drag.dir > 0 ? -dx : dx;
    const p = Math.min(1, Math.max(0, raw / drag.width));
    drag.p = p;
    paint(drag.dir > 0 ? -180 * p : -180 + 180 * p, false);
  };

  const onPointerUp = event => {
    try {
      if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch {
      /* sin captura previa */
    }
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag) return;
    if (!drag.dir) {
      // Clic limpio en la banda de margen: pasa hoja sin arrastrar.
      const moved =
        Math.abs(event.clientX - drag.x0) > 6 || Math.abs(event.clientY - drag.y0) > 6;
      if (!moved && drag.band) turn(drag.band === 'next' ? 1 : -1);
      return;
    }
    settle(drag.dir, drag.p > DRAG_COMMIT);
  };

  /* Rueda horizontal (o Mayús + rueda): pasa hoja sin secuestrar el scroll. */
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return undefined;
    const onWheel = event => {
      // Una misma rueda puede llegar como dos eventos (Chrome convierte Mayús +
      // rueda en scroll horizontal y emite otro): una hoja por gesto.
      if (flip || performance.now() < wheelUntil.current) return;
      const delta = event.shiftKey ? event.deltaY : event.deltaX;
      if (Math.abs(delta) < WHEEL_MIN) return;
      event.preventDefault();
      if (turn(delta > 0 ? 1 : -1)) wheelUntil.current = performance.now() + FLIP_MS + 160;
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [flip, turn]);

  /* --------------------------- contenido a pintar --------------------------- */

  let left = pageAt(spread ? index * 2 : index);
  let right = pageAt(index * 2 + 1);
  let front = null;
  let back = null;

  if (flip) {
    if (spread) {
      if (flip.dir > 0) {
        left = pageAt(index * 2);
        right = pageAt(index * 2 + 3);
        front = pageAt(index * 2 + 1);
        back = pageAt(index * 2 + 2);
      } else {
        left = pageAt(index * 2 - 2);
        right = pageAt(index * 2 - 1);
        front = pageAt(index * 2 - 1);
        back = pageAt(index * 2);
      }
    } else if (flip.dir > 0) {
      left = pageAt(index + 1);
      front = pageAt(index);
    } else {
      left = pageAt(index);
      front = pageAt(index - 1);
    }
  }

  return (
    <div
      className={`book-stage ${className}`.trim()}
      data-theme={theme}
      ref={stageRef}
      onPointerLeave={clearHover}
    >
      <button
        type="button"
        className="book-stage__arrow book-stage__arrow--prev"
        onClick={() => turn(-1)}
        disabled={flip ? true : index <= 0}
        aria-label="Página anterior"
      >
        <span aria-hidden="true">‹</span>
      </button>

      <div
        className={`book ${spread ? 'book--spread' : 'book--single'}`}
        role="group"
        aria-roledescription="libro"
        aria-label="Páginas del libro"
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {spread ? (
          <>
            <div className="book__page book__page--left">{left ? renderPage(left) : null}</div>
            <div className="book__page book__page--right">{right ? renderPage(right) : null}</div>
            <span className="book__spine" aria-hidden="true" />
          </>
        ) : (
          <div className="book__page book__page--single">{left ? renderPage(left) : null}</div>
        )}

        {flip && (
          <Leaf
            innerRef={leafRef}
            angle={flip.angle}
            animate={flip.animate}
            front={front ? renderPage(front) : null}
            back={back ? renderPage(back) : <span className="book__paper" />}
          />
        )}
      </div>

      <button
        type="button"
        className="book-stage__arrow book-stage__arrow--next"
        onClick={() => turn(1)}
        disabled={flip ? true : index >= total - 1}
        aria-label="Página siguiente"
      >
        <span aria-hidden="true">›</span>
      </button>
    </div>
  );
}
