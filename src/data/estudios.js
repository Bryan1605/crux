// Índice de contenidos: fuente única en content/estudios/*.md
// (se regenera content/estudios.json al guardar en /admin o con npm run index:wiki)
import index from '../../content/estudios.json';

export const STUDY_CATEGORIES = index.categories;

export const STUDIES = index.studies;

export const studyBySlug = slug => STUDIES.find(s => s.slug === slug);

export default STUDIES;
