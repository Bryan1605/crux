// Portadas de las obras de la Biblia Patrística: fuente única en content/obras-patristica.json
import obras from '../../content/obras-patristica.json';
import { assetUrl } from '../lib/assets';

const BY_PARTE = new Map(obras.items.map(o => [o.parte, { src: assetUrl(o.portada), alt: o.alt }]));

/** Portada de la Parte `num` («1.3»), o null si aún no tiene. */
export const portadaDe = num => BY_PARTE.get(num) || null;
