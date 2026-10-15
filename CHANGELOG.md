# Changelog

Todas las versiones notables de Web Crux. El formato sigue, a grandes rasgos,
[Keep a Changelog](https://keepachangelog.com/es/1.1.0/).

## [0.4.0] — 2026-10-14

Doce apóstoles nuevos en las fichas de personaje y la Biblia Patrística completa.

### Añadido

- **Doce fichas de apóstol** en `/estudio/personajes` (17 personajes en total):
  Santiago el Mayor, Juan el Apóstol, Andrés, Felipe, Bartolomé, Mateo, Tomás,
  Santiago el Menor, Simón el Zelote, Judas Tadeo, Matías y Judas Iscariote. Cada
  una con identificación, biografía y sus hitos en la línea de tiempo.
- Portada provisional (imagen «pendiente») para los once apóstoles que todavía no
  tienen ilustración; se sustituyen al recibir las imágenes definitivas.

### Cambiado

- **Biblia Patrística**: se publica la edición completa (1,2 → 3,6 MB) y se repara
  la codificación dañada (43 caracteres U+FFFD) de la sección de Atenágoras.

### Corregido

- **Paginación del lector** (`src/lib/bookPages.js`): ninguna página queda
  compuesta solo de encabezados; si un párrafo gigante no cabe en una página,
  viaja junto a su título. Las ~4.300 páginas vuelven a pasar `qa:biblia` sin
  avisos.
- **`qa:biblia --browser`**: el selector del control de tamaño de letra vuelve a
  coincidir con la etiqueta actual del lector.

## [0.3.0] — 2026-10-12

Roadmap de cinco fases sobre la base de la 0.2.0: línea de tiempo, concilios,
búsqueda global, accesibilidad y limpieza de assets.

### Añadido

- **Línea de tiempo en `/estudio`** (Fase 1): hitos derivados de los personajes
  (`timeline[]`) y de los concilios, ordenados por año, con eras y filtros.
- **`/concilios`** (Fase 2): concilios ecuménicos con sus herejías condenadas
  (ss. I–VIII). Las herejías heredan el año del concilio que las condena; los
  estudios aún sin redactar aparecen como «próximamente».
- **`/buscar` — búsqueda global** (Fase 3): índice `content/busquedas.json`
  (estudios, personajes, concilios, herejías y videos), con un mínimo de dos letras.
- **`/temas` — índice de categorías y etiquetas** (Fase 3).
- **Editor de línea de tiempo y editor de concilios** en el panel `/admin`.
- **QA de accesibilidad** (`npm run qa:a11y`, axe-core) sobre 16 vistas.
- **QA de imágenes** (`npm run qa:imagenes`): verifica que toda ruta `/img/...`
  referenciada en `content/` responde 200 y que las páginas no dejan `<img>` rotas.

### Cambiado

- **Accesibilidad (Fase 4)**: 0 violaciones WCAG y de buenas prácticas en
  escritorio y móvil (reveals con `prefers-reduced-motion`, contraste de
  ordinales, áreas táctiles de los puntos del carrusel, etiquetas de tamaño de
  letra, jerarquía de encabezados).
- **`Explorar`** en el menú queda en cuatro destinos: Biblia Patrística, Concilios,
  Temas y Buscar.

### Optimizado

- **Fase 5 — assets**: Juan el Bautista pasa a `.webp` como el resto de personajes;
  se retiran duplicados sin uso (`cruxlogonegro.png` y un vídeo de 6 MB) y el
  banner del héroe deja de publicarse. Resultado: `public/` 23,7 → 13,4 MB y
  `dist/` 29,2 → 18,8 MB.

### Documentación

- README: secciones del sitio, editores nuevos del panel, índice de contenido y
  comandos de QA.
- `.gitignore`: las fuentes locales de imagen (JPG originales) dejan de aparecer
  como pendientes.

## [0.2.0] — 2026-10-12

- `/videos` con parrilla de YouTube, marquesina de anuncios y versículos.
- `/biblia`: Biblia Patrística (índice de la obra y lector paginado).
- Panel de edición `/admin` (solo en desarrollo) con validación en servidor y en
  build, copias de seguridad en `content/.history/` y botón «Publicar».
- Deploy automático a GitHub Pages (`/crux/`) vía push a `main`.
