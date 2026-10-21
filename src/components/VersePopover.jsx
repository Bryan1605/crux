import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { parseNote, witnessLabel } from '../data/exegesis';
import { describeMorph, posLabel, splitOverline } from '../lib/greek';

import './VersePopover.css';

const MAX_WIDTH = 384;
const MARGIN = 10;

/**
 * Ficha flotante anclada a un elemento (un sigilo del aparato, una marca de
 * nota…). Se coloca en `position: fixed` respecto del elemento pulsado, así que
 * no empuja el texto ni depende del scroll del contenedor: al hacer scroll
 * simplemente se recoloca. Se cierra con Escape, con la × o pulsando fuera.
 */
export default function VersePopover({ anchor, label, onClose, children }) {
  const boxRef = useRef(null);
  const [box, setBox] = useState(null);

  useLayoutEffect(() => {
    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
    const place = () => {
      const el = anchor;
      if (!el || !el.isConnected) {
        onClose();
        return;
      }
      const rect = el.getBoundingClientRect();
      const width = Math.min(MAX_WIDTH, window.innerWidth - MARGIN * 2);
      const left = clamp(rect.left, MARGIN, Math.max(MARGIN, window.innerWidth - width - MARGIN));
      const height = Math.min(
        boxRef.current?.offsetHeight || 260,
        window.innerHeight - MARGIN * 2
      );
      const below = window.innerHeight - rect.bottom - MARGIN;
      const above = rect.top - MARGIN;
      let top;
      if (below >= height || below >= above) {
        top = rect.bottom + 8;
        if (below < height && above > below) top = rect.top - 8 - height;
      } else {
        top = rect.top - 8 - height;
      }
      setBox({
        left,
        width,
        top: clamp(top, MARGIN, Math.max(MARGIN, window.innerHeight - MARGIN - height))
      });
    };
    place();
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [anchor, onClose]);

  useEffect(() => {
    const onKey = event => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
      }
    };
    const onDown = event => {
      const box = boxRef.current;
      if (!box) return;
      if (box.contains(event.target)) return;
      if (anchor && anchor.contains(event.target)) return;
      onClose();
    };
    document.addEventListener('keydown', onKey, true);
    document.addEventListener('mousedown', onDown, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      document.removeEventListener('mousedown', onDown, true);
    };
  }, [anchor, onClose]);

  useEffect(() => {
    const box = boxRef.current;
    box?.focus({ preventScroll: true });
    return () => {
      if (box?.contains(document.activeElement) && anchor?.isConnected) {
        anchor.focus({ preventScroll: true });
      }
    };
  }, [anchor]);

  return (
    <div
      ref={boxRef}
      className="vpop"
      role="dialog"
      aria-label={label}
      tabIndex={-1}
      style={
        box
          ? { left: box.left, width: box.width, top: box.top }
          : { visibility: 'hidden', left: MARGIN, width: MAX_WIDTH }
      }
    >
      <header className="vpop__head">
        <span className="vpop__label">{label}</span>
        <button type="button" className="vpop__close" onClick={onClose} aria-label="Cerrar la ficha">
          ×
        </button>
      </header>
      <div className="vpop__body">{children}</div>
    </div>
  );
}

/** Ficha de una variante del aparato crítico. */
export function ApparatusBody({ entries, start = 0, end }) {
  const last = end ?? entries.length;
  return (
    <ul className="vpop__list">
      {entries.map((entry, i) => (
        <li key={i} className={`vpop__item${i >= start && i < last ? ' is-marked' : ''}`}>
          <span className="exg-witness">{witnessLabel(entry.w)}</span>{' '}
          {entry.t === 'omitted' ? <em>omite</em> : <span className="exg-variant">{entry.t}</span>}
        </li>
      ))}
    </ul>
  );
}

/** Ficha de una nota del traductor. */
export function NoteBody({ note, reference }) {
  const parsed = useMemo(() => parseNote(note), [note]);
  return (
    <div className="vpop__note">
      <p className="vpop__ref">{reference}</p>
      <p>
        <span className={`note-badge note-badge--${parsed.kind}`}>{parsed.label}</span>{' '}
        {parsed.text}
      </p>
    </div>
  );
}

/**
 * Ficha léxica de una palabra del Codex. `analysis` es la entrada del mapa de
 * lemas (`[lema, Strong, parse, ns, categoría]`); `entry` es la entrada del
 * diccionario (o null si el lema aún no está entre los 250 publicados).
 */
export function LexiconBody({ analysis, entry, token, reference, onOpenDictionary }) {
  const [lemma, strong, parse, ns, pos] = analysis || [];
  const morph = describeMorph(pos, parse);
  const isNs = Boolean(ns);
  const kind = morph || entry?.posLabel || posLabel(pos);
  const surface = splitOverline(token?.v || token?.plain || '');

  return (
    <div className="vpop__lex">
      <p className="vpop__ref">{reference}</p>
      <p className="vpop__lex-word" aria-label={`Palabra: ${token?.plain || lemma || ''}`}>
        {surface.map((part, i) =>
          part.overline ? (
            <i key={i} className="vpop__overline">
              {part.text}
            </i>
          ) : (
            <span key={i}>{part.text}</span>
          )
        )}
      </p>

      {analysis ? (
        <>
          <p className="vpop__lex-head">
            <span className="vpop__lex-lemma">{lemma}</span>
            {entry?.translit ? <span className="vpop__lex-translit">{entry.translit}</span> : null}
          </p>
          {kind ? <p className="vpop__lex-pos">{kind}</p> : null}
          {entry ? (
            <p className="vpop__lex-gloss">{entry.gloss}</p>
          ) : (
            <p className="vpop__lex-missing">
              Este lema todavía no está entre los 250 del diccionario.
            </p>
          )}
          {entry?.note ? <p className="vpop__lex-note">{entry.note}</p> : null}
        </>
      ) : (
        <p className="vpop__lex-missing">
          No se pudo alinear esta palabra con MorphGNT. El texto del códice se conserva tal cual.
        </p>
      )}

      <div className="vpop__lex-foot">
        {strong ? <span className="vpop__lex-strong">Strong {strong}</span> : null}
        {isNs ? <span className="vpop__lex-ns">nomen sacrum</span> : null}
        {entry ? (
          <button type="button" className="vpop__lex-link" onClick={onOpenDictionary}>
            Abrir en el diccionario <span aria-hidden="true">→</span>
          </button>
        ) : null}
      </div>
    </div>
  );
}
