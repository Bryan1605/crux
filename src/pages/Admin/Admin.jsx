import { useState } from 'react';
import { Link } from 'react-router-dom';

import EstudioEditor from './EstudioEditor';
import PersonajesEditor from './PersonajesEditor';
import CategoriasEditor from './CategoriasEditor';
import SiteEditor from './SiteEditor';
import MediaLibrary from './MediaLibrary';
import PublishBar from './PublishBar';
import { VideosEditor, SlidesEditor, VersiculosEditor, AnunciosEditor } from './ContentEditors';

import './Admin.css';

const TABS = [
  { id: 'estudios', label: 'Estudios' },
  { id: 'personajes', label: 'Personajes' },
  { id: 'videos', label: 'Videos' },
  { id: 'slides', label: 'Banner' },
  { id: 'versiculos', label: 'Versículos' },
  { id: 'anuncios', label: 'Anuncios' },
  { id: 'categorias', label: 'Categorías' },
  { id: 'site', label: 'Ajustes del sitio' },
  { id: 'media', label: 'Medios' }
];

export default function Admin() {
  const [tab, setTab] = useState('estudios');

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
        <nav className="admin__tabs" aria-label="Secciones del panel">
          {TABS.map(t => (
            <button
              key={t.id}
              type="button"
              className={tab === t.id ? 'is-active' : ''}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      {tab === 'estudios' && <EstudioEditor />}
      {tab === 'personajes' && <PersonajesEditor />}
      {tab === 'videos' && <VideosEditor />}
      {tab === 'slides' && <SlidesEditor />}
      {tab === 'versiculos' && <VersiculosEditor />}
      {tab === 'anuncios' && <AnunciosEditor />}
      {tab === 'categorias' && <CategoriasEditor />}
      {tab === 'site' && <SiteEditor />}
      {tab === 'media' && <MediaLibrary />}

      <p className="admin__foot">
        <Link to="/">← Volver a la web</Link>
      </p>
    </main>
  );
}