import { Fragment } from 'react';

/** Parte el texto en tramos de texto y marcas de nota `[x]`. */
function tokenize(text) {
  const out = [];
  const re = /\[([a-z]{1,2})\]/g;
  let last = 0;
  let m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ k: 't', v: text.slice(last, m.index) });
    out.push({ k: 'fn', v: m[1] });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ k: 't', v: text.slice(last) });
  return out;
}

/**
 * Texto de la NTV con sus marcas de nota convertidas en botones. Se usa en los
 * títulos de sección, donde también puede haber notas (las sobrescrituras de
 * los Salmos, por ejemplo).
 *
 * @param {{ text:string, verse:number, onNote:(anchor:HTMLElement, verse:number, id:string)=>void }} props
 */
export default function NtvInline({ text, verse, onNote }) {
  return tokenize(text).map((part, i) =>
    part.k === 'fn' ? (
      <button
        key={i}
        type="button"
        className="ntv-fn"
        title="Ver la nota del traductor"
        aria-label={`Nota ${part.v}${verse ? ` del versículo ${verse}` : ''}`}
        onClick={event => {
          event.stopPropagation();
          if (onNote) onNote(event.currentTarget, verse, part.v);
        }}
      >
        {part.v}
      </button>
    ) : (
      <Fragment key={i}>{part.v}</Fragment>
    )
  );
}
