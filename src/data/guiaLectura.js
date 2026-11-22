/**
 * Datos didácticos para `/exegesis/guia`: alfabeto griego koiné (NT y Codex
 * Sinaiticus), alefato hebreo y arameo bíblico (AT), vocales, lectura guiada
 * versículo a versículo y ejercicios breves de reconocimiento.
 *
 * Módulo puro (sin DOM ni dependencias externas): puede usarse tanto en React
 * como en scripts de verificación.
 */

export const GREEK_GUIDE = {
  id: 'griego',
  tabLabel: 'Griego koiné · NT y Codex',
  eyebrow: 'Lectura inicial · Nuevo Testamento y Septuaginta',
  title: 'Cómo leer el griego bíblico y el Codex Sinaiticus',
  lead:
    'No necesitas saber declinaciones de memoria para empezar a descifrar palabras en el lector de exégesis. Con 24 letras, unas pocas vocales dobles y cuatro abreviaturas del manuscrito puedes leer las palabras reales de los evangelios y las cartas.',
  intro: [
    {
      title: 'Misma dirección que el español',
      text: 'El griego se lee de izquierda a derecha. Además, muchas raíces ya las conoces por el español: λόγος (lógos → lógica), βίβλος (bíblos → Biblia), γραφή (grafé → caligrafía) o ἀπόστολος (apóstolos → apóstol).'
    },
    {
      title: 'Texto impreso vs. Codex Sinaiticus',
      text: 'Las ediciones modernas usan minúsculas, espacios entre palabras y acentos. En cambio, el Codex Sinaiticus (s. IV) usa unciales (solo mayúsculas), casi sin separación, sin acentos, con sigma lunada (ϲ) y abreviaturas sagradas con raya encima.'
    },
    {
      title: '¿Cómo pronunciarlo al estudiar?',
      text: 'Aquí usamos la pronunciación didáctica habitual en seminarios (distingue claramente η de ι y υ), junto con notas sobre la pronunciación koiné/moderna (por ejemplo β como v o αι como e), que explica muchas faltas ortográficas antiguas del propio Codex.'
    }
  ],
  filters: [
    { id: 'todas', label: 'Las 24 letras' },
    { id: 'falso-amigo', label: 'Falsos amigos' },
    { id: 'vocal', label: 'Vocales (7)' },
    { id: 'nueva', label: 'Nuevas del griego' },
    { id: 'familiar', label: 'Parecidas al latín' }
  ],
  alphabet: [
    {
      upper: 'Α',
      lower: 'α',
      name: 'Alfa',
      translit: 'a',
      sound: 'a como en «padre»',
      group: 'familiar',
      isVowel: true,
      example: { word: 'ἀμήν', read: 'amén', gloss: 'en verdad, así sea' },
      tip: 'Suena siempre «a», breve o larga.'
    },
    {
      upper: 'Β',
      lower: 'β',
      name: 'Beta',
      translit: 'b / v',
      sound: 'b suave (o v en koiné)',
      group: 'falso-amigo',
      isVowel: false,
      example: { word: 'βίβλος', read: 'bíblos', gloss: 'libro, rollo' },
      tip: 'No la confundas con la ß alemana: es la b/v de «Biblia».'
    },
    {
      upper: 'Γ',
      lower: 'γ',
      name: 'Gamma',
      translit: 'g / ng',
      sound: 'g suave de «gato»',
      group: 'nueva',
      isVowel: false,
      example: { word: 'ἄγγελος', read: 'ánguelos', gloss: 'mensajero, ángel' },
      tip: 'Siempre es «g» suave (ga, gue, gui, go, gu). Ante γ, κ, ξ o χ suena «n» nasal (γγ = ng).'
    },
    {
      upper: 'Δ',
      lower: 'δ',
      name: 'Delta',
      translit: 'd',
      sound: 'd de «dedo»',
      group: 'nueva',
      isVowel: false,
      example: { word: 'δόξα', read: 'dóxa', gloss: 'gloria, esplendor' },
      tip: 'La mayúscula Δ es un triángulo (como un delta fluvial).'
    },
    {
      upper: 'Ε',
      lower: 'ε',
      name: 'Épsilon',
      translit: 'e',
      sound: 'e breve de «fe»',
      group: 'familiar',
      isVowel: true,
      example: { word: 'ἐν', read: 'en', gloss: 'en, dentro de' },
      tip: 'Siempre «e» clara; nunca es muda al final.'
    },
    {
      upper: 'Ζ',
      lower: 'ζ',
      name: 'Dseta / Zeta',
      translit: 'z / ds',
      sound: 'ds o z sonora (zoo)',
      group: 'familiar',
      isVowel: false,
      example: { word: 'ζωή', read: 'dsoé / zoé', gloss: 'vida' },
      tip: 'En didáctica suena suave «ds» o «z» inglesa vibrante.'
    },
    {
      upper: 'Η',
      lower: 'η',
      name: 'Eta',
      translit: 'ē',
      sound: 'e larga (como «é»)',
      group: 'falso-amigo',
      isVowel: true,
      example: { word: 'ἀγάπη', read: 'agápē', gloss: 'amor' },
      tip: '¡Ojo! La mayúscula Η parece una H y la minúscula η parece una n, pero es una VOCAL que suena «e».'
    },
    {
      upper: 'Θ',
      lower: 'θ',
      name: 'Theta',
      translit: 'th',
      sound: 'z española / t aspirada',
      group: 'nueva',
      isVowel: false,
      example: { word: 'θεός', read: 'theós', gloss: 'Dios' },
      tip: 'Aparece en el nomen sacrum más frecuente del Codex: ‹θϲ›.'
    },
    {
      upper: 'Ι',
      lower: 'ι',
      name: 'Iota',
      translit: 'i',
      sound: 'i de «vida»',
      group: 'familiar',
      isVowel: true,
      example: { word: 'Ἰησοῦς', read: 'Iēsoús', gloss: 'Jesús' },
      tip: 'Nunca lleva punto en griego clásico. Cuando ves ϊ en el Codex indica que se pronuncia aparte, no en diptongo.'
    },
    {
      upper: 'Κ',
      lower: 'κ',
      name: 'Kappa',
      translit: 'k',
      sound: 'k fuerte de «casa»',
      group: 'familiar',
      isVowel: false,
      example: { word: 'κύριος', read: 'kýrios', gloss: 'Señor, dueño' },
      tip: 'Siempre suena fuerte, incluso delante de ε o ι.'
    },
    {
      upper: 'Λ',
      lower: 'λ',
      name: 'Lambda',
      translit: 'l',
      sound: 'l de «luz»',
      group: 'nueva',
      isVowel: false,
      example: { word: 'λόγος', read: 'lógos', gloss: 'palabra, verbo' },
      tip: 'Como una «V» invertida.'
    },
    {
      upper: 'Μ',
      lower: 'μ',
      name: 'Mi / Mu',
      translit: 'm',
      sound: 'm de «madre»',
      group: 'nueva',
      isVowel: false,
      example: { word: 'μαθητής', read: 'mathētés', gloss: 'discípulo' },
      tip: 'La mayúscula Μ es idéntica a la nuestra; la minúscula μ tiene un trazo descendente a la izquierda.'
    },
    {
      upper: 'Ν',
      lower: 'ν',
      name: 'Ni / Nu',
      translit: 'n',
      sound: 'n de «noche»',
      group: 'falso-amigo',
      isVowel: false,
      example: { word: 'νόμος', read: 'nómos', gloss: 'ley' },
      tip: '¡Falso amigo clásico! La minúscula ν parece una «v» latina, pero es una «n» (mayúscula Ν).'
    },
    {
      upper: 'Ξ',
      lower: 'ξ',
      name: 'Xi',
      translit: 'x',
      sound: 'ks de «taxi»',
      group: 'nueva',
      isVowel: false,
      example: { word: 'δόξα', read: 'dóxa', gloss: 'gloria' },
      tip: 'Tres barras horizontales en mayúscula; su equivalente es «k + s».'
    },
    {
      upper: 'Ο',
      lower: 'ο',
      name: 'Ómicron',
      translit: 'o',
      sound: 'o breve de «sol»',
      group: 'familiar',
      isVowel: true,
      example: { word: 'ὁδός', read: 'hodós', gloss: 'camino' },
      tip: 'Significa literalmente «o pequeña» (por oposición a omega, «o grande»).'
    },
    {
      upper: 'Π',
      lower: 'π',
      name: 'Pi',
      translit: 'p',
      sound: 'p de «pan»',
      group: 'nueva',
      isVowel: false,
      example: { word: 'πίστις', read: 'pístis', gloss: 'fe, fidelidad' },
      tip: 'El mismo signo π que conoces de matemáticas.'
    },
    {
      upper: 'Ρ',
      lower: 'ρ',
      name: 'Rho',
      translit: 'r / rh',
      sound: 'r de «rey»',
      group: 'falso-amigo',
      isVowel: false,
      example: { word: 'ῥῆμα', read: 'rhêma', gloss: 'palabra pronunciada' },
      tip: '¡Ojo! Parece una «P» española pero siempre es una «R». Al inicio de palabra suele llevar espíritu áspero (ῥ).'
    },
    {
      upper: 'Σ',
      lower: 'σ',
      variant: 'ς final · ϲ Codex',
      name: 'Sigma',
      translit: 's',
      sound: 's de «sal»',
      group: 'falso-amigo',
      isVowel: false,
      example: { word: 'ϲάρξ / σάρξ', read: 'sarx', gloss: 'carne' },
      tip: 'En texto impreso es σ al inicio/medio y ς al final. En el Codex Sinaiticus aparece SIEMPRE como sigma lunada «ϲ» (no es una C).'
    },
    {
      upper: 'Τ',
      lower: 'τ',
      name: 'Tau',
      translit: 't',
      sound: 't de «tierra»',
      group: 'familiar',
      isVowel: false,
      example: { word: 'τέκνον', read: 'téknon', gloss: 'hijo, niño' },
      tip: 'Sonido limpio de t; en mayúscula y minúscula mantiene forma de cruz en T.'
    },
    {
      upper: 'Υ',
      lower: 'υ',
      name: 'Ípsilon',
      translit: 'y / u',
      sound: 'u francesa o i; «u» en diptongo',
      group: 'falso-amigo',
      isVowel: true,
      example: { word: 'υἱός', read: 'hyiós', gloss: 'hijo' },
      tip: '¡No es una «v»! Sola suena i/ü, y después de α, ε u ο suena «u» española (αυ=au, ευ=eu, ου=u).'
    },
    {
      upper: 'Φ',
      lower: 'φ',
      name: 'Fi',
      translit: 'ph / f',
      sound: 'f de «fuego»',
      group: 'nueva',
      isVowel: false,
      example: { word: 'φῶς', read: 'fôs', gloss: 'luz' },
      tip: 'En español dio la «f» de «filosofía» o «fósforo».'
    },
    {
      upper: 'Χ',
      lower: 'χ',
      name: 'Ji / Chi',
      translit: 'ch / j',
      sound: 'j fuerte de «jota»',
      group: 'falso-amigo',
      isVowel: false,
      example: { word: 'Χριστός', read: 'Jristós', gloss: 'Cristo, ungido' },
      tip: '¡Ojo! Aunque parezca una «X», nunca es «ks» ni «ch» de «chico»: es una «j» aspirada fuerte (como Jristós).'
    },
    {
      upper: 'Ψ',
      lower: 'ψ',
      name: 'Psi',
      translit: 'ps',
      sound: 'ps de «psicología»',
      group: 'nueva',
      isVowel: false,
      example: { word: 'ψυχή', read: 'psyjé', gloss: 'alma, vida' },
      tip: 'Un tridente fácil de recordar: p + s en una sola letra.'
    },
    {
      upper: 'Ω',
      lower: 'ω',
      name: 'Omega',
      translit: 'ō',
      sound: 'o larga abierta',
      group: 'falso-amigo',
      isVowel: true,
      example: { word: 'ὥρα', read: 'hóra', gloss: 'hora' },
      tip: 'No es una «w» inglesa: es «o grande» (por contraste con ο, ómicron).'
    }
  ],
  diphthongs: [
    { pair: 'αι', read: 'ai (en koiné tardía: e)', example: 'καί (kai = y)', note: 'En el Codex a veces alterna con ε por coincidir en el habla (itacismo).' },
    { pair: 'ει', read: 'ei (en koiné: i)', example: 'εἰρήνη (eirénē = paz)', note: 'Por eso en el Codex verás escrito ει como ι (ej. ϊδον por εἶδον).' },
    { pair: 'οι', read: 'oi', example: 'οἶκος (oîkos = casa)', note: 'Dos vocales seguidas en un solo golpe de voz.' },
    { pair: 'ου', read: 'u (como en «tú»)', example: 'οὐρανός (uranós = cielo)', note: '¡Clave! En griego «ου» no suena o-u, sino una sola «u» española.' },
    { pair: 'αυ / ευ', read: 'au / eu', example: 'αὐτός (autós) · εὐαγγέλιον (euanguélion)', note: 'Ante consonante sonora o vocal en koiné evoluciona hacia av/af y ev/ef.' },
    { pair: 'ᾳ · ῃ · ῳ', read: 'a · e · o (iota suscrita)', example: 'ἀρχῇ (arjê = principio, dativo)', note: 'La pequeña iota debajo indica un dativo u otro caso sin cambiar la lectura moderna.' }
  ],
  diacritics: [
    {
      mark: 'ἀ · ἁ',
      name: 'Espíritu suave (᾿) y espíritu áspero (῾)',
      text: 'Toda vocal inicial lleva una coma diminuta encima. El suave (ἀ) no se pronuncia; el áspero (ἁ) añade una «h» aspirada inglesa / j suave al inicio: ἅγιος = haguios, υἱός = hyiós.'
    },
    {
      mark: 'ά · ὰ · ᾶ',
      name: 'Acentos (agudo, grave y circunflejo)',
      text: 'Para leer hoy, los tres cumplen exactamente la misma función: te dicen en qué sílaba cargar la voz (como la tilde en español). En el Codex Sinaiticus original casi no se escriben.'
    },
    {
      mark: '·  y  ;',
      name: '¡Cuidado con la puntuación griega!',
      text: 'El punto alto (·) equivale a dos puntos o punto y coma. Y el signo de punto y coma «;» en griego impreso es nuestro signo de INTERROGACIÓN (¿…?).'
    }
  ],
  codexKeys: {
    intro:
      'Cuando abras la columna izquierda de Exégesis comparada verás el texto tal como lo copiaron los escribas en el siglo IV. Solo cuatro claves explican casi todas las diferencias respecto a un NT griego moderno:',
    nominaSacra: [
      { abbr: 'θϲ · θυ · θω · θν', full: 'θεός / θεοῦ / θεῷ / θεόν', read: 'theós', gloss: 'Dios (según el caso)' },
      { abbr: 'κϲ · κυ · κω · κν', full: 'κύριος / κυρίου…', read: 'kýrios', gloss: 'Señor' },
      { abbr: 'ιϲ · ιυ · ιν', full: 'Ἰησοῦς / Ἰησοῦ / Ἰησοῦν', read: 'Iēsoús', gloss: 'Jesús' },
      { abbr: 'χϲ · χυ · χω · χν', full: 'Χριστός / Χριστοῦ…', read: 'Jristós', gloss: 'Cristo, Mesías' },
      { abbr: 'πνα · πνϲ · πνι', full: 'πνεῦμα / πνεύματος…', read: 'pneûma', gloss: 'Espíritu, aliento' },
      { abbr: 'υϲ · ανοϲ · ουνοϲ', full: 'υἱός · ἄνθρωπος · οὐρανός', read: 'hyiós · ánthrōpos · uranós', gloss: 'hijo · hombre · cielo' }
    ],
    cases: [
      { name: 'Nominativo', role: 'Quien realiza la acción (sujeto)', clue: 'p. ej. ὁ λόγος, θεός' },
      { name: 'Genitivo', role: '«de…», pertenencia o fuente', clue: 'p. ej. τοῦ θεοῦ (de Dios)' },
      { name: 'Dativo', role: '«a / para / con…» (receptor o instrumento)', clue: 'p. ej. ἐν ἀρχῇ (en el principio)' },
      { name: 'Acusativo', role: 'Quien recibe directamente la acción', clue: 'p. ej. τὸν θεόν (a Dios / hacia Dios)' },
      { name: 'Vocativo', role: 'Llamada directa', clue: 'p. ej. κύριε (¡Señor!)' }
    ]
  },
  walkthrough: {
    title: 'Tu primer versículo: Juan 1:1',
    refLabel: 'Juan 1:1',
    exegesisHref: '/exegesis?libro=juan&cap=1&v=1',
    intro:
      'Pulsa cada palabra para ver cómo suena, qué forma toma en el Codex Sinaiticus y qué aporta la gramática al sentido del versículo.',
    words: [
      {
        id: 'jn1-1',
        printed: 'ἐν',
        codex: 'εν',
        syllables: 'en',
        read: 'en',
        grammar: 'Preposición (rige dativo)',
        gloss: 'en',
        strong: 'G1722',
        inLexico: true,
        note: 'Misma palabra con la que abre Génesis 1:1 en la traducción griega antigua (ἐν ἀρχῇ).'
      },
      {
        id: 'jn1-2',
        printed: 'ἀρχῇ',
        codex: 'αρχη',
        syllables: 'ar-jê',
        read: 'arjê',
        grammar: 'Sustantivo, dativo singular femenino',
        gloss: 'principio, comienzo',
        strong: 'G0746',
        inLexico: false,
        note: 'Observa la χ = «j» suave/fuerte y la ῃ con iota suscrita que marca el caso dativo.'
      },
      {
        id: 'jn1-3',
        printed: 'ἦν',
        codex: 'ην',
        syllables: 'ên',
        read: 'en',
        grammar: 'Verbo εἰμί, imperfecto indicativo 3.ª sg.',
        gloss: 'era / ya existía',
        strong: 'G1510',
        inLexico: true,
        note: '¡Cuidado con Η/η! Suena «en», no «hn». El tiempo imperfecto subraya existencia continua antes de la creación.'
      },
      {
        id: 'jn1-4',
        printed: 'ὁ',
        codex: 'ο',
        syllables: 'ho',
        read: 'ho',
        grammar: 'Artículo definido, nominativo masc. sg.',
        gloss: 'el',
        strong: 'G3588',
        inLexico: true,
        note: 'El espíritu áspero sobre ὁ suena como «h» inglesa suave. En el Codex solo ves «ο».'
      },
      {
        id: 'jn1-5',
        printed: 'λόγος,',
        codex: 'λογοϲ',
        syllables: 'ló-gos',
        read: 'lógos',
        grammar: 'Sustantivo, nominativo masc. sg.',
        gloss: 'Palabra, Verbo',
        strong: 'G3056',
        inLexico: true,
        note: 'En el Codex termina con sigma lunada «ϲ» en vez de «ς». Es el sujeto: la Palabra.'
      },
      {
        id: 'jn1-6',
        printed: 'καὶ',
        codex: 'και',
        syllables: 'kai',
        read: 'kai',
        grammar: 'Conjunción',
        gloss: 'y',
        strong: 'G2532',
        inLexico: true,
        note: 'La palabra más frecuente de todo el Nuevo Testamento griego (más de 8.900 apariciones).'
      },
      {
        id: 'jn1-7',
        printed: 'ὁ',
        codex: 'ο',
        syllables: 'ho',
        read: 'ho',
        grammar: 'Artículo definido, nominativo masc. sg.',
        gloss: 'el',
        strong: 'G3588',
        inLexico: true,
        note: 'Vuelve a presentar a «la Palabra» como sujeto.'
      },
      {
        id: 'jn1-8',
        printed: 'λόγος',
        codex: 'λογοϲ',
        syllables: 'ló-gos',
        read: 'lógos',
        grammar: 'Sustantivo, nominativo masc. sg.',
        gloss: 'Palabra, Verbo',
        strong: 'G3056',
        inLexico: true,
        note: 'Misma forma nominativa que antes.'
      },
      {
        id: 'jn1-9',
        printed: 'ἦν',
        codex: 'ην',
        syllables: 'ên',
        read: 'en',
        grammar: 'Verbo εἰμί, imperfecto indicativo 3.ª sg.',
        gloss: 'estaba / era',
        strong: 'G1510',
        inLexico: true,
        note: 'Aquí indica comunión activa («estaba con»).'
      },
      {
        id: 'jn1-10',
        printed: 'πρὸς',
        codex: 'προϲ',
        syllables: 'pros',
        read: 'pros',
        grammar: 'Preposición (con acusativo)',
        gloss: 'junto a, cara a cara con',
        strong: 'G4314',
        inLexico: true,
        note: 'La ρ parece P, pero es «r»: π-ρ-ο-ς = pros. Con acusativo expresa relación personal y cercanía.'
      },
      {
        id: 'jn1-11',
        printed: 'τὸν',
        codex: 'τον',
        syllables: 'ton',
        read: 'ton',
        grammar: 'Artículo, acusativo masc. sg.',
        gloss: 'el (marca al objeto de πρὸς)',
        strong: 'G3588',
        inLexico: true,
        note: 'La ν final = «n» (no «v»): τ-ο-ν = ton.'
      },
      {
        id: 'jn1-12',
        printed: 'θεόν,',
        codex: 'θν',
        codexNs: true,
        syllables: 'the-ón',
        read: 'theón',
        grammar: 'Sustantivo, acusativo masc. sg.',
        gloss: 'Dios',
        strong: 'G2316',
        inLexico: true,
        note: '¡Nomen sacrum! En el Codex ves ‹θν› (primera y última letra con línea encima): se lee completo, «theón».'
      },
      {
        id: 'jn1-13',
        printed: 'καὶ',
        codex: 'και',
        syllables: 'kai',
        read: 'kai',
        grammar: 'Conjunción',
        gloss: 'y',
        strong: 'G2532',
        inLexico: true,
        note: 'Une la segunda y tercera cláusula.'
      },
      {
        id: 'jn1-14',
        printed: 'θεὸς',
        codex: 'θϲ',
        codexNs: true,
        syllables: 'the-ós',
        read: 'theós',
        grammar: 'Sustantivo, nominativo masc. sg. (predicado sin artículo)',
        gloss: 'Dios (de naturaleza divina)',
        strong: 'G2316',
        inLexico: true,
        note: 'En el Codex: ‹θϲ› con sobrelínea. Va delante del verbo y sin artículo, distinguiendo naturaleza compartida sin confundir las Personas.'
      },
      {
        id: 'jn1-15',
        printed: 'ἦν',
        codex: 'ην',
        syllables: 'ên',
        read: 'en',
        grammar: 'Verbo εἰμί, imperfecto indicativo 3.ª sg.',
        gloss: 'era',
        strong: 'G1510',
        inLexico: true,
        note: 'En griego el orden enfatiza el predicado («Dios era…»), pero el sujeto con artículo es ὁ λόγος.'
      },
      {
        id: 'jn1-16',
        printed: 'ὁ',
        codex: 'ο',
        syllables: 'ho',
        read: 'ho',
        grammar: 'Artículo, nominativo masc. sg.',
        gloss: 'el',
        strong: 'G3588',
        inLexico: true,
        note: 'El artículo confirma cuál de los dos nominativos es el sujeto de la frase.'
      },
      {
        id: 'jn1-17',
        printed: 'λόγος.',
        codex: 'λογοϲ',
        syllables: 'ló-gos',
        read: 'lógos',
        grammar: 'Sustantivo, nominativo masc. sg.',
        gloss: 'Palabra, Verbo',
        strong: 'G3056',
        inLexico: true,
        note: '«…y el Verbo era Dios». Ya leíste la frase griega completa letra por letra.'
      }
    ]
  },
  practice: [
    {
      id: 'p-grc-1',
      printed: 'λόγος',
      codex: 'λογοϲ',
      codexNs: false,
      options: ['lógos', 'nojos', 'aógoc'],
      correctIndex: 0,
      breakdown: 'λ (l) + ό (o) + γ (g) + ο (o) + ς / ϲ (s)',
      meaning: 'palabra, verbo (G3056)'
    },
    {
      id: 'p-grc-2',
      printed: 'θεός',
      codex: 'θϲ',
      codexNs: true,
      options: ['beós', 'theós', 'zeón'],
      correctIndex: 1,
      breakdown: 'θ (th/z) + ε (e) + ό (o) + ς (s) · en el Codex abreviado ‹θϲ›',
      meaning: 'Dios (G2316)'
    },
    {
      id: 'p-grc-3',
      printed: 'ἀγάπη',
      codex: 'αγαπη',
      codexNs: false,
      options: ['agápn', 'ajanē', 'agápē'],
      correctIndex: 2,
      breakdown: 'ἀ (a) + γ (g) + ά (a) + π (p) + η (e larga, no n)',
      meaning: 'amor entregado (G0026)'
    },
    {
      id: 'p-grc-4',
      printed: 'πνεῦμα',
      codex: 'πνα',
      codexNs: true,
      options: ['nveuma', 'pneûma', 'preúma'],
      correctIndex: 1,
      breakdown: 'π (p) + ν (n) + εῦ (eu) + μ (m) + α (a) · en el Codex ‹πνα›',
      meaning: 'espíritu, viento, aliento (G4151)'
    },
    {
      id: 'p-grc-5',
      printed: 'χάρις',
      codex: 'χαριϲ',
      codexNs: false,
      options: ['xápis', 'chápic', 'járis'],
      correctIndex: 2,
      breakdown: 'χ (j fuerte) + ά (a) + ρ (r, no p) + ι (i) + ς / ϲ (s)',
      meaning: 'gracia, favor inmerecido (G5485)'
    },
    {
      id: 'p-grc-6',
      printed: 'εἰρήνη',
      codex: 'ειρηνη',
      codexNs: false,
      options: ['eirénē', 'epnvn', 'arpini'],
      correctIndex: 0,
      breakdown: 'εἰ (ei/i) + ρ (r, no p) + ή (e) + ν (n, no v) + η (e)',
      meaning: 'paz (G1515)'
    },
    {
      id: 'p-grc-7',
      printed: 'βασιλεία',
      codex: 'βαϲιλεια',
      codexNs: false,
      options: ['rasiclea', 'basiléia', 'vasiláia'],
      correctIndex: 1,
      breakdown: 'β (b/v) + α (a) + σ / ϲ (s) + ι (i) + λ (l) + ει (ei) + α (a)',
      meaning: 'reino, soberanía (G0932)'
    },
    {
      id: 'p-grc-8',
      printed: 'ἄγγελος',
      codex: 'αγγελοϲ',
      codexNs: false,
      options: ['ágguelos', 'ánjeloc', 'ánguelos'],
      correctIndex: 2,
      breakdown: 'ἄ (a) + γγ (ng nasal) + ε (e) + λ (l) + ο (o) + ς (s)',
      meaning: 'mensajero, ángel (G0032)'
    }
  ]
};

export const HEBREW_GUIDE = {
  id: 'hebreo',
  tabLabel: 'Hebreo y Arameo · AT',
  eyebrow: 'Lectura inicial · Antiguo Testamento',
  title: 'Cómo leer el hebreo y arameo bíblico desde cero',
  lead:
    'La mayoría de las biblias originales del Antiguo Testamento están en hebreo, con capítulos en arameo (Daniel 2–7, Esdras 4–7). Ambos comparten el mismo alfabeto de 22 letras. Si entiendes las consonantes, los puntos vocálicos y los prefijos pegados, ya puedes descifrar el texto.',
  intro: [
    {
      title: 'Se lee de derecha a izquierda (←)',
      text: 'Empiezas por la esquina superior derecha de cada línea y avanzas hacia la izquierda. Cada palabra se descifra primero por sus consonantes grandes y luego por las vocales colocadas debajo, arriba o al lado.'
    },
    {
      title: '22 consonantes + puntos vocálicos (niqqud)',
      text: 'La escritura hebrea original anotaba solo consonantes (escritura abyad). Siglos después, los escribas masoretas añadieron rayitas y puntitos (niqqud) para fijar las vocales y preservar exactamente la lectura tradicional.'
    },
    {
      title: 'Sin mayúsculas, pero con 5 letras finales (sofit)',
      text: 'No existen mayúsculas ni minúsculas. En cambio, cinco consonantes (כ מ נ פ צ) cambian de silueta cuando aparecen al final de una palabra (ך ם ן ף ץ).'
    },
    {
      title: 'Hebreo y arameo: el mismo alefato',
      text: 'Los pasajes arameos de Esdras y Daniel usan exactamente las mismas 22 letras y las mismas vocales masoréticas que el hebreo, con unas pocas terminaciones propias muy fáciles de reconocer.'
    }
  ],
  filters: [
    { id: 'todas', label: 'Las 22 letras' },
    { id: 'parecida', label: 'Parecidas entre sí' },
    { id: 'sofit', label: 'Cambian al final (5)' },
    { id: 'begadkefat', label: 'Cambian con punto (6)' },
    { id: 'gutural', label: 'Guturales' }
  ],
  alphabet: [
    {
      letter: 'א',
      name: 'Álef',
      translit: 'ʾ (muda)',
      sound: 'muda (porta su vocal)',
      tags: ['gutural'],
      example: { word: 'אָמֵן', read: 'amén', gloss: 'firme, así sea' },
      tip: 'No tiene sonido propio en español: simplemente pronuncia la vocal que la acompaña.'
    },
    {
      letter: 'ב',
      name: 'Bet / Vet',
      translit: 'b / v',
      sound: 'בּ = b · ב = v',
      tags: ['begadkefat', 'parecida'],
      example: { word: 'בְּרֵאשִׁית', read: 'bereshít', gloss: 'en el principio' },
      tip: 'Con punto en el centro (בּ) suena «b»; sin punto suena «v» suave. Su base sobresale un poco por la derecha (distinta de כ).'
    },
    {
      letter: 'ג',
      name: 'Guímel',
      translit: 'g',
      sound: 'g suave de «gato»',
      tags: ['begadkefat'],
      example: { word: 'גָּדוֹל', read: 'gadól', gloss: 'grande' },
      tip: 'Tiene un «pie» partido abajo que avanza hacia la izquierda.'
    },
    {
      letter: 'ד',
      name: 'Dálet',
      translit: 'd',
      sound: 'd de «día»',
      tags: ['begadkefat', 'parecida'],
      example: { word: 'דָּוִד', read: 'Davíd', gloss: 'David' },
      tip: '¡No la confundas con ר! Dálet tiene una punta aguda arriba a la derecha; ר es curva.'
    },
    {
      letter: 'ה',
      name: 'He',
      translit: 'h',
      sound: 'h suave (muda al final)',
      tags: ['gutural', 'parecida'],
      example: { word: 'הַלְלוּיָהּ', read: 'haleluyáh', gloss: 'alabad a Yah' },
      tip: 'La patita izquierda está SEPARADA del techo arriba (a diferencia de ח, donde va pegada, y ת, que tiene pie doblado).'
    },
    {
      letter: 'ו',
      name: 'Vav',
      translit: 'v / w · o / u',
      sound: 'v (y prefijada); o en וֹ, u en וּ',
      tags: ['parecida'],
      example: { word: 'וְאֵת', read: 've-ét', gloss: 'y [marca al objeto]' },
      tip: 'Es la «navaja suiza» del hebreo: consonante «v», conjunción «y» pegada delante, u «o»/«u» según dónde lleve el punto.'
    },
    {
      letter: 'ז',
      name: 'Zayin',
      translit: 'z / ds',
      sound: 'z sonora (zoo)',
      tags: ['parecida'],
      example: { word: 'זֶרַע', read: 'zéra', gloss: 'semilla, descendencia' },
      tip: 'Parece una pequeña espada o T: su cabeza sobresale por ambos lados del palo (distinta de ו).'
    },
    {
      letter: 'ח',
      name: 'Jet',
      translit: 'j / kh',
      sound: 'j fuerte de «jamás»',
      tags: ['gutural', 'parecida'],
      example: { word: 'חֶסֶד', read: 'jésed', gloss: 'misericordia, amor leal' },
      tip: 'A diferencia de ה, el palo izquierdo toca el techo completamente cerrado.'
    },
    {
      letter: 'ט',
      name: 'Tet',
      translit: 't',
      sound: 't de «todo»',
      tags: [],
      example: { word: 'טוֹב', read: 'tov', gloss: 'bueno' },
      tip: 'Su brazo izquierdo se enrosca hacia adentro formando un cuenco.'
    },
    {
      letter: 'י',
      name: 'Yod',
      translit: 'y',
      sound: 'y de «yo»; parte de vocales i / e',
      tags: [],
      example: { word: 'יְהוּדָה', read: 'Yehudáh', gloss: 'Judá' },
      tip: 'La letra más diminuta: flota en lo alto del renglón.'
    },
    {
      letter: 'כ',
      sofit: 'ך',
      name: 'Kaf / Jaf',
      translit: 'k / j',
      sound: 'כּ = k · כ / ך = j',
      tags: ['begadkefat', 'sofit', 'parecida'],
      example: { word: 'כֹּהֵן', read: 'kohén', gloss: 'sacerdote' },
      tip: 'Con punto כּ = «k»; sin punto כ = «j» suave. Al final de palabra baja en palo largo «ך» (sofit).'
    },
    {
      letter: 'ל',
      name: 'Lámed',
      translit: 'l',
      sound: 'l de «luz»',
      tags: [],
      example: { word: 'לֵב', read: 'lev', gloss: 'corazón' },
      tip: 'Fácil de identificar al vuelo: su mástil sobresale por encima de todas las demás letras.'
    },
    {
      letter: 'מ',
      sofit: 'ם',
      name: 'Mem',
      translit: 'm',
      sound: 'm de «mar»',
      tags: ['sofit', 'parecida'],
      example: { word: 'מֶלֶךְ', read: 'mélej', gloss: 'rey' },
      tip: 'Al final de palabra se convierte en una caja cuadrada cerrada «ם» (distínguela de ס, que es redonda).'
    },
    {
      letter: 'נ',
      sofit: 'ן',
      name: 'Nun',
      translit: 'n',
      sound: 'n de «nombre»',
      tags: ['sofit', 'parecida'],
      example: { word: 'נָבִיא', read: 'naví', gloss: 'profeta' },
      tip: 'Al final de palabra se estira hacia abajo como un poste fino «ן» (sofit).'
    },
    {
      letter: 'ס',
      name: 'Sámej',
      translit: 's',
      sound: 's de «sol»',
      tags: ['parecida'],
      example: { word: 'סֵפֶר', read: 'séfer', gloss: 'libro, rollo' },
      tip: 'Es ovalada y redondeada por abajo (ם sofit tiene ángulos cuadrados abajo).'
    },
    {
      letter: 'ע',
      name: 'Ayin',
      translit: 'ʿ',
      sound: 'gutural profunda (a menudo muda en lectura inicial)',
      tags: ['gutural'],
      example: { word: 'עוֹלָם', read: 'olám', gloss: 'eternidad, siglo' },
      tip: 'Como la álef, para empezar puedes apoyarte en su vocal recordando que marca una consonante de garganta.'
    },
    {
      letter: 'פ',
      sofit: 'ף',
      name: 'Pe / Fe',
      translit: 'p / f',
      sound: 'פּ = p · פ / ף = f',
      tags: ['begadkefat', 'sofit'],
      example: { word: 'פָּנִים', read: 'paním', gloss: 'rostro, presencia' },
      tip: 'Con punto פּ = «p»; sin punto פ = «f». Al final de palabra baja su trazo izquierdo «ף».'
    },
    {
      letter: 'צ',
      sofit: 'ץ',
      name: 'Tsade',
      translit: 'ts',
      sound: 'ts (como «pizza»)',
      tags: ['sofit'],
      example: { word: 'צֶדֶק', read: 'tsédeq', gloss: 'justicia' },
      tip: 'Al final de palabra mantiene sus dos brazos arriba con palo recto hacia abajo «ץ».'
    },
    {
      letter: 'ק',
      name: 'Qof',
      translit: 'q / k',
      sound: 'k de «casa»',
      tags: [],
      example: { word: 'קָדוֹשׁ', read: 'qadósh', gloss: 'santo' },
      tip: 'Su palo izquierdo cuelga por debajo del renglón sin tocar la curva superior.'
    },
    {
      letter: 'ר',
      name: 'Resh',
      translit: 'r',
      sound: 'r suave',
      tags: ['gutural', 'parecida'],
      example: { word: 'רוּחַ', read: 'rúaj', gloss: 'espíritu, viento' },
      tip: 'Esquina curva y lisa (sin el pico saliente de ד Dálet).'
    },
    {
      letter: 'שׁ / שׂ',
      name: 'Shin / Sin',
      translit: 'sh / s',
      sound: 'שׁ (derecha) = sh · שׂ (izquierda) = s',
      tags: ['parecida'],
      example: { word: 'שָׁלוֹם', read: 'shalóm', gloss: 'paz' },
      tip: 'La posición del puntito lo decide todo: arriba a la derecha = «sh» (Shalom); a la izquierda = «s» (Israel, יִשְׂרָאֵל).'
    },
    {
      letter: 'ת',
      name: 'Tav',
      translit: 't',
      sound: 't de «templo»',
      tags: ['begadkefat', 'parecida'],
      example: { word: 'תּוֹרָה', read: 'toráh', gloss: 'ley, instrucción' },
      tip: 'Parece una ח, pero su patita izquierda termina en un pequeño pie vuelto hacia afuera.'
    }
  ],
  confusables: [
    { chars: ['ב', 'כ'], names: 'Bet vs. Kaf', clue: 'Bet (ב) tiene un pequeño «talón» cuadrado saliendo a la derecha; Kaf (כ) es curva atrás.' },
    { chars: ['ד', 'ר'], names: 'Dálet vs. Resh', clue: 'Dálet (ד) saca una esquina recta hacia la derecha; Resh (ר) es redondeada.' },
    { chars: ['ה', 'ח', 'ת'], names: 'He · Jet · Tav', clue: 'He (ה) tiene hueco arriba a la izquierda; Jet (ח) está cerrada; Tav (ת) tiene pie doblado abajo.' },
    { chars: ['ו', 'ז', 'ן'], names: 'Vav · Zayin · Nun final', clue: 'Vav (ו) mide un renglón; Zayin (ז) lleva sombrerito cruzado; Nun final (ן) baja debajo del renglón.' },
    { chars: ['ס', 'ם'], names: 'Sámej vs. Mem final', clue: 'Sámej (ס) es ovalada; Mem sofit (ם) tiene esquinas rectas abajo.' },
    { chars: ['שׁ', 'שׂ'], names: 'Shin vs. Sin', clue: 'Punto derecho = «sh»; punto izquierdo = «s».' }
  ],
  vowels: [
    {
      vowel: 'A',
      forms: [
        { glyph: 'בַ', name: 'Patach', read: 'ba', note: 'Rayita horizontal debajo.' },
        { glyph: 'בָ', name: 'Qamats', read: 'ba', note: 'Forma de pequeña «T» debajo (como en אָמֵן, amén).' },
        { glyph: 'אֲ', name: 'Jataf patach', read: 'a (breve)', note: 'Combinación ultrabreve frecuente bajo guturales.' }
      ]
    },
    {
      vowel: 'E',
      forms: [
        { glyph: 'בֶ', name: 'Segol', read: 'be', note: 'Tres puntos en triángulo invertido (מֶלֶךְ = mélej).' },
        { glyph: 'בֵ · בֵי', name: 'Tsere', read: 'be', note: 'Dos puntos horizontales debajo, a veces seguidos de י.' }
      ]
    },
    {
      vowel: 'I',
      forms: [
        { glyph: 'בִ', name: 'Jiriq', read: 'bi', note: 'Un solo punto debajo de la consonante.' },
        { glyph: 'בִי', name: 'Jiriq yod', read: 'bi (larga)', note: 'Un punto debajo seguido de י (דָּוִיד / נָבִיא).' }
      ]
    },
    {
      vowel: 'O',
      forms: [
        { glyph: 'בֹ', name: 'Jolam', read: 'bo', note: 'Un punto arriba a la izquierda de la consonante.' },
        { glyph: 'בוֹ', name: 'Jolam vav', read: 'bo (larga)', note: 'La letra ו con un punto ENCIMA siempre suena «o» (שָׁלוֹם).' }
      ]
    },
    {
      vowel: 'U',
      forms: [
        { glyph: 'בֻ', name: 'Qibuts', read: 'bu', note: 'Tres puntos en diagonal debajo.' },
        { glyph: 'בוּ', name: 'Shureq', read: 'bu (larga)', note: 'La letra ו con el punto EN MEDIO siempre suena «u» (רוּחַ).' }
      ]
    }
  ],
  extraMarks: [
    {
      glyph: 'בְ',
      name: 'Shevá (dos puntos verticales)',
      text: 'Al inicio de sílaba suena como una «e» muy rápida (בְּרֵאשִׁית = be-re-shít). Al cerrar sílaba en mitad o final de palabra suele ser mudo (מַלְכָּה = mal-káh).'
    },
    {
      glyph: 'בּ',
      name: 'Dagesh (punto interior)',
      text: 'En las 6 letras begadkefat (ב ג ד כ פ ת) endurece el sonido (b en vez de v, p en vez de f, k en vez de j). En el resto duplica la consonante.'
    },
    {
      glyph: '׃',
      name: 'Te’amim (cantilación) y Sof pasuq',
      text: 'Además de los puntos vocálicos, las biblias masoréticas llevan arquitos y acentos musicales que marcan pausas y sílaba tónica. El signo doble «׃» cierra el versículo.'
    }
  ],
  wordStructure: {
    rootsTitle: 'La raíz trilítera (Shoresh): familias de 3 consonantes',
    rootsText:
      'En hebreo y arameo, casi todas las palabras nacen de un esqueleto de 3 consonantes que guarda el significado central. Cambian las vocales, prefijos o terminaciones para hacer verbos, sustantivos y adjetivos:',
    roots: [
      {
        root: 'מ־ל־ך',
        sense: 'reinar, rey',
        derivatives: [
          { word: 'מָלַךְ', read: 'maláj', gloss: 'reinó (verbo)' },
          { word: 'מֶלֶךְ', read: 'mélej', gloss: 'rey' },
          { word: 'מַלְכָּה', read: 'malkáh', gloss: 'reina' },
          { word: 'מַמְלָכָה', read: 'mamlajáh', gloss: 'reino' }
        ]
      },
      {
        root: 'ק־ד־שׁ',
        sense: 'santo, apartado',
        derivatives: [
          { word: 'קָדוֹשׁ', read: 'qadósh', gloss: 'santo (adjetivo)' },
          { word: 'קֹדֶשׁ', read: 'qódesh', gloss: 'santidad, santuario' },
          { word: 'קִדֵּשׁ', read: 'qiddésh', gloss: 'santificó (verbo)' }
        ]
      }
    ],
    prefixesTitle: 'Prefijos pegados a la palabra',
    prefixesText:
      'En español escribimos «y en la casa» como 4 palabras separadas; en hebreo las preposiciones cortas, la conjunción «y» y el artículo se pegan delante de la palabra:',
    prefixes: [
      { form: 'וְ / וּ', meaning: 'y, pero', example: 'וְאֵת (y…)' },
      { form: 'הַ / הָ', meaning: 'el, la, los, las', example: 'הַמֶּלֶךְ (el rey)' },
      { form: 'בְּ / בַּ', meaning: 'en, con, por', example: 'בְּרֵאשִׁית (en el principio)' },
      { form: 'לְ / לַ', meaning: 'a, para', example: 'לְדָוִד (para / de David)' },
      { form: 'כְּ / כַּ', meaning: 'como, según', example: 'כְּבַר אֱנָשׁ (como hijo de hombre)' },
      { form: 'מִ / מֵ', meaning: 'de, desde', example: 'מִצִּיּוֹן (desde Sion)' }
    ],
    anatomy: {
      full: 'וּבְבֵיתוֹ',
      read: 'u-ve-vei-tó',
      gloss: '«y en su casa» (todo en una sola palabra gráfica)',
      pieces: [
        { part: 'וּ', label: 'prefijo', meaning: 'y' },
        { part: 'בְ', label: 'prefijo', meaning: 'en' },
        { part: 'בֵית', label: 'raíz', meaning: 'casa (bayit)' },
        { part: 'וֹ', label: 'sufijo', meaning: 'su (de él)' }
      ]
    },
    tetragrammaton: {
      glyph: 'יהוה',
      title: 'El Nombre divino (YHWH) y por qué suele traducirse «el SEÑOR»',
      text: 'En el texto hebreo aparece el tetragramatón יהוה (yod-he-vav-he). Por reverencia en la lectura sinagogal, los masoretas solían colocar sobre estas cuatro consonantes las vocales de אֲדֹנָי (Adonái, «Señor») o de אֱלֹהִים para indicar que en voz alta se lee «Señor» en lugar de pronunciar el nombre. De esa práctica procede traducirlo en muchas biblias como «el SEÑOR» en versalitas.'
    }
  },
  aramaic: {
    intro:
      'Varias secciones clave del Antiguo Testamento no se escribieron originalmente en hebreo sino en arameo bíblico (lengua hermana, usada en el imperio babilónico y persa, y lengua cotidiana en Judea en tiempos de Jesús). Usa exactamente el mismo alfabeto:',
    passages: [
      { ref: 'Daniel 2:4b – 7:28', href: '/exegesis?libro=daniel&cap=2&v=4', desc: 'La sección más extensa en arameo (incluye Daniel 7, el Hijo del Hombre).' },
      { ref: 'Esdras 4:8 – 6:18 y 7:12–26', href: '/exegesis?libro=esdras&cap=4&v=8', desc: 'Cartas y decretos oficiales de la corte persa.' },
      { ref: 'Jeremías 10:11', href: '/exegesis?libro=jeremias&cap=10&v=11', desc: 'Un solo versículo arameo dirigido a las naciones.' },
      { ref: 'Génesis 31:47', href: '/exegesis?libro=genesis&cap=31&v=47', desc: 'Dos palabras de Labán: «Jegar Sahaduta» (montón del testimonio).' }
    ],
    clues: [
      { title: 'El artículo va al FINAL (-ָא)', text: 'En hebreo el artículo va delante (הַמֶּלֶךְ = el rey); en arameo suele ir al final como sufijo «-á»: מַלְכָּא (malká = el rey).' },
      { title: 'El plural masculino termina en -ִין', text: 'Frente al clásico «-îm» hebreo (מְלָכִים), el arameo termina en «-în»: מַלְכִין (reyes).' },
      { title: '«Hijo» se dice בַּר (bar)', text: 'Mientras el hebreo usa בֵּן (ben), el arameo usa בַּר (bar), familiar en el NT en nombres como «Simón Bar-Jonás» o «Bartolomé».' },
      { title: 'Partícula דִּי (dî = que, de)', text: 'Equivale al hebreo אֲשֶׁר. Y en el NT conservarás frases arameas transcritas en griego: Ἀββά (Abbá, «Padre»), Talita cumi («niña, levántate»), Efatá («ábrete») y Maranata («¡Ven, Señor nuestro!»).' }
    ]
  },
  walkthrough: {
    title: 'Tu primer versículo en hebreo (Génesis 1:1) y una frase aramea (Daniel 7:13)',
    refLabel: 'Génesis 1:1',
    exegesisHref: '/exegesis?libro=genesis&cap=1&v=1',
    intro:
      'El recuadro mantiene el orden real de lectura de derecha a izquierda (←). Pulsa cada palabra de derecha a izquierda para desmontar sus letras, prefijos y sentido.',
    words: [
      {
        id: 'gn1-1',
        printed: 'בְּרֵאשִׁית',
        noPoints: 'בראשית',
        syllables: 'be · re · shít',
        read: 'bereshít',
        grammar: 'Prefijo בְּ + sustantivo רֵאשִׁית',
        gloss: 'En el principio',
        note: 'Empieza por la derecha con la letra ב con punto (b) y shevá (be), seguida de ר (r) y שׁ con punto derecho (sh).'
      },
      {
        id: 'gn1-2',
        printed: 'בָּרָא',
        noPoints: 'ברא',
        syllables: 'ba · rá',
        read: 'bará',
        grammar: 'Verbo (raíz ב-ר-א), perfecto 3.ª masc. sg.',
        gloss: 'creó',
        note: 'Observa que aquí no hay prefijos: tres letras claras, בָּ-רָ-א (la álef final queda muda tras la vocal «a»).'
      },
      {
        id: 'gn1-3',
        printed: 'אֱלֹהִים',
        noPoints: 'אלהים',
        syllables: 'e · lo · hím',
        read: 'Elohím',
        grammar: 'Sustantivo con terminación -ִים (mem sofit ם)',
        gloss: 'Dios',
        note: 'Lleva terminación plural de majestad (-îm), pero el verbo anterior בָּרָא está en singular: «Dios creó».'
      },
      {
        id: 'gn1-4',
        printed: 'אֵת',
        noPoints: 'את',
        syllables: 'et',
        read: 'et',
        grammar: 'Partícula señaladora de objeto directo',
        gloss: '[marca al objeto directo]',
        note: 'No se traduce al español: avisa que lo que viene inmediatamente después es lo que Dios creó.'
      },
      {
        id: 'gn1-5',
        printed: 'הַשָּׁמַיִם',
        noPoints: 'השמים',
        syllables: 'ha · sha · má · yim',
        read: 'hashamáyim',
        grammar: 'Artículo הַ + sustantivo dual שָׁמַיִם',
        gloss: 'los cielos',
        note: 'Prefijo הַ («los») pegado a שָׁמַיִם («cielos»). Termina con mem cerrada (ם).'
      },
      {
        id: 'gn1-6',
        printed: 'וְאֵת',
        noPoints: 'ואת',
        syllables: 've · ét',
        read: 've-ét',
        grammar: 'Conjunción וְ («y») + marcador אֵת',
        gloss: 'y [marca al objeto]',
        note: 'La letra וְ se pega delante como «y».'
      },
      {
        id: 'gn1-7',
        printed: 'הָאָרֶץ׃',
        noPoints: 'הארץ',
        syllables: 'ha · á · rets',
        read: 'ha-árets',
        grammar: 'Artículo הָ + sustantivo אֶרֶץ (tsade sofit ץ)',
        gloss: 'la tierra',
        note: 'Termina con tsade final (ץ = ts) y el signo ׃ (sof pasuq) que cierra todo el versículo.'
      }
    ],
    aramaicSample: {
      refLabel: 'Daniel 7:13 (arameo)',
      exegesisHref: '/exegesis?libro=daniel&cap=7&v=13',
      words: [
        {
          id: 'dn7-1',
          printed: 'כְּבַר',
          noPoints: 'כבר',
          syllables: 'ke · vár',
          read: 'kevár',
          grammar: 'Prefijo arameo כְּ («como») + בַּר («hijo»)',
          gloss: 'como un hijo',
          note: 'Observa el rasgo arameo típico: בַר (bar = hijo) en lugar del hebreo בֵּן (ben).'
        },
        {
          id: 'dn7-2',
          printed: 'אֱנָשׁ',
          noPoints: 'אנש',
          syllables: 'e · násh',
          read: 'enásh',
          grammar: 'Sustantivo arameo',
          gloss: 'de hombre / ser humano',
          note: 'Termina en שׁ (sh). La expresión entera «bar enásh» corresponde al «Hijo del Hombre» citado en los evangelios.'
        },
        {
          id: 'dn7-3',
          printed: 'אָתֵה',
          noPoints: 'אתה',
          syllables: 'a · téh',
          read: 'atéh',
          grammar: 'Participio activo arameo (raíz א-ת-ה)',
          gloss: 'venía',
          note: 'En arameo, la ת lleva vocal tsere (e) y la ה final cierra la palabra.'
        },
        {
          id: 'dn7-4',
          printed: 'הֲוָה',
          noPoints: 'הוה',
          syllables: 'ha · váh',
          read: 'haváh',
          grammar: 'Verbo auxiliar arameo «ser / estar»',
          gloss: 'estaba (viniendo)',
          note: 'Equivalente arameo del verbo hebreo הָיָה (hayáh = fue/estaba).'
        }
      ]
    }
  },
  practice: [
    {
      id: 'p-heb-1',
      printed: 'שָׁלוֹם',
      unpointed: 'שלום',
      options: ['shalóm', 'salám', 'molásh'],
      correctIndex: 0,
      breakdown: 'De derecha a izquierda: שׁ (sh) + qamats (a) + ל (l) + וֹ (o) + ם (m final)',
      meaning: 'paz, plenitud, bienestar'
    },
    {
      id: 'p-heb-2',
      printed: 'אָמֵן',
      unpointed: 'אמן',
      options: ['omán', 'amén', 'nemá'],
      correctIndex: 1,
      breakdown: 'א (muda + ā) + מ (m + ē) + ן (n final)',
      meaning: 'verdadero, firme, así sea'
    },
    {
      id: 'p-heb-3',
      printed: 'תּוֹרָה',
      unpointed: 'תורה',
      options: ['harót', 'buráh', 'toráh'],
      correctIndex: 2,
      breakdown: 'תּ (t) + וֹ (o) + ר (r + ā) + ה (muda final)',
      meaning: 'ley, instrucción, enseñanza'
    },
    {
      id: 'p-heb-4',
      printed: 'מֶלֶךְ',
      unpointed: 'מלך',
      options: ['kélem', 'mélej', 'máloj'],
      correctIndex: 1,
      breakdown: 'מ (m + e) + ל (l + e) + ךְ (j final con shevá)',
      meaning: 'rey'
    },
    {
      id: 'p-heb-5',
      printed: 'הַלְלוּיָהּ',
      unpointed: 'הללויה',
      options: ['yeluláh', 'jalulíah', 'haleluyáh'],
      correctIndex: 2,
      breakdown: 'ה (h + a) + ל (l) + ל (l) + וּ (u) + י (y + ā) + הּ',
      meaning: '¡alabad a Yah! (imperativo plural)'
    },
    {
      id: 'p-heb-6',
      printed: 'אֱלֹהִים',
      unpointed: 'אלהים',
      options: ['Elohím', 'Elohén', 'Alajím'],
      correctIndex: 0,
      breakdown: 'א (muda + e) + לֹ (l + o) + הִ (h + i) + י + ם (m final)',
      meaning: 'Dios (plural de majestad)'
    },
    {
      id: 'p-heb-7',
      printed: 'בַּר אֱנָשׁ',
      unpointed: 'בר אנש',
      options: ['ben adám', 'bar enásh', 'var asán'],
      correctIndex: 1,
      breakdown: 'Arameo: בַּ (b + a) + ר (r) · אֱ (e) + נָ (n + a) + שׁ (sh)',
      meaning: 'hijo de hombre (arameo, Daniel 7:13)'
    },
    {
      id: 'p-heb-8',
      printed: 'אַבָּא',
      unpointed: 'אבא',
      options: ['ibá', 'aváv', 'abbá'],
      correctIndex: 2,
      breakdown: 'Arameo: א (a) + בָּ (bb con dagesh + a) + א (muda final)',
      meaning: 'padre / papá (forma aramea citada en Gá 4:6 y Ro 8:15)'
    }
  ]
};
