import { renderProse } from '../../lib/markdown';

/**
 * Un bloque del libro: título de Parte, encabezado de sección o markdown
 * (párrafos, listas, citas y tablas). Se renderiza a HTML real —texto
 * seleccionable, buscable y accesible—, nunca a una textura.
 */

const cache = new Map();

function htmlOf(text) {
  let html = cache.get(text);
  if (html === undefined) {
    html = renderProse(text);
    cache.set(text, html);
  }
  return html;
}

export default function BlockView({ block }) {
  if (block.type === 'part') {
    return <h2 className="book-block book-block--part">{block.text}</h2>;
  }

  if (block.type === 'heading') {
    const Tag = block.level >= 4 ? 'h4' : 'h3';
    return (
      <Tag className={`book-block book-block--h${Math.min(block.level, 4)}`}>{block.text}</Tag>
    );
  }

  return (
    <div
      className="book-block book-block--md"
      dangerouslySetInnerHTML={{ __html: htmlOf(block.text) }}
    />
  );
}
