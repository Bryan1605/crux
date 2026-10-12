import { useEffect, useRef, useState } from 'react';

import { api, Field } from './shared';

/**
 * Selector de imagen: campo de texto con URL + botón para elegir de la
 * biblioteca de medios o subir un archivo nuevo.
 */
export default function MediaPicker({ label = 'Imagen', value, onChange }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [msg, setMsg] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const load = async () => {
    try {
      const { items: list } = await api('/media');
      setItems(list);
    } catch (e) {
      setMsg(String(e.message));
    }
  };

  useEffect(() => {
    if (open) load();
  }, [open]);

  const upload = async file => {
    if (!file) return;
    setUploading(true);
    setMsg(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/content/media', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al subir');
      onChange(data.url);
      await load();
    } catch (e) {
      setMsg(String(e.message));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="admin__media-picker">
      <Field label={label}>
        <div className="admin__media-field">
          <input value={value || ''} onChange={e => onChange(e.target.value)} placeholder="/img/archivo.jpg" />
          <button type="button" className="admin__btn" onClick={() => setOpen(o => !o)}>
            {open ? 'Cerrar' : 'Elegir'}
          </button>
        </div>
      </Field>
      {value && <img className="admin__thumb admin__thumb--pick" src={value} alt="" loading="lazy" />}

      {open && (
        <div className="admin__media-panel">
          <div className="admin__media-actions">
            <button type="button" className="admin__btn admin__btn--accent" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? 'Subiendo…' : '+ Subir imagen'}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={e => upload(e.target.files?.[0])}
            />
            {msg && <span className="is-error">{msg}</span>}
          </div>
          <div className="admin__media-grid">
            {items.map(it => (
              <button
                type="button"
                key={it.name}
                className={`admin__media-item${value === it.url ? ' is-active' : ''}`}
                onClick={() => { onChange(it.url); setOpen(false); }}
                title={`${it.name} · ${Math.round(it.size / 1024)} kB`}
              >
                <img src={it.url} alt={it.name} loading="lazy" />
              </button>
            ))}
            {items.length === 0 && <p className="muted">No hay imágenes en /img.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
