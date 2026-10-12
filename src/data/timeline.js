// Línea de tiempo global: personajes (derivada) + eventos de content/timeline.json.
import { buildTimeline } from '../lib/timeline';
import { PERSONAJES } from './personajes';

const modules = import.meta.glob('../../content/timeline.json', {
  eager: true,
  import: 'default'
});

const EXTRA = Object.values(modules)[0] || [];

export const TIMELINE = buildTimeline(PERSONAJES, EXTRA);

/** Tipos presentes, con su recuento, para los filtros. */
export const TIMELINE_TIPOS = Object.entries(
  TIMELINE.reduce((acc, ev) => {
    acc[ev.tipo] = (acc[ev.tipo] || 0) + 1;
    return acc;
  }, {})
)
  .map(([id, count]) => ({ id, count }))
  .sort((a, b) => a.id.localeCompare(b.id));

export default TIMELINE;