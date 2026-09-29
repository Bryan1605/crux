// Slides del hero-banner: fuente única en content/slides.json (editable en /admin)
// Las imágenes viven en public/ y se referencian como "/nombre.jpg"
import slides from '../../content/slides.json';
import { assetUrl } from '../lib/assets';

export const SLIDES = slides.map(s => ({ ...s, image: assetUrl(s.image) }));

export default SLIDES;
