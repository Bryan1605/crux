/**
 * Biblia Patrística — glifos de los encabezados.
 *
 * El documento fuente marca las secciones con emojis (📖 Resumen, 📜 Citas
 * clave, 📄 Obra completa…). En pantalla se sustituyen por glifos tipográficos
 * que siguen el color del texto. El `.md` no se toca: el mapeo es solo visual.
 */

const BY_EMOJI = [
  ['📖', '¶'],
  ['📜', '“'],
  ['📄', '§'],
  ['🗂', '▦'],
  ['🗄', '▦'],
  ['🧭', '◇'],
  ['📋', '≡']
];

const EMOJI_RE = /^[\p{Extended_Pictographic}️‍\s]+/u;

/**
 * Separa el emoji inicial de un encabezado.
 * @returns {{ glyph: string, text: string }} glifo (o '') y texto sin emoji.
 */
export function headingGlyph(label) {
  // Los títulos latinos van en cursiva Markdown (`(*De Lapsis*)`); en pantalla
  // el encabezado ya tiene su estilo, así que se quitan los asteriscos.
  const raw = String(label || '').replace(/\*+([^*]+)\*+/g, '$1');
  const m = EMOJI_RE.exec(raw);
  if (!m) return { glyph: '', text: raw };
  const lead = m[0];
  const hit = BY_EMOJI.find(([emoji]) => lead.includes(emoji));
  return { glyph: hit ? hit[1] : '◇', text: raw.slice(lead.length).trim() };
}

/** Texto de un encabezado sin su emoji. */
export const plainLabel = label => headingGlyph(label).text;

/** Las tres entradas estándar de cada obra. */
export function standardKind(label) {
  const text = plainLabel(label).toLowerCase();
  if (text.startsWith('resumen')) return 'resumen';
  if (text.startsWith('citas clave')) return 'citas';
  if (text.startsWith('obra completa')) return 'obra';
  return '';
}

export const STANDARD = {
  resumen: { glyph: '¶', title: 'Resumen' },
  citas: { glyph: '“', title: 'Citas clave' },
  obra: { glyph: '§', title: 'Obra completa' }
};

/**
 * «Parte 1.3 — Ignacio de Antioquía (c. 35-107/117 d.C.)» →
 * { num: '1.3', title: 'Ignacio de Antioquía', date: 'c. 35-107/117 d.C.', from: 35, to: 107 }
 * Las Partes con el título en mayúsculas («PARTE 4.1 — TERTULIANO…») se pasan a tipo título.
 */
export function partInfo(label) {
  const raw = String(label || '');
  const m = /^Parte\s+([\d.]+)\s*(?:—|-)\s*(.*)$/i.exec(raw);
  let num = '';
  let rest = raw;
  if (m) {
    num = m[1];
    rest = m[2];
  }
  const dm = /\s*\(([^)]*\d[^)]*)\)\s*$/.exec(rest);
  const date = dm ? dm[1] : '';
  let title = dm ? rest.slice(0, dm.index) : rest;
  if (title && title === title.toUpperCase()) {
    title = title.toLowerCase().replace(/(^|\s|—\s)(\p{L})/gu, (_, sp, c) => sp + c.toUpperCase());
    title = title.replace(/\b(De|Del|La|El|Los|Las|Y)\b/g, w => (w === title.split(' ')[0] ? w : w.toLowerCase()));
  }
  let from = null;
  let to = null;
  const range = /c\.\s*(\d+)\s*[–-]\s*(?:c\.\s*)?(\d+)/.exec(date);
  if (range) {
    from = Number(range[1]);
    to = Number(range[2]);
  } else {
    const one = /(\d{2,4})/.exec(date);
    if (one) from = to = Number(one[1]);
  }
  return { num, title: title.trim(), date, from, to };
}
