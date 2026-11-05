/**
 * Fichas de los libros de la Biblia (`content/libros/<id>.json`) y su registro
 * de fuentes verificadas (`content/libros/fuentes.json`).
 *
 * Las fichas se validan en el build (`contentGuard` → `validateLibro`): cuadran
 * con la tabla canónica, tienen 600–900 palabras y solo citan fuentes del
 * registro. Aquí solo se leen.
 *
 * Nota de escala: se importan todas de una vez porque hoy hay pocas. Con muchas
 * fichas conviene separar un índice ligero (id, título, resumen, canon) y cargar
 * cada ficha completa bajo demanda.
 */
import registro from '../../content/libros/fuentes.json';
import { ALL_BOOKS } from './exegesis';

const modules = import.meta.glob(['../../content/libros/*.json', '!../../content/libros/fuentes.json'], {
  eager: true,
  import: 'default'
});

/** Fichas publicadas, en el orden canónico del sitio. */
export const LIBROS = Object.values(modules).sort((a, b) => a.order - b.order);

export const FUENTES = registro.fuentes;

export const libroById = id => LIBROS.find(l => l.id === id) || null;

/** Los 73 libros de la tabla canónica, con su ficha si existe. */
export const LIBROS_CANON = ALL_BOOKS.slice()
  .sort((a, b) => a.order - b.order)
  .map(book => ({ book, ficha: libroById(book.id) }));

export const CERTEZA = {
  segura: 'segura',
  probable: 'probable',
  discutida: 'discutida',
  desconocida: 'desconocida'
};

export const CANON_LABEL = {
  judio: 'Canon judío',
  catolico: 'Canon católico',
  ortodoxo: 'Iglesias ortodoxas',
  protestante: 'Canon protestante'
};

/** Capas de la ficha (`docs/proyecto-biblico/FICHAS.md` §2.1). */
const CAPAS = ['Texto', 'Tradición', 'Estudio'];

const CAPA_RE = new RegExp(`\\[(${CAPAS.join('|')})\\]\\s*`, 'g');

/** Un párrafo en tramos `{ capa, text }`: cada etiqueta `[Estudio]` abre uno nuevo. */
function tramos(p) {
  const out = [];
  let capa = null;
  let last = 0;
  for (const m of p.matchAll(CAPA_RE)) {
    const text = p.slice(last, m.index).trim();
    if (text) out.push({ capa, text });
    capa = m[1];
    last = m.index + m[0].length;
  }
  const rest = p.slice(last).trim();
  if (rest) out.push({ capa, text: rest });
  return out;
}

/**
 * Trocea el cuerpo de una sección en párrafos y listas numeradas; cada párrafo
 * se parte en tramos con su capa (`[Texto]`, `[Tradición]`, `[Estudio]`).
 * @returns {({ kind: 'p', parts: { capa: string|null, text: string }[] } | { kind: 'ol', items: string[] })[]}
 */
export function bloquesDe(body) {
  return String(body || '')
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(Boolean)
    .map(p => {
      const lines = p.split('\n').map(l => l.trim());
      if (lines.length > 1 && lines.every(l => /^\d+\.\s/.test(l))) {
        return { kind: 'ol', items: lines.map(l => l.replace(/^\d+\.\s+/, '')) };
      }
      return { kind: 'p', parts: tramos(p) };
    });
}
