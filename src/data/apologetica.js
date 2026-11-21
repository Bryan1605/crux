/**
 * Exámenes apologéticos («Preguntas con la Biblia»): diálogo y contraste
 * bíblico por corriente o movimiento.
 *
 * `estado`: 'disponible' | 'proximamente'. Solo las entradas con `href`
 * enlazan a una página activa; el resto se muestra como «Próximamente».
 */
export const APOLOGETICA_EXAMS = [
  {
    id: 'shincheonji',
    nombre: 'Shincheonji',
    estado: 'disponible',
    href: '/apologetica/shincheonji',
    badge: 'Disponible',
    tag: '100 preguntas de cotejo',
    desc: 'Cien preguntas en diez temas cruciales con el texto griego del Codex Sinaiticus frente a la NTV, además de 35 citas literales de sus doctrinas fundamentales examinadas con rigor.',
    footLeft: 'Cotejo exegético',
    footRight: '10 temas · 35 citas',
    cta: 'Abrir las 100 preguntas'
  },
  {
    id: 'adventismo',
    nombre: 'Adventismo',
    estado: 'disponible',
    href: '/apologetica/adventismo',
    badge: 'Disponible',
    tag: '50 preguntas de cotejo',
    desc: 'Sábado ceremonial, santuario celestial, juicio investigador, ley y evangelio examinados directamente en el texto griego del Codex Sinaiticus frente a la NTV.',
    footLeft: 'Cotejo exegético',
    footRight: '6 temas · solo la Biblia',
    cta: 'Abrir las 50 preguntas'
  },
  {
    id: 'catolicismo-romano',
    nombre: 'Catolicismo Romano Papista',
    estado: 'proximamente',
    href: null,
    badge: 'Próximamente',
    tag: 'Fascículo III',
    desc: 'Primado papal, infalibilidad ex cathedra, tradición magisterial, mediación y justificación contrastados con la Escritura y los Padres apostólicos.',
    footLeft: 'Patrística y textos griegos',
    footRight: 'Revisión de fuentes'
  },
  {
    id: 'dispensacionalismo',
    nombre: 'Dispensacionalismo',
    estado: 'disponible',
    href: '/apologetica/dispensacionalismo',
    badge: 'Disponible',
    tag: '50 preguntas de cotejo',
    desc: 'Israel y la Iglesia, los pactos bíblicos, el rapto pretribulacional y el milenio en el Codex Sinaiticus frente a la NTV, además de 24 citas de Eventos del Porvenir.',
    footLeft: 'Cotejo exegético',
    footRight: '6 temas · 24 citas',
    cta: 'Abrir las 50 preguntas'
  },
  {
    id: 'gnosticos',
    nombre: 'Gnósticos',
    estado: 'proximamente',
    href: null,
    badge: 'Próximamente',
    tag: 'Fascículo V',
    desc: 'La bondad original de la creación, la encarnación real de Cristo y la revelación apostólica pública frente al supuesto conocimiento secreto.',
    footLeft: 'Manuscritos de Nag Hammadi',
    footRight: 'Refutación de Ireneo'
  }
];

export const APOLOGETICA_QUOTE = {
  label: 'Método Crux',
  texto: '«Toda la Escritura es inspirada por Dios y útil para enseñar, para reprender, para corregir y para instruir en la justicia.»',
  cita: '2 Timoteo 3:16'
};

export default APOLOGETICA_EXAMS;
