/**
 * Datos estructurados para la presentación interactiva de
 * «Fundamentos de doctrina — NTV» (`01-fundamentos--fundamentos-teologia-ntv`).
 *
 * Todo el texto doctrinal y todas las citas NTV provienen literalmente de
 * `content/estudios/01-fundamentos--fundamentos-teologia-ntv.md`.
 *
 * Fuentes originales en `src/assets/imgs/Fundamentos/01_Fundamentos_Teología/`,
 * convertidas a WebP en `public/img/estudios/fundamentos/` mediante `node scripts/optimize-images.mjs`.
 */

export const FUNDAMENTOS_SLUG = '01-fundamentos--fundamentos-teologia-ntv';

export const FUNDAMENTOS_BLOQUES = [
  {
    id: 'posicion',
    roman: 'I',
    title: 'Posición',
    subtitle: 'Lo que Dios hizo por ti',
    summary:
      'Antes de cualquier obra nuestra, Dios perdona la deuda, declara justo al creyente, restaura la relación rota y nos adopta como hijos suyos de manera permanente.',
    image: '/img/estudios/fundamentos/bloque-1-posicion.webp'
  },
  {
    id: 'gracia',
    roman: 'II',
    title: 'Gracia irrevocable',
    subtitle: 'Revelación, no mérito',
    summary:
      'Las verdades espirituales se entienden por revelación del Espíritu, no por la razón natural; y la salvación, la filiación y la vida eterna son regalos completos que ninguna conducta puede mejorar.',
    image: '/img/estudios/fundamentos/bloque-2-gracia.webp'
  },
  {
    id: 'crecimiento',
    roman: 'III',
    title: 'Crecimiento',
    subtitle: 'Comunión y transformación',
    summary:
      'Aunque la posición del hijo es perfecta desde el principio, la vida diaria requiere santificación, purificación continua de la comunión, consagración voluntaria y madurez en la Palabra.',
    image: '/img/estudios/fundamentos/bloque-3-crecimiento.webp'
  },
  {
    id: 'vocacion',
    roman: 'IV',
    title: 'Vocación y misión',
    subtitle: 'Cómo vivimos en el mundo',
    summary:
      'El creyente maduro responde a su identidad en Cristo ejerciendo seis funciones vivas en la tierra: testigo, obrero, soldado, ministro de reconciliación, embajador y discípulo.',
    image: '/img/estudios/fundamentos/bloque-4-vocacion.webp'
  }
];

export const FUNDAMENTOS_PUNTOS = [
  {
    num: 1,
    id: 'punto-01',
    bloqueId: 'posicion',
    shortTitle: 'Perdón',
    question: '¿Qué significa Perdón?',
    lead: 'Quitar la culpa y la deuda del pecado, restaurando la relación con Dios.',
    verses: [
      {
        ref: '1 Juan 1:9',
        text: 'Si confesamos nuestros pecados, él es fiel y justo para perdonarnos nuestros pecados y limpiarnos de toda maldad.'
      },
      {
        ref: 'Efesios 1:7',
        text: 'Él es tan rico en gracia que compró nuestra libertad con la sangre de su Hijo y perdonó nuestros pecados.'
      },
      {
        ref: 'Salmo 103:12',
        text: 'Tan lejos como está el oriente del occidente, así de lejos ha quitado de nosotros nuestras transgresiones.'
      }
    ],
    closing:
      'El perdón bíblico no es «Dios decide ignorar el pecado». Es Dios quitando la culpa completamente, basado en el sacrificio de Cristo.',
    layout: 'default',
    studySlug: '01-fundamentos--01-perdon'
  },
  {
    num: 2,
    id: 'punto-02',
    bloqueId: 'posicion',
    shortTitle: 'Justificación',
    question: '¿Qué significa Justificación?',
    lead: 'Ser declarado justo ante Dios, no por mérito propio sino por la fe en Cristo.',
    verses: [
      {
        ref: 'Romanos 3:22-24',
        text: 'Dios nos hace justos a sus ojos por medio de la fe en Jesucristo. Y todos son declarados justos gratuitamente por la gracia de Dios, mediante la redención que Cristo Jesús realizó.'
      },
      {
        ref: 'Romanos 5:1',
        text: 'Ya que hemos sido declarados justos por medio de la fe, tenemos paz con Dios por medio de nuestro Señor Jesucristo.'
      },
      {
        ref: 'Romanos 8:1',
        text: 'Por lo tanto, ya no hay condenación para los que pertenecen a Cristo Jesús.'
      }
    ],
    closing:
      'Justificación es un veredicto legal: Dios declara justo al pecador que cree en Cristo. No es «hacer justo», es declarar justo sobre la base de la obra de Cristo.',
    layout: 'default',
    studySlug: '01-fundamentos--02-justificacion'
  },
  {
    num: 3,
    id: 'punto-03',
    bloqueId: 'posicion',
    shortTitle: 'Reconciliación',
    question: '¿Qué significa Reconciliación?',
    lead: 'Restauración de la relación rota entre Dios y el ser humano.',
    verses: [
      {
        ref: '2 Corintios 5:18-19',
        text: 'Dios nos trajo de vuelta a sí mismo por medio de Cristo. Y Dios nos ha dado la tarea de reconciliar a la gente con él. Pues Dios estaba en Cristo reconciliando al mundo consigo mismo, no tomando más en cuenta el pecado de la gente.'
      },
      {
        ref: 'Colosenses 1:21-22',
        text: 'Ustedes, que antes estaban lejos de Dios. Eran sus enemigos, estaban separados de él por sus malos pensamientos y acciones; pero ahora él los reconcilió consigo mediante la muerte de Cristo en su cuerpo físico. Como resultado, los ha trasladado a su propia presencia, y ahora ustedes son santos, libres de culpa y pueden presentarse delante de él sin ninguna falta.'
      }
    ],
    layout: 'default',
    studySlug: '01-fundamentos--03-reconciliacion'
  },
  {
    num: 4,
    id: 'punto-04',
    bloqueId: 'posicion',
    shortTitle: 'Hijo de Dios',
    question: '¿Cómo se llega a ser hijo de Dios?',
    lead: 'Por fe en Cristo Jesús y nuevo nacimiento espiritual.',
    verses: [
      {
        ref: 'Juan 1:12-13',
        text: 'A todos los que creyeron en él y lo recibieron, les dio el derecho de llegar a ser hijos de Dios. Ellos nacen de nuevo, no mediante un nacimiento físico como resultado de la pasión o de la iniciativa humana, sino por medio de un nacimiento que proviene de Dios.'
      },
      {
        ref: 'Romanos 8:14-16',
        text: 'Todos los que son guiados por el Espíritu de Dios son hijos de Dios... El Espíritu de Dios se une a nuestro espíritu para confirmar que somos hijos de Dios.'
      }
    ],
    negativeTitle: 'No se llega a ser hijo de Dios por:',
    negativeList: [
      { label: 'Nacimiento físico', note: 'v.13 — «no mediante un nacimiento físico»' },
      { label: 'Esfuerzo humano', note: 'v.13 — «no por la iniciativa humana»' },
      { label: 'Religión o mérito', note: '' }
    ],
    positiveSummary: 'Se llega por: creer en Jesús + recibirlo + nuevo nacimiento del Espíritu.',
    layout: 'default',
    studySlug: '01-fundamentos--04-llegar-a-ser-hijo-de-dios'
  },
  {
    num: 5,
    id: 'punto-05',
    bloqueId: 'posicion',
    shortTitle: 'Liberación',
    question: '¿De qué son salvos los hijos de Dios?',
    lead: 'Cinco esferas de las que Cristo libra al creyente de forma definitiva.',
    salvationItems: [
      {
        title: 'La muerte espiritual',
        ref: 'Efesios 2:1-5',
        quote: 'Antes ustedes estaban muertos a causa de su desobediencia... pero Dios nos dio vida'
      },
      {
        title: 'El poder del pecado',
        ref: 'Romanos 6:14',
        quote: 'El pecado ya no es más su amo'
      },
      {
        title: 'La ira de Dios',
        ref: 'Romanos 5:9',
        quote: 'Seremos salvos de la ira de Dios por medio de él'
      },
      {
        title: 'La condenación eterna',
        ref: 'Romanos 8:1',
        quote: 'Ya no hay condenación'
      },
      {
        title: 'El dominio del diablo',
        ref: 'Colosenses 1:13',
        quote: 'Dios nos libró del reino de la oscuridad y nos trasladó al reino de su Hijo amado'
      }
    ],
    layout: 'salvation-grid',
    studySlug: '01-fundamentos--05-de-que-son-salvos'
  },
  {
    num: 6,
    id: 'punto-06',
    bloqueId: 'posicion',
    shortTitle: 'Seguridad eterna',
    question: '¿Puede un hijo de Dios dejar de ser su Hijo?',
    verdict: 'No.',
    verses: [
      {
        ref: 'Juan 10:27-29',
        text: 'Mis ovejas escuchan mi voz; yo las conozco y ellas me siguen. Les doy vida eterna, y nunca perecerán. Nadie puede arrebatármelas de la mano. Mi Padre, quien me las dio, es más grande que todos, y nadie puede arrebatarlas de la mano del Padre.'
      },
      {
        ref: 'Romanos 8:38-39',
        text: 'Estoy convencido de que nada puede separarnos del amor de Dios: ni la muerte ni la vida, ni ángeles ni demonios, ni el presente ni el futuro, ni poderes espirituales, ni lo de arriba ni lo de abajo, ni nada de lo creado.'
      },
      {
        ref: 'Romanos 11:29',
        text: 'Los dones de Dios y su llamado son irrevocables.'
      },
      {
        ref: 'Efesios 1:13-14',
        text: 'Cuando creyeron en Cristo, Dios los identificó como suyos al darles el Espíritu Santo, tal como lo había prometido. El Espíritu es la garantía de que recibiremos la herencia que Dios nos prometió.'
      }
    ],
    closing:
      'El Espíritu Santo es la garantía (arras, depósito) de la herencia. Dios no da una garantía que luego revoca.',
    layout: 'grace-verdict',
    studySlug: '01-fundamentos--06-puede-un-hijo-dejar-de-serlo'
  },
  {
    num: 7,
    id: 'punto-07',
    bloqueId: 'gracia',
    shortTitle: 'Razón vs. Revelación',
    question: 'Información por la razón vs. Información por revelación',
    lead: 'La razón sola no puede entender las verdades espirituales; el Espíritu las revela.',
    verses: [
      {
        ref: '1 Corintios 2:9-14',
        text: 'Ningún ojo ha visto, ningún oído ha escuchado, ninguna mente ha imaginado lo que Dios tiene preparado para quienes lo aman. Pero fue a nosotros a quienes Dios reveló esas cosas por medio de su Espíritu. Pues su Espíritu investiga todo a fondo y nos muestra los secretos profundos de Dios... Los que no son espirituales no pueden recibir esas verdades del Espíritu de Dios. Todo les suena ridículo y no pueden entenderlo, porque sólo los que son espirituales pueden entender lo que el Espíritu quiere decir.'
      }
    ],
    comparison: {
      leftTitle: 'Información por razón',
      rightTitle: 'Información por revelación',
      rows: [
        ['Viene del estudio humano', 'Viene del Espíritu Santo (1 Co 2:10)'],
        ['Puede entender hechos bíblicos', 'Entiende el significado espiritual'],
        ['Accesible a creyentes e incrédulos', 'Solo accesible a los espirituales (1 Co 2:14)'],
        ['Limitada a lo natural', 'Abre los secretos profundos de Dios']
      ]
    },
    layout: 'comparison',
    studySlug: '01-fundamentos--07-informacion-vs-revelacion'
  },
  {
    num: 8,
    id: 'punto-08',
    bloqueId: 'gracia',
    shortTitle: 'Salvación por gracia',
    question: '¿Puede un hijo de Dios mejorar por su conducta el regalo de la Salvación?',
    verdict: 'No.',
    verses: [
      {
        ref: 'Efesios 2:8-9',
        text: 'Dios los salvó por su gracia cuando creyeron. Ustedes no tienen ningún mérito en eso; es un regalo de Dios. La salvación no es un premio por las cosas buenas que hayamos hecho, así que ninguno de nosotros puede jactarse de ser salvo.'
      },
      {
        ref: 'Romanos 11:6',
        text: 'Ya que es por gracia, no es por las buenas obras que ustedes hayan hecho; de lo contrario, la gracia no sería gracia.'
      }
    ],
    closing:
      'Un regalo no se «mejora» con obras. Si pudieras mejorarlo, ya no sería un regalo sino un salario. La salvación es completa desde el momento en que se recibe.',
    layout: 'grace-verdict',
    studySlug: '01-fundamentos--08-mejorar-la-salvacion-con-conducta'
  },
  {
    num: 9,
    id: 'punto-09',
    bloqueId: 'gracia',
    shortTitle: 'Filiación',
    question: '¿Puede un hijo de Dios mejorar por su conducta el regalo de ser hijo de Dios?',
    verdict: 'No.',
    verses: [
      {
        ref: '1 Juan 3:1',
        text: '¡Miren con cuánto amor nos ama nuestro Padre celestial! Nos llamó sus hijos, ¡y eso es lo que somos!'
      },
      {
        ref: 'Romanos 8:15',
        text: 'Ustedes no recibieron un espíritu que los esclavice al miedo. En cambio, recibieron el Espíritu de Dios cuando él los adoptó como sus propios hijos.'
      }
    ],
    closing:
      'La filiación es por adopción (Ro 8:15) y nuevo nacimiento (Jn 1:12-13). Un hijo no se vuelve más hijo por portarse bien. Tu conducta afecta tu comunión con el Padre, no tu posición como hijo.',
    layout: 'grace-verdict',
    studySlug: '01-fundamentos--09-mejorar-la-filiacion-con-conducta'
  },
  {
    num: 10,
    id: 'punto-10',
    bloqueId: 'gracia',
    shortTitle: 'Vida eterna',
    question: '¿Puede mejorar un hijo de Dios por su conducta el regalo de la Vida Eterna?',
    verdict: 'No.',
    verses: [
      {
        ref: 'Juan 10:28',
        text: 'Les doy vida eterna, y nunca perecerán.'
      },
      {
        ref: 'Juan 3:16',
        text: 'Todo el que crea en él no se pierda, sino que tenga vida eterna.'
      }
    ],
    closing:
      'La palabra «eterna» significa sin fin. Si la vida eterna pudiera perderse o mejorarse con conducta, no sería eterna — sería condicional. No es «vida condicional», es vida eterna.',
    layout: 'grace-verdict',
    studySlug: '01-fundamentos--10-mejorar-la-vida-eterna-con-conducta'
  },
  {
    num: 11,
    id: 'punto-11',
    bloqueId: 'crecimiento',
    shortTitle: 'Santificación',
    question: '¿Por qué es necesario la Santificación?',
    lead: 'La santificación es el proceso por el cual Dios nos hace más parecidos a Cristo. No es para ser más salvos, sino para reflejar mejor a nuestro Padre.',
    verses: [
      {
        ref: '1 Tesalonicenses 4:3',
        text: 'La voluntad de Dios es que sean santos; por eso, aléjense de todo pecado sexual.'
      },
      {
        ref: 'Romanos 8:29',
        text: 'Dios conoció a los suyos de antemano y los eligió para que llegaran a ser como su Hijo.'
      },
      {
        ref: 'Hebreos 12:14',
        text: 'Esfuércense por vivir en paz con todos y por ser santos, porque sin santidad nadie verá al Señor.'
      }
    ],
    stepsTitle: 'Es necesaria porque:',
    steps: [
      { label: 'Es la voluntad de Dios', ref: '1 Ts 4:3' },
      { label: 'Es el propósito de la elección', ref: 'Ro 8:29' },
      { label: 'Sin ella no hay intimidad con Dios', ref: 'He 12:14' },
      { label: 'Produce fruto que glorifica a Dios', ref: 'Jn 15:8' }
    ],
    layout: 'steps',
    studySlug: '01-fundamentos--11-santificacion'
  },
  {
    num: 12,
    id: 'punto-12',
    bloqueId: 'crecimiento',
    shortTitle: 'Purificación',
    question: '¿Por qué es necesario la Purificación?',
    lead: 'Porque aunque la posición es perfecta, la comunión diaria se mancha con el pecado.',
    verses: [
      {
        ref: '1 Juan 1:7-9',
        text: 'Si vivimos en la luz... la sangre de Jesús, su Hijo, nos limpia de todo pecado. Si afirmamos que no tenemos pecado, lo único que hacemos es engañarnos a nosotros mismos. Pero si confesamos nuestros pecados a Dios, él es fiel y justo para perdonarnos nuestros pecados y limpiarnos de toda maldad.'
      },
      {
        ref: '1 Juan 3:2-3',
        text: 'Todo el que tiene esta esperanza en Cristo se purifica a sí mismo, así como Cristo es puro.'
      }
    ],
    stepsTitle: 'La purificación es necesaria para:',
    steps: [
      { label: 'Mantener la comunión íntima con Dios (no la posición)', ref: '' },
      { label: 'Confesar (estar de acuerdo con Dios) restaura la cercanía', ref: '' },
      { label: 'Prepararnos para la venida de Cristo', ref: '1 Jn 3:2-3' }
    ],
    layout: 'steps',
    studySlug: '01-fundamentos--12-purificacion'
  },
  {
    num: 13,
    id: 'punto-13',
    bloqueId: 'crecimiento',
    shortTitle: 'Consagración',
    question: '¿Por qué es necesario la Consagración?',
    lead: 'Consagración es la dedicación voluntaria de toda la vida a Dios.',
    verses: [
      {
        ref: 'Romanos 12:1',
        text: 'Les ruego que entreguen su cuerpo a Dios por todo lo que él ha hecho a favor de ustedes. Que sea un sacrificio vivo y santo, la clase de sacrificio que a él le agrada. Esa es la verdadera forma de adorarlo.'
      },
      {
        ref: '1 Corintios 6:19-20',
        text: 'Su cuerpo es el templo del Espíritu Santo, quien vive en ustedes y les fue dado por Dios. Ustedes no se pertenecen a sí mismos, porque Dios los compró a un alto precio. Por lo tanto, honren a Dios con su cuerpo.'
      }
    ],
    stepsTitle: 'Es necesaria porque:',
    steps: [
      { label: 'Es una respuesta de gratitud a lo que Dios ya hizo', ref: 'Ro 12:1' },
      { label: 'Reconoce que ya no te perteneces', ref: '1 Co 6:19' },
      { label: 'Es la adoración verdadera', ref: 'Ro 12:1' },
      { label: 'Pone tu vida a disposición de Dios para Su propósito', ref: '' }
    ],
    layout: 'steps',
    studySlug: '01-fundamentos--13-consagracion'
  },
  {
    num: 14,
    id: 'punto-14',
    bloqueId: 'crecimiento',
    shortTitle: 'Madurez espiritual',
    question: '¿Cómo se llega a la madurez espiritual?',
    verses: [
      {
        ref: 'Hebreos 5:12-14',
        text: 'Ya deberían ser maestros, pero necesitan que alguien les enseñe una y otra vez los principios elementales... El alimento sólido es para los maduros, que a fuerza de práctica entrenan la capacidad para distinguir entre lo bueno y lo malo.'
      },
      {
        ref: 'Colosenses 1:28',
        text: 'Enseñamos a todos con toda la sabiduría que tenemos, a fin de presentar a todos perfectos en Cristo.'
      },
      {
        ref: 'Efesios 4:13-15',
        text: 'Así llegaremos a ser maduros en el Señor, mediremos la estatura de la plenitud de Cristo. Así ya no seremos inmaduros como niños... Más bien, hablando la verdad con amor, creceremos hasta ser semejantes a Cristo.'
      }
    ],
    stepsTitle: 'Pasos a la madurez:',
    steps: [
      { label: 'Alimento sólido — la Palabra profunda, no solo leche', ref: '' },
      { label: 'Práctica constante — ejercitar el discernimiento', ref: '' },
      { label: 'Comunidad — crecer juntos, hablando la verdad en amor', ref: '' },
      { label: 'Maestros — aprender de los que ya son maduros', ref: '' }
    ],
    layout: 'steps',
    studySlug: '01-fundamentos--14-madurez-espiritual'
  },
  {
    num: 15,
    id: 'punto-15',
    bloqueId: 'vocacion',
    shortTitle: 'Testigo',
    roleBadge: 'Rol 01',
    question: '¿Quién es un testigo de Jesús?',
    lead: 'El que habla de Cristo por experiencia personal, con el poder del Espíritu Santo.',
    verses: [
      {
        ref: 'Hechos 1:8',
        text: 'Recibirán poder cuando el Espíritu Santo descienda sobre ustedes; y serán mis testigos en Jerusalén, en toda Judea, en Samaria y hasta los confines de la tierra.'
      },
      {
        ref: '1 Juan 1:1-3',
        text: 'Les anunciamos al que existe desde el principio, a quien hemos visto y oído. Lo vimos con nuestros propios ojos y lo tocamos con nuestras propias manos... Les anunciamos lo que nosotros mismos hemos visto y oído.'
      }
    ],
    closing:
      'Un testigo no es un experto en teología necesariamente. Es alguien que ha experimentado a Cristo y habla de lo que ha visto y oído.',
    layout: 'vocation',
    studySlug: '01-fundamentos--15-testigo-de-jesus'
  },
  {
    num: 16,
    id: 'punto-16',
    bloqueId: 'vocacion',
    shortTitle: 'Obrero',
    roleBadge: 'Rol 02',
    question: '¿Quién es un obrero en su mies?',
    lead: 'El que participa activamente en la cosecha de almas para el reino de Dios.',
    verses: [
      {
        ref: 'Mateo 9:37-38',
        text: 'La cosecha es grande, pero los obreros son pocos. Oren al Señor que envíe más obreros a sus campos.'
      },
      {
        ref: 'Mateo 28:19-20',
        text: 'Vayan y hagan discípulos de todas las naciones, bautícenlos en el nombre del Padre y del Hijo y del Espíritu Santo. Enseñen a los nuevos discípulos a obedecer todos los mandatos que les he dado.'
      },
      {
        ref: '1 Corintios 3:9',
        text: 'Nosotros somos colaboradores de Dios.'
      }
    ],
    layout: 'vocation',
    studySlug: '01-fundamentos--16-obrero-en-la-mies'
  },
  {
    num: 17,
    id: 'punto-17',
    bloqueId: 'vocacion',
    shortTitle: 'Soldado',
    roleBadge: 'Rol 03',
    question: '¿Quién es un soldado en su milicia?',
    lead: 'El que soporta dificultades por Cristo, disciplinado y enfocado en la misión.',
    verses: [
      {
        ref: '2 Timoteo 2:3-4',
        text: 'Soporta las dificultades como un buen soldado de Cristo Jesús. Los soldados en servicio activo no se dejan atrapar por los asuntos de la vida civil, porque se concentran en agradar a su comandante.'
      },
      {
        ref: 'Efesios 6:10-18',
        text: 'Pónganse toda la armadura de Dios. Así podrán hacer frente a las estrategias del diablo... manténganse firmes.'
      }
    ],
    layout: 'vocation',
    studySlug: '01-fundamentos--17-soldado-en-la-milicia'
  },
  {
    num: 18,
    id: 'punto-18',
    bloqueId: 'vocacion',
    shortTitle: 'Ministro',
    roleBadge: 'Rol 04',
    question: '¿Quién es un ministro de reconciliación?',
    lead: 'El que ha recibido el mensaje y la tarea de llevar a otros de vuelta a Dios.',
    verses: [
      {
        ref: '2 Corintios 5:18',
        text: 'Y Dios nos ha dado la tarea de reconciliar a la gente con él.'
      },
      {
        ref: '2 Corintios 5:19',
        text: 'Y nos dio a nosotros este maravilloso mensaje de reconciliación.'
      }
    ],
    layout: 'vocation',
    studySlug: '01-fundamentos--03-reconciliacion'
  },
  {
    num: 19,
    id: 'punto-19',
    bloqueId: 'vocacion',
    shortTitle: 'Embajador',
    roleBadge: 'Rol 05',
    question: '¿Quién es un embajador de Jesucristo?',
    lead: 'El que representa oficialmente a Cristo y a Su reino ante el mundo.',
    verses: [
      {
        ref: '2 Corintios 5:20',
        text: 'Así que somos embajadores de Cristo; Dios hace su llamado por medio de nosotros. Hablamos en nombre de Cristo cuando les rogamos: ¡Vuelvan a Dios!'
      },
      {
        ref: 'Efesios 6:20',
        text: 'Soy embajador en cadenas. Pidan a Dios que sea valiente al predicar el mensaje.'
      }
    ],
    traitsTitle: 'Un embajador:',
    traits: [
      { title: 'No habla por sí mismo', detail: 'habla en nombre de su Rey' },
      { title: 'No vive para sí', detail: 'representa a su nación (el cielo)' },
      { title: 'No negocia', detail: 'transmite el mensaje de su Rey' }
    ],
    layout: 'vocation',
    studySlug: '01-fundamentos--19-embajador-de-jesucristo'
  },
  {
    num: 20,
    id: 'punto-20',
    bloqueId: 'vocacion',
    shortTitle: 'Discípulo',
    roleBadge: 'Rol 06',
    question: '¿Eres discípulo de Jesús y alumno del Espíritu Santo?',
    verses: [
      {
        ref: 'Mateo 28:19',
        text: 'Vayan y hagan discípulos de todas las naciones.'
      },
      {
        ref: 'Juan 14:26',
        text: 'Sin embargo, cuando el Padre envíe al Abogado Defensor como mi representante —es decir, al Espíritu Santo—, él les enseñará todo y les recordará cada cosa que les he dicho.'
      },
      {
        ref: 'Mateo 11:29',
        text: 'Tomen mi yugo y aprendan de mí.'
      }
    ],
    traitsTitle: 'La palabra «discípulo» significa aprendiz, alumno. Un discípulo de Jesús:',
    traits: [
      { title: 'Aprende de Él', detail: 'Mt 11:29' },
      { title: 'Es enseñado por el Espíritu Santo', detail: 'Jn 14:26' },
      { title: 'Sigue a Jesús', detail: 'Jn 10:27' },
      { title: 'Se parece a su Maestro', detail: 'Lc 6:40' }
    ],
    layout: 'vocation',
    studySlug: '01-fundamentos--20-discipulo'
  }
];
