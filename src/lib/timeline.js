/**
 * Línea de tiempo de la historia de la fe.
 *
 * Módulo puro (sin import.meta, sin DOM): lo usan el frontend
 * (`src/data/timeline.js`) y las comprobaciones en Node (build + QA).
 *
 * Los eventos "curated" viven en content/timeline.json (con `anio` numérico
 * obligatorio) y los de los personajes se derivan de content/personajes/*.json
 * convirtiendo su `anio` display ("≈8-10 d. C.") a un ancla numérica con
 * `parseAnio`. Nunca se inventan fechas: lo que no se pueda convertir queda
 * reportado por `checkTimelineLabels` para que lo corrija quien edite.
 */

export const TIPO_LABELS = {
  personaje: 'Personaje',
  concilio: 'Concilio',
  herejia: 'Herejía',
  doctrina: 'Doctrina',
  evento: 'Hito'
};

export const TIPO_ORDER = {
  concilio: 0,
  herejia: 1,
  doctrina: 2,
  personaje: 3,
  evento: 4
};

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

/** Céntimo/siglo de un año (admite negativos = a. C.). */
export function eraOf(anio) {
  const bc = anio <= 0;
  const n = Math.abs(anio);
  const siglo = Math.max(1, Math.ceil(n / 100));
  return {
    siglo,
    bc,
    label: `s. ${ROMAN[siglo]}${bc ? ' a. C.' : ' d. C.'}`
  };
}

/**
 * "≈8-10 d. C." → 8 · "≈1 a. C." → -1 · "420" → 420 · "≈347" → 347.
 * Los rangos usan el inicio como ancla de orden. Devuelve null si no entiende.
 */
export function parseAnio(label) {
  if (typeof label !== 'string') return null;
  const m = label
    .trim()
    .match(/^≈?\s*(?:c\.?\s*|ca\.?\s*)?(\d{1,4})(?:\s*(?:-|–|—)\s*(\d{1,4}))?\s*(a\.?\s*c\.?|d\.?\s*c\.?)?\.?\s*$/i);
  if (!m) return null;
  const year = Number(m[1]);
  const era = (m[3] || '').toLowerCase();
  const bc = era.startsWith('a');
  return bc ? -year : year;
}

/** Ancla visual + etiqueta normalizada para un evento con `anio` numérico. */
export function normalizeCurated(ev, index) {
  const anio = typeof ev.anio === 'number' ? ev.anio : null;
  return {
    ...ev,
    anio,
    anio_label: ev.anio_label || (anio === null ? '' : `${anio <= 0 ? -anio + ' a. C.' : anio + ' d. C.'}`),
    era: anio === null ? '' : eraOf(anio).label,
    _seq: index,
    _fuente: 'curated'
  };
}

/**
 * Combina personajes + eventos curated y devuelve la línea ordenada.
 * Cada evento queda con { id, anio, anio_label, era, tipo, titulo, texto, href, estudio }.
 */
export function buildTimeline(personajes = [], extra = []) {
  const out = [];

  for (const p of personajes) {
    const list = Array.isArray(p.timeline) ? p.timeline : [];
    for (const [i, t] of list.entries()) {
      const anio = parseAnio(t.anio);
      out.push({
        id: `${p.slug}-${i + 1}`,
        anio,
        anio_label: t.anio,
        era: anio === null ? '' : eraOf(anio).label,
        tipo: 'personaje',
        titulo: p.nombre,
        texto: t.evento,
        href: `/estudio/personajes/${p.slug}`,
        estudio: p.estudio ?? null,
        _seq: i,
        _fuente: 'personaje'
      });
    }
  }

  for (const ev of extra) {
    out.push(normalizeCurated(ev, out.length));
  }

  return out.sort((a, b) => {
    // Sin anio al final, por orden de entrada.
    if (a.anio === null && b.anio === null) return a._seq - b._seq;
    if (a.anio === null) return 1;
    if (b.anio === null) return -1;
    if (a.anio !== b.anio) return a.anio - b.anio;
    const ta = TIPO_ORDER[a.tipo] ?? 9;
    const tb = TIPO_ORDER[b.tipo] ?? 9;
    if (ta !== tb) return ta - tb;
    if (a.titulo !== b.titulo) return a.titulo.localeCompare(b.titulo, 'es');
    return a._seq - b._seq;
  });
}

/** Eras presentes (orden cronológico) en un conjunto de eventos. */
export function erasOf(events) {
  const seen = new Map();
  for (const ev of events) {
    if (ev.anio === null) continue;
    const era = eraOf(ev.anio);
    const key = era.label;
    if (!seen.has(key)) {
      seen.set(key, { ...era, anio: ev.anio });
    } else {
      seen.get(key).anio = Math.min(seen.get(key).anio, ev.anio);
    }
  }
  return [...seen.values()].sort(
    (a, b) => Number(a.bc) - Number(b.bc) || a.siglo - b.siglo
  );
}

/**
 * «Regla de los siglos»: bandas uniformes entre el primer y el último siglo
 * (incluye los siglos vacíos intermedios). p = centro de la banda en %.
 * Devuelve [] si el tramo es absurdo (> 12 siglos).
 */
export function centuryBands(minAnio, maxAnio) {
  if (!Number.isFinite(minAnio) || !Number.isFinite(maxAnio) || minAnio > maxAnio) return [];
  const signed = a => (a <= 0 ? -Math.max(1, Math.ceil(Math.abs(a) / 100)) : Math.max(1, Math.ceil(a / 100)));
  const sMin = signed(minAnio);
  const sMax = signed(maxAnio);
  // No existe el «año 0»: los siglos van de BC (negativos) a AD (positivos).
  const bcs = sMin < 0 ? Array.from({ length: -sMin }, (_, i) => -(i + 1)) : [];
  const ads = sMax > 0 ? Array.from({ length: sMax }, (_, i) => i + 1) : [];
  const values = [...bcs, ...ads];
  const n = values.length;
  if (n < 1 || n > 12) return [];
  return values.map((s, i) => ({
    label: `s. ${ROMAN[Math.abs(s)]}${s < 0 ? ' a. C.' : ' d. C.'}`,
    p: ((i + 0.5) / n) * 100
  }));
}

/** Reporta las etiquetas de año que no se pueden convertir (para corregir). */
export function checkTimelineLabels(personajes = []) {
  const ok = [];
  const broken = [];
  for (const p of personajes) {
    for (const t of Array.isArray(p.timeline) ? p.timeline : []) {
      const anio = parseAnio(t.anio);
      (anio === null ? broken : ok).push({ slug: p.slug, anio: t.anio, evento: t.evento });
    }
  }
  return { ok: ok.length, broken };
}