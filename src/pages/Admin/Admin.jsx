import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';

import DashboardPanel from './DashboardPanel';
import EstudioEditor from './EstudioEditor';
import PersonajesEditor from './PersonajesEditor';
import LibrosEditor from './LibrosEditor';
import TradEditor from './TradEditor';
import ObrasPatristicaEditor from './ObrasPatristicaEditor';
import TimelineEditor from './TimelineEditor';
import ConciliosEditor from './ConciliosEditor';
import CategoriasEditor from './CategoriasEditor';
import SiteEditor from './SiteEditor';
import MediaLibrary from './MediaLibrary';
import PublishBar from './PublishBar';
import { VideosEditor, SlidesEditor, VersiculosEditor, AnunciosEditor } from './ContentEditors';

import './Admin.css';

const NAV_GROUPS = [
  {
    title: 'General',
    items: [{ id: 'resumen', label: 'Resumen' }]
  },
  {
    title: 'Publicaciones',
    items: [
      { id: 'estudios', label: 'Estudios' },
      { id: 'personajes', label: 'Personajes' },
      { id: 'videos', label: 'Videos' },
      { id: 'slides', label: 'Banner' },
      { id: 'versiculos', label: 'Versículos' },
      { id: 'anuncios', label: 'Anuncios' }
    ]
  },
  {
    title: 'Proyecto Bíblico',
    items: [
      { id: 'libros', label: 'Libros (73)' },
      { id: 'trad', label: 'Traducciones (8)' },
      { id: 'obras', label: 'Portadas Patrística' },
      { id: 'timeline', label: 'Línea de tiempo' },
      { id: 'concilios', label: 'Concilios' },
      { id: 'categorias', label: 'Categorías' }
    ]
  },
  {
    title: 'Apariencia y Medios',
    items: [
      { id: 'site', label: 'Ajustes del sitio' },
      { id: 'media', label: 'Medios (/img)' }
    ]
  }
];

export default function Admin() {
  // 'estudios' sigue siendo la vista inicial para edición directa y qa:admin.
  const [tab, setTab] = useState('estudios');
  const [dirty, setDirty] = useState(false);

  const selectTab = useCallback(
    next => {
      if (next === tab) return;
      if (dirty && !window.confirm('Hay cambios sin guardar en esta sección. ¿Cambiar de sección igualmente?')) {
        return;
      }
      setDirty(false);
      setTab(next);
    },
    [tab, dirty]
  );

  return (
    <main id="main" className="admin container">
      <header className="admin__head">
        <p className="eyebrow">Panel local · solo desarrollo</p>
        <h1>Edición de contenidos</h1>
        <p className="muted">
          Este panel existe únicamente con <code>npm run dev</code>. La web publicada no incluye la ruta
          /admin ni ningún punto de escritura. Los cambios guardan en <code>content/</code>.
        </p>
        <PublishBar />
      </header>

      <div className="admin__shell">
        <nav className="admin__sidebar" aria-label="Secciones del panel">
          {NAV_GROUPS.map(group => (
            <div className="admin__nav-group" key={group.title}>
              <p className="admin__nav-title">{group.title}</p>
              <div className="admin__tabs">
                {group.items.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    data-admin-tab={t.id}
                    className={tab === t.id ? 'is-active' : ''}
                    onClick={() => selectTab(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="admin__stage">
          {tab === 'resumen' && <DashboardPanel onNavigate={selectTab} />}
          {tab === 'estudios' && <EstudioEditor onDirtyChange={setDirty} />}
          {tab === 'personajes' && <PersonajesEditor />}
          {tab === 'libros' && <LibrosEditor onDirtyChange={setDirty} />}
          {tab === 'trad' && <TradEditor onDirtyChange={setDirty} />}
          {tab === 'obras' && <ObrasPatristicaEditor onDirtyChange={setDirty} />}
          {tab === 'videos' && <VideosEditor />}
          {tab === 'slides' && <SlidesEditor />}
          {tab === 'versiculos' && <VersiculosEditor />}
          {tab === 'anuncios' && <AnunciosEditor />}
          {tab === 'timeline' && <TimelineEditor />}
          {tab === 'concilios' && <ConciliosEditor />}
          {tab === 'categorias' && <CategoriasEditor />}
          {tab === 'site' && <SiteEditor onDirtyChange={setDirty} />}
          {tab === 'media' && <MediaLibrary />}
        </div>
      </div>

      <p className="admin__foot">
        <Link to="/">← Volver a la web</Link>
      </p>
    </main>
  );
}
