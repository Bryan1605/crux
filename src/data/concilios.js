// Concilios y herejías: content/concilios.json (solo lectura).
const modules = import.meta.glob('../../content/concilios.json', {
  eager: true,
  import: 'default'
});

export const CONCILIOS = Object.values(modules)[0] || [];

export const concilioById = id => CONCILIOS.find(c => c.id === id);

export const CONCILIOS_LIST = CONCILIOS.filter(c => c.tipo === 'concilio');
export const HEREJIAS_LIST = CONCILIOS.filter(c => c.tipo === 'herejia');

export default CONCILIOS;