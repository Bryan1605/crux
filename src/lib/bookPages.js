/**
 * Paginación de la Biblia Patrística.
 *
 * El documento se pagina por **medición real** (no por número de caracteres):
 * los bloques se montan una vez en un contenedor oculto con la misma tipografía
 * y el mismo ancho que una página, se mide la altura de cada uno y se reparten
 * con un algoritmo voraz. Así el texto fluye como en un libro impreso y ninguna
 * página queda a medias ni desbordada.
 *
 * Este módulo es puro (sin DOM): recibe las alturas ya medidas y devuelve las
 * páginas. Eso permite verificarlo con Node en `scripts/qa-biblia.mjs`.
 */

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/**
 * Geometría del libro a partir del hueco disponible.
 *
 * `bodyH` es la altura realmente disponible para el texto (la página menos los
 * márgenes, el encabezado y el folio): es la que se usa para paginar.
 */
export function bookGeometry({ width, height, fontSize = 17 }) {
  const wide = width >= 900;
  const columns = wide ? 2 : 1;
  const spine = wide ? 84 : 0; // lomo + aire entre páginas
  const raw = (width - spine) / columns;
  const pageW = Math.round(clamp(raw, 296, wide ? 540 : 640));
  const pageH = Math.round(clamp(Math.min(height * 0.74, pageW * 1.55), 360, 800));
  const pad = Math.round(clamp(pageW * 0.078, 16, 34));
  const head = 36; // encabezado + separación (fijo en CSS)
  const foot = 32; // folio (fijo en CSS)
  const bodyH = Math.max(200, pageH - pad * 2 - head - foot);
  return { wide, columns, spine, pageW, pageH, pad, head, foot, bodyH, fontSize };
}

const isHeading = block => block.type === 'heading' || block.type === 'part';

/**
 * Reparte el flujo de bloques en páginas.
 *
 * Usa ids de página **estables** e independientes del tamaño de la ventana:
 *
 *   `p2-4`              → la Parte 2.4 (su primera página)
 *   `p2-4-resumen`      → la sección (su primera página)
 *   `p2-4-resumen.3`    → la 3.ª página de esa sección
 *
 * El «ámbito» de una página es su sección si empieza una, y si no su Parte;
 * dentro del ámbito se numeran las páginas 1..k.
 *
 * @param {object} book            modelo de `parseBook()`
 * @param {number[]} extents       altura de cada bloque, medida en el DOM
 * @param {number} pageHeight      altura útil de una página
 */
export function packBook(book, extents, pageHeight) {
  const { blocks } = book;
  const packs = [];
  let current = { blocks: [], height: 0, hasContent: false };

  const close = () => {
    if (current.blocks.length) {
      packs.push(current);
      current = { blocks: [], height: 0, hasContent: false };
    }
  };

  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i];
    const h = extents[i] || 0;
    const next = i + 1 < blocks.length ? blocks[i + 1] : null;
    const nextHeight = next ? extents[i + 1] || 0 : 0;
    const hasContent = current.hasContent;

    // Una Parte siempre abre página; un título nunca queda solo al final ni
    // delante de otro título (Parte o sección). Nunca se cierra una página que
    // solo tenga títulos: si un párrafo gigante no cabe, viaja con su título.
    const opensPart = block.type === 'part' && hasContent;
    const overflow = hasContent && current.height + h > pageHeight;
    const widow =
      isHeading(block) &&
      hasContent &&
      Boolean(next) &&
      (next.type === 'part' || next.type === 'heading' || current.height + h + nextHeight > pageHeight);

    if (opensPart || overflow || widow) close();

    current.blocks.push(i);
    current.height += h;
    if (!isHeading(block)) current.hasContent = true;
  }
  close();

  const counters = new Map();
  const pageById = new Map();
  const pageOfBlock = new Map();
  const folioOfPart = new Map();
  const folioOfSection = new Map();
  const scopePages = new Map();

  const pages = packs.map((pack, index) => {
    const first = blocks[pack.blocks[0]];
    const scopeId = first.sectionId || first.partId;
    const k = (counters.get(scopeId) || 0) + 1;
    counters.set(scopeId, k);

    const page = {
      index,
      folio: index + 1,
      id: `${scopeId}.${k}`,
      scopeId,
      k,
      partId: first.partId,
      sectionId: first.sectionId,
      blocks: pack.blocks
    };

    pageById.set(page.id, index);

    const list = scopePages.get(scopeId) || [];
    list.push(index);
    scopePages.set(scopeId, list);

    for (const blockIndex of pack.blocks) pageOfBlock.set(blockIndex, index);
    return page;
  });

  // Un enlace a una Parte o a una sección abre la página donde está su título,
  // aunque el título caiga a mitad de página (el índice debe dar su folio real).
  for (const part of book.parts) {
    const at = pageOfBlock.get(part.firstBlock);
    if (at === undefined) continue;
    pageById.set(part.id, at);
    folioOfPart.set(part.id, pages[at].folio);
  }

  for (const section of book.sections) {
    const at = pageOfBlock.get(section.blockIndex);
    if (at === undefined) continue;
    pageById.set(section.id, at);
    folioOfSection.set(section.id, pages[at].folio);
  }

  return { pages, pageById, pageOfBlock, folioOfPart, folioOfSection, scopePages };
}

/**
 * Enlaces antiguos (`?pag=p9`, `p133`, `p139`…) anteriores a la repaginación.
 * Apuntaban a páginas concretas del esquema viejo (que mezclaba el encabezado
 * de la Parte 2.1 con las secciones de Atenágoras); ahora apuntan a su contenido.
 */
const LEGACY = {
  p9: 'p2-1',
  p133: 'p2-4-resumen',
  p135: 'p2-4-obra-completa-traducida',
  p139: 'p3-1'
};

/**
 * Resuelve un id de la URL a un índice de página.
 * Acepta `p2-4`, `p2-4-resumen`, `p2-4-resumen.3` y los enlaces antiguos.
 *
 * @returns {number} índice de página, o -1 si no existe.
 */
export function resolvePage(pagination, rawId) {
  const id = String(rawId || '').trim();
  if (!id || !pagination) return -1;

  const target = LEGACY[id] || id;
  const direct = pagination.pageById.get(target);
  if (direct !== undefined) return direct;

  // `ambito.k`: la k-ésima página de esa Parte o sección (con acotación).
  const pieces = target.split('.');
  if (pieces.length === 2) {
    const list = pagination.scopePages.get(pieces[0]);
    const k = Number.parseInt(pieces[1], 10);
    if (list && list.length && Number.isFinite(k) && k >= 1) {
      return list[Math.min(k, list.length) - 1];
    }
  }

  return -1;
}

/** Años de tradición que abarca la obra (para la portada). */
export const CENTURIES = 8;
