import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';

import ClickSpark from './components/ClickSpark/ClickSpark';
import CardNav from './components/CardNav/CardNav';
import MarqueeBar from './components/MarqueeBar/MarqueeBar';
import { useSite } from './lib/site';

// El panel de edición solo existe en desarrollo: en el build la rama se elimina.
const Admin = import.meta.env.DEV ? lazy(() => import('./pages/Admin/Admin')) : null;

import Home from './pages/Home';
import Estudio from './pages/Estudio';
import EstudioDetalle from './pages/EstudioDetalle';
import Personaje from './pages/Personaje';
import Biblia from './pages/Biblia';
import Videos from './pages/Videos';
import Concilios from './pages/Concilios';
import NotFound from './pages/NotFound';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function SiteFooter({ site }) {
  const { footer, marca } = site;
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer__grid">
          <div className="site-footer__brand">
            <img src={marca.logo} alt={marca.nombre} />
            <span className="muted">{footer.tagline}</span>
          </div>
          <nav className="site-footer__links" aria-label="Enlaces del pie de página">
            {footer.links.map((link, i) => (
              <Link key={i} to={link.href}>{link.label}</Link>
            ))}
          </nav>
        </div>
        <div className="site-footer__note">
          <span>{footer.copyright.replace('{year}', new Date().getFullYear())}</span>
          <span>{footer.note}</span>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  const site = useSite();
  const { marca, nav, home } = site;

  return (
    <ClickSpark
      sparkColor="#f4f4f5"
      sparkSize={9}
      sparkRadius={16}
      sparkCount={8}
      duration={380}
    >
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <a className="skip-link" href="#main">
          Saltar al contenido
        </a>
        <CardNav
          logo={marca.logo}
          logoAlt={marca.nombre}
          items={nav}
          baseColor="#101014"
          menuColor="#f4f4f5"
          buttonBgColor="#f4f4f5"
          buttonTextColor="#0a0a0b"
          ctaLabel={home.hero.ctaPrimary.label}
          ctaHref={home.hero.ctaPrimary.href}
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
          <Route path="/concilios" element={<Concilios />} />
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
        <SiteFooter site={site} />
      </BrowserRouter>
    </ClickSpark>
  );
}