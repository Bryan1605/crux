import { useEffect, useState } from 'react';

import { api, EditorHead, Field, Status } from './shared';
import MediaPicker from './MediaPicker';

export default function ObrasPatristicaEditor({ onDirtyChange }) {
  const [data, setData] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  const load = async () => {
    setMsg(null);
    try {
      const { raw } = await api('/obras-patristica');
      setData(JSON.parse(raw));
      setDirty(false);
    } catch (e) {
      setMsg({ type: 'error', text: String(e.message) });
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateItem = (idx, key, value) => {
    setData(prev => ({
      ...prev,
      items: prev.items.map((it, i) => (i === idx ? { ...it, [key]: value } : it))
    }));
    setDirty(true);
  };

  const setFormato = (idx, formato) => {
    const dims = formato === 'horizontal' ? { width: 960, height: 540 } : { width: 640, height: 800 };
    setData(prev => ({
      ...prev,
      items: prev.items.map((it, i) => (i === idx ? { ...it, formato, ...dims } : it))
    }));
    setDirty(true);
  };

  const add = () => {
    setData(prev => ({
      ...(prev || { version: 1, items: [] }),
      items: [
        ...(prev?.items || []),
        {
          parte: '',
          titulo: '',
          fuente: '',
          portada: '/img/obras/',
          formato: 'vertical',
          width: 640,
          height: 800,
          alt: ''
        }
      ]
    }));
    setDirty(true);
  };

  const remove = idx => {
    if (!window.confirm('¿Quitar esta portada de la lista?')) return;
    setData(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));
    setDirty(true);
  };

  const save = async () => {
    if (!data) return;
    setSaving(true);
    setMsg(null);
    try {
      await api('/obras-patristica', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      setMsg({ type: 'ok', text: 'Guardado: content/obras-patristica.json' });
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
      <EditorHead title="Portadas de la Biblia Patrística" file="content/obras-patristica.json">
        {dirty && <span className="admin__dirty">● sin guardar</span>}
        <button type="button" className="admin__btn" onClick={load}>Recargar</button>
        <button type="button" className="admin__btn" onClick={add}>+ Añadir obra</button>
        <button type="button" className="admin__btn admin__btn--accent" onClick={save} disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </EditorHead>

      <Status msg={msg} />
      <p className="muted admin__hint">
        Cada portada requiere archivo <code>.webp</code> dentro de <code>/img/obras/</code> y texto alternativo de hasta 160 caracteres.
      </p>

      {(data.items || []).map((item, i) => (
        <div className="admin__card" key={`${item.parte}-${i}`}>
          <div className="admin__card-head">
            <strong>{item.parte || '?'} — {item.titulo || 'Nueva obra'}</strong>
            <button type="button" className="admin__btn admin__btn--danger" onClick={() => remove(i)}>
              Quitar
            </button>
          </div>
          <div className="admin__row">
            <Field label="Parte" hint="p. ej. 1.1 o 6">
              <input value={item.parte} onChange={e => updateItem(i, 'parte', e.target.value)} />
            </Field>
            <Field label="Título">
              <input value={item.titulo || ''} onChange={e => updateItem(i, 'titulo', e.target.value)} />
            </Field>
            <Field label="Formato">
              <select value={item.formato || 'vertical'} onChange={e => setFormato(i, e.target.value)}>
                <option value="vertical">Vertical (640 × 800)</option>
                <option value="horizontal">Horizontal (960 × 540)</option>
              </select>
            </Field>
          </div>

          <MediaPicker
            label="Portada (/img/obras/*.webp)"
            value={item.portada}
            defaultFolder="obras"
            onChange={v => updateItem(i, 'portada', v)}
          />

          <Field
            label="Texto alternativo (alt)"
            hint={`${(item.alt || '').length}/160`}
          >
            <input
              className={(item.alt || '').length > 160 ? 'admin__input--warn' : ''}
              value={item.alt || ''}
              onChange={e => updateItem(i, 'alt', e.target.value)}
            />
          </Field>

          <Field label="Archivo fuente (opcional)">
            <input value={item.fuente || ''} onChange={e => updateItem(i, 'fuente', e.target.value)} />
          </Field>
        </div>
      ))}
    </section>
  );
}
