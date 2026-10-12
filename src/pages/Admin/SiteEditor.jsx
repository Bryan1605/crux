import { useEffect, useState } from 'react';

import { api, Field, Status } from './shared';

function Section({ title, children }) {
  return (
    <fieldset className="admin__section">
      <legend>{title}</legend>
      {children}
    </fieldset>
  );
}

function NavEditor({ site, set }) {
  const nav = site.nav;
  const setCard = (i, key, value) => set(d => {
    d.nav = [...d.nav];
    d.nav[i] = { ...d.nav[i], [key]: value };
    return d;
  });
  const setLink = (ci, li, key, value) => set(d => {
    d.nav = d.nav.map((c, i) =>
      i === ci ? { ...c, links: c.links.map((l, j) => (j === li ? { ...l, [key]: value } : l)) } : c
    );
    return d;
  });
  const addCard = () => set(d => ({ ...d, nav: [...d.nav, { label: 'Nuevo', bgColor: '#16161b', textColor: '#f4f4f5', links: [] }] }));
  const removeCard = i => set(d => ({ ...d, nav: d.nav.filter((_, j) => j !== i) }));
  const addLink = i => set(d => {
    d.nav = d.nav.map((c, j) => (j === i ? { ...c, links: [...c.links, { label: '', href: '', ariaLabel: '' }] } : c));
    return d;
  });
  const removeLink = (i, li) => set(d => {
    d.nav = d.nav.map((c, j) => (j === i ? { ...c, links: c.links.filter((_, k) => k !== li) } : c));
    return d;
  });

  return (
    <Section title="Menú de navegación">
      <p className="muted admin__hint">
        Cada tarjeta del menú con sus enlaces. Los colores son los del fondo y del texto de la tarjeta.
      </p>
      {nav.map((card, i) => (
        <div className="admin__card" key={i}>
          <div className="admin__card-head">
            <strong>{card.label || `Tarjeta ${i + 1}`}</strong>
            <button type="button" className="admin__btn admin__btn--danger" onClick={() => removeCard(i)}>Quitar tarjeta</button>
          </div>
          <div className="admin__row">
            <Field label="Título">
              <input value={card.label} onChange={e => setCard(i, 'label', e.target.value)} />
            </Field>
            <Field label="Color de fondo">
              <input type="color" value={card.bgColor} onChange={e => setCard(i, 'bgColor', e.target.value)} />
            </Field>
            <Field label="Color de texto">
              <input type="color" value={card.textColor} onChange={e => setCard(i, 'textColor', e.target.value)} />
            </Field>
          </div>
          {card.links.map((link, li) => (
            <div className="admin__row admin__row--tight" key={li}>
              <input
                value={link.label}
                placeholder="Etiqueta"
                onChange={e => setLink(i, li, 'label', e.target.value)}
              />
              <input
                value={link.href}
                placeholder="/ruta o /estudio?cat=xx"
                onChange={e => setLink(i, li, 'href', e.target.value)}
              />
              <input
                value={link.ariaLabel || ''}
                placeholder="ariaLabel (accesibilidad)"
                onChange={e => setLink(i, li, 'ariaLabel', e.target.value)}
              />
              <button type="button" className="admin__btn admin__btn--danger" onClick={() => removeLink(i, li)}>✕</button>
            </div>
          ))}
          <button type="button" className="admin__btn" onClick={() => addLink(i)}>+ Enlace</button>
        </div>
      ))}
      <button type="button" className="admin__btn" onClick={addCard}>+ Tarjeta</button>
    </Section>
  );
}

export default function SiteEditor() {
  const [site, setSite] = useState(null);
  const [msg, setMsg] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const load = async () => {
    setMsg(null);
    try {
      const { raw } = await api('/site');
      setSite(JSON.parse(raw));
      setDirty(false);
    } catch (e) {
      setMsg({ type: 'error', text: String(e.message) });
    }
  };

  useEffect(() => {
    load();
  }, []);

  const set = fn => {
    setSite(d => fn({ ...d }));
    setDirty(true);
  };

  const save = async () => {
    if (!site) return;
    setSaving(true);
    setMsg(null);
    try {
      await api('/site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(site)
      });
      // refrescar los componentes del sitio en vivo
      const mod = await import('../../lib/site');
      await mod.reloadSite();
      setMsg({ type: 'ok', text: 'Guardado: content/site.json' });
      setDirty(false);
    } catch (e) {
      setMsg({ type: 'error', text: String(e.message) });
    } finally {
      setSaving(false);
    }
  };

  if (!site) return <Status msg={msg} />;

  const setMarca = (key, value) => set(d => ({ ...d, marca: { ...d.marca, [key]: value } }));

  // setHome('hero.title', v) / setHome('bridges.cards.0.meta1', v) / setHome('manifesto.0', v)
  const setHome = (path, value) => set(d => {
    const home = JSON.parse(JSON.stringify(d.home));
    const keys = path.split('.');
    const last = keys.pop();
    let cur = home;
    for (const k of keys) cur = cur[k];
    cur[last] = value;
    return { ...d, home };
  });

  return (
    <section className="admin__editor admin__editor--full">
      <div className="admin__body-head">
        <span>
          Ajustes del sitio{' '}
          {dirty && <span className="admin__dirty">● sin guardar</span>}
        </span>
        <div className="admin__body-actions">
          <button type="button" className="admin__btn" onClick={load}>Descartar</button>
          <button type="button" className="admin__btn admin__btn--accent" onClick={save} disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
      <Status msg={msg} />

      <Section title="Marca">
        <div className="admin__row">
          <Field label="Nombre">
            <input value={site.marca.nombre} onChange={e => setMarca('nombre', e.target.value)} />
          </Field>
          <Field label="Ruta del logo" hint="/imgs/…">
            <input value={site.marca.logo} onChange={e => setMarca('logo', e.target.value)} />
          </Field>
        </div>
        <Field label="Tagline">
          <input value={site.marca.tagline} onChange={e => setMarca('tagline', e.target.value)} />
        </Field>
      </Section>

      <NavEditor site={site} set={set} />

      <Section title="Pie de página">
        <Field label="Tagline">
          <input value={site.footer.tagline} onChange={e => set(d => ({ ...d, footer: { ...d.footer, tagline: e.target.value } }))} />
        </Field>
        {site.footer.links.map((l, i) => (
          <div className="admin__row admin__row--tight" key={i}>
            <input
              value={l.label}
              placeholder="Etiqueta"
              onChange={e => set(d => {
                const links = d.footer.links.map((x, j) => (j === i ? { ...x, label: e.target.value } : x));
                return { ...d, footer: { ...d.footer, links } };
              })}
            />
            <input
              value={l.href}
              placeholder="/ruta"
              onChange={e => set(d => {
                const links = d.footer.links.map((x, j) => (j === i ? { ...x, href: e.target.value } : x));
                return { ...d, footer: { ...d.footer, links } };
              })}
            />
            <button
              type="button"
              className="admin__btn admin__btn--danger"
              onClick={() => set(d => ({ ...d, footer: { ...d.footer, links: d.footer.links.filter((_, j) => j !== i) } }))}
            >
              ✕
            </button>
          </div>
        ))}
        <div className="admin__row">
          <Field label="Copyright" hint='Usa {year} para el año actual'>
            <input value={site.footer.copyright} onChange={e => set(d => ({ ...d, footer: { ...d.footer, copyright: e.target.value } }))} />
          </Field>
          <Field label="Nota">
            <input value={site.footer.note} onChange={e => set(d => ({ ...d, footer: { ...d.footer, note: e.target.value } }))} />
          </Field>
        </div>
      </Section>

      <Section title="Portada (Home)">
        <p className="muted admin__hint">Hero</p>
        <div className="admin__row">
          <Field label="Eyebrow">
            <input value={site.home.hero.eyebrow} onChange={e => setHome('hero.eyebrow', e.target.value)} />
          </Field>
        </div>
        <Field label="Título H1">
          <input value={site.home.hero.title} onChange={e => setHome('hero.title', e.target.value)} />
        </Field>
        <Field label="Lead">
          <textarea rows={3} value={site.home.hero.lead} onChange={e => setHome('hero.lead', e.target.value)} />
        </Field>
        <div className="admin__row">
          <Field label="Botón primario (texto)">
            <input value={site.home.hero.ctaPrimary.label} onChange={e => setHome('hero.ctaPrimary.label', e.target.value)} />
          </Field>
          <Field label="Botón primario (ruta)">
            <input value={site.home.hero.ctaPrimary.href} onChange={e => setHome('hero.ctaPrimary.href', e.target.value)} />
          </Field>
        </div>
        <div className="admin__row">
          <Field label="Botón secundario (texto)">
            <input value={site.home.hero.ctaSecondary.label} onChange={e => setHome('hero.ctaSecondary.label', e.target.value)} />
          </Field>
          <Field label="Botón secundario (ruta)">
            <input value={site.home.hero.ctaSecondary.href} onChange={e => setHome('hero.ctaSecondary.href', e.target.value)} />
          </Field>
        </div>

        <p className="muted admin__hint">Manifiesto (líneas que aparecen al bajar)</p>
        {site.home.manifesto.map((line, i) => (
          <div className="admin__row admin__row--tight" key={i}>
            <textarea rows={2} value={line} onChange={e => setHome(`manifesto.${i}`, e.target.value)} />
            <button
              type="button"
              className="admin__btn admin__btn--danger"
              onClick={() => set(d => ({ ...d, home: { ...d.home, manifesto: d.home.manifesto.filter((_, j) => j !== i) } }))}
            >
              ✕
            </button>
          </div>
        ))}
        <button type="button" className="admin__btn" onClick={() => set(d => ({ ...d, home: { ...d.home, manifesto: [...d.home.manifesto, ''] } }))}>
          + Línea
        </button>

        <p className="muted admin__hint">Banner</p>
        <div className="admin__row">
          <Field label="Kicker">
            <input value={site.home.banner.kicker} onChange={e => setHome('banner.kicker', e.target.value)} />
          </Field>
          <Field label="Botón (texto)">
            <input value={site.home.banner.cta.label} onChange={e => setHome('banner.cta.label', e.target.value)} />
          </Field>
          <Field label="Botón (ruta)">
            <input value={site.home.banner.cta.href} onChange={e => setHome('banner.cta.href', e.target.value)} />
          </Field>
        </div>

        <p className="muted admin__hint">Puertas de entrada</p>
        <div className="admin__row">
          <Field label="Eyebrow">
            <input value={site.home.bridges.eyebrow} onChange={e => setHome('bridges.eyebrow', e.target.value)} />
          </Field>
          <Field label="Título">
            <input value={site.home.bridges.title} onChange={e => setHome('bridges.title', e.target.value)} />
          </Field>
        </div>
        {site.home.bridges.cards.map((card, i) => (
          <div className="admin__card" key={i}>
            <div className="admin__card-head"><strong>Tarjeta {i + 1}</strong></div>
            <div className="admin__row">
              <Field label="Meta 1" hint='Puedes usar {total} y {categories}'>
                <input value={card.meta1} onChange={e => setHome(`bridges.cards.${i}.meta1`, e.target.value)} />
              </Field>
              <Field label="Meta 2">
                <input value={card.meta2} onChange={e => setHome(`bridges.cards.${i}.meta2`, e.target.value)} />
              </Field>
            </div>
            <Field label="Título">
              <input value={card.title} onChange={e => setHome(`bridges.cards.${i}.title`, e.target.value)} />
            </Field>
            <Field label="Descripción">
              <textarea rows={2} value={card.desc} onChange={e => setHome(`bridges.cards.${i}.desc`, e.target.value)} />
            </Field>
            <Field label="Texto del botón">
              <input value={card.cta} onChange={e => setHome(`bridges.cards.${i}.cta`, e.target.value)} />
            </Field>
          </div>
        ))}
      </Section>

      <Section title="Marquee / anuncios">
        <div className="admin__row">
          <Field label="Barra activada">
            <input type="checkbox" checked={site.marquee.enabled} onChange={e => set(d => ({ ...d, marquee: { ...d.marquee, enabled: e.target.checked } }))} />
          </Field>
          <Field label="Se puede cerrar">
            <input type="checkbox" checked={site.marquee.dismissable} onChange={e => set(d => ({ ...d, marquee: { ...d.marquee, dismissable: e.target.checked } }))} />
          </Field>
          <Field label="Velocidad">
            <input type="number" value={site.marquee.speed} onChange={e => set(d => ({ ...d, marquee: { ...d.marquee, speed: Number(e.target.value) } }))} />
          </Field>
          <Field label="Separador">
            <input value={site.marquee.separator} onChange={e => set(d => ({ ...d, marquee: { ...d.marquee, separator: e.target.value } }))} />
          </Field>
        </div>
      </Section>

      <Section title="SEO">
        <Field label="Título global">
          <input value={site.seo.title} onChange={e => set(d => ({ ...d, seo: { ...d.seo, title: e.target.value } }))} />
        </Field>
        <Field label="Descripción global">
          <textarea rows={2} value={site.seo.description} onChange={e => set(d => ({ ...d, seo: { ...d.seo, description: e.target.value } }))} />
        </Field>
        <Field label="Imagen OG" hint="/imgs/…">
          <input value={site.seo.ogImage} onChange={e => set(d => ({ ...d, seo: { ...d.seo, ogImage: e.target.value } }))} />
        </Field>
      </Section>

      <Section title="Ajustes avanzados">
        <Field label="Categoría de personajes" hint='id usado por los enlaces "Personajes"'>
          <input value={site.personajesCategoryId} onChange={e => set(d => ({ ...d, personajesCategoryId: e.target.value }))} />
        </Field>
      </Section>
    </section>
  );
}