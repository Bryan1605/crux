import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { api, Field, Status } from './shared';

export default function TradEditor({ onDirtyChange }) {
  const [items, setItems] = useState(null);
  const [selected, setSelected] = useState(null);
  const [trad, setTrad] = useState(null);
  const [codex, setCodex] = useState(null);
  const [activeCap, setActiveCap] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const dirtyRef = useRef(false);
  dirtyRef.current = dirty;

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  const loadList = useCallback(async () => {
    const res = await api('/trad');
    setItems(res.items || []);
  }, []);

  useEffect(() => {
    loadList().catch(e => setMsg({ type: 'error', text: String(e.message) }));
  }, [loadList]);

  const openBook = async id => {
    if (dirtyRef.current && !window.confirm('Hay cambios sin guardar en esta traducción. ¿Descartarlos?')) return;
    setMsg(null);
    try {
      const res = await api(`/trad/${id}`);
      setTrad(res.trad);
      setCodex(res.codex);
      setSelected(id);
      setActiveCap(res.trad?.chapters?.[0]?.num ?? null);
      setDirty(false);
    } catch (e) {
      setMsg({ type: 'error', text: String(e.message) });
    }
  };

  const setVerse = (capNum, vNum, key, value) => {
    setTrad(prev => ({
      ...prev,
      chapters: prev.chapters.map(ch =>
        ch.num !== capNum
          ? ch
          : {
              ...ch,
              verses: ch.verses.map(v => {
                if (v.n !== vNum) return v;
                if (key === 'note') {
                  const clean = value;
                  const next = { ...v };
                  if (clean === '') delete next.note;
                  else next.note = clean;
                  return next;
                }
                return { ...v, [key]: value };
              })
            }
      )
    }));
    setDirty(true);
  };

  const save = async () => {
    if (!trad || !selected) return;
    setSaving(true);
    setMsg(null);
    try {
      await api(`/trad/${selected}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trad })
      });
      setDirty(false);
      setMsg({ type: 'ok', text: `Guardado y publicado: ${selected}.json (build-trad + index actualizados)` });
      await loadList();
    } catch (e) {
      setMsg({ type: 'error', text: String(e.message) });
    } finally {
      setSaving(false);
    }
  };

  const currentChapter = useMemo(
    () => trad?.chapters?.find(c => c.num === activeCap) || null,
    [trad, activeCap]
  );

  const codexMap = useMemo(() => {
    const ch = codex?.chapters?.find(c => c.num === activeCap);
    const map = new Map();
    for (const v of ch?.verses || []) map.set(v.n, v.text);
    return map;
  }, [codex, activeCap]);

  return (
    <div className="admin__split">
      <aside className="admin__list">
        <div className="admin__list-head">
          <span className="muted">Traducciones solo-Codex</span>
        </div>
        <ul>
          {(items || []).map(it => (
            <li key={it.id}>
              <button type="button" className={selected === it.id ? 'is-active' : ''} onClick={() => openBook(it.id)}>
                <strong>{it.name} ({it.abbr})</strong>
                <span>{it.chapters} caps. · {it.verses} vv. · {it.status}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section className="admin__editor">
        <Status msg={msg} />
        {!trad && (
          <div className="admin__placeholder">
            <p className="muted">Selecciona una de las 8 traducciones para revisarla verso a verso frente al griego del Codex.</p>
          </div>
        )}

        {trad && (
          <>
            <div className="admin__body-head">
              <span>
                <strong>{trad.name}</strong> ({trad.license})
                {dirty && <em className="admin__dirty">· sin guardar</em>}
              </span>
              <div className="admin__body-actions">
                <a
                  className="admin__btn"
                  href={`/exegesis?libro=${trad.id}&cap=${activeCap || trad.chapters?.[0]?.num || 1}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Abrir en Exégesis ↗
                </a>
                <button type="button" className="admin__btn admin__btn--accent" onClick={save} disabled={saving}>
                  {saving ? 'Validando y publicando…' : 'Guardar y regenerar'}
                </button>
              </div>
            </div>

            <div className="admin__row">
              <Field label="Estado de revisión">
                <select
                  value={trad.status}
                  onChange={e => {
                    setTrad(prev => ({ ...prev, status: e.target.value }));
                    setDirty(true);
                  }}
                >
                  <option value="borrador">borrador</option>
                  <option value="revisado">revisado</option>
                </select>
              </Field>
              <Field label="Alcance (scope)">
                <input
                  value={trad.scope || ''}
                  onChange={e => {
                    setTrad(prev => ({ ...prev, scope: e.target.value }));
                    setDirty(true);
                  }}
                />
              </Field>
            </div>

            <div className="admin__chips" role="tablist" aria-label="Capítulos traducidos">
              {(trad.chapters || []).map(ch => (
                <button
                  key={ch.num}
                  type="button"
                  role="tab"
                  aria-selected={ch.num === activeCap}
                  className={`admin__chip${ch.num === activeCap ? ' is-active' : ''}`}
                  onClick={() => setActiveCap(ch.num)}
                >
                  Cap. {ch.num}
                </button>
              ))}
            </div>

            {currentChapter && (
              <div className="admin__trad-list">
                {currentChapter.verses.map(v => (
                  <div className="admin__trad-row" key={v.n}>
                    <div className="admin__trad-greek">
                      <strong className="admin__trad-num">v. {v.n}</strong>
                      <p lang="grc">{codexMap.get(v.n) || '—'}</p>
                    </div>
                    <div className="admin__trad-es">
                      <textarea
                        rows={2}
                        className={!v.text?.trim() ? 'admin__input--warn' : ''}
                        aria-label={`Texto español versículo ${v.n}`}
                        value={v.text || ''}
                        onChange={e => setVerse(currentChapter.num, v.n, 'text', e.target.value)}
                      />
                      <input
                        placeholder="Nota de traducción (opcional)"
                        aria-label={`Nota versículo ${v.n}`}
                        value={v.note || ''}
                        onChange={e => setVerse(currentChapter.num, v.n, 'note', e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
