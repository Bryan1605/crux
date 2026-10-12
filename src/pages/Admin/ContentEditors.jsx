import { useEffect, useState } from 'react';

import { api, Field, Status, EditorHead } from './shared';
import MediaPicker from './MediaPicker';

function ListTools({ onAdd, onSave, onReload, saving }) {
  return (
    <div className="admin__body-actions">
      <button type="button" className="admin__btn" onClick={onReload}>Recargar</button>
      <button type="button" className="admin__btn" onClick={onAdd}>+ Añadir</button>
      <button type="button" className="admin__btn admin__btn--accent" onClick={onSave} disabled={saving}>
        {saving ? 'Guardando…' : 'Guardar'}
      </button>
    </div>
  );
}

function useJson(name) {
  const [data, setData] = useState(null);
  const [msg, setMsg] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const load = async () => {
    setMsg(null);
    try {
      const { raw } = await api(`/${name}`);
      setData(JSON.parse(raw));
      setDirty(false);
    } catch (e) {
      setMsg({ type: 'error', text: String(e.message) });
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  const update = fn => {
    setData(d => fn(Array.isArray(d) ? [...d] : { ...d }));
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      await api(`/${name}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      setMsg({ type: 'ok', text: `Guardado: content/${name}.json` });
      setDirty(false);
    } catch (e) {
      setMsg({ type: 'error', text: String(e.message) });
    } finally {
      setSaving(false);
    }
  };

  return { data, setData, msg, saving, dirty, update, save, load };
}

function DirtyBadge({ dirty }) {
  return dirty ? <span className="admin__dirty">● sin guardar</span> : null;
}

// --- Videos ---
export function VideosEditor() {
  const { data, msg, saving, dirty, update, save, load } = useJson('videos');
  const list = data || [];

  const setItem = (i, key, value) => update(arr => {
    arr[i] = { ...arr[i], [key]: value };
    return arr;
  });

  const add = () => update(arr => [...arr, { id: '', title: '', date: new Date().toISOString().slice(0, 10), description: '' }]);
  const remove = i => update(arr => arr.filter((_, j) => j !== i));
  const move = (i, delta) => update(arr => {
    const j = i + delta;
    if (j < 0 || j >= arr.length) return arr;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    return arr;
  });

  if (!data) return <Status msg={msg} />;

  return (
    <section className="admin__editor admin__editor--full">
      <EditorHead title="Parrilla de videos" file="content/videos.json">
        <DirtyBadge dirty={dirty} />
        <ListTools onAdd={add} onSave={save} onReload={load} saving={saving} />
      </EditorHead>
      <Status msg={msg} />

      {list.length === 0 && <p className="muted admin__hint">Sin videos. Pulsa «+ Añadir».</p>}

      {list.map((v, i) => (
        <div className="admin__card" key={i}>
          <div className="admin__card-head">
            <strong>{v.title || `Video ${i + 1}`}</strong>
            <div className="admin__body-actions">
              <button type="button" className="admin__btn" onClick={() => move(i, -1)}>↑</button>
              <button type="button" className="admin__btn" onClick={() => move(i, 1)}>↓</button>
              <button type="button" className="admin__btn admin__btn--danger" onClick={() => remove(i)}>Quitar</button>
            </div>
          </div>
          <div className="admin__row">
            <Field label="ID de YouTube" hint="11 caracteres">
              <input value={v.id} onChange={e => setItem(i, 'id', e.target.value.trim())} placeholder="dQw4w9WgXcQ" />
            </Field>
            <Field label="Fecha">
              <input value={v.date} onChange={e => setItem(i, 'date', e.target.value)} placeholder="AAAA-MM-DD" />
            </Field>
          </div>
          <Field label="Título">
            <input value={v.title} onChange={e => setItem(i, 'title', e.target.value)} />
          </Field>
          <Field label="Descripción">
            <textarea rows={2} value={v.description} onChange={e => setItem(i, 'description', e.target.value)} />
          </Field>
          {/^[A-Za-z0-9_-]{11}$/.test(v.id) && (
            <img
              className="admin__thumb"
              src={`https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`}
              alt=""
              loading="lazy"
            />
          )}
        </div>
      ))}
    </section>
  );
}

// --- Slides ---
export function SlidesEditor() {
  const { data, msg, saving, dirty, update, save, load } = useJson('slides');
  const list = data || [];

  const setItem = (i, key, value) => update(arr => {
    arr[i] = { ...arr[i], [key]: value };
    return arr;
  });
  const add = () => update(arr => [...arr, { image: '', caption: '', href: '/estudio' }]);
  const remove = i => update(arr => arr.filter((_, j) => j !== i));
  const move = (i, delta) => update(arr => {
    const j = i + delta;
    if (j < 0 || j >= arr.length) return arr;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    return arr;
  });

  if (!data) return <Status msg={msg} />;

  return (
    <section className="admin__editor admin__editor--full">
      <EditorHead title="Banner de portada" file="content/slides.json">
        <DirtyBadge dirty={dirty} />
        <ListTools onAdd={add} onSave={save} onReload={load} saving={saving} />
      </EditorHead>
      <Status msg={msg} />
      <p className="muted admin__hint">
        La primera imagen es la que se ve al cargar. El texto (caption) se muestra sobre el banner y el
        enlace es el destino del botón.
      </p>

      {list.map((s, i) => (
        <div className="admin__card" key={i}>
          <div className="admin__card-head">
            <strong>{s.caption || `Slide ${i + 1}`}</strong>
            <div className="admin__body-actions">
              <button type="button" className="admin__btn" onClick={() => move(i, -1)}>↑</button>
              <button type="button" className="admin__btn" onClick={() => move(i, 1)}>↓</button>
              <button type="button" className="admin__btn admin__btn--danger" onClick={() => remove(i)}>Quitar</button>
            </div>
          </div>
          <MediaPicker
            label="Imagen"
            value={s.image}
            onChange={url => setItem(i, 'image', url)}
          />
          <div className="admin__row">
            <Field label="Caption (texto sobre el banner)">
              <input value={s.caption || ''} onChange={e => setItem(i, 'caption', e.target.value)} />
            </Field>
            <Field label="Enlace del botón">
              <input value={s.href || ''} onChange={e => setItem(i, 'href', e.target.value)} placeholder="/estudio" />
            </Field>
          </div>
        </div>
      ))}
    </section>
  );
}

// --- Versículos ---
export function VersiculosEditor() {
  const { data, msg, saving, dirty, update, save, load } = useJson('versiculos');
  const list = data || [];

  const setItem = (i, value) => update(arr => {
    arr[i] = value;
    return arr;
  });
  const add = () => update(arr => [...arr, '']);
  const remove = i => update(arr => arr.filter((_, j) => j !== i));

  if (!data) return <Status msg={msg} />;

  return (
    <section className="admin__editor admin__editor--full">
      <EditorHead title="Versículos del marquee" file="content/versiculos.json">
        <DirtyBadge dirty={dirty} />
        <ListTools onAdd={add} onSave={save} onReload={load} saving={saving} />
      </EditorHead>
      <Status msg={msg} />
      <p className="muted admin__hint">Uno por línea. Se elige uno al azar en cada carga y cambio de página.</p>
      {list.map((v, i) => (
        <div className="admin__row admin__row--tight" key={i}>
          <textarea rows={2} value={v} onChange={e => setItem(i, e.target.value)} />
          <button type="button" className="admin__btn admin__btn--danger" onClick={() => remove(i)}>Quitar</button>
        </div>
      ))}
    </section>
  );
}

// --- Anuncios ---
export function AnunciosEditor() {
  const { data, msg, saving, dirty, update, save, load } = useJson('anuncios');

  if (!data) return <Status msg={msg} />;

  const items = data.items || [];
  const setItem = (i, value) => update(d => {
    d.items = [...d.items];
    d.items[i] = value;
    return d;
  });
  const add = () => update(d => ({ ...d, items: [...(d.items || []), ''] }));
  const remove = i => update(d => ({ ...d, items: d.items.filter((_, j) => j !== i) }));

  return (
    <section className="admin__editor admin__editor--full">
      <EditorHead title="Anuncios del marquee" file="content/anuncios.json">
        <DirtyBadge dirty={dirty} />
        <ListTools onAdd={add} onSave={save} onReload={load} saving={saving} />
      </EditorHead>
      <Status msg={msg} />
      <div className="admin__row">
        <Field label="Barra activada">
          <input
            type="checkbox"
            checked={data.enabled !== false}
            onChange={e => update(d => ({ ...d, enabled: e.target.checked }))}
          />
        </Field>
        <Field label="Se puede cerrar">
          <input
            type="checkbox"
            checked={data.dismissable !== false}
            onChange={e => update(d => ({ ...d, dismissable: e.target.checked }))}
          />
        </Field>
      </div>
      {items.map((v, i) => (
        <div className="admin__row admin__row--tight" key={i}>
          <textarea rows={2} value={v} onChange={e => setItem(i, e.target.value)} />
          <button type="button" className="admin__btn admin__btn--danger" onClick={() => remove(i)}>Quitar</button>
        </div>
      ))}
    </section>
  );
}
