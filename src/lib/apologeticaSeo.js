/**
 * Metadatos SEO, archivos de contenido e información de búsqueda de los
 * fascículos de apologética. Módulo puro: lo usan la página (`useSeo`),
 * `scripts/routes-lib.mjs`, `scripts/content-lib.mjs`, `scripts/check-search.mjs`
 * y `vite.config.js`, así que el HTML del build, el buscador y la web no
 * pueden divergir.
 */

export const SHINCHEONJI_PATH = '/apologetica/shincheonji';

export const shincheonjiSeo = brand => ({
  title: `100 preguntas, solo con la Biblia — ${brand}`,
  description:
    'Para miembros y estudiantes de Shincheonji: 100 preguntas que se responden leyendo el versículo, en el griego del Codex Sinaiticus y en español, sin recortes.'
});

export const APOLOGETICA_FASCICULOS = [
  {
    slug: 'shincheonji',
    path: SHINCHEONJI_PATH,
    preguntasFile: 'shincheonji-preguntas.json',
    clavesFile: 'shincheonji-claves.json',
    doctrinaFile: 'shincheonji-doctrina.json',
    bilingualDoctrina: true,
    expectedCount: 100,
    expectedBlocks: 10,
    seo: shincheonjiSeo,
    search: {
      title: 'Shincheonji — 100 preguntas, solo con la Biblia',
      desc: '100 preguntas con el texto griego del Codex Sinaiticus frente a la NTV y contraste doctrinal con «The Creation of Heaven and Earth» de Lee Man-hee.',
      tags: ['shincheonji', 'apologética', 'sectas', 'lee man-hee', 'codex sinaiticus'],
      extra: ['scj', 'nuevo cielo nueva tierra', 'pastor prometido', 'vencedor', 'parabolas']
    }
  },
  {
    slug: 'adventismo',
    path: '/apologetica/adventismo',
    preguntasFile: 'adventismo-preguntas.json',
    clavesFile: 'adventismo-claves.json',
    doctrinaFile: 'adventismo-doctrina.json',
    bilingualDoctrina: false,
    expectedCount: 100,
    expectedBlocks: 10,
    seo: brand => ({
      title: `Adventismo: 100 preguntas, solo con la Biblia — ${brand}`,
      description:
        'Para miembros y estudiantes adventistas: 100 preguntas en 10 temas y análisis «¿Qué cree el Adventismo?» con fuentes oficiales y patrística sobre el sábado, el Día del Señor, 1844, el juicio investigador, Azazel, el remanente, Elena G. de White y la cristología, en el Codex Sinaiticus y la NTV.'
    }),
    search: {
      title: 'Adventismo — 100 preguntas y contraste doctrinal',
      desc: '100 preguntas con el Codex Sinaiticus y la NTV más contraste documental «¿Qué cree el Adventismo?» sobre el sábado, el Día del Señor (patrística), la ley, 1844, Azazel, el remanente, Elena G. de White y Miguel.',
      tags: [
        'adventismo',
        'apologética',
        'sábado',
        'día del señor',
        '1844',
        'juicio investigador',
        'codex sinaiticus'
      ],
      extra: [
        'adventistas del septimo dia',
        'ellen white',
        'elena de white',
        'santuario celestial',
        'sueno del alma',
        'aniquilacionismo',
        'ley ceremonial',
        'que cree el adventismo',
        'arcangel miguel',
        'marca de la bestia',
        'iglesia remanente',
        'domingo patrística',
        'leroy froom',
        'azazel'
      ]
    }
  },
  {
    slug: 'dispensacionalismo',
    path: '/apologetica/dispensacionalismo',
    preguntasFile: 'dispensacionalismo-preguntas.json',
    clavesFile: 'dispensacionalismo-claves.json',
    doctrinaFile: 'dispensacionalismo-doctrina.json',
    bilingualDoctrina: false,
    expectedCount: 50,
    expectedBlocks: 6,
    seo: brand => ({
      title: `Dispensacionalismo: 50 preguntas, solo con la Biblia — ${brand}`,
      description:
        'Para hermanos y estudiantes dispensacionalistas: 50 preguntas sobre Israel y la Iglesia, el Nuevo Pacto, «esta generación», el rapto pretribulacional y el milenio, además de citas literales de J. Dwight Pentecost examinadas con la Escritura.'
    }),
    search: {
      title: 'Dispensacionalismo — 50 preguntas, solo con la Biblia',
      desc: '50 preguntas con el texto griego del Codex Sinaiticus frente a la NTV y contraste doctrinal con «Eventos del Porvenir» de J. Dwight Pentecost.',
      tags: ['dispensacionalismo', 'apologética', 'escatología', 'rapto', 'milenio', 'codex sinaiticus'],
      extra: [
        'israel y la iglesia',
        'nuevo pacto',
        'pentecost',
        'eventos del porvenir',
        'pretribulacional',
        'esta generacion',
        'monte de los olivos',
        'trono de david',
        'sacrificios mileniales'
      ]
    }
  }
];

export const FASCICULO_BY_SLUG = new Map(APOLOGETICA_FASCICULOS.map(f => [f.slug, f]));

export const apologeticaSeo = (slug, brand) => {
  const f = FASCICULO_BY_SLUG.get(slug);
  return f ? f.seo(brand) : { title: brand, description: '' };
};
