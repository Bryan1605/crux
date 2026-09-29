import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { marked } from 'marked';

import { parseFrontmatter, serializeFrontmatter } from '../../lib/frontmatter';

import './Admin.css';

const TABS = [
  { id: 'estudios', label: 'Estudios' },
  { id: 'videos', label: 'Videos' },
  { id: 'slides', label: 'Banner' },
  { id: 'versiculos', label: 'Versículos' },
  { id: 'anuncios', label: 'Anuncios' }
];

const slugify = s =>
  String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

async function api(path, options) {
  const res = await fetch(`/api/content${path}`, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

const emptyForm = category => ({
  title: '',
  category,
  subcategory: '',
  passage: '',
  description: '',
  tags: '',
  aliases: '',
  updated: new Date().toISOString().slice(0, 10)
});

function Field({ label, children }) {
  return (
    <label className="admin__field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function EstudioEditor() {
  const [index, setIndex] = useState(null);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [origSlug, setOrigSlug] = useState(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState(null);
  const [body, setBody] = useState('');
  const [preview, setPreview] = useState(false);
  const [msg, setMsg] = useState(null);

  const loadIndex = useCallback(async () => {
    const data = await api('/estudios');
    setIndex(data);
    return data;
  }, []);

  useEffect(() => {
    loadIndex().catch(e => setMsg({ type: 'error', text: String(e.message) }));
  }, [loadIndex]);

  const open = useCallback(async slug => {
    setMsg(null);
    setPreview(false);
    try {
      const { raw } = await api(`/estudio?slug=${encodeURIComponent(slug)}`);
      const { data, body: md } = parseFrontmatter(raw);
      setForm({
        title: data.title || '',
        category: data.category || '',
        subcategory: data.subcategory || '',
        passage: data.passage || '',
        description: data.description || '',
        tags: (data.tags || []).join(', '),
        aliases: (data.aliases || []).join(', '),
        updated: data.updated || ''
      });
      setBody(md);
      setSelected(slug);
      setOrigSlug(slug);
      setIsNew(false);
    } catch (e) {
      setMsg({ type: 'error', text: String(e.message) });
    }
  }, []);

  const createNew = () => {
    const firstCat = index?.categories?.[0]?.id || '';
    setForm(emptyForm(firstCat));
    setBody('');
    setSelected(null);
    setOrigSlug(null);
    setIsNew(true);
    setPreview(false);
    setMsg(null);
  };

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const save = async () => {
    if (!form || !form.title.trim()) {
      setMsg({ type: 'error', text: 'El título es obligatorio.' });
      return;
    }
    const slug = slugify(selected || form.title);
    if (!slug) {
      setMsg({ type: 'error', text: 'No se puede generar un slug con ese título.' });
      return;
    }
    const raw = serializeFrontmatter(
      {
        title: form.title.trim(),
        category: form.category,
        subcategory: form.subcategory.trim(),
        description: form.description.trim(),
        passage: form.passage.trim(),
        tags: form.tags.split(',').map(s => s.trim()).filter(Boolean),
        aliases: form.aliases.split(',').map(s => s.trim()).filter(Boolean),
        updated: form.updated
      },
      body
    );
    try {
      const data = await api('/estudio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, raw, renameFrom: origSlug })
      });
      setIndex(data.index);
      setSelected(slug);
      setOrigSlug(slug);
      setIsNew(false);
      setMsg({ type: 'ok', text: `Guardado: content/estudios/${slug}.md` });
    } catch (e) {
      setMsg({ type: 'error', text: String(e.message) });
    }
  };

  const remove = async () => {
    if (!origSlug) return;
    if (!window.confirm(`¿Eliminar content/estudios/${origSlug}.md?`)) return;
    try {
      const data = await api(`/estudio?slug=${encodeURIComponent(origSlug)}`, { method: 'DELETE' });
      setIndex(data.index);
      setSelected(null);
      setOrigSlug(null);
      setForm(null);
      setMsg({ type: 'ok', text: 'Estudio eliminado.' });
    } catch (e) {
      setMsg({ type: 'error', text: String(e.message) });
    }
  };

  const studies = (index?.studies || []).filter(s => {
    const q = filter.trim().toLowerCase();
    if (!q) return true;
    return `${s.title} ${s.slug} ${s.passage} ${s.tags.join(' ')}`.toLowerCase().includes(q);
  });

  return (
    <div className="admin__split">
      <aside className="admin__list">
        <div className="admin__list-head">
          <input
            type="search"
            placeholder="Filtrar estudios…"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            aria-label="Filtrar estudios"
          />
          <button type="button" className="admin__btn admin__btn--accent" onClick={createNew}>
            + Nuevo
          </button>
        </div>
        <ul>
          {studies.map(s => (
            <li key={s.slug}>
              <button
                type="button"
                className={selected === s.slug ? 'is-active' : ''}
                onClick={() => open(s.slug)}
              >
                <strong>{s.title}</strong>
                <span>{s.slug}</span>
              </button>
            </li>
          ))}
          {index && studies.length === 0 && <li className="admin__empty">Sin resultados</li>}
        </ul>
      </aside>

      <section className="admin__editor">
        {msg && (
          <p className="admin__status">
            <span className={msg.type === 'error' ? 'is-error' : 'is-ok'}>{msg.text}</span>
          </p>
        )}

        {!form && (
          <div className="admin__placeholder">
            <p className="muted">Elige un estudio de la lista o pulsa «+ Nuevo» para empezar.</p>
          </div>
        )}

        {form && (
          <>
            <div className="admin__row">
              <Field label="Título">
                <input value={form.title} onChange={e => set('title', e.target.value)} />
              </Field>
              <Field label="Slug">
                <input
                  value={selected || slugify(form.title)}
                  onChange={e => setSelected(e.target.value)}
                  disabled={!form.title && !selected}
                />
              </Field>
            </div>

            <div className="admin__row">
              <Field label="Categoría">
                <select value={form.category} onChange={e => set('category', e.target.value)}>
                  {(index?.categories || []).map(c => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Subcategoría">
                <input value={form.subcategory} onChange={e => set('subcategory', e.target.value)} />
              </Field>
              <Field label="Pasaje clave">
                <input value={form.passage} onChange={e => set('passage', e.target.value)} />
              </Field>
              <Field label="Actualizado">
                <input value={form.updated} onChange={e => set('updated', e.target.value)} placeholder="AAAA-MM-DD" />
              </Field>
            </div>

            <Field label="Descripción (aparece en las tarjetas)">
              <textarea rows={3} value={form.description} onChange={e => set('description', e.target.value)} />
            </Field>

            <div className="admin__row">
              <Field label="Etiquetas (separadas por coma)">
                <input value={form.tags} onChange={e => set('tags', e.target.value)} />
              </Field>
              <Field label="Alias (separados por coma)">
                <input value={form.aliases} onChange={e => set('aliases', e.target.value)} />
              </Field>
            </div>

            <div className="admin__body-head">
              <span>Contenido (Markdown)</span>
              <div className="admin__body-actions">
                <button type="button" className="admin__btn" onClick={() => setPreview(p => !p)}>
                  {preview ? 'Editar' : 'Vista previa'}
                </button>
                <button type="button" className="admin__btn admin__btn--accent" onClick={save}>
                  Guardar
                </button>
                {!isNew && (
                  <button type="button" className="admin__btn admin__btn--danger" onClick={remove}>
                    Eliminar
                  </button>
                )}
              </div>
            </div>

            {preview ? (
              <div className="admin__preview study-prose" dangerouslySetInnerHTML={{ __html: marked.parse(body) }} />
            ) : (
              <textarea
                className="admin__body"
                rows={18}
                spellCheck={false}
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder={'## 1. Título de sección\n\nEscribe aquí el contenido del estudio…'}
              />
            )}
          </>
        )}
      </section>
    </div>
  );
}

function JsonEditor({ name, title, hint }) {
  const [raw, setRaw] = useState(null);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    setMsg(null);
    api(`/${name}`)
      .then(d => setRaw(d.raw))
      .catch(e => setMsg({ type: 'error', text: String(e.message) }));
  }, [name]);

  const save = async () => {
    try {
      JSON.parse(raw);
    } catch (e) {
      setMsg({ type: 'error', text: `JSON inválido: ${e.message}` });
      return;
    }
    try {
      await api(`/${name}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: raw });
      setMsg({ type: 'ok', text: `Guardado: content/${name}.json` });
    } catch (e) {
      setMsg({ type: 'error', text: String(e.message) });
    }
  };

  const pretty = () => {
    try {
      setRaw(`${JSON.stringify(JSON.parse(raw), null, 2)}\n`);
      setMsg(null);
    } catch (e) {
      setMsg({ type: 'error', text: `JSON inválido: ${e.message}` });
    }
  };

  return (
    <section className="admin__editor admin__editor--full">
      <div className="admin__body-head">
        <span>
          {title} <span className="muted">— content/{name}.json</span>
        </span>
        <div className="admin__body-actions">
          <button type="button" className="admin__btn" onClick={pretty}>
            Formatear
          </button>
          <button type="button" className="admin__btn admin__btn--accent" onClick={save} disabled={raw === null}>
            Guardar
          </button>
        </div>
      </div>
      {hint && <p className="muted admin__hint">{hint}</p>}
      <textarea
        className="admin__body"
        rows={22}
        spellCheck={false}
        value={raw ?? ''}
        onChange={e => setRaw(e.target.value)}
        aria-label={title}
      />
    </section>
  );
}

export default function Admin() {
  const [tab, setTab] = useState('estudios');
  const [msg, setMsg] = useState(null);

  return (
    <main id="main" className="admin container">
      <header className="admin__head">
        <p className="eyebrow">Panel local · solo desarrollo</p>
        <h1>Edición de contenidos</h1>
        <p className="muted">
          Este panel existe únicamente con <code>npm run dev</code>. La web publicada no incluye la ruta
          /admin ni ningún punto de escritura. Los cambios guardan en <code>content/</code>.
        </p>
        <nav className="admin__tabs" aria-label="Secciones del panel">
          {TABS.map(t => (
            <button
              key={t.id}
              type="button"
              className={tab === t.id ? 'is-active' : ''}
              onClick={() => {
                setTab(t.id);
                setMsg(null);
              }}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <p className="admin__status">
          {msg && <span className={msg.type === 'error' ? 'is-error' : 'is-ok'}>{msg.text}</span>}
        </p>
      </header>

      {tab === 'estudios' && <EstudioEditor />}
      {tab === 'videos' && (
        <JsonEditor
          name="videos"
          title="Parrilla de videos"
          hint='Array JSON de objetos: { "id": "YouTubeId", "title": "...", "date": "AAAA-MM-DD", "description": "..." }'
        />
      )}
      {tab === 'slides' && (
        <JsonEditor
          name="slides"
          title="Banner de portada"
          hint='Array JSON de { "image": "/archivo.jpg", "caption": "...", "href": "/estudio" }. Las imágenes se colocan en public/.'
        />
      )}
      {tab === 'versiculos' && (
        <JsonEditor
          name="versiculos"
          title="Versículos del marquee"
          hint='Array JSON de strings con el versículo completo a mostrar (uno por entrada).'
        />
      )}
      {tab === 'anuncios' && (
        <JsonEditor
          name="anuncios"
          title="Anuncios del marquee"
          hint='Objeto JSON: { "enabled": true, "dismissable": true, "items": ["Texto de anuncio", …] }'
        />
      )}

      <p className="admin__foot">
        <Link to="/">← Volver a la web</Link>
      </p>
    </main>
  );
}
