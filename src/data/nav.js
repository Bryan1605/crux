import logo from '../assets/imgs/cruxlogoBlanco.png';

export const LOGO = logo;

export const NAV_ITEMS = [
  {
    label: 'Estudio',
    bgColor: '#1b1b21',
    textColor: '#f4f4f5',
    links: [
      { label: 'Fundamentos', href: '/estudio?cat=01-fundamentos', ariaLabel: 'Estudios de fundamentos doctrinales' },
      { label: 'Parábolas', href: '/estudio?cat=09-parabolas', ariaLabel: 'Estudios de las parábolas de Jesús' },
      { label: 'Apologética', href: '/estudio?cat=06-apologetica', ariaLabel: 'Estudios de apologética' }
    ]
  },
  {
    label: 'Videos',
    bgColor: '#16161b',
    textColor: '#f4f4f5',
    links: [
      { label: 'Todos los videos', href: '/videos', ariaLabel: 'Ver todos los videos' },
      { label: 'Canal de YouTube', href: '/videos', ariaLabel: 'Ir a los videos del canal' }
    ]
  },
  {
    label: 'Explorar',
    bgColor: '#121216',
    textColor: '#f4f4f5',
    links: [
      { label: 'Biblia Patrística', href: '/biblia', ariaLabel: 'Leer la Biblia Patrística completa' },
      { label: 'Personajes', href: '/estudio?cat=03-personajes', ariaLabel: 'Estudios de personajes bíblicos' },
      { label: 'Doctrinas', href: '/estudio?cat=04-doctrinas', ariaLabel: 'Estudios de doctrina sistemática' },
      { label: 'Apocalipsis', href: '/estudio?cat=10-apocalipsis', ariaLabel: 'Estudios del libro de Apocalipsis' }
    ]
  }
];
