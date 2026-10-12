// Índice de contenidos: fuente única en content/estudios/*.md
// (se regenera content/estudios.json al guardar en /admin o con npm run index:wiki)
import index from '../../content/estudios.json';
import { assetUrl } from '../lib/assets';

export const STUDY_CATEGORIES = index.categories;

export const STUDIES = index.studies.map(s => ({ ...s, portada: assetUrl(s.portada) }));

export const studyBySlug = slug => STUDIES.find(s => s.slug === slug);

export default STUDIES;
