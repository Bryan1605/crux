import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { api, Field, Status } from './shared';

const CERTEZAS = ['segura', 'probable', 'discutida', 'desconocida'];

function countWords(text) {
  return String(text || '').trim().split(/\s+/).filter(Boolean).length;
}

export default function LibrosEditor({ onDirtyChange }) {
  const [items, setItems] = useState(null);
  const [fuentes, setFuentes] = useState({});
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const dirtyRef = useRef(false);
  dirtyRef.current = dirty;

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  const loadList = useCallback(async () => {
    const res = await api('/libros');
    setItems(res.items || []);
    setFuentes(res.fuentes || {});
  }, []);

  useEffect(() => {
    loadList().catch(e => setMsg({ type: 'error', text: String(e.message) }));
  }, [loadList]);

  const openBook = async id => {
    if (dirtyRef.current && !window.confirm('Hay cambios sin guardar en esta ficha. ¿Descartarlos?')) return;
    setMsg(null);
    try {
      const res = await api(`/libros/${id}`);
      const d = res.data;
      setForm({
        ...d,
        genreText: (d.genre || []).join(', '),
        notice: d.notice || ''
      });
      if (res.fuentes) setFuentes(res.fuentes);
      setSelected(id);
      setDirty(false);
    } catch (e) {
      setMsg({ type: 'error', text: String(e.message) });
    }
  };

  const setField = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const setNested = (group, key, value) => {
    setForm(prev => ({ ...prev, [group]: { ...(prev[group] || {}), [key]: value } }));
    setDirty(true);
  };

  const setSectionBody = (idx, body) => {
    setForm(prev => ({
      ...prev,
      sections: prev.sections.map((s, i) => (i === idx ? { ...s, body } : s))
    }));
    setDirty(true);
  };

  const toggleSource = key => {
    setForm(prev => {
      const cur = prev.sources || [];
      const next = cur.includes(key) ? cur.filter(x => x !== key) : [...cur, key];
      return { ...prev, sources: next };
    });
    setDirty(true);
  };

  const setDebate = (idx, key, val) => {
    setForm(prev => ({
      ...prev,
      debates: (prev.debates || []).map((d, i) => (i === idx ? { ...d, [key]: val } : d))
    }));
    setDirty(true);
  };

  const setDebatePos = (dIdx, pIdx, key, val) => {
    setForm(prev => ({
      ...prev,
      debates: (prev.debates || []).map((d, i) =>
        i === dIdx
          ? { ...d, positions: d.positions.map((p, j) => (j === pIdx ? { ...p, [key]: val } : p)) }
          : d
      )
    }));
    setDirty(true);
  };

  const save = async () => {
    if (!form || !selected) return;
    setSaving(true);
    setMsg(null);
    const payload = {
      ...form,
      genre: form.genreText.split(',').map(s => s.trim()).filter(Boolean),
      notice: form.notice.trim() ? form.notice.trim() : null,
      updated: new Date().toISOString().slice(0, 10)
    };
    delete payload.genreText;

    try {
      const res = await api(`/libros/${selected}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      setForm({
        ...res.data,
        genreText: (res.data.genre || []).join(', '),
        notice: res.data.notice || ''
      });
      setDirty(false);
      setMsg({ type: 'ok', text: `Guardado: content/libros/${selected}.json` });
      await loadList();
    } catch (e) {
      setMsg({ type: 'error', text: String(e.message) });
    } finally {
      setSaving(false);
    }
  };

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return (items || []).filter(it => !q || `${it.title} ${it.abbr} ${it.id} ${it.status}`.toLowerCase().includes(q));
  }, [items, filter]);

  const bodyWords = useMemo(
    () => (form?.sections || []).reduce((n, s) => n + countWords(s.body), 0),
    [form?.sections]
  );
  const summaryWords = useMemo(() => countWords(form?.summary), [form?.summary]);
  const fuentesList = useMemo(() => Object.entries(fuentes), [fuentes]);

  return (
    <div className="admin__split">
      <aside className="admin__list">
        <div className="admin__list-head">
          <input
            type="search"
            placeholder="Filtrar 73 libros…"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            aria-label="Filtrar libros"
          />
        </div>
        <ul>
          {filtered.map(it => (
            <li key={it.id}>
              <button type="button" className={selected === it.id ? 'is-active' : ''} onClick={() => openBook(it.id)}>
                <strong>{it.abbr} · {it.title}</strong>
                <span>{it.testament} · {it.status} · {it.words} pal.</span>
              </button>
            </li>
          ))}
          {items && filtered.length === 0 && <li className="admin__empty">Sin resultados</li>}
        </ul>
      </aside>

      <section className="admin__editor">
        <Status msg={msg} />
        {!form && (
          <div className="admin__placeholder">
            <p className="muted">Elige uno de los 73 libros para revisar su ficha, fuentes o aprobar a «revisado».</p>
          </div>
        )}

        {form && (
          <>
            <div className="admin__body-head">
              <span>
                <strong>{form.title}</strong> ({form.abbr} · {form.testament} · orden {form.order})
                {dirty && <em className="admin__dirty">· sin guardar</em>}
              </span>
              <div className="admin__body-actions">
                <a className="admin__btn" href={`/biblia/libros/${form.id}`} target="_blank" rel="noopener noreferrer">
                  Ver ficha ↗
                </a>
                <button type="button" className="admin__btn admin__btn--accent" onClick={save} disabled={saving}>
                  {saving ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </div>

            <div className="admin__row">
              <Field label="Estado">
                <select value={form.status} onChange={e => setField('status', e.target.value)}>
                  <option value="borrador">borrador</option>
                  <option value="revisado">revisado</option>
                </select>
              </Field>
              <Field label="Lengua original">
                <input value={form.language} onChange={e => setField('language', e.target.value)} />
              </Field>
              <Field label="Géneros (separados por coma)">
                <input value={form.genreText} onChange={e => setField('genreText', e.target.value)} />
              </Field>
            </div>

            <Field
              label="Resumen (2–3 frases)"
              hint={`${summaryWords} pal. (20–90 requeridas)`}
            >
              <textarea
                rows={3}
                className={summaryWords < 20 || summaryWords > 90 ? 'admin__input--warn' : ''}
                value={form.summary}
                onChange={e => setField('summary', e.target.value)}
              />
            </Field>

            <Field label="Aviso textual (opcional, p. ej. libros solo-Codex)">
              <input value={form.notice} onChange={e => setField('notice', e.target.value)} />
            </Field>

            <fieldset className="admin__section">
              <legend>Datación</legend>
              <div className="admin__row">
                <Field label="Fecha narrativa">
                  <input value={form.date?.narrative || ''} onChange={e => setNested('date', 'narrative', e.target.value)} />
                </Field>
                <Field label="Composición">
                  <input value={form.date?.composition || ''} onChange={e => setNested('date', 'composition', e.target.value)} />
                </Field>
                <Field label="Certeza">
                  <select value={form.date?.certainty || 'discutida'} onChange={e => setNested('date', 'certainty', e.target.value)}>
                    {CERTEZAS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Nota de datación">
                <input value={form.date?.note || ''} onChange={e => setNested('date', 'note', e.target.value)} />
              </Field>
            </fieldset>

            <fieldset className="admin__section">
              <legend>Canon</legend>
              <div className="admin__row">
                {['judio', 'catolico', 'ortodoxo', 'protestante'].map(k => (
                  <Field key={k} label={k}>
                    <input value={form.canon?.[k] || ''} onChange={e => setNested('canon', k, e.target.value)} />
                  </Field>
                ))}
              </div>
            </fieldset>

            <div className="admin__body-head">
              <span>Las 7 secciones</span>
              <span className={bodyWords < 600 || bodyWords > 900 ? 'admin__dirty' : 'muted'}>
                Total cuerpo: {bodyWords} palabras (rango válido: 600–900)
              </span>
            </div>

            {(form.sections || []).map((sec, idx) => (
              <Field key={sec.id} label={sec.title} hint={`${countWords(sec.body)} pal.`}>
                <textarea
                  rows={5}
                  value={sec.body}
                  onChange={e => setSectionBody(idx, e.target.value)}
                />
              </Field>
            ))}

            <fieldset className="admin__section">
              <legend>Debates ({(form.debates || []).length})</legend>
              {(form.debates || []).map((d, dIdx) => (
                <div className="admin__card" key={dIdx}>
                  <Field label={`Pregunta ${dIdx + 1}`}>
                    <input value={d.question} onChange={e => setDebate(dIdx, 'question', e.target.value)} />
                  </Field>
                  {(d.positions || []).map((pos, pIdx) => (
                    <div className="admin__row" key={pIdx}>
                      <Field label={`Postura ${pIdx + 1}`}>
                        <input value={pos.label} onChange={e => setDebatePos(dIdx, pIdx, 'label', e.target.value)} />
                      </Field>
                      <Field label="Argumento">
                        <textarea rows={2} value={pos.body} onChange={e => setDebatePos(dIdx, pIdx, 'body', e.target.value)} />
                      </Field>
                    </div>
                  ))}
                </div>
              ))}
            </fieldset>

            <fieldset className="admin__section">
              <legend>Fuentes citadas ({(form.sources || []).length}/3–5 requeridas)</legend>
              <div className="admin__checks">
                {fuentesList.map(([key, meta]) => {
                  const checked = (form.sources || []).includes(key);
                  return (
                    <label key={key} className="admin__check" title={`${meta.autor} (${meta.anio}) — ${meta.titulo}`}>
                      <input type="checkbox" checked={checked} onChange={() => toggleSource(key)} />
                      <span><code>{key}</code> · {meta.autor} ({meta.anio})</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          </>
        )}
      </section>
    </div>
  );
}
