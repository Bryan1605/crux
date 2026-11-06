import { useEffect, useId, useRef, useState } from 'react';

/**
 * Menú «Aa» de las barras de lectura: agrupa los ajustes que no se usan a cada
 * momento (tamaño de letra, papel, diccionario, facsímil) para que la barra
 * quepa en una fila. Se cierra con Esc, al pulsar fuera o al elegir un enlace.
 */
export default function ReaderMenu({ label = 'Opciones de lectura', children }) {
  const [open, setOpen] = useState(false);
  const root = useRef(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const onKey = e => {
      if (e.key === 'Escape') {
        setOpen(false);
        root.current?.querySelector('.rmenu__toggle')?.focus();
      }
    };
    const onDown = e => {
      if (!root.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [open]);

  return (
    <div className="rmenu" ref={root}>
      <button
        type="button"
        className={`rb-btn rb-btn--icon rmenu__toggle${open ? ' is-active' : ''}`}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={label}
        title={label}
        onClick={() => setOpen(o => !o)}
      >
        <span aria-hidden="true">Aa</span>
      </button>
      <div
        id={panelId}
        className="rmenu__panel"
        role="group"
        aria-label={label}
        hidden={!open}
        onClick={e => {
          if (e.target.closest('a')) setOpen(false);
        }}
      >
        {children}
      </div>
    </div>
  );
}
