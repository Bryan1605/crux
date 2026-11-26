import { useEffect, useMemo, useRef, useState } from 'react';

import { api, Field } from './shared';

const UPLOAD_FOLDERS = [
  { id: '', label: 'Raíz (/img)' },
  { id: 'estudios', label: 'estudios/' },
  { id: 'slides', label: 'slides/' },
  { id: 'personajes', label: 'personajes/' },
  { id: 'obras', label: 'obras/' }
];

/**
 * Selector de imagen: campo de texto con URL + botón para elegir de la
 * biblioteca de medios (con filtro por carpeta/búsqueda) o subir a WebP.
 */
export default function MediaPicker({ label = 'Imagen', value, onChange, defaultFolder = '' }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('');
  const [folderFilter, setFolderFilter] = useState('');
  const [uploadFolder, setUploadFolder] = useState(defaultFolder);
  const [useWebp, setUseWebp] = useState(true);
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

  const folders = useMemo(() => {
    const s = new Set();
    for (const it of items) {
      if (it.folder) s.add(it.folder);
    }
    return [...s].sort((a, b) => a.localeCompare(b));
  }, [items]);

  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return items.filter(it => {
      if (folderFilter === '__root' && it.folder) return false;
      if (folderFilter && folderFilter !== '__root' && it.folder !== folderFilter) return false;
      if (q && !it.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, filter, folderFilter]);

  const upload = async file => {
    if (!file) return;
    setUploading(true);
    setMsg(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const qs = new URLSearchParams({ folder: uploadFolder, webp: useWebp ? '1' : '0' });
      const res = await fetch(`/api/content/media?${qs}`, { method: 'POST', body: fd });
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
          <input value={value || ''} onChange={e => onChange(e.target.value)} placeholder="/img/archivo.webp" />
          <button type="button" className="admin__btn" onClick={() => setOpen(o => !o)}>
            {open ? 'Cerrar' : 'Elegir'}
          </button>
        </div>
      </Field>
      {value && <img className="admin__thumb admin__thumb--pick" src={value} alt="" loading="lazy" />}

      {open && (
        <div className="admin__media-panel">
          <div className="admin__media-actions">
            <select value={uploadFolder} onChange={e => setUploadFolder(e.target.value)} aria-label="Carpeta de subida">
              {UPLOAD_FOLDERS.map(f => (
                <option key={f.id || 'root'} value={f.id}>{f.label}</option>
              ))}
            </select>
            <label className="admin__check">
              <input type="checkbox" checked={useWebp} onChange={e => setUseWebp(e.target.checked)} />
              WebP
            </label>
            <button type="button" className="admin__btn admin__btn--accent" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? 'Subiendo…' : '+ Subir'}
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
          <div className="admin__media-actions">
            <input
              type="search"
              placeholder="Filtrar imágenes…"
              value={filter}
              onChange={e => setFilter(e.target.value)}
              aria-label="Filtrar imágenes"
            />
            <select value={folderFilter} onChange={e => setFolderFilter(e.target.value)} aria-label="Filtrar por carpeta">
              <option value="">Todas las carpetas</option>
              <option value="__root">Solo raíz</option>
              {folders.map(f => <option key={f} value={f}>{f}/</option>)}
            </select>
          </div>
          <div className="admin__media-grid">
            {visible.map(it => (
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
            {visible.length === 0 && <p className="muted">Sin coincidencias en /img.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
