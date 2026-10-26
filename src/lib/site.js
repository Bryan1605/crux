/**
 * Configuración del sitio: content/site.json + valores por defecto.
 * El admin (solo en dev) puede recargar y notificar a los componentes suscritos.
 */
import { useEffect, useState } from 'react';

import siteData from '../../content/site.json';
import { assetUrl } from './assets';

// --- valores por defecto (los textos originales hardcodeados) ---
const DEFAULTS = {
  marca: {
    nombre: 'Crux',
    logo: '/img/cruxlogoBlanco.png',
    tagline: 'Estudios, videos y notas para aprender la Escritura con fundamento.'
  },
  nav: [
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
        { label: 'Todos los videos', href: '/videos', ariaLabel: 'Ver todos los videos' }
      ]
    },
    {
      label: 'Biblia',
      bgColor: '#141824',
      textColor: '#f4f4f5',
      links: [
        { label: 'Biblia Patrística', href: '/biblia', ariaLabel: 'Leer la Biblia Patrística completa' },
        { label: 'Biblia NTV', href: '/biblia/ntv', ariaLabel: 'Leer la Biblia NTV capítulo a capítulo' },
        { label: 'Exégesis comparada', href: '/exegesis', ariaLabel: 'Exégesis comparada: el Codex Sinaiticus y la NTV, versículo a versículo' }
      ]
    },
    {
      label: 'Explorar',
      bgColor: '#121216',
      textColor: '#f4f4f5',
      links: [
        { label: 'Concilios', href: '/concilios', ariaLabel: 'Concilios y herejías de la historia de la Iglesia' },
        { label: 'Temas', href: '/temas', ariaLabel: 'Explorar todos los temas del estudio' },
        { label: 'Buscar', href: '/buscar', ariaLabel: 'Buscar en todo el sitio' }
      ]
    }
  ],
  footer: {
    tagline: 'Estudios, videos y notas para aprender con fundamento.',
    links: [
      { label: 'Inicio', href: '/' },
      { label: 'Estudio', href: '/estudio' },
      { label: 'Concilios', href: '/concilios' },
      { label: 'Temas', href: '/temas' },
      { label: 'Buscar', href: '/buscar' },
      { label: 'Biblia Patrística', href: '/biblia' },
      { label: 'Biblia NTV', href: '/biblia/ntv' },
      { label: 'Exégesis comparada', href: '/exegesis' },
      { label: 'Videos', href: '/videos' }
    ],
    copyright: '© {year} Crux',
    note: 'Contenido del segundo cerebro bíblico'
  },
  home: {
    hero: {
      eyebrow: 'Crux',
      title: 'La fe se estudia, no se improvisa',
      lead: 'Estudios, videos y notas reunidos en un solo lugar para abrir la Escritura con tiempo, método y contexto.',
      ctaPrimary: { label: 'Explorar el estudio', href: '/estudio' },
      ctaSecondary: { label: 'Ver los videos', href: '/videos' }
    },
    manifesto: [
      'Crux es el punto de partida: una sola cruz, y debajo todo lo que he aprendido estudiando la Biblia.',
      'Cada ficha resume un tema completo: pasaje clave, contexto, exégesis y aplicación, lista para leer en diez minutos o para estudiar con calma.',
      'Y los videos acompañan lo que la página enseña: lo mismo, contado en voz alta.'
    ],
    banner: {
      kicker: 'Del banner al estudio',
      cta: { label: 'Empezar por los fundamentos', href: '/estudio?cat=01-fundamentos' }
    },
    bridges: {
      eyebrow: 'La biblioteca',
      title: 'Tres puertas a la Biblia',
      cards: [
        {
          meta1: 'Padres de la Iglesia',
          meta2: 'siglos I–VIII',
          title: 'Biblia Patrística',
          desc: 'Las cartas, homilías y tratados de los Padres de la Iglesia, parte por parte, con su fólio y su contexto.',
          cta: 'Abrir la Patrística'
        },
        {
          meta1: '66 libros',
          meta2: '39 AT + 27 NT',
          title: 'Biblia NTV',
          desc: 'La Nueva Traducción Viviente completa, versículo a versículo, con las notas del traductor y el audio dramatizado donde existe.',
          cta: 'Leer la NTV'
        },
        {
          meta1: 'Codex Sinaiticus',
          meta2: 'frente a la NTV',
          title: 'Exégesis comparada',
          desc: 'El texto griego del Codex Sinaiticus con su aparato crítico, puesto al lado de la traducción, versículo a versículo.',
          cta: 'Comparar los textos'
        }
      ]
    }
  },
  marquee: {
    enabled: true,
    dismissable: true,
    speed: 42,
    separator: ' ✝ '
  },
  seo: {
    title: 'Crux — Estudios bíblicos y videos',
    description: 'Crux: estudios bíblicos, videos y recursos para aprender la Escritura con fundamento.',
    ogImage: '/img/banners/herobanner1.webp'
  },
  personajesCategoryId: '03-personajes'
};

// --- merge profundo ---
function isObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function deepMerge(target, source) {
  const out = { ...target };
  for (const key of Object.keys(source)) {
    if (isObject(source[key]) && isObject(target[key])) {
      out[key] = deepMerge(target[key], source[key]);
    } else {
      out[key] = source[key];
    }
  }
  return out;
}

// Aplica BASE_URL a las rutas de imagen configurables.
function normalizeAssets(site) {
  return {
    ...site,
    marca: { ...site.marca, logo: assetUrl(site.marca.logo) },
    seo: { ...site.seo, ogImage: assetUrl(site.seo.ogImage) }
  };
}

function buildSite(raw) {
  return normalizeAssets(deepMerge(DEFAULTS, raw || {}));
}

let SITE = buildSite(siteData);

export function getSite() {
  return SITE;
}

/**
 * Recarga site.json desde el servidor de desarrollo (solo en `npm run dev`).
 */
export async function reloadSite() {
  if (import.meta.env.DEV) {
    try {
      const res = await fetch('/api/content/site');
      if (res.ok) {
        const { raw } = await res.json();
        SITE = buildSite(JSON.parse(raw));
        window.dispatchEvent(new CustomEvent('crux:site-updated', { detail: SITE }));
        return SITE;
      }
    } catch {
      // ignorar
    }
  }
  return SITE;
}

/**
 * Hook para suscribirse a cambios de site (solo en dev).
 */
export function useSite() {
  const [site, setSite] = useState(SITE);
  useEffect(() => {
    if (!import.meta.env.DEV) return undefined;
    const handler = e => setSite(e.detail);
    window.addEventListener('crux:site-updated', handler);
    return () => window.removeEventListener('crux:site-updated', handler);
  }, []);
  return site;
}

/**
 * SEO por página: título, descripción, OG y Twitter.
 */
export function useSeo({ title, description, ogImage }) {
  const site = useSite();
  useEffect(() => {
    const t = typeof title === 'function' ? title(site) : title;
    const d = typeof description === 'function' ? description(site) : description;
    const img = typeof ogImage === 'function' ? ogImage(site) : ogImage;

    if (t) document.title = t;

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    if (d) metaDesc.content = d;

    const setOG = (prop, content) => {
      if (!content) return;
      let el = document.querySelector(`meta[property="${prop}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('property', prop);
        document.head.appendChild(el);
      }
      el.content = content;
    };
    // Los rastreadores necesitan URL absolutas: una ruta «/img/...» no les sirve.
    const absolute = value => {
      try {
        return new URL(value, window.location.href).href;
      } catch {
        return value;
      }
    };
    const image = absolute(img || site.seo.ogImage);

    setOG('og:title', t);
    setOG('og:description', d);
    setOG('og:url', window.location.href);
    setOG('og:image', image);
    setOG('og:type', 'website');
    setOG('twitter:card', 'summary_large_image');
    setOG('twitter:title', t);
    setOG('twitter:description', d);
    setOG('twitter:image', image);
  }, [site, title, description, ogImage]);
}

export default SITE;
