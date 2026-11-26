import { useEffect, useMemo, useRef, useState } from 'react';

import { api, Status } from './shared';

const PRESET_FOLDERS = ['', 'estudios', 'slides', 'personajes', 'obras', 'banners'];

export default function MediaLibrary() {
  const [items, setItems] = useState(null);
  const [filter, setFilter] = useState('');
  const [folderFilter, setFolderFilter] = useState('');
  const [uploadFolder, setUploadFolder] = useState('');
  const [useWebp, setUseWebp] = useState(true);
  const [copied, setCopied] = useState('');
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

  const folders = useMemo(() => {
    const s = new Set();
    for (const it of items || []) {
      if (it.folder) s.add(it.folder);
    }
    return [...s].sort((a, b) => a.localeCompare(b));
  }, [items]);

  const filtered = useMemo(() => {
    if (!items) return [];
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
      setMsg({
        type: 'ok',
        text: `Subido: ${data.url}${data.converted ? ' (optimizado a WebP)' : ''}`
      });
      await load();
    } catch (e) {
      setMsg({ type: 'error', text: String(e.message) });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const copyPath = async url => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(url);
      window.setTimeout(() => setCopied(prev => (prev === url ? '' : prev)), 1500);
    } catch {
      setMsg({ type: 'ok', text: `Ruta: ${url}` });
    }
  };

  const checkUsage = async name => {
    try {
      const res = await api(`/media/usage?path=${encodeURIComponent(name)}`);
      if (!res.count) {
        setMsg({ type: 'ok', text: `${name}: sin referencias encontradas en el sitio.` });
      } else {
        const list = res.refs.slice(0, 6).map(r => r.file).join(', ');
        setMsg({
          type: 'ok',
          text: `${name}: usado en ${res.count} archivo(s) → ${list}${res.count > 6 ? '…' : ''}`
        });
      }
    } catch (e) {
      setMsg({ type: 'error', text: String(e.message) });
    }
  };

  const remove = async name => {
    let promptMsg = `¿Eliminar /img/${name}?`;
    try {
      const usage = await api(`/media/usage?path=${encodeURIComponent(name)}`);
      if (usage.count > 0) {
        const sample = usage.refs.slice(0, 5).map(r => `• ${r.file}`).join('\n');
        promptMsg = `¡Atención! /img/${name} aparece referenciada en ${usage.count} archivo(s):\n${sample}\n\n¿Seguro que quieres eliminarla (se guardará copia en .history)?`;
      }
    } catch {
      /* si falla el detector, seguimos con confirmación normal */
    }
    if (!window.confirm(promptMsg)) return;
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
        <span>
          Biblioteca de medios — public/img/
          {items && <span className="muted"> · {filtered.length}/{items.length}</span>}
        </span>
        <div className="admin__body-actions">
          <select value={uploadFolder} onChange={e => setUploadFolder(e.target.value)} aria-label="Carpeta destino">
            {PRESET_FOLDERS.map(f => (
              <option key={f || 'root'} value={f}>{f ? `${f}/` : 'Raíz (/img)'}</option>
            ))}
          </select>
          <label className="admin__check">
            <input type="checkbox" checked={useWebp} onChange={e => setUseWebp(e.target.checked)} />
            Optimizar a WebP
          </label>
          <button type="button" className="admin__btn" onClick={load}>Recargar</button>
          <button type="button" className="admin__btn admin__btn--accent" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? 'Subiendo…' : '+ Subir imagen'}
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => upload(e.target.files?.[0])} />
        </div>
      </div>

      <div className="admin__row">
        <input
          type="search"
          placeholder="Buscar imagen por nombre o ruta…"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          aria-label="Buscar imagen"
        />
        <select value={folderFilter} onChange={e => setFolderFilter(e.target.value)} aria-label="Filtrar por subcarpeta">
          <option value="">Todas las carpetas</option>
          <option value="__root">Solo raíz (/img)</option>
          {folders.map(f => (
            <option key={f} value={f}>{f}/</option>
          ))}
        </select>
      </div>

      <Status msg={msg} />
      <p className="muted admin__hint">
        Las imágenes PNG/JPG subidas con «Optimizar a WebP» se convierten automáticamente en memoria mediante <code>sharp</code>.
        Antes de eliminar se comprueban sus referencias en estudios y configuraciones.
      </p>
      {!items && <Status msg={{ type: 'error', text: 'Cargando…' }} />}
      {items && (
        <div className="admin__media-library">
          {filtered.map(it => (
            <div className="admin__media-card" key={it.name}>
              <img src={it.url} alt={it.name} loading="lazy" />
              <div className="admin__media-meta">
                <span title={it.name}>{it.name}</span>
                <small>{Math.round(it.size / 1024)} kB · {it.url}</small>
              </div>
              <div className="admin__media-card-actions">
                <button type="button" className="admin__btn" onClick={() => copyPath(it.url)}>
                  {copied === it.url ? 'Copiado' : 'Copiar'}
                </button>
                <button type="button" className="admin__btn" onClick={() => checkUsage(it.name)}>
                  Uso
                </button>
                <button type="button" className="admin__btn admin__btn--danger" onClick={() => remove(it.name)}>
                  Eliminar
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="muted">No hay imágenes que coincidan con el filtro.</p>}
        </div>
      )}
    </section>
  );
}
