// Rutas de archivos estaticos: en GitHub Pages la app vive en un subpath
// (BASE_URL = "/crux/"), asi que "/img/x.webp" debe resolverse a "/crux/img/x.webp".
const BASE = import.meta.env.BASE_URL || '/';

export function assetUrl(path) {
  if (typeof path !== 'string' || !path) return path;
  if (/^([a-z]+:)?\/\//i.test(path) || path.startsWith('data:') || path.startsWith('blob:')) {
    return path;
  }
  return `${BASE}${path.replace(/^\/+/, '')}`;
}

export default assetUrl;
