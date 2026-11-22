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
 * Ficha léxica de una palabra del Codex. Acepta `morphemes` V2 (`[{ lemma, strong, parse, ns, pos }]`)
 * o el formato plano anterior (`analysis`), además de `entry` (glosa curada) y
 * `baseEntry` (respaldo TBESG para Strongs fuera de la selección curada).
 */
export function LexiconBody({
  morphemes,
  analysis,
  entry,
  baseEntry,
  loading = false,
  token,
  reference,
  onOpenDictionary
}) {
  const resolved = useMemo(() => {
    if (Array.isArray(morphemes) && morphemes.length) return morphemes;
    if (Array.isArray(analysis) && analysis.length) {
      return [{
        lemma: analysis[0],
        strong: analysis[1] || null,
        parse: analysis[2] || null,
        ns: Boolean(analysis[3]),
        pos: analysis[4] || ''
      }];
    }
    return [];
  }, [morphemes, analysis]);

  const primary = resolved[0] || null;
  const lemma = primary?.lemma || '';
  const strong = primary?.strong || '';
  const parse = primary?.parse || '';
  const pos = primary?.pos || '';
  const isNs = resolved.some(m => m.ns);
  const morph = describeMorph(pos, parse);
  const kind = morph || entry?.posLabel || baseEntry?.[2] || posLabel(pos);
  const translit = entry?.translit || baseEntry?.[1] || '';
  const baseGloss = baseEntry?.[3] || '';
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

      {primary ? (
        <>
          <p className="vpop__lex-head">
            <span className="vpop__lex-lemma">{lemma}</span>
            {translit ? <span className="vpop__lex-translit">{translit}</span> : null}
          </p>
          {kind ? <p className="vpop__lex-pos">{kind}</p> : null}

          {resolved.length > 1 && (
            <ul className="vpop__lex-morphemes" aria-label="Desglose de morfemas">
              {resolved.map((m, idx) => (
                <li key={`${m.lemma}-${idx}`}>
                  <b>{m.lemma}</b>
                  {m.strong ? <span> · {m.strong}</span> : null}
                  {describeMorph(m.pos, m.parse) ? <span> · {describeMorph(m.pos, m.parse)}</span> : null}
                </li>
              ))}
            </ul>
          )}

          {entry ? (
            <p className="vpop__lex-gloss">{entry.gloss}</p>
          ) : baseGloss ? (
            <div className="vpop__lex-base">
              <span className="vpop__lex-badge">Glosa base (TBESG · inglés)</span>
              <p className="vpop__lex-gloss">{baseGloss}</p>
            </div>
          ) : loading ? (
            <p className="vpop__lex-missing">Cargando definición…</p>
          ) : (
            <p className="vpop__lex-missing">
              Ficha en español todavía en preparación para este lema.
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
