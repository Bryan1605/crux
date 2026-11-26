import { useEffect, useState } from 'react';

import { api, Status } from './shared';

export default function DashboardPanel({ onNavigate }) {
  const [data, setData] = useState(null);
  const [msg, setMsg] = useState(null);

  const load = async () => {
    setMsg(null);
    try {
      const res = await api('/dashboard');
      setData(res);
    } catch (e) {
      setMsg({ type: 'error', text: String(e.message) });
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (!data) return <Status msg={msg || { type: 'ok', text: 'Cargando resumen del proyecto…' }} />;

  const cards = [
    {
      title: 'Estudios Markdown',
      value: data.estudios,
      sub: 'Fichas en content/estudios/',
      tab: 'estudios'
    },
    {
      title: 'Personajes',
      value: data.personajes,
      sub: 'Biografías en content/personajes/',
      tab: 'personajes'
    },
    {
      title: 'Fichas de libros',
      value: `${data.libros.revisado}/${data.libros.total}`,
      sub: `${data.libros.borrador} en borrador · ${data.libros.revisado} revisadas`,
      tab: 'libros'
    },
    {
      title: 'Traducciones solo-Codex',
      value: `${data.trad.total} libros`,
      sub: `${data.trad.verses.toLocaleString('es')} versículos (${data.trad.borrador} borrador · ${data.trad.revisado} revisados)`,
      tab: 'trad'
    },
    {
      title: 'Portadas Patrística',
      value: data.obrasPatristica,
      sub: 'Obras ilustradas en /biblia',
      tab: 'obras'
    },
    {
      title: 'Biblioteca de medios',
      value: data.media,
      sub: 'Imágenes publicadas en /img/',
      tab: 'media'
    }
  ];

  return (
    <section className="admin__editor admin__editor--full">
      <div className="admin__body-head">
        <span>Resumen del sitio y estado editorial</span>
        <div className="admin__body-actions">
          <button type="button" className="admin__btn" onClick={load}>Actualizar</button>
          <button type="button" className="admin__btn admin__btn--accent" onClick={() => onNavigate('estudios')}>
            + Editar estudios
          </button>
        </div>
      </div>

      <Status msg={msg} />

      <div className="admin__dash-grid">
        {cards.map(c => (
          <button type="button" className="admin__dash-card" key={c.tab} onClick={() => onNavigate(c.tab)}>
            <span className="admin__dash-label">{c.title}</span>
            <strong className="admin__dash-val">{c.value}</strong>
            <span className="admin__dash-sub">{c.sub}</span>
          </button>
        ))}
      </div>

      <div className="admin__card">
        <div className="admin__card-head">
          <strong>Accesos rápidos</strong>
        </div>
        <div className="admin__body-actions admin__actions-wrap">
          <button type="button" className="admin__btn" onClick={() => onNavigate('site')}>Ajustes y apariencia</button>
          <button type="button" className="admin__btn" onClick={() => onNavigate('libros')}>Revisar fichas de libros</button>
          <button type="button" className="admin__btn" onClick={() => onNavigate('trad')}>Revisar traducciones Codex</button>
          <button type="button" className="admin__btn" onClick={() => onNavigate('obras')}>Portadas Patrística</button>
          <button type="button" className="admin__btn" onClick={() => onNavigate('media')}>Subir WebP a /img</button>
        </div>
      </div>
    </section>
  );
}
