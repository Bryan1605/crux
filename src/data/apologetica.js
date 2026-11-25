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
    tag: '100 preguntas + fuentes oficiales',
    desc: 'Sábado y Día del Señor (con patrística), ley, santuario celestial, 1844, Azazel, remanente, Elena G. de White y cristología examinados en sus libros oficiales, el Codex Sinaiticus y la NTV.',
    footLeft: 'Cotejo exegético y documental',
    footRight: '10 temas · 8 partes doctrinales',
    cta: 'Abrir las 100 preguntas'
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
  },
  {
    id: 'islam',
    nombre: 'Islam',
    estado: 'proximamente',
    href: null,
    badge: 'Próximamente',
    tag: 'Fascículo VI',
    desc: 'La integridad textual de la Torá y el Evangelio (Injil) en los manuscritos antiguos, y la deidad, crucifixión y resurrección histórica de Jesús frente a las afirmaciones coránicas posteriores.',
    footLeft: 'Manuscritos bíblicos y Corán',
    footRight: 'Cotejo histórico-textual'
  },
  {
    id: 'mormonismo',
    nombre: 'Mormonismo · Santos de los Últimos Días',
    estado: 'proximamente',
    href: null,
    badge: 'Próximamente',
    tag: 'Fascículo VII',
    desc: 'El monoteísmo bíblico, la suficiencia del canon apostólico y la continuidad histórica de la Iglesia frente al Libro de Mormón, Doctrina y Convenios y la Perla de Gran Precio.',
    footLeft: 'Canon bíblico y textos SUD',
    footRight: 'Cotejo doctrinal e histórico'
  },
  {
    id: 'testigos-de-jehova',
    nombre: 'Testigos de Jehová',
    estado: 'proximamente',
    href: null,
    badge: 'Próximamente',
    tag: 'Fascículo VIII',
    desc: 'La plena deidad de Cristo, la personalidad del Espíritu Santo y las lecturas griegas del Nuevo Testamento en el Codex Sinaiticus frente a la Traducción del Nuevo Mundo.',
    footLeft: 'Codex Sinaiticus vs. TNM',
    footRight: 'Exégesis griega y cristología'
  },
  {
    id: 'judaizantes-raices-hebreas',
    nombre: 'Judaizantes y Raíces Hebreas',
    estado: 'proximamente',
    href: null,
    badge: 'Próximamente',
    tag: 'Fascículo IX',
    desc: 'El cumplimiento de la Torá mosaica en el Nuevo Pacto, el Concilio de Jerusalén (Hechos 15), Gálatas y Hebreos frente a la exigencia de guardar la ley ritual, fiestas y nombres sagrados para la salvación.',
    footLeft: 'Hechos 15, Gálatas y Hebreos',
    footRight: 'Pactos y libertad en Cristo'
  }
];

export const APOLOGETICA_QUOTE = {
  label: 'Método Crux',
  texto: '«Toda la Escritura es inspirada por Dios y útil para enseñar, para reprender, para corregir y para instruir en la justicia.»',
  cita: '2 Timoteo 3:16'
};

export default APOLOGETICA_EXAMS;
