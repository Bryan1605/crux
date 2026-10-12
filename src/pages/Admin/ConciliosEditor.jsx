import { useEffect, useMemo, useState } from 'react';

import { api, Field, Status, slugify } from './shared';

const empty = tipo => ({
  id: '',
  tipo,
  nombre: '',
  resumen: '',
  estudio: null
});

export default function ConciliosEditor() {
  const [data, setData] = useState(null);
  const [msg, setMsg] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const load = async () => {
    setMsg(null);
    try {
      const res = await api('/concilios');
      setData(JSON.parse(res.raw));
      setDirty(false);
    } catch (e) {
      setMsg({ type: 'error', text: String(e.message) });
    }
  };

  useEffect(() => {
    load();
  }, []);

  const hermano = useMemo(() => {
    const list = data || [];
    return {
      concilios: list.filter(c => c.tipo === 'concilio'),
      herejias: list.filter(h => h.tipo === 'herejia')
    };
  }, [data]);

  const update = (i, key, value) => {
    setData(d => d.map((it, j) => (j === i ? { ...it, [key]: value } : it)));
    setDirty(true);
  };

  const toggleHerejia = (i, hid) => {
    setData(d =>
      d.map((it, j) => {
        if (j !== i) return it;
        const herejias = it.herejias || [];
        return {
          ...it,
          herejias: herejias.includes(hid) ? herejias.filter(x => x !== hid) : [...herejias, hid]
        };
      })
    );
    setDirty(true);
  };

  const setTipo = (i, tipo) => {
    setData(d =>
      d.map((it, j) => {
        if (j !== i) return it;
        const next = { id: it.id, tipo, nombre: it.nombre, resumen: it.resumen, estudio: it.estudio ?? null };
        return next;
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

  const add = tipo => {
    setData(d => [...d, empty(tipo)]);
    setDirty(true);
  };

  const save = async () => {
    if (!data) return;
    setSaving(true);
    setMsg(null);
    try {
      const payload = data.map(it => {
        const isConcilio = it.tipo === 'concilio';
        const anio = isConcilio ? Number(it.anio) : null;
        const base = {
          id: it.id.trim() || slugify(it.nombre),
          tipo: it.tipo,
          nombre: it.nombre.trim(),
          resumen: it.resumen.trim(),
          estudio: it.estudio && it.estudio.trim() ? it.estudio.trim() : null
        };
        if (isConcilio) {
          return {
            ...base,
            anio: Number.isFinite(anio) ? anio : null,
            anio_label: it.anio_label?.trim() || (Number.isFinite(anio) ? `${anio} d. C.` : ''),
            convocante: it.convocante?.trim() || '',
            ordinal: it.ordinal ? Number(it.ordinal) : null,
            decisiones: splitLines(it.decisiones),
            herejias: it.herejias || []
          };
        }
        return {
          ...base,
          contexto: it.contexto?.trim() || '',
          condenada_en: it.condenada_en || null
        };
      });
      await api('/concilios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      setMsg({ type: 'ok', text: 'Guardado: content/concilios.json' });
      setDirty(false);
      await load();
    } catch (e) {
      setMsg({ type: 'error', text: String(e.message) });
    } finally {
      setSaving(false);
    }
  };

  if (!data) return <Status msg={msg} />;

  return (
    <section className="admin__editor admin__editor--full">
      <Status msg={msg} />
      <div className="admin__body-head">
        <span>
          Concilios y herejías {dirty && <span className="admin__dirty">● sin guardar</span>}
        </span>
        <div className="admin__body-actions">
          <button type="button" className="admin__btn" onClick={load}>Descartar</button>
          <button type="button" className="admin__btn admin__btn--accent" onClick={save} disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>

      <p className="muted admin__hint">
        Este archivo también alimenta la línea de tiempo de /estudio: cada concilio aparece en su año y
        cada herejía hereda el año del concilio que la condena (<code>condenada_en</code>). No hace falta
        repetirlos en «Línea de tiempo». El campo <code>estudio</code> enlaza el estudio detallado cuando
        exista; vacío muestra «Estudio próximamente».
      </p>

      <div className="admin__body-head" style={{ marginTop: 'var(--sp-6)' }}>
        <span>Fichas ({data.length})</span>
        <div className="admin__body-actions">
          <button type="button" className="admin__btn admin__btn--accent" onClick={() => add('concilio')}>
            + Concilio
          </button>
          <button type="button" className="admin__btn admin__btn--accent" onClick={() => add('herejia')}>
            + Herejía
          </button>
        </div>
      </div>

      {data.map((it, i) => (
        <div className="admin__card" key={`${it.id || 'nuevo'}-${i}`}>
          <div className="admin__card-head">
            <strong>{it.nombre || it.id || 'Ficha nueva'}</strong>
            <span className="muted">{it.tipo === 'concilio' ? 'Concilio' : 'Herejía'}</span>
            <div className="admin__body-actions">
              <button type="button" className="admin__btn" onClick={() => move(i, -1)}>↑</button>
              <button type="button" className="admin__btn" onClick={() => move(i, 1)}>↓</button>
              <button type="button" className="admin__btn admin__btn--danger" onClick={() => remove(i)}>Borrar</button>
            </div>
          </div>

          <div className="admin__row">
            <Field label="Tipo">
              <select value={it.tipo} onChange={e => setTipo(i, e.target.value)}>
                <option value="concilio">Concilio</option>
                <option value="herejia">Herejía</option>
              </select>
            </Field>
            <Field label="Id" hint="solo a-z 0-9 y guiones">
              <input value={it.id} onChange={e => update(i, 'id', e.target.value)} />
            </Field>
          </div>

          <div className="admin__row">
            <Field label="Nombre">
              <input
                value={it.nombre}
                onChange={e => update(i, 'nombre', e.target.value)}
                onBlur={() => {
                  if (!it.id.trim() && it.nombre.trim()) update(i, 'id', slugify(it.nombre));
                }}
              />
            </Field>
            <Field label="Estudio (slug o vacío)" hint="vacío = «Estudio próximamente»">
              <input value={it.estudio || ''} onChange={e => update(i, 'estudio', e.target.value)} />
            </Field>
          </div>

          {it.tipo === 'concilio' ? (
            <>
              <div className="admin__row">
                <Field label="Año (número obligatorio)">
                  <input
                    type="number"
                    value={it.anio ?? ''}
                    onChange={e => update(i, 'anio', e.target.value)}
                  />
                </Field>
                <Field label="Etiqueta de fecha" hint="vacío se deriva del año">
                  <input value={it.anio_label || ''} onChange={e => update(i, 'anio_label', e.target.value)} />
                </Field>
              </div>
              <div className="admin__row">
                <Field label="Convocante">
                  <input value={it.convocante || ''} onChange={e => update(i, 'convocante', e.target.value)} />
                </Field>
                <Field label="Ordinal romano (1-7)" hint="Nicea = I, Calcedonia = IV…">
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={it.ordinal ?? ''}
                    onChange={e => update(i, 'ordinal', e.target.value)}
                  />
                </Field>
              </div>
              <Field label="Decisiones (una por línea)">
                <textarea
                  rows={3}
                  value={(it.decisiones || []).join('\n')}
                  onChange={e => update(i, 'decisiones', e.target.value)}
                />
              </Field>
              <Field label="Herejías que condena" hint="marca las herejías de este archivo">
                <div className="admin__chips">
                  {hermano.herejias.length === 0 && <span className="muted">aún no hay herejías</span>}
                  {hermano.herejias.map(h => (
                    <button
                      key={h.id}
                      type="button"
                      className={`admin__chip ${(it.herejias || []).includes(h.id) ? 'is-active' : ''}`}
                      onClick={() => toggleHerejia(i, h.id)}
                    >
                      {h.nombre}
                    </button>
                  ))}
                </div>
              </Field>
            </>
          ) : (
            <div className="admin__row">
              <Field label="Contexto histórico" hint="p. ej. «siglo IV»">
                <input value={it.contexto || ''} onChange={e => update(i, 'contexto', e.target.value)} />
              </Field>
              <Field label="Condenada en" hint="hereda su año en la línea de tiempo">
                <select
                  value={it.condenada_en || ''}
                  onChange={e => update(i, 'condenada_en', e.target.value || null)}
                >
                  <option value="">— ninguna (solo ficha) —</option>
                  {hermano.concilios.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </Field>
            </div>
          )}

          <Field label="Resumen">
            <textarea rows={3} value={it.resumen} onChange={e => update(i, 'resumen', e.target.value)} />
          </Field>
        </div>
      ))}
    </section>
  );
}

const splitLines = v =>
  String(v || '')
    .split(/\n+/)
    .map(s => s.trim())
    .filter(Boolean);