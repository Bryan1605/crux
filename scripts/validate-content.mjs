/**
 * Validadores de esquemas para content-api.mjs y build-time.
 * Sin dependencias externas; lanza Error con mensaje en español si falla.
 */

// --- utilidades ---
function isString(v) { return typeof v === 'string'; }
function isArray(v) { return Array.isArray(v); }
function isObject(v) { return v !== null && typeof v === 'object' && !isArray(v); }
function required(obj, key, type, label) {
  if (!(key in obj)) throw new Error(`${label}: falta el campo "${key}"`);
  const v = obj[key];
  if (type === 'string' && !isString(v)) throw new Error(`${label}: "${key}" debe ser texto`);
  if (type === 'array' && !isArray(v)) throw new Error(`${label}: "${key}" debe ser array`);
  if (type === 'object' && !isObject(v)) throw new Error(`${label}: "${key}" debe ser objeto`);
  if (type === 'boolean' && typeof v !== 'boolean') throw new Error(`${label}: "${key}" debe ser true/false`);
  if (type === 'number' && typeof v !== 'number') throw new Error(`${label}: "${key}" debe ser número`);
  return v;
}
function optional(obj, key, type, label, def) {
  if (!(key in obj)) return def;
  return required(obj, key, type, label);
}

// --- validadores por recurso ---

export function validateSite(obj) {
  required(obj, 'marca', 'object', 'site');
  required(obj.marca, 'nombre', 'string', 'marca');
  required(obj.marca, 'logo', 'string', 'marca');
  required(obj.marca, 'tagline', 'string', 'marca');

  required(obj, 'nav', 'array', 'site');
  for (const [i, card] of obj.nav.entries()) {
    required(card, 'label', 'string', `nav[${i}]`);
    required(card, 'bgColor', 'string', `nav[${i}]`);
    required(card, 'textColor', 'string', `nav[${i}]`);
    required(card, 'links', 'array', `nav[${i}]`);
    for (const [j, link] of card.links.entries()) {
      required(link, 'label', 'string', `nav[${i}].links[${j}]`);
      required(link, 'href', 'string', `nav[${i}].links[${j}]`);
      required(link, 'ariaLabel', 'string', `nav[${i}].links[${j}]`);
    }
  }

  required(obj, 'footer', 'object', 'site');
  required(obj.footer, 'tagline', 'string', 'footer');
  required(obj.footer, 'links', 'array', 'footer');
  for (const [i, link] of obj.footer.links.entries()) {
    required(link, 'label', 'string', `footer.links[${i}]`);
    required(link, 'href', 'string', `footer.links[${i}]`);
  }
  required(obj.footer, 'copyright', 'string', 'footer');
  required(obj.footer, 'note', 'string', 'footer');

  required(obj, 'home', 'object', 'site');
  required(obj.home, 'hero', 'object', 'home');
  required(obj.home.hero, 'eyebrow', 'string', 'home.hero');
  required(obj.home.hero, 'title', 'string', 'home.hero');
  required(obj.home.hero, 'lead', 'string', 'home.hero');
  required(obj.home.hero, 'ctaPrimary', 'object', 'home.hero');
  required(obj.home.hero.ctaPrimary, 'label', 'string', 'home.hero.ctaPrimary');
  required(obj.home.hero.ctaPrimary, 'href', 'string', 'home.hero.ctaPrimary');
  required(obj.home.hero, 'ctaSecondary', 'object', 'home.hero');
  required(obj.home.hero.ctaSecondary, 'label', 'string', 'home.hero.ctaSecondary');
  required(obj.home.hero.ctaSecondary, 'href', 'string', 'home.hero.ctaSecondary');

  required(obj.home, 'manifesto', 'array', 'home');
  for (const [i, line] of obj.home.manifesto.entries()) {
    if (!isString(line)) throw new Error(`home.manifesto[${i}]: debe ser texto`);
  }

  required(obj.home, 'banner', 'object', 'home');
  required(obj.home.banner, 'kicker', 'string', 'home.banner');
  required(obj.home.banner, 'cta', 'object', 'home.banner');
  required(obj.home.banner.cta, 'label', 'string', 'home.banner.cta');
  required(obj.home.banner.cta, 'href', 'string', 'home.banner.cta');

  required(obj.home, 'bridges', 'object', 'home');
  required(obj.home.bridges, 'eyebrow', 'string', 'home.bridges');
  required(obj.home.bridges, 'title', 'string', 'home.bridges');
  required(obj.home.bridges, 'cards', 'array', 'home.bridges');
  for (const [i, card] of obj.home.bridges.cards.entries()) {
    required(card, 'meta1', 'string', `home.bridges.cards[${i}]`);
    required(card, 'meta2', 'string', `home.bridges.cards[${i}]`);
    required(card, 'title', 'string', `home.bridges.cards[${i}]`);
    required(card, 'desc', 'string', `home.bridges.cards[${i}]`);
    required(card, 'cta', 'string', `home.bridges.cards[${i}]`);
  }

  required(obj, 'marquee', 'object', 'site');
  required(obj.marquee, 'enabled', 'boolean', 'marquee');
  required(obj.marquee, 'dismissable', 'boolean', 'marquee');
  required(obj.marquee, 'speed', 'number', 'marquee');
  required(obj.marquee, 'separator', 'string', 'marquee');

  required(obj, 'seo', 'object', 'site');
  required(obj.seo, 'title', 'string', 'seo');
  required(obj.seo, 'description', 'string', 'seo');
  required(obj.seo, 'ogImage', 'string', 'seo');

  required(obj, 'personajesCategoryId', 'string', 'site');
  return true;
}

export function validateCategorias(obj) {
  if (!isArray(obj)) throw new Error('categorias: debe ser un array');
  const seen = new Set();
  for (const [i, cat] of obj.entries()) {
    required(cat, 'id', 'string', `categorias[${i}]`);
    required(cat, 'label', 'string', `categorias[${i}]`);
    required(cat, 'short', 'string', `categorias[${i}]`);
    required(cat, 'orden', 'number', `categorias[${i}]`);
    if (seen.has(cat.id)) throw new Error(`categorias[${i}]: id duplicado "${cat.id}"`);
    seen.add(cat.id);
    if (!/^[a-z0-9-]+$/.test(cat.id)) throw new Error(`categorias[${i}]: id "${cat.id}" solo a-z 0-9 guión`);
  }
  return true;
}

export function validateEstudio(raw, slug) {
  // raw ya viene parseado (frontmatter + body) por content-api
  const fm = raw.data || {};
  required(fm, 'title', 'string', `estudio/${slug}`);
  if (fm.portada && !isString(fm.portada)) throw new Error(`estudio/${slug}: portada debe ser texto`);
  if (fm.portada && !fm.portada.startsWith('/')) {
    throw new Error(`estudio/${slug}: portada debe empezar por /`);
  }
  if (fm.category && !/^[a-z0-9-]+$/.test(fm.category)) {
    throw new Error(`estudio/${slug}: category inválida`);
  }
  if (fm.tags && !isArray(fm.tags)) throw new Error(`estudio/${slug}: tags debe ser array`);
  if (fm.aliases && !isArray(fm.aliases)) throw new Error(`estudio/${slug}: aliases debe ser array`);
  if (fm.updated && !/^\d{4}-\d{2}-\d{2}$/.test(fm.updated)) {
    throw new Error(`estudio/${slug}: updated debe ser AAAA-MM-DD`);
  }
  return true;
}

export function validateVideos(obj) {
  if (!isArray(obj)) throw new Error('videos: debe ser array');
  for (const [i, v] of obj.entries()) {
    required(v, 'id', 'string', `videos[${i}]`);
    required(v, 'title', 'string', `videos[${i}]`);
    required(v, 'date', 'string', `videos[${i}]`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v.date)) throw new Error(`videos[${i}]: date AAAA-MM-DD`);
    required(v, 'description', 'string', `videos[${i}]`);
    if (v.id && !/^[A-Za-z0-9_-]{11}$/.test(v.id)) {
      throw new Error(`videos[${i}]: id no parece ID de YouTube (11 chars)`);
    }
  }
  return true;
}

export function validateSlides(obj) {
  if (!isArray(obj)) throw new Error('slides: debe ser array');
  for (const [i, s] of obj.entries()) {
    required(s, 'image', 'string', `slides[${i}]`);
    if (!s.image.startsWith('/')) throw new Error(`slides[${i}]: image debe empezar por /`);
    optional(s, 'caption', 'string', `slides[${i}]`, '');
    optional(s, 'href', 'string', `slides[${i}]`, '/estudio');
  }
  return true;
}

export function validateVersiculos(obj) {
  if (!isArray(obj)) throw new Error('versiculos: debe ser array');
  for (const [i, v] of obj.entries()) {
    if (!isString(v) || !v.trim()) throw new Error(`versiculos[${i}]: string no vacío`);
  }
  return true;
}

export function validateAnuncios(obj) {
  required(obj, 'enabled', 'boolean', 'anuncios');
  required(obj, 'dismissable', 'boolean', 'anuncios');
  required(obj, 'items', 'array', 'anuncios');
  for (const [i, item] of obj.items.entries()) {
    if (!isString(item) || !item.trim()) throw new Error(`anuncios.items[${i}]: string no vacío`);
  }
  return true;
}

const TIMELINE_TIPOS = new Set(['personaje', 'concilio', 'herejia', 'doctrina', 'evento']);
const CONCILIO_TIPOS = new Set(['concilio', 'herejia']);

/** ¿Resuelve el href a una ruta real del sitio? (ctx: { studies, personajes }) */
function resolveHref(href, ctx) {
  const path = String(href).split(/[?#]/)[0];
  if (!path.startsWith('/')) return false;
  if (path === '/') return true;
  if (['/estudio', '/biblia', '/videos', '/concilios', '/temas', '/buscar'].includes(path)) return true; // /biblia?pag=… se recorta arriba
  if (path.startsWith('/estudio/personajes/')) {
    const slug = path.replace('/estudio/personajes/', '').replace(/\/+$/, '');
    return Boolean(ctx.personajes && ctx.personajes.includes(slug));
  }
  if (path.startsWith('/estudio/')) {
    const slug = path.replace('/estudio/', '').replace(/\/+$/, '');
    return Boolean(ctx.studies && ctx.studies.includes(slug));
  }
  return false;
}

export function validateTimeline(obj, slug, ctx = {}) {
  if (!isArray(obj)) throw new Error('timeline: debe ser un array');
  const seen = new Set();
  for (const [i, ev] of obj.entries()) {
    const label = `timeline[${i}]`;
    required(ev, 'id', 'string', label);
    if (!/^[a-z0-9-]+$/.test(ev.id)) throw new Error(`${label}: id "${ev.id}" solo a-z 0-9 guión`);
    if (seen.has(ev.id)) throw new Error(`${label}: id duplicado "${ev.id}"`);
    seen.add(ev.id);
    required(ev, 'anio', 'number', label);
    if (!Number.isFinite(ev.anio)) throw new Error(`${label}: anio debe ser un número`);
    required(ev, 'anio_label', 'string', label);
    required(ev, 'tipo', 'string', label);
    if (!TIMELINE_TIPOS.has(ev.tipo)) {
      throw new Error(`${label}: tipo "${ev.tipo}" no es válido (${[...TIMELINE_TIPOS].join('|')})`);
    }
    required(ev, 'titulo', 'string', label);
    required(ev, 'texto', 'string', label);
    optional(ev, 'href', 'string', label, '');
    optional(ev, 'estudio', 'string', label, null);
    if ('estudio' in ev && ev.estudio !== null && !isString(ev.estudio)) {
      throw new Error(`${label}: estudio debe ser texto o null`);
    }
    if (ctx.routes && ev.href && !resolveHref(ev.href, ctx.routes)) {
      throw new Error(`${label}: href "${ev.href}" no resuelve a una ruta conocida`);
    }
  }
  return true;
}

export function validateConcilios(obj) {
  if (!isArray(obj)) throw new Error('concilios: debe ser un array');
  const ids = new Set();
  const concilios = [];
  const herejias = [];
  for (const [i, c] of obj.entries()) {
    const label = `concilios[${i}]`;
    required(c, 'id', 'string', label);
    if (!/^[a-z0-9-]+$/.test(c.id)) throw new Error(`${label}: id "${c.id}" solo a-z 0-9 guión`);
    if (ids.has(c.id)) throw new Error(`${label}: id duplicado "${c.id}"`);
    ids.add(c.id);
    required(c, 'tipo', 'string', label);
    if (!CONCILIO_TIPOS.has(c.tipo)) throw new Error(`${label}: tipo "${c.tipo}" no es válido (concilio|herejia)`);
    required(c, 'nombre', 'string', label);
    required(c, 'resumen', 'string', label);
    if ('estudio' in c && c.estudio !== null) optional(c, 'estudio', 'string', label, null);
    if (c.tipo === 'concilio') {
      required(c, 'anio', 'number', label);
      if (!Number.isFinite(c.anio)) throw new Error(`${label}: anio debe ser un número`);
      optional(c, 'anio_label', 'string', label, '');
      optional(c, 'convocante', 'string', label, '');
      optional(c, 'ordinal', 'number', label, null);
      optional(c, 'decisiones', 'array', label, []);
      optional(c, 'herejias', 'array', label, []);
      for (const h of c.herejias) {
        if (!isString(h) || !/^[a-z0-9-]+$/.test(h)) {
          throw new Error(`${label}: herejía "${h}" no es un id válido`);
        }
      }
      concilios.push(c);
    } else {
      optional(c, 'contexto', 'string', label, '');
      if ('condenada_en' in c && c.condenada_en !== null) optional(c, 'condenada_en', 'string', label, null);
      herejias.push(c);
    }
  }
  // referencias cruzadas: herejías ↔ concilios
  const concilioIds = new Set(concilios.map(c => c.id));
  const herejiaIds = new Set(herejias.map(h => h.id));
  for (const c of concilios) {
    for (const h of c.herejias) {
      if (!herejiaIds.has(h)) {
        throw new Error(`concilios: "${c.id}" referencia la herejía inexistente "${h}"`);
      }
    }
  }
  for (const h of herejias) {
    if (h.condenada_en && !concilioIds.has(h.condenada_en)) {
      throw new Error(`concilios: herejía "${h.id}" referencia el concilio inexistente "${h.condenada_en}"`);
    }
  }
  return true;
}

export function validatePersonaje(obj, slug) {
  required(obj, 'slug', 'string', `personajes/${slug}`);
  required(obj, 'nombre', 'string', `personajes/${slug}`);
  required(obj, 'epoca', 'string', `personajes/${slug}`);
  required(obj, 'rol', 'string', `personajes/${slug}`);
  required(obj, 'resumen', 'string', `personajes/${slug}`);
  required(obj, 'tags', 'array', `personajes/${slug}`);
  for (const [i, t] of obj.tags.entries()) {
    if (!isString(t)) throw new Error(`personajes/${slug}.tags[${i}]: debe ser texto`);
  }
  required(obj, 'portada', 'string', `personajes/${slug}`);

  required(obj, 'escenas', 'array', `personajes/${slug}`);
  for (const [i, e] of obj.escenas.entries()) {
    if (!isString(e)) throw new Error(`personajes/${slug}.escenas[${i}]: debe ser la ruta de una imagen`);
  }

  required(obj, 'bio', 'array', `personajes/${slug}`);
  for (const [i, b] of obj.bio.entries()) {
    if (!isString(b)) throw new Error(`personajes/${slug}.bio[${i}]: debe ser texto`);
  }

  required(obj, 'timeline', 'array', `personajes/${slug}`);
  for (const [i, t] of obj.timeline.entries()) {
    required(t, 'anio', 'string', `personajes/${slug}.timeline[${i}]`);
    required(t, 'evento', 'string', `personajes/${slug}.timeline[${i}]`);
  }

  if ('estudio' in obj && obj.estudio !== null && !isString(obj.estudio)) {
    throw new Error(`personajes/${slug}.estudio: debe ser texto o null`);
  }
  return true;
}

// --- mapa para content-api ---
export const VALIDATORS = {
  site: validateSite,
  categorias: validateCategorias,
  estudio: validateEstudio,
  videos: validateVideos,
  slides: validateSlides,
  versiculos: validateVersiculos,
  anuncios: validateAnuncios,
  personaje: validatePersonaje,
  timeline: validateTimeline,
  concilios: validateConcilios
};

export function validate(name, data, slug, ctx) {
  const fn = VALIDATORS[name];
  if (!fn) throw new Error(`No hay validador para "${name}"`);
  return fn(data, slug, ctx);
}
