import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useSite } from '../../lib/site';

import BendingMarquee from '../BendingMarquee/BendingMarquee';

import './MarqueeBar.css';

const STORAGE_KEY = 'crux-marquee-closed';

/**
 * Barra fija inferior en todas las rutas: anuncios importantes + un versículo
 * aleatorio que se renueva en cada carga y en cada cambio de ruta.
 * El cierre (✕) dura la sesión (sessionStorage): en la siguiente visita vuelve.
 * En dev, los datos vienen de /api/content/anuncios y /api/content/versiculos.
 * En build, se importan estáticamente desde content/.
 */
export default function MarqueeBar() {
  const site = useSite();
  const { marquee } = site;
  const location = useLocation();
  const barRef = useRef(null);

  // Estado para datos dinámicos (dev) o estáticos (build)
  const [anuncios, setAnuncios] = useState(null);
  const [versiculos, setVersiculos] = useState(null);
  const [loaded, setLoaded] = useState(false);

  // Cargar datos
  useEffect(() => {
    let mounted = true;
    async function load() {
      if (import.meta.env.DEV) {
        try {
          const [aRes, vRes] = await Promise.all([
            fetch('/api/content/anuncios'),
            fetch('/api/content/versiculos')
          ]);
          if (mounted) {
            const aData = await aRes.json();
            const vData = await vRes.json();
            setAnuncios(JSON.parse(aData.raw || '{}'));
            setVersiculos(JSON.parse(vData.raw || '[]'));
            setLoaded(true);
          }
        } catch {
          setLoaded(true);
        }
      } else {
        // En build, importar estáticamente
        const aMod = await import('../../../content/anuncios.json');
        const vMod = await import('../../../content/versiculos.json');
        if (mounted) {
          setAnuncios(aMod.default);
          setVersiculos(vMod.default);
          setLoaded(true);
        }
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const pickVerse = () => {
    if (!Array.isArray(versiculos) || versiculos.length === 0) return '';
    return versiculos[Math.floor(Math.random() * versiculos.length)];
  };

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
    // pickVerse cambia con los datos; se recalcula al navegar y al cargar datos
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, versiculos]);

  const enabled = anuncios?.enabled !== false && marquee.enabled;
  const dismissable = anuncios?.dismissable !== false && marquee.dismissable;

  useEffect(() => {
    if (!enabled || closed) {
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
  }, [enabled, closed]);

  const items = useMemo(() => {
    if (!loaded) return [];
    const announce = Array.isArray(anuncios?.items) ? anuncios.items.filter(Boolean) : [];
    return [...announce, verse].filter(Boolean);
  }, [verse, loaded, anuncios]);

  // `closed` debe cortar el render: si no, el ✕ guarda la preferencia pero la
  // barra sigue pintada (era el bug de "no se puede cerrar la marquesina").
  if (!enabled || closed || !loaded || items.length === 0) return null;

  return (
    <aside className="marquee-bar" ref={barRef} aria-label="Avisos y versículo">
      <BendingMarquee items={items} speed={marquee.speed} separator={marquee.separator} />
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