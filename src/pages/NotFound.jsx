import { Link } from 'react-router-dom';
import { useSite, useSeo } from '../lib/site';

export default function NotFound() {
  const site = useSite();
  useSeo({ title: `404 — ${site.marca.nombre}`, description: site.seo.description });

  return (
    <main id="main" className="study-detail">
      <div className="container">
        <div className="empty-state">
          <p className="eyebrow">404</p>
          <h1 style={{ margin: '1rem 0' }}>Página no encontrada</h1>
          <p className="muted">Esa dirección no existe en {site.marca.nombre}.</p>
          <p style={{ marginTop: '1.5rem' }}>
            <Link className="btn btn--primary" to="/">
              Volver al inicio
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}