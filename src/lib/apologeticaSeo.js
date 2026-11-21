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
    doctrinaFile: null,
    bilingualDoctrina: false,
    expectedCount: 50,
    expectedBlocks: 6,
    seo: brand => ({
      title: `Adventismo: 50 preguntas, solo con la Biblia — ${brand}`,
      description:
        'Para miembros y estudiantes adventistas: 50 preguntas sobre el sábado, la ley, el santuario celestial, 1844, el juicio investigador, el estado intermedio y la profecía, en el griego del Codex Sinaiticus y en español.'
    }),
    search: {
      title: 'Adventismo — 50 preguntas, solo con la Biblia',
      desc: '50 preguntas con el texto griego del Codex Sinaiticus frente a la NTV sobre el sábado, la ley, 1844, el juicio investigador, el estado intermedio y el don de profecía.',
      tags: ['adventismo', 'apologética', 'sábado', '1844', 'juicio investigador', 'codex sinaiticus'],
      extra: [
        'adventistas del septimo dia',
        'ellen white',
        'elena de white',
        'santuario celestial',
        'sueno del alma',
        'aniquilacionismo',
        'ley ceremonial'
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
