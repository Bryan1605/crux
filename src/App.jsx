import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';

import ClickSpark from './components/ClickSpark/ClickSpark';
import CardNav from './components/CardNav/CardNav';
import MarqueeBar from './components/MarqueeBar/MarqueeBar';
import { LOGO, NAV_ITEMS } from './data/nav';

import Home from './pages/Home';
import Estudio from './pages/Estudio';
import EstudioDetalle from './pages/EstudioDetalle';
import Personaje from './pages/Personaje';
import Biblia from './pages/Biblia';
import Videos from './pages/Videos';
import NotFound from './pages/NotFound';

// El panel de edición solo existe en desarrollo: en el build la rama se elimina.
const Admin = import.meta.env.DEV ? lazy(() => import('./pages/Admin/Admin')) : null;

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer__grid">
          <div className="site-footer__brand">
            <img src={LOGO} alt="Crux" />
            <span className="muted">Estudios, videos y notas para aprender con fundamento.</span>
          </div>
          <nav className="site-footer__links" aria-label="Enlaces del pie de página">
            <Link to="/">Inicio</Link>
            <Link to="/estudio">Estudio</Link>
            <Link to="/biblia">Biblia Patrística</Link>
            <Link to="/videos">Videos</Link>
          </nav>
        </div>
        <div className="site-footer__note">
          <span>© {new Date().getFullYear()} Crux</span>
          <span>Contenido del segundo cerebro bíblico</span>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <ClickSpark sparkColor="#f4f4f5" sparkSize={9} sparkRadius={16} sparkCount={8} duration={380}>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <a className="skip-link" href="#main">
          Saltar al contenido
        </a>
        <CardNav
          logo={LOGO}
          logoAlt="Crux"
          items={NAV_ITEMS}
          baseColor="#101014"
          menuColor="#f4f4f5"
          buttonBgColor="#f4f4f5"
          buttonTextColor="#0a0a0b"
          ctaLabel="Empezar"
          ctaHref="/estudio"
        />
        <ScrollToTop />
        <MarqueeBar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/estudio" element={<Estudio />} />
          <Route path="/estudio/personajes/:slug" element={<Personaje />} />
          <Route path="/estudio/:slug" element={<EstudioDetalle />} />
          <Route path="/biblia" element={<Biblia />} />
          <Route path="/videos" element={<Videos />} />
          {import.meta.env.DEV && (
            <Route
              path="/admin"
              element={
                <Suspense fallback={null}>
                  <Admin />
                </Suspense>
              }
            />
          )}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <SiteFooter />
      </BrowserRouter>
    </ClickSpark>
  );
}
