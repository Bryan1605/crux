export async function api(path, options) {
  const res = await fetch(`/api/content${path}`, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export const slugify = s =>
  String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export function Field({ label, children, hint }) {
  return (
    <label className="admin__field">
      <span>
        {label}
        {hint && <em className="admin__field-hint">{hint}</em>}
      </span>
      {children}
    </label>
  );
}

export function Status({ msg }) {
  if (!msg) return null;
  return (
    <p className="admin__status">
      <span className={msg.type === 'error' ? 'is-error' : 'is-ok'}>{msg.text}</span>
    </p>
  );
}

export function EditorHead({ title, file, children }) {
  return (
    <div className="admin__body-head">
      <span>
        {title} {file && <span className="muted">— {file}</span>}
      </span>
      <div className="admin__body-actions">{children}</div>
    </div>
  );
}
