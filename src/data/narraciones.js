// Narraciones de audio: fuente única en content/narraciones.json (validado en el
// build). El audio y su onda viven en public/ y se sirven con el subpath del sitio.
import narraciones from '../../content/narraciones.json';
import { assetUrl } from '../lib/assets';

export const NARRACIONES = (narraciones.items || []).map(item => ({
  ...item,
  src: assetUrl(item.src),
  peaks: item.peaks ? assetUrl(item.peaks) : ''
}));

/** Narración de un capítulo concreto, o null si ese capítulo no tiene audio. */
export function narracionDe(bookId, chapter) {
  return NARRACIONES.find(n => n.book === bookId && n.chapter === chapter) || null;
}

export default NARRACIONES;
