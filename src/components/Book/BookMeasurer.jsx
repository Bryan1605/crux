import { useLayoutEffect, useRef } from 'react';

import BlockView from './BlockView';

/**
 * Contenedor oculto de medición: monta TODO el flujo de bloques con el mismo
 * ancho, tipografía y espaciado que una página real, y mide la altura de cada
 * bloque en una sola pasada de layout (diferencias de `offsetTop`).
 *
 * Nada de esto se ve: vive fuera del viewport y el padre lo desmonta en cuanto
 * recibe las alturas, para no arrastrar el coste de layout de 1,2 MB de texto.
 */
export default function BookMeasurer({ book, packKey, pageW, pad, fontSize, onPacked }) {
  const bodyRef = useRef(null);

  useLayoutEffect(() => {
    const el = bodyRef.current;
    if (!el) return;

    const kids = el.children;
    const count = kids.length;
    const tops = new Array(count);
    for (let i = 0; i < count; i += 1) tops[i] = kids[i].offsetTop;

    // `offsetTop` es relativo al contenedor posicionado más cercano, así que se
    // comparan diferencias y el final se toma respecto al propio cuerpo.
    const end = el.offsetTop + el.offsetHeight;

    const extents = new Array(count);
    for (let i = 0; i < count; i += 1) {
      extents[i] = (i + 1 < count ? tops[i + 1] : end) - tops[i];
    }

    onPacked(packKey, extents);
  }, [book, packKey, pageW, pad, fontSize, onPacked]);

  return (
    <div className="book-measure" aria-hidden="true" inert>
      <div
        className="book-measure__page"
        style={{ width: `${pageW}px`, '--book-pad': `${pad}px` }}
      >
        <div
          className="book-page__body book-page__body--measure"
          ref={bodyRef}
          style={{ fontSize: `${fontSize}px` }}
        >
          {book.blocks.map(block => (
            <BlockView key={block.i} block={block} />
          ))}
        </div>
      </div>
    </div>
  );
}
