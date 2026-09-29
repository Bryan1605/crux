/**
 * Frontmatter propio (sin dependencias): parseo + serialización.
 * Formato canónico de escritura:
 *   ---
 *   title: "Título"
 *   tags: ["a", "b"]
 *   ---
 */

export function parseFrontmatter(text) {
  let src = text;
  if (src.charCodeAt(0) === 0xfeff) src = src.slice(1);
  if (!src.startsWith('---')) return { data: {}, body: src };
  const end = src.indexOf('\n---', 3);
  if (end < 0) return { data: {}, body: src };
  const block = src.slice(3, end);
  let body = src.slice(end + 4);
  if (body.startsWith('\r')) body = body.slice(1);
  if (body.startsWith('\n')) body = body.slice(1);

  const data = {};
  for (const raw of block.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const m = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!m) continue;
    const [, key, rawVal] = m;
    if (rawVal.startsWith('[')) {
      try {
        data[key] = JSON.parse(rawVal);
      } catch {
        data[key] = [];
      }
    } else if (rawVal.startsWith('"')) {
      try {
        data[key] = JSON.parse(rawVal);
      } catch {
        data[key] = rawVal;
      }
    } else {
      data[key] = rawVal;
    }
  }
  return { data, body };
}

export function serializeFrontmatter(data, body) {
  const lines = [];
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      lines.push(`${key}: [${value.map(v => JSON.stringify(String(v))).join(', ')}]`);
    } else if (String(value) === '') {
      continue;
    } else {
      lines.push(`${key}: ${JSON.stringify(String(value))}`);
    }
  }
  const cleanBody = String(body || '').replace(/^\r?\n/, '');
  return `---\n${lines.join('\n')}\n---\n\n${cleanBody}`;
}
