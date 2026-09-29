// Fichas de personajes: content/personajes/*.json (solo lectura)
const modules = import.meta.glob('../../content/personajes/*.json', {
  eager: true,
  import: 'default'
});

import { assetUrl } from '../lib/assets';

export const PERSONAJES = Object.values(modules)
  .map(p => ({
    ...p,
    portada: assetUrl(p.portada),
    escenas: (p.escenas || []).map(assetUrl)
  }))
  .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

export const personajeBySlug = slug => PERSONAJES.find(p => p.slug === slug);

export default PERSONAJES;
