import { marked } from 'marked';

/**
 * Markdown → HTML para el cuerpo de las páginas.
 * Demueve cualquier <h1> del contenido a <h2> para respetar el h1 único de la página.
 */
export function renderProse(body) {
  return marked
    .parse(body)
    .replace(/<h1(\s|>)/gi, '<h2$1')
    .replace(/<\/h1>/gi, '</h2>');
}

export default renderProse;
