import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App.jsx';
import './styles/global.css';

// GitHub Pages sirve 404.html en rutas profundas; public/404.html guarda la ruta
// pedida y vuelve a la raiz. La restauramos aqui, antes de montar el router.
try {
  const stored = sessionStorage.getItem('crux:path');
  if (stored) {
    sessionStorage.removeItem('crux:path');
    const base = import.meta.env.BASE_URL;
    if (stored.startsWith(base) && stored !== location.pathname) {
      history.replaceState(null, '', stored);
    }
  }
} catch {
  /* sessionStorage no disponible: se navega en la raiz */
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
