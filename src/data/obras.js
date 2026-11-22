// Portadas de las obras de la Biblia Patrística: fuente única en content/obras-patristica.json
import obras from '../../content/obras-patristica.json';
import { assetUrl } from '../lib/assets';

const BY_PARTE = new Map(
  obras.items.map(o => [
    o.parte,
    {
      src: assetUrl(o.portada),
      alt: o.alt,
      formato: o.formato || 'vertical',
      width: o.width || (o.formato === 'horizontal' ? 960 : 640),
      height: o.height || (o.formato === 'horizontal' ? 540 : 800)
    }
  ])
);

/** Portada de la Parte `num` («1.3»), o null si aún no tiene. */
export const portadaDe = num => BY_PARTE.get(num) || null;

/** Lista completa de portadas de obras resueltas con `assetUrl`. */
export const OBRAS_PORTADAS = obras.items.map(o => assetUrl(o.portada));
