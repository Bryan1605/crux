import { useEffect, useState } from 'react';

import { api, Field, Status } from './shared';

export default function CategoriasEditor() {
  const [data, setData] = useState(null);
  const [msg, setMsg] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const load = async () => {
    setMsg(null);
    try {
      const { raw } = await api('/categorias');
      setData(JSON.parse(raw));
      setDirty(false);
    } catch (e) {
      setMsg({ type: 'error', text: String(e.message) });
    }
  };

  useEffect(() => {
    load();
  }, []);

  const update = (i, key, value) => {
    setData(d => d.map((c, j) => (j === i ? { ...c, [key]: value } : c)));
    setDirty(true);
  };

  const move = (i, delta) => {
    setData(d => {
      const arr = [...d];
      const j = i + delta;
      if (j < 0 || j >= arr.length) return arr;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      // reasignar orden
      arr.forEach((c, k) => { c.orden = k + 1; });
      return arr;
    });
    setDirty(true);
  };

  const save = async () => {
    if (!data) return;
    setSaving(true);
    setMsg(null);
    try {
      await api('/categorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      setMsg({ type: 'ok', text: 'Guardado: content/categorias.json' });
      setDirty(false);
    } catch (e) {
      setMsg({ type: 'error', text: String(e.message) });
    } finally {
      setSaving(false);
    }
  };

  if (!data) return <Status msg={msg} />;

  return (
    <section className="admin__editor admin__editor--full">
      <div className="admin__body-head">
        <span>
          Categorías {dirty && <span className="admin__dirty">● sin guardar</span>}
        </span>
        <div className="admin__body-actions">
          <button type="button" className="admin__btn" onClick={load}>Descartar</button>
          <button type="button" className="admin__btn admin__btn--accent" onClick={save} disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
      <Status msg={msg} />
      <p className="muted admin__hint">
        El orden aquí define el orden de los filtros y del índice. La descripción corta («short») aparece
        como cabecera de categoría en el índice.
      </p>
      {data.map((c, i) => (
        <div className="admin__card" key={c.id}>
          <div className="admin__card-head">
            <strong>{c.label}</strong>
            <span className="muted">{c.id}</span>
            <div className="admin__body-actions">
              <button type="button" className="admin__btn" onClick={() => move(i, -1)}>↑</button>
              <button type="button" className="admin__btn" onClick={() => move(i, 1)}>↓</button>
            </div>
          </div>
          <div className="admin__row">
            <Field label="Label">
              <input value={c.label} onChange={e => update(i, 'label', e.target.value)} />
            </Field>
            <Field label="Descripción corta">
              <input value={c.short || ''} onChange={e => update(i, 'short', e.target.value)} />
            </Field>
          </div>
        </div>
      ))}
    </section>
  );
}