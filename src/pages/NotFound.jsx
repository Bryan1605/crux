import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <main id="main" className="study-detail">
      <div className="container">
        <div className="empty-state">
          <p className="eyebrow">404</p>
          <h1 style={{ margin: '1rem 0' }}>Página no encontrada</h1>
          <p className="muted">Esa dirección no existe en Crux.</p>
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
