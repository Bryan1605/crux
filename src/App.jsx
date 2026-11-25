import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';

import ClickSpark from './components/ClickSpark/ClickSpark';
import CardNav from './components/CardNav/CardNav';
import MobileNav from './components/MobileNav/MobileNav';
import MarqueeBar from './components/MarqueeBar/MarqueeBar';
import { useSite } from './lib/site';

// El panel de edición solo existe en desarrollo: en el build la rama se elimina.
const Admin = import.meta.env.DEV ? lazy(() => import('./pages/Admin/Admin')) : null;
// Las páginas de apologética llevan su propio JSON (~30–50 KB): se cargan solo al entrar.
const Shincheonji = lazy(() => import('./pages/Shincheonji'));
const Adventismo = lazy(() => import('./pages/Adventismo'));
const Dispensacionalismo = lazy(() => import('./pages/Dispensacionalismo'));
const GuiaLectura = lazy(() => import('./pages/GuiaLectura'));
const BibliaHebreo = lazy(() => import('./pages/BibliaHebreo'));

import Home from './pages/Home';
import Estudio from './pages/Estudio';
import EstudioDetalle from './pages/EstudioDetalle';
import Personaje from './pages/Personaje';
import Biblia from './pages/Biblia';
import BibliaNtv from './pages/BibliaNtv';
import Libros from './pages/Libros';
import LibroFicha from './pages/LibroFicha';
import Exegesis from './pages/Exegesis';
import Videos from './pages/Videos';
import Concilios from './pages/Concilios';
import Buscar from './pages/Buscar';
import Temas from './pages/Temas';
import NotFound from './pages/NotFound';

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    // Con ancla (#nicea, #preguntas-con-la-biblia) lleva el foco al destino.
    if (hash) {
      const id = hash.slice(1);
      const target = document.getElementById(id);
      if (target) {
        target.scrollIntoView({ block: 'start' });
        return undefined;
      }
      const raf = requestAnimationFrame(() => {
        const delayed = document.getElementById(id);
        if (delayed) delayed.scrollIntoView({ block: 'start' });
        else window.scrollTo(0, 0);
      });
      return () => cancelAnimationFrame(raf);
    }
    window.scrollTo(0, 0);
    return undefined;
  }, [pathname, hash]);
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
        <MobileNav logo={marca.logo} logoAlt={marca.nombre} items={nav} />
        <ScrollToTop />
        <MarqueeBar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/estudio" element={<Estudio />} />
          <Route path="/estudio/personajes/:slug" element={<Personaje />} />
          <Route path="/estudio/:slug" element={<EstudioDetalle />} />
          <Route path="/biblia" element={<Biblia />} />
          <Route path="/biblia/ntv" element={<BibliaNtv />} />
          <Route
            path="/biblia/hebreo"
            element={
              <Suspense fallback={<main id="main" className="page-loading" aria-busy="true" />}>
                <BibliaHebreo />
              </Suspense>
            }
          />
          <Route path="/biblia/libros" element={<Libros />} />
          <Route path="/biblia/libros/:id" element={<LibroFicha />} />
          <Route path="/exegesis" element={<Exegesis />} />
          <Route
            path="/exegesis/guia"
            element={
              <Suspense fallback={<main id="main" className="page-loading" aria-busy="true" />}>
                <GuiaLectura />
              </Suspense>
            }
          />
          <Route path="/videos" element={<Videos />} />
          <Route path="/concilios" element={<Concilios />} />
          <Route path="/buscar" element={<Buscar />} />
          <Route path="/temas" element={<Temas />} />
          <Route
            path="/apologetica/shincheonji"
            element={
              <Suspense fallback={<main id="main" className="page-loading" aria-busy="true" />}>
                <Shincheonji />
              </Suspense>
            }
          />
          <Route
            path="/apologetica/adventismo"
            element={
              <Suspense fallback={<main id="main" className="page-loading" aria-busy="true" />}>
                <Adventismo />
              </Suspense>
            }
          />
          <Route
            path="/apologetica/dispensacionalismo"
            element={
              <Suspense fallback={<main id="main" className="page-loading" aria-busy="true" />}>
                <Dispensacionalismo />
              </Suspense>
            }
          />
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