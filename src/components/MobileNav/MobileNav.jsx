import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { GoArrowUpRight } from 'react-icons/go';

import './MobileNav.css';

const READING_SCALE_KEY = 'crux.reading.scale';
const SCALE_MIN = 0.9;
const SCALE_MAX = 1.3;
const SCALE_STEP = 0.1;

function readScale() {
  try {
    const val = Number(window.localStorage.getItem(READING_SCALE_KEY));
    if (Number.isFinite(val) && val >= SCALE_MIN && val <= SCALE_MAX) {
      return Math.round(val * 10) / 10;
    }
  } catch {
    /* modo privado */
  }
  return 1;
}

/** Determina el contexto de lectura según la ruta actual. */
function routeContext(pathname) {
  if (pathname === '/biblia') return { label: 'Biblia Patrística', isReader: true, isLongReading: false };
  if (pathname === '/biblia/ntv') return { label: 'Biblia NTV', isReader: true, isLongReading: false };
  if (pathname === '/biblia/hebreo') return { label: 'Biblia Hebrea', isReader: true, isLongReading: false };
  if (pathname === '/exegesis') return { label: 'Exégesis', isReader: true, isLongReading: false };

  if (pathname.startsWith('/estudio/personajes/')) return { label: 'Personaje', isReader: false, isLongReading: true };
  if (pathname.startsWith('/estudio/')) return { label: 'Estudio', isReader: false, isLongReading: true };
  if (pathname.startsWith('/biblia/libros/')) return { label: 'Ficha', isReader: false, isLongReading: true };
  if (pathname === '/exegesis/guia') return { label: 'Guía', isReader: false, isLongReading: true };
  if (pathname.startsWith('/apologetica/')) return { label: 'Apologética', isReader: false, isLongReading: true };

  return { label: '', isReader: false, isLongReading: false };
}

/** Convierte texto de encabezado a un id estable cuando carece de él. */
function slugHeading(text, index) {
  const clean = String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return clean ? `sec-${clean.slice(0, 42)}-${index}` : `sec-h2-${index}`;
}

/** Cruz ortodoxa de Crux (idéntica a `public/favicon.svg`) para el acceso a Inicio. */
function CruxIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <g fill="currentColor">
        <rect x="29" y="8" width="6" height="48" />
        <rect x="16" y="15" width="32" height="5" />
        <rect x="20" y="27" width="24" height="5" />
        <rect x="23" y="43" width="18" height="5" transform="rotate(-20 32 45.5)" />
      </g>
    </svg>
  );
}

function StudyIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M2 5.5A2.5 2.5 0 0 1 4.5 3H10a3 3 0 0 1 2 1 3 3 0 0 1 2-1h5.5A2.5 2.5 0 0 1 22 5.5v13a2.5 2.5 0 0 1-2.5 2.5H14a2 2 0 0 0-2 1 2 2 0 0 0-2-1H4.5A2.5 2.5 0 0 1 2 18.5v-13Z" />
      <path d="M12 4v17" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true" focusable="false">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function MenuGridIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true" focusable="false">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function TocIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" focusable="false">
      <path d="M4 6h16M4 12h12M4 18h8" />
    </svg>
  );
}

/**
 * Navegación híbrida exclusiva de móvil (<= 768 px):
 *  - Barra superior minimalista (logo + controles contextuales Toc/Aa en lecturas largas).
 *  - Barra inferior fija con 4 accesos (Inicio, Estudio, Buscar, Menú) + auto-hide al bajar scroll + Safe Area.
 *  - Drawer tipo Hoja Inferior (Bottom Sheet) con todas las secciones de `content/site.json` + Guía de lectura.
 */
export default function MobileNav({ logo, logoAlt = 'Crux', items = [] }) {
  const { pathname } = useLocation();
  const ctx = useMemo(() => routeContext(pathname), [pathname]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hiddenBar, setHiddenBar] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);
  const [aaOpen, setAaOpen] = useState(false);
  const [headings, setHeadings] = useState([]);
  const [scale, setScale] = useState(readScale);

  const menuBtnRef = useRef(null);
  const closeDrawerBtnRef = useRef(null);
  const bottomRef = useRef(null);
  const topPanelRef = useRef(null);
  const scrollState = useRef({ lastY: 0, delta: 0 });

  // Escalado de lectura persistente (--reading-scale)
  useEffect(() => {
    document.documentElement.style.setProperty('--reading-scale', String(scale));
    try {
      window.localStorage.setItem(READING_SCALE_KEY, String(scale));
    } catch {
      /* modo privado */
    }
  }, [scale]);

  // Cerrar paneles y mostrar barra al cambiar de ruta
  useEffect(() => {
    setDrawerOpen(false);
    setTocOpen(false);
    setAaOpen(false);
    setHiddenBar(false);
    scrollState.current = { lastY: window.scrollY || 0, delta: 0 };
  }, [pathname]);

  // Escaneo de subtítulos h2 visibles en vistas de lectura larga (<= 768 px)
  useEffect(() => {
    if (!ctx.isLongReading || typeof window === 'undefined') {
      setHeadings([]);
      return undefined;
    }

    const mq = window.matchMedia('(max-width: 768px)');
    const scan = () => {
      if (!mq.matches) {
        setHeadings([]);
        return;
      }
      const main = document.querySelector('main#main');
      if (!main) {
        setHeadings([]);
        return;
      }
      const collect = selector => {
        const list = [];
        main.querySelectorAll(selector).forEach((el, idx) => {
          if (el.closest('[hidden], .sr-only, .bcta, .empty-state, .study-detail__meta-group')) return;
          if (el.getAttribute('aria-hidden') === 'true') return;
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 && rect.height === 0) return;
          const text = (el.textContent || '').trim();
          if (!text) return;
          if (!el.id) {
            el.id = slugHeading(text, idx + 1);
          }
          list.push({ id: el.id, text });
        });
        return list;
      };

      let found = collect('h2');
      if (found.length < 2) {
        found = collect('.study-prose h2, .study-prose h3');
      }
      setHeadings(prev => {
        if (
          prev.length === found.length &&
          prev.every((p, i) => p.id === found[i].id && p.text === found[i].text)
        ) {
          return prev;
        }
        return found;
      });
    };

    scan();
    const timer = window.setTimeout(scan, 180);
    const main = document.querySelector('main#main');
    const observer =
      main && typeof MutationObserver !== 'undefined'
        ? new MutationObserver(scan)
        : null;
    if (observer && main) {
      observer.observe(main, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden'] });
    }
    mq.addEventListener?.('change', scan);

    return () => {
      window.clearTimeout(timer);
      observer?.disconnect();
      mq.removeEventListener?.('change', scan);
    };
  }, [ctx.isLongReading, pathname]);

  // Auto-hide suave de la barra inferior al hacer scroll en móvil
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const mq = window.matchMedia('(max-width: 768px)');

    const onScroll = () => {
      if (!mq.matches || drawerOpen || tocOpen || aaOpen) {
        setHiddenBar(false);
        return;
      }
      if (bottomRef.current?.contains(document.activeElement)) {
        setHiddenBar(false);
        return;
      }
      const y = window.scrollY || window.pageYOffset || 0;
      const dy = y - scrollState.current.lastY;
      scrollState.current.lastY = y;

      const nearBottom = y + window.innerHeight >= document.documentElement.scrollHeight - 36;
      if (y <= 60 || nearBottom) {
        scrollState.current.delta = 0;
        setHiddenBar(false);
        return;
      }

      if ((dy > 0 && scrollState.current.delta < 0) || (dy < 0 && scrollState.current.delta > 0)) {
        scrollState.current.delta = 0;
      }
      scrollState.current.delta += dy;

      if (scrollState.current.delta > 14) {
        setHiddenBar(true);
      } else if (scrollState.current.delta < -8) {
        setHiddenBar(false);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [drawerOpen, tocOpen, aaOpen]);

  // Bloqueo de scroll, Escape y retorno de foco cuando el Drawer está abierto
  useEffect(() => {
    if (!drawerOpen) return undefined;
    setHiddenBar(false);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const raf = requestAnimationFrame(() => {
      closeDrawerBtnRef.current?.focus({ preventScroll: true });
    });

    const onKey = e => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setDrawerOpen(false);
        menuBtnRef.current?.focus({ preventScroll: true });
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [drawerOpen]);

  // Cerrar subpaneles Índice / Aa con Escape o toque fuera
  useEffect(() => {
    if (!tocOpen && !aaOpen) return undefined;
    const onKey = e => {
      if (e.key === 'Escape') {
        setTocOpen(false);
        setAaOpen(false);
      }
    };
    const onDown = e => {
      if (!topPanelRef.current?.contains(e.target)) {
        setTocOpen(false);
        setAaOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [tocOpen, aaOpen]);

  const closeDrawer = useCallback((returnFocus = false) => {
    setDrawerOpen(false);
    if (returnFocus) {
      requestAnimationFrame(() => menuBtnRef.current?.focus({ preventScroll: true }));
    }
  }, []);

  const jumpToHeading = id => {
    setTocOpen(false);
    const el = document.getElementById(id);
    if (!el) return;
    const marquee =
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--marquee-h')) || 0;
    const top = el.getBoundingClientRect().top + window.scrollY - marquee - 64;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: Math.max(0, top), behavior: reduced ? 'auto' : 'smooth' });
  };

  // Añade Guía de lectura dentro de Biblia en el Drawer móvil sin duplicarla
  const drawerGroups = useMemo(
    () =>
      (items || []).map(group => {
        if (group.label !== 'Biblia') return group;
        const hasGuia = group.links?.some(l => l.href === '/exegesis/guia');
        if (hasGuia) return group;
        return {
          ...group,
          links: [
            ...(group.links || []),
            {
              label: 'Guía de lectura',
              href: '/exegesis/guia',
              ariaLabel: 'Guía de lectura para principiantes de griego y hebreo'
            }
          ]
        };
      }),
    [items]
  );

  const onHome = pathname === '/';
  const onEstudio = pathname === '/estudio' || pathname.startsWith('/estudio/');
  const onBuscar = pathname === '/buscar';

  return (
    <div className="mnav">
      {/* 2. Barra superior minimalista */}
      <header className="mnav-top" ref={topPanelRef} aria-label="Barra superior">
        <div className="mnav-top__inner">
          <div className="mnav-top__left">
            <Link to="/" className="mnav-top__brand" aria-label={`${logoAlt} — Inicio`}>
              <img src={logo} alt={logoAlt} className="mnav-top__logo" />
            </Link>
            {ctx.label ? (
              <span className="mnav-top__ctx">{ctx.label}</span>
            ) : null}
          </div>

          {ctx.isLongReading && (
            <div className="mnav-top__actions">
              {headings.length >= 2 && (
                <button
                  type="button"
                  className={`mnav-top__btn${tocOpen ? ' is-on' : ''}`}
                  aria-expanded={tocOpen}
                  aria-controls={tocOpen ? 'mnav-toc-panel' : undefined}
                  onClick={() => {
                    setAaOpen(false);
                    setTocOpen(v => !v);
                  }}
                >
                  <TocIcon />
                  <span>Índice</span>
                </button>
              )}
              <button
                type="button"
                className={`mnav-top__btn mnav-top__btn--aa${aaOpen ? ' is-on' : ''}`}
                aria-expanded={aaOpen}
                aria-controls={aaOpen ? 'mnav-aa-panel' : undefined}
                aria-label="Tamaño de letra de lectura"
                onClick={() => {
                  setTocOpen(false);
                  setAaOpen(v => !v);
                }}
              >
                <span aria-hidden="true">Aa</span>
              </button>
            </div>
          )}
        </div>

        {/* Panel flotante: Tabla de contenidos del artículo/ficha */}
        {tocOpen && headings.length >= 2 && (
          <div id="mnav-toc-panel" className="mnav-pop" role="region" aria-label="Tabla de contenidos">
            <div className="mnav-pop__head">
              <span>Tabla de contenidos</span>
              <button
                type="button"
                className="mnav-pop__close"
                aria-label="Cerrar tabla de contenidos"
                onClick={() => setTocOpen(false)}
              >
                ×
              </button>
            </div>
            <ul className="mnav-pop__list">
              {headings.map(h => (
                <li key={h.id}>
                  <button
                    type="button"
                    className="mnav-pop__item"
                    onClick={() => jumpToHeading(h.id)}
                  >
                    {h.text}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Panel flotante: Tamaño de letra (Aa) */}
        {aaOpen && (
          <div id="mnav-aa-panel" className="mnav-pop" role="region" aria-label="Tamaño de letra">
            <div className="mnav-pop__head">
              <span>Tamaño de lectura</span>
              <button
                type="button"
                className="mnav-pop__close"
                aria-label="Cerrar tamaño de letra"
                onClick={() => setAaOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="mnav-aa__controls">
              <button
                type="button"
                className="mnav-aa__step"
                disabled={scale <= SCALE_MIN}
                aria-label="Reducir tamaño de letra: A−"
                onClick={() => setScale(s => Math.max(SCALE_MIN, Math.round((s - SCALE_STEP) * 10) / 10))}
              >
                A−
              </button>
              <span className="mnav-aa__val" aria-live="polite">
                {Math.round(scale * 100)}%
              </span>
              <button
                type="button"
                className="mnav-aa__step"
                disabled={scale >= SCALE_MAX}
                aria-label="Aumentar tamaño de letra: A+"
                onClick={() => setScale(s => Math.min(SCALE_MAX, Math.round((s + SCALE_STEP) * 10) / 10))}
              >
                A+
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 1. Barra inferior fija (Auto-hide + Safe Area) */}
      <nav
        ref={bottomRef}
        className={`mnav-bottom${hiddenBar && !drawerOpen ? ' is-hidden' : ''}`}
        aria-label="Navegación principal móvil"
      >
        <div className="mnav-bottom__grid">
          <Link
            to="/"
            className={`mnav-bottom__btn${onHome && !drawerOpen ? ' is-active' : ''}`}
            aria-current={onHome ? 'page' : undefined}
            onClick={() => drawerOpen && closeDrawer(false)}
          >
            <CruxIcon size={20} />
            <span>Inicio</span>
          </Link>

          <Link
            to="/estudio"
            className={`mnav-bottom__btn${onEstudio && !drawerOpen ? ' is-active' : ''}`}
            aria-current={onEstudio ? 'page' : undefined}
            onClick={() => drawerOpen && closeDrawer(false)}
          >
            <StudyIcon />
            <span>Estudio</span>
          </Link>

          <Link
            to="/buscar"
            className={`mnav-bottom__btn${onBuscar && !drawerOpen ? ' is-active' : ''}`}
            aria-current={onBuscar ? 'page' : undefined}
            onClick={() => drawerOpen && closeDrawer(false)}
          >
            <SearchIcon />
            <span>Buscar</span>
          </Link>

          <button
            ref={menuBtnRef}
            type="button"
            className={`mnav-bottom__btn mnav-bottom__btn--menu${drawerOpen ? ' is-active' : ''}`}
            aria-expanded={drawerOpen}
            aria-controls={drawerOpen ? 'mnav-drawer-dialog' : undefined}
            onClick={() => (drawerOpen ? closeDrawer(false) : setDrawerOpen(true))}
          >
            <MenuGridIcon />
            <span>Menú</span>
          </button>
        </div>
      </nav>

      {/* 3. Drawer tipo Hoja Inferior (Bottom Sheet) con todas las secciones */}
      {drawerOpen && (
        <div className="mnav-drawer" id="mnav-drawer">
          <div
            className="mnav-drawer__backdrop"
            aria-hidden="true"
            onClick={() => closeDrawer(true)}
          />
          <div
            id="mnav-drawer-dialog"
            className="mnav-drawer__panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mnav-drawer-title"
          >
            <div className="mnav-drawer__head">
              <div className="mnav-drawer__handle" aria-hidden="true" />
              <div className="mnav-drawer__head-row">
                <div>
                  <p className="mnav-drawer__eyebrow">Índice del sitio</p>
                  <h2 id="mnav-drawer-title" className="mnav-drawer__title">
                    Todas las secciones
                  </h2>
                </div>
                <button
                  ref={closeDrawerBtnRef}
                  type="button"
                  className="mnav-drawer__close"
                  aria-label="Cerrar menú de secciones"
                  onClick={() => closeDrawer(true)}
                >
                  ×
                </button>
              </div>
            </div>

            <nav className="mnav-drawer__body" aria-label="Todas las secciones del sitio">
              {drawerGroups.map(group => (
                <section
                  key={group.label}
                  className="mnav-drawer__group"
                  style={{
                    backgroundColor: group.bgColor,
                    color: group.textColor
                  }}
                >
                  <h3 className="mnav-drawer__group-title">{group.label}</h3>
                  <ul className="mnav-drawer__list">
                    {group.links?.map(link => (
                      <li key={`${group.label}-${link.href}-${link.label}`}>
                        <Link
                          className="mnav-drawer__link"
                          to={link.href}
                          aria-label={link.ariaLabel}
                          onClick={() => closeDrawer(false)}
                        >
                          <span>{link.label}</span>
                          <GoArrowUpRight className="mnav-drawer__arrow" aria-hidden="true" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
