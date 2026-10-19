import { marked } from 'marked';

/**
 * Markdown → HTML para el cuerpo de las páginas.
 * Demueve cualquier <h1> del contenido a <h2> para respetar el h1 único de la página.
 * Los enlaces que salen del sitio se abren en pestaña nueva y sin prestar la
 * ventana (`noopener noreferrer`): el lector no pierde el punto de lectura y la
 * página citada no recibe la referencia del sitio.
 */
export function renderProse(body) {
  return (
    marked
      .parse(body)
      .replace(/<h1(\s|>)/gi, '<h2$1')
      .replace(/<\/h1>/gi, '</h2>')
      // eslint-disable-next-line no-useless-escape
      .replace(/<a href="(https?:\/\/(?!bryan1605\.github\.io\/crux\/)[^"]+)"/g, '<a href="$1" target="_blank" rel="noopener noreferrer"')
  );
}

export default renderProse;
