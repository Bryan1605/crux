import { useCallback, useEffect, useState } from 'react';

import { api, slugify, Field, Status } from './shared';
import MediaPicker from './MediaPicker';

const emptyPersonaje = () => ({
  slug: '',
  nombre: '',
  epoca: '',
  rol: '',
  resumen: '',
  tags: '',
  portada: '',
  escenas: [],
  bio: [],
  timeline: [],
  estudio: null
});

export default function PersonajesEditor() {
  const [list, setList] = useState(null);
  const [selected, setSelected] = useState(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState(null);
  const [msg, setMsg] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { items } = await api('/personajes');
    setList(items);
  }, []);

  useEffect(() => {
    load().catch(e => setMsg({ type: 'error', text: String(e.message) }));
  }, [load]);

  const open = async slug => {
    setMsg(null);
    try {
      const data = await api(`/personajes/${slug}`);
      setForm({ ...data, tags: (data.tags || []).join(', ') });
      setSelected(slug);
      setIsNew(false);
    } catch (e) {
      setMsg({ type: 'error', text: String(e.message) });
    }
  };

  const createNew = () => {
    setForm(emptyPersonaje());
    setSelected(null);
    setIsNew(true);
    setMsg(null);
  };

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));
  const setArr = (key, i, value) => setForm(f => {
    const arr = [...f[key]];
    arr[i] = value;
    return { ...f, [key]: arr };
  });
  const addArr = (key, value = '') => setForm(f => ({ ...f, [key]: [...(f[key] || []), value] }));
  const delArr = (key, i) => setForm(f => ({ ...f, [key]: f[key].filter((_, j) => j !== i) }));

  const save = async () => {
    if (!form || !form.nombre.trim()) {
      setMsg({ type: 'error', text: 'El nombre es obligatorio.' });
      return;
    }
    const slug = form.slug || slugify(form.nombre);
    setSaving(true);
    setMsg(null);
    try {
      const data = {
        slug,
        nombre: form.nombre.trim(),
        epoca: form.epoca.trim(),
        rol: form.rol.trim(),
        resumen: form.resumen.trim(),
        tags: form.tags.split(',').map(s => s.trim()).filter(Boolean),
        portada: form.portada.trim(),
        escenas: form.escenas.map(s => String(s).trim()).filter(Boolean),
        bio: form.bio.map(s => String(s).trim()).filter(Boolean),
        timeline: form.timeline.map(t => ({ anio: String(t.anio || '').trim(), evento: String(t.evento || '').trim() })),
        estudio: form.estudio ? form.estudio.trim() : null
      };
      await api('/personajes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      setMsg({ type: 'ok', text: `Guardado: content/personajes/${slug}.json` });
      setSelected(slug);
      setIsNew(false);
      await load();
    } catch (e) {
      setMsg({ type: 'error', text: String(e.message) });
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!selected) return;
    if (!window.confirm(`¿Eliminar content/personajes/${selected}.json?`)) return;
    try {
      await api(`/personajes/${selected}`, { method: 'DELETE' });
      setMsg({ type: 'ok', text: 'Personaje eliminado.' });
      setSelected(null);
      setForm(null);
      setIsNew(false);
      await load();
    } catch (e) {
      setMsg({ type: 'error', text: String(e.message) });
    }
  };

  return (
    <div className="admin__split">
      <aside className="admin__list">
        <div className="admin__list-head">
          <span className="muted">{list ? `${list.length} personajes` : 'Cargando…'}</span>
          <button type="button" className="admin__btn admin__btn--accent" onClick={createNew}>+ Nuevo</button>
        </div>
        <ul>
          {(list || []).map(p => (
            <li key={p.slug}>
              <button
                type="button"
                className={selected === p.slug ? 'is-active' : ''}
                onClick={() => open(p.slug)}
              >
                <strong>{p.nombre}</strong>
                <span>{p.slug}</span>
              </button>
            </li>
          ))}
          {list && list.length === 0 && <li className="admin__empty">Sin personajes</li>}
        </ul>
      </aside>

      <section className="admin__editor">
        <Status msg={msg} />
        {!form && (
          <div className="admin__placeholder">
            <p className="muted">Elige un personaje o pulsa «+ Nuevo».</p>
          </div>
        )}
        {form && (
          <>
            <div className="admin__row">
              <Field label="Nombre">
                <input value={form.nombre} onChange={e => set('nombre', e.target.value)} />
              </Field>
              <Field label="Slug" hint="se autogenera si lo dejas vacío">
                <input
                  value={form.slug || slugify(form.nombre)}
                  onChange={e => set('slug', e.target.value)}
                  disabled={!form.nombre && !form.slug}
                />
              </Field>
            </div>
            <div className="admin__row">
              <Field label="Época">
                <input value={form.epoca} onChange={e => set('epoca', e.target.value)} />
              </Field>
              <Field label="Rol">
                <input value={form.rol} onChange={e => set('rol', e.target.value)} />
              </Field>
              <Field label="Etiquetas" hint="separadas por coma">
                <input value={form.tags} onChange={e => set('tags', e.target.value)} />
              </Field>
            </div>
            <Field label="Resumen">
              <textarea rows={3} value={form.resumen} onChange={e => set('resumen', e.target.value)} />
            </Field>
            <MediaPicker label="Portada" value={form.portada} onChange={url => set('portada', url)} />
            <Field label="Estudio relacionado" hint="slug del estudio (opcional)">
              <input
                value={form.estudio || ''}
                onChange={e => set('estudio', e.target.value || null)}
                placeholder="apostol-pablo"
              />
            </Field>

            <div className="admin__body-head">
              <span>Escenas ({form.escenas.length})</span>
              <button type="button" className="admin__btn" onClick={() => addArr('escenas')}>+ Escena</button>
            </div>
            {form.escenas.map((src, i) => (
              <div className="admin__card" key={i}>
                <MediaPicker
                  label={`Imagen de la escena ${i + 1}`}
                  value={src}
                  onChange={url => setArr('escenas', i, url)}
                />
                <button type="button" className="admin__btn admin__btn--danger" onClick={() => delArr('escenas', i)}>
                  Quitar escena
                </button>
              </div>
            ))}

            <div className="admin__body-head">
              <span>Biografía — párrafos ({form.bio.length})</span>
              <button type="button" className="admin__btn" onClick={() => addArr('bio')}>+ Párrafo</button>
            </div>
            {form.bio.map((text, i) => (
              <div className="admin__row admin__row--tight" key={i}>
                <textarea rows={3} value={text} onChange={e => setArr('bio', i, e.target.value)} />
                <button type="button" className="admin__btn admin__btn--danger" onClick={() => delArr('bio', i)}>✕</button>
              </div>
            ))}

            <div className="admin__body-head">
              <span>Línea de tiempo ({form.timeline.length})</span>
              <button type="button" className="admin__btn" onClick={() => addArr('timeline', { anio: '', evento: '' })}>
                + Hito
              </button>
            </div>
            {form.timeline.map((t, i) => (
              <div className="admin__card" key={i}>
                <div className="admin__row admin__row--tight">
                  <input
                    value={t.anio || ''}
                    placeholder="Fecha (ej. 33 d. C.)"
                    onChange={e => setArr('timeline', i, { ...t, anio: e.target.value })}
                  />
                  <button type="button" className="admin__btn admin__btn--danger" onClick={() => delArr('timeline', i)}>✕</button>
                </div>
                <Field label="Qué ocurrió">
                  <textarea
                    rows={2}
                    value={t.evento || ''}
                    onChange={e => setArr('timeline', i, { ...t, evento: e.target.value })}
                  />
                </Field>
              </div>
            ))}

            <div className="admin__body-actions">
              <button type="button" className="admin__btn admin__btn--accent" onClick={save} disabled={saving}>
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
              {!isNew && (
                <button type="button" className="admin__btn admin__btn--danger" onClick={remove}>Eliminar</button>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}