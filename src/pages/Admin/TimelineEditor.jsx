import { useEffect, useMemo, useState } from 'react';

import Timeline from '../../components/Timeline/Timeline';
import { buildTimeline } from '../../lib/timeline';
import { api, Field, Status, slugify } from './shared';

const TIPOS = [
  { id: 'personaje', label: 'Personaje' },
  { id: 'concilio', label: 'Concilio' },
  { id: 'herejia', label: 'Herejía' },
  { id: 'doctrina', label: 'Doctrina' },
  { id: 'evento', label: 'Hito' }
];

const empty = () => ({
  id: '',
  anio: null,
  anio_label: '',
  tipo: 'evento',
  titulo: '',
  texto: '',
  href: '',
  estudio: null
});

export default function TimelineEditor() {
  const [data, setData] = useState(null);
  const [personajes, setPersonajes] = useState([]);
  const [studies, setStudies] = useState([]);
  const [msg, setMsg] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const load = async () => {
    setMsg(null);
    try {
      const [{ raw }, personajesRes, index] = await Promise.all([
        api('/timeline'),
        api('/personajes'),
        api('/estudios')
      ]);
      setData(JSON.parse(raw));
      setPersonajes(personajesRes.items || []);
      setStudies(index.studies || []);
      setDirty(false);
    } catch (e) {
      setMsg({ type: 'error', text: String(e.message) });
    }
  };

  useEffect(() => {
    load();
  }, []);

  const personajeSlugs = useMemo(() => new Set(personajes.map(p => p.slug)), [personajes]);
  const studySlugs = useMemo(() => new Set(studies.map(s => s.slug)), [studies]);

  const hrefOk = href => {
    if (!href) return true;
    const p = String(href).split(/[?#]/)[0];
    if (p === '/') return true;
    if (['/estudio', '/biblia', '/videos', '/concilios'].includes(p)) return true;
    if (p.startsWith('/biblia')) return true;
    if (p.startsWith('/estudio/personajes/')) return personajeSlugs.has(p.replace('/estudio/personajes/', ''));
    if (p.startsWith('/estudio/')) return studySlugs.has(p.replace('/estudio/', ''));
    return false;
  };

  const update = (i, key, value) => {
    setData(d => d.map((ev, j) => (j === i ? { ...ev, [key]: value } : ev)));
    setDirty(true);
  };

  const touch = (i, key, value, derive) => {
    setData(d =>
      d.map((ev, j) => {
        if (j !== i) return ev;
        const next = { ...ev, [key]: value };
        return derive ? derive(next) : next;
      })
    );
    setDirty(true);
  };

  const move = (i, delta) => {
    setData(d => {
      const arr = [...d];
      const j = i + delta;
      if (j < 0 || j >= arr.length) return arr;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return arr;
    });
    setDirty(true);
  };

  const remove = i => {
    setData(d => d.filter((_, j) => j !== i));
    setDirty(true);
  };

  const add = () => {
    setData(d => [...d, empty()]);
    setDirty(true);
  };

  const save = async () => {
    if (!data) return;
    setSaving(true);
    setMsg(null);
    try {
      const payload = data.map(ev => {
        const rawAnio = ev.anio === '' || ev.anio === null ? null : Number(ev.anio);
        const anio = Number.isFinite(rawAnio) ? rawAnio : null;
        return {
          ...ev,
          id: ev.id.trim() || slugify(ev.titulo),
          anio,
          anio_label: ev.anio_label.trim() || (anio === null ? '' : anio <= 0 ? `${-anio} a. C.` : `${anio} d. C.`),
          href: ev.href.trim(),
          estudio: ev.estudio && ev.estudio.trim() ? ev.estudio.trim() : null
        };
      });
      await api('/timeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      setMsg({ type: 'ok', text: 'Guardado: content/timeline.json' });
      setDirty(false);
      await load();
    } catch (e) {
      setMsg({ type: 'error', text: String(e.message) });
    } finally {
      setSaving(false);
    }
  };

  const merged = useMemo(() => buildTimeline(personajes, data || []), [personajes, data]);

  if (!data) return <Status msg={msg} />;

  return (
    <section className="admin__editor admin__editor--full">
      <Status msg={msg} />
      <div className="admin__body-head">
        <span>
          Línea de tiempo {dirty && <span className="admin__dirty">● sin guardar</span>}
        </span>
        <div className="admin__body-actions">
          <button type="button" className="admin__btn" onClick={load}>Descartar</button>
          <button type="button" className="admin__btn admin__btn--accent" onClick={save} disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>

      <p className="muted admin__hint">
        Los hitos de los personajes se añaden solos desde sus fichas (content/personajes/*.json). Aquí
        añades concilios, herejías, doctrinas o hitos propios con su destino real. El «año» siempre es
        numérico (negativo = a. C.); la etiqueta de fecha solo es para mostrarla («27-28 d. C.», «≈347»).
      </p>

      <div className="admin__card admin__card--flat">
        <strong>Vista previa (personajes + eventos propios)</strong>
        <p className="muted">La línea completa tal como se verá en /estudio.</p>
        <Timeline events={merged} />
      </div>

      <div className="admin__body-head" style={{ marginTop: 'var(--sp-6)' }}>
        <span>Eventos propios ({data.length})</span>
        <div className="admin__body-actions">
          <button type="button" className="admin__btn admin__btn--accent" onClick={add}>+ Añadir evento</button>
        </div>
      </div>

      {data.map((ev, i) => {
        const badHref = !hrefOk(ev.href);
        return (
          <div className="admin__card" key={`${ev.id || 'nuevo'}-${i}`}>
            <div className="admin__card-head">
              <strong>{ev.id || 'Evento nuevo'}</strong>
              <span className="muted">{(TIPOS.find(t => t.id === ev.tipo) || {}).label}</span>
              <div className="admin__body-actions">
                <button type="button" className="admin__btn" onClick={() => move(i, -1)}>↑</button>
                <button type="button" className="admin__btn" onClick={() => move(i, 1)}>↓</button>
                <button type="button" className="admin__btn admin__btn--danger" onClick={() => remove(i)}>Borrar</button>
              </div>
            </div>
            <div className="admin__row">
              <Field label="Título" hint="se usa para sugerir el id">
                <input
                  value={ev.titulo}
                  onChange={e => update(i, 'titulo', e.target.value)}
                  onBlur={() => {
                    if (!ev.id.trim() && ev.titulo.trim()) update(i, 'id', slugify(ev.titulo));
                  }}
                />
              </Field>
              <Field label="Id" hint="solo a-z 0-9 y guiones">
                <input value={ev.id} onChange={e => update(i, 'id', e.target.value)} />
              </Field>
            </div>
            <div className="admin__row">
              <Field label="Año (número)" hint="negativo = a. C.">
                <input
                  type="number"
                  value={ev.anio ?? ''}
                  onChange={e => update(i, 'anio', e.target.value === '' ? null : Number(e.target.value))}
                  onBlur={e => {
                    if (ev.anio !== null && ev.anio !== '' && !ev.anio_label.trim()) {
                      const n = Number(ev.anio);
                      update(i, 'anio_label', n <= 0 ? `${-n} a. C.` : `${n} d. C.`);
                    }
                  }}
                />
              </Field>
              <Field label="Etiqueta de fecha (display)">
                <input value={ev.anio_label} onChange={e => update(i, 'anio_label', e.target.value)} />
              </Field>
              <Field label="Tipo">
                <select value={ev.tipo} onChange={e => update(i, 'tipo', e.target.value)}>
                  {TIPOS.map(t => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="admin__row">
              <Field label="Texto del hito">
                <textarea rows={2} value={ev.texto} onChange={e => update(i, 'texto', e.target.value)} />
              </Field>
            </div>
            <div className="admin__row">
              <Field
                label="Destino (href)"
                hint={
                  badHref
                    ? ' no resuelve: usa /estudio/…, /estudio/personajes/…, /biblia o déjalo vacío'
                    : ' ruta interna o vacío'
                }
              >
                <input
                  className={badHref ? 'admin__input--warn' : ''}
                  value={ev.href}
                  placeholder="/estudio/personajes/juan-bautista"
                  onChange={e => update(i, 'href', e.target.value)}
                />
              </Field>
              <Field label="Estudio (opcional)" hint="slug del estudio asociado">
                <input
                  value={ev.estudio || ''}
                  onChange={e => update(i, 'estudio', e.target.value || null)}
                />
              </Field>
            </div>
          </div>
        );
      })}

      <div className="admin__body-head">
        <span />
        <div className="admin__body-actions">
          <button type="button" className="admin__btn admin__btn--accent" onClick={add}>+ Añadir evento</button>
          <button type="button" className="admin__btn admin__btn--accent" onClick={save} disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </section>
  );
}