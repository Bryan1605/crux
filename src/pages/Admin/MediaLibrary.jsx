import { useEffect, useRef, useState } from 'react';

import { api, Status } from './shared';

export default function MediaLibrary() {
  const [items, setItems] = useState(null);
  const [msg, setMsg] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const load = async () => {
    setMsg(null);
    try {
      const { items: list } = await api('/media');
      setItems(list);
    } catch (e) {
      setMsg({ type: 'error', text: String(e.message) });
    }
  };

  useEffect(() => {
    load();
  }, []);

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
      setMsg({ type: 'ok', text: `Subido: ${data.name}` });
      await load();
    } catch (e) {
      setMsg({ type: 'error', text: String(e.message) });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const remove = async name => {
    if (!window.confirm(`¿Eliminar /img/${name}?`)) return;
    try {
      await api(`/media?path=${encodeURIComponent(name)}`, { method: 'DELETE' });
      setMsg({ type: 'ok', text: `Eliminado: ${name}` });
      await load();
    } catch (e) {
      setMsg({ type: 'error', text: String(e.message) });
    }
  };

  return (
    <section className="admin__editor admin__editor--full">
      <div className="admin__body-head">
        <span>Biblioteca de medios — public/img/</span>
        <div className="admin__body-actions">
          <button type="button" className="admin__btn" onClick={load}>Recargar</button>
          <button type="button" className="admin__btn admin__btn--accent" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? 'Subiendo…' : '+ Subir imagen'}
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => upload(e.target.files?.[0])} />
        </div>
      </div>
      <Status msg={msg} />
      <p className="muted admin__hint">
        Las imágenes se guardan en <code>public/img/</code> y se referencian como <code>/img/nombre.webp</code>.
        Usa este panel para preparar las imágenes de slides, personajes y escenas.
      </p>
      {!items && <Status msg={{ type: 'error', text: 'Cargando…' }} />}
      {items && (
        <div className="admin__media-library">
          {items.map(it => (
            <div className="admin__media-card" key={it.name}>
              <img src={it.url} alt={it.name} loading="lazy" />
              <div className="admin__media-meta">
                <span>{it.name}</span>
                <small>{Math.round(it.size / 1024)} kB · {it.url}</small>
              </div>
              <button type="button" className="admin__btn admin__btn--danger" onClick={() => remove(it.name)}>
                Eliminar
              </button>
            </div>
          ))}
          {items.length === 0 && <p className="muted">No hay imágenes en /img.</p>}
        </div>
      )}
    </section>
  );
}