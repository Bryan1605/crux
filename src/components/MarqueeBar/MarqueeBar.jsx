import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

import BendingMarquee from '../BendingMarquee/BendingMarquee';
import anuncios from '../../../content/anuncios.json';
import versiculos from '../../../content/versiculos.json';

import './MarqueeBar.css';

const STORAGE_KEY = 'crux-marquee-closed';

const pickVerse = () => {
  if (!Array.isArray(versiculos) || versiculos.length === 0) return '';
  return versiculos[Math.floor(Math.random() * versiculos.length)];
};

/**
 * Barra fija inferior en todas las rutas: anuncios importantes + un versículo
 * aleatorio que se renueva en cada carga y en cada cambio de ruta.
 * El cierre (✕) dura la sesión (sessionStorage): en la siguiente visita vuelve.
 */
export default function MarqueeBar() {
  const location = useLocation();
  const enabled = anuncios?.enabled !== false;
  const dismissable = anuncios?.dismissable !== false;
  const barRef = useRef(null);

  const [closed, setClosed] = useState(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [verse, setVerse] = useState(pickVerse);

  useEffect(() => {
    setVerse(pickVerse());
  }, [location.pathname]);

  const visible = enabled && !closed;

  useEffect(() => {
    if (!visible) {
      document.body.style.paddingBottom = '';
      return undefined;
    }
    const apply = () => {
      const h = barRef.current?.offsetHeight || 0;
      document.body.style.paddingBottom = `${h}px`;
      document.documentElement.style.setProperty('--marquee-h', `${h}px`);
    };
    apply();
    const ro = new ResizeObserver(apply);
    if (barRef.current) ro.observe(barRef.current);
    return () => {
      ro.disconnect();
      document.body.style.paddingBottom = '';
      document.documentElement.style.removeProperty('--marquee-h');
    };
  }, [visible]);

  const items = useMemo(() => {
    const announce = Array.isArray(anuncios?.items) ? anuncios.items.filter(Boolean) : [];
    return [...announce, verse].filter(Boolean);
  }, [verse]);

  if (!visible || items.length === 0) return null;

  return (
    <aside className="marquee-bar" ref={barRef} aria-label="Avisos y versículo">
      <BendingMarquee items={items} speed={42} separator=" ✝ " />
      {dismissable && (
        <button
          type="button"
          className="marquee-bar__close"
          aria-label="Cerrar aviso"
          onClick={() => {
            try {
              sessionStorage.setItem(STORAGE_KEY, '1');
            } catch {
              /* modo privado: el cierre vive solo en memoria */
            }
            setClosed(true);
          }}
        >
          ✕
        </button>
      )}
    </aside>
  );
}
