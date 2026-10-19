# Changelog

Todas las versiones notables de Web Crux. El formato sigue, a grandes rasgos,
[Keep a Changelog](https://keepachangelog.com/es/1.1.0/).

## [0.8.0] — 2026-10-19

Cada página del sitio se publica con su propio HTML: Google y las redes sociales
ya ven lo que ven las personas.

**Antes**: GitHub Pages servía `404.html` para toda ruta profunda de la SPA, con
código **404** y `noindex`. Google solo podía indexar la portada y, al compartir
cualquier enlace, WhatsApp/X/Facebook (que no ejecutan JavaScript) no encontraban
ni título ni imagen: el `og:image` se escribía desde el navegador y era una ruta
relativa a un WebP.

### Añadido

- **Prerender por ruta** (`plugins/prerender.mjs`): el build escribe
  `dist/<ruta>/index.html` para las **214 rutas públicas** (9 de sección +
  188 estudios + 17 fichas de personaje) con `<title>`, `description`,
  `canonical`, `robots`, `og:*`, `twitter:*` y JSON-LD de esa ruta ya en el HTML.
  El `404.html` sigue cubriendo las rutas que no existen.
- **`scripts/routes-lib.mjs`**: fuente única de las rutas y su SEO (títulos y
  descripciones idénticos a los que usa `useSeo()`), compartida por el prerender,
  el sitemap y la QA.
- **Imagen al compartir** `public/img/og/crux.jpg` (1200×630, JPEG) generada con
  `npm run og` desde el banner y el logotipo. JPEG a propósito: las tarjetas de
  WhatsApp, Facebook, X y LinkedIn no pintan WebP de forma fiable.
- **`qa:prod`** comprueba ahora dos cosas nuevas: que las rutas reales se sirven
  con **200** (no por `404.html`) y que el HTML de las 214 rutas lleva su título,
  su `canonical` y su `og:image` **sin ejecutar JavaScript**. También valida el
  sitemap, el `robots.txt` y que la imagen social se publica como `image/jpeg`.

### Cambiado

- **`sitemap.xml`**: solo rutas indexables, con la forma canónica `/ruta/`, con
  `lastmod` en los estudios y sin las páginas de servicio (`/buscar`, y `/videos`
  mientras la parrilla esté vacía). Pasa de 197 a **212 URLs** que responden 200.
- **`robots.txt`**: añade `Disallow: /admin`.
- **`useSeo()`** escribe `og:image` y `og:url` con URL absoluta, y `og:image`
  apunta al JPEG social.
- El build falla con un mensaje claro si falta la imagen social (`npm run og`).

## [0.7.1] — 2026-10-18

La Carta a los Romanos 1 se suma a las narraciones del raíl.

### Añadido

- **Narración de Romanos 1** (9:24) en el raíl de `/biblia/ntv`: segunda entrada
  de `content/narraciones.json` con su audio en `public/audio/ntv/romanos-1.ogg`
  y su onda medida con `node scripts/build-audio-peaks.mjs`. El reproductor y el
  libro no cambian: cada capítulo con narración la muestra en su raíl.
- **`qa:audio` recorre todas las narraciones** declaradas y comprueba que cada
  una se ofrece en su capítulo con la duración real del audio (±1 s), no solo la
  primera; la comprobación del contenedor Ogg lee la cabecera en vez del archivo
  entero.

## [0.7.0] — 2026-10-18

La lectura se afina: la Patrística se lee en un libro más grande y con gestos
claros, la NTV pasa a la rejilla por versículo de la exégesis y la Carta de Judas
se puede **escuchar** desde el raíl del capítulo.

### Añadido

- **Narración en el raíl de la NTV** (`ChapterAudio`): al abrir un capítulo con
  audio aparece un reproductor con la onda real de la grabación —picos mínimos y
  máximos por tramo, medidos con la Web Audio API
  (`scripts/build-audio-peaks.mjs`), no una silueta inventada—, posición con clic
  o arrastre, teclado (flechas ±5 s, AvPág/RePág ±30 s, Inicio/Fin, Espacio),
  descarga en Ogg/Opus y aviso con enlace si el navegador no reproduce el
  formato. El contenido vive en `content/narraciones.json` (validado en el build:
  el audio y su onda tienen que existir en `public/`) y los datos en
  `src/data/narraciones.js`. Primera narración: **Carta de Judas** (7:18).
- **`qa:audio`** (22 comprobaciones): esquema, contenedor Ogg, onda coherente con
  la duración declarada, libro y capítulo en el índice, `audio/ogg` servido con
  rangos, reproductor, progreso, salto, teclado y capítulos sin narración.

### Cambiado

- **`/biblia/ntv` se lee en rejilla por versículo**, con las mismas clases que
  `/exegesis` (`exg-grid`): número en cintillo, títulos de sección dentro de la
  rejilla y notas del traductor en superíndice. El pliego de dos páginas sigue a
  un clic con el conmutador, y la preferencia estrena clave (`crux.ntv.vista`,
  `rejilla | dos`) para que quien tuviera guardada la vista antigua
  (`crux.ntv.paginas`, que se escribía sola con su valor por defecto) vea la
  rejilla nueva; si elige el pliego, se recuerda.
- **El libro de la Patrística es más grande**: `--biblia-w` sube a 1560 px en el
  lector (1240 px en la portada), la página se clampa a 620 px de ancho y a
  `min(alto · 0.76, ancho · 1.5)` de alto. El raíl de la NTV pasa de 240 a 280 px
  para que quepa el reproductor.
- **Pasar hoja con el ratón, sin pisar la selección**: el arrastre solo empieza en
  los márgenes de la página, el clic limpio en la banda de margen pasa una hoja
  —también la rueda horizontal o `Mayús` + rueda— y sobre el texto el ratón
  selecciona. En táctil el arrastre sigue valiendo en toda la hoja, y una captura
  de puntero mantiene el gesto aunque el dedo o el cursor salgan del pliego.
- **La Biblia Patrística es la recopilación de los Padres**, no una Biblia
  comentada: el texto de presentación, el SEO y el pie de la portada lo dicen así
  («La compilación de las cartas, homilías y tratados…»).
- **La divisoria del Codex queda alineada** con la columna de las filas: la
  cabecera de testigos viaja dentro del cuerpo con `position: sticky` y
  `scrollbar-gutter: stable`, así que el ancho útil es el mismo en la cabecera y
  en cada fila (0 px de diferencia).

### Corregido

- **Marcar texto ya no cambia el versículo fijado** en la rejilla: con una
  selección viva, el clic de fila se ignora (`src/lib/selection.js`). Vale para
  `/exegesis` y para el pliego de la NTV, donde además ya no se desplaza el
  capítulo.
- **`?pag=sección.k` ya no se pierde al repaginar** (otro tamaño de letra, otra
  ventana): si una sección no abre página propia —su título cae a mitad de la
  anterior—, el enlace resuelve a la página donde está su título en vez de
  mostrar «página no encontrada».
- **Los emojis perdidos de la Parte 2.4** (`## ??`) vuelven a su sitio
  (`📖`, `📜`, `📄`) conservando el nivel `##`, y el paso `encoding` de
  `fix-biblia-doc.mjs` es idempotente. La copia del sitio y la bóveda siguen
  idénticas: 8516 líneas, 0 `??`, 0 U+FFFD.

### Notas

- La narración todavía no tiene editor en `/admin`: se edita a mano en
  `content/narraciones.json` (el audio, en `public/audio/ntv/`). Las ondas se
  regeneran con `node scripts/build-audio-peaks.mjs`.
- El audio se sirve como `.ogg` (no `.opus`) porque GitHub Pages solo reconoce
  `audio/ogg` por extensión, y se declara `type="audio/ogg; codecs=opus"`.

## [0.6.0] — 2026-10-17

La exégesis pasa a leerse **versículo a versículo** y los tres lectores se
enlazan entre sí.

### Añadido

- **`/exegesis` — rejilla por versículo**: cada versículo del Codex y de la NTV
  ocupa una fila alineada, con el número en un cintillo lateral y las marcas del
  aparato (◆ variante, † nota) en la misma columna. La cabecera de los testigos
  queda fija y el cuerpo se desplaza por dentro.
- **Modalidades de columna** —paralelo, solo el Codex o solo la NTV— con memoria
  en `localStorage`, y **selector de versículo** con salto directo (`?v=`) o a un
  rango (`?vv=`).
- **Fichas flotantes** para el aparato crítico y las notas del traductor: al pulsar
  un sigilo o una marca se abre una ficha anclada al punto tocado, con sus entradas
  etiquetadas («Griego», «Otra lectura», «Variante textual», «Referencia»), cierre
  con `Escape` o clic fuera, y paneles inferiores sincronizados.
- **Buscador por palabras** en la NTV y en el Codex (`src/lib/bibleSearch.js`,
  `BibleSearch.jsx`), pensado para recordar el texto sin saber la referencia:
  pliega mayúsculas, diacríticos y sigma final, ignora las marcas de la
  transcripción y busca primero en el libro abierto, con un botón para ampliar a
  todo el Nuevo Testamento. Los resultados llevan el testigo, el versículo y el
  fragmento resaltado. Índice versionado en
  `public/textos/exegesis/buscar.json` (`npm run exegesis:search`).
- **Leyenda de siglas** del aparato con la fuente oficial del proyecto y su
  atribución.
- **Puente entre lectores** (`BibleCta`): al pie de la Biblia Patrística, la NTV y
  la exégesis, y en cada ficha de estudio a partir de su pasaje clave. Una cita
  como «1 Corintios 15:17» se traduce a `?libro=…&cap=…&v=…`, así que el lector
  aterriza en el mismo versículo (`parsePassage`, `ntvPath`, `exegesisPath`).

### Cambiado

- **`/biblia/ntv`** incorpora el selector de versículo, el buscador por palabras y
  las notas del traductor en ficha, como el lector de la Biblia Patrística.
- **Datos regenerados**: la NTV vuelve a numerar las secciones de cada capítulo
  (`headingKind` distingue las que caen dentro de un versículo) y limpia las notas
  del traductor (`cleanNoteText`): 27 libros, 260 capítulos, 7.943 versículos,
  744 secciones y 1.642 notas sin residuos.
- **`qa:exegesis`** crece hasta las 59 comprobaciones: datos (secciones, notas,
  cobertura del índice de búsqueda, referencias de los estudios) y navegador
  (rejilla, fichas, buscador local y global, conmutador, móvil, NTV y CTAs).

### Corregido

- El carácter `>` de la transcripción —una celda real del manuscrito, no ruido— se
  dibuja atenuado en lugar de eliminarse.

### Notas

- La bóveda `D:\Biblia\Biblia_Patristica_Completa.md` se repara con
  `node scripts/fix-biblia-doc.mjs --only encoding --file … --write` (41 sustituciones
  sobre 43 U+FFFD), sin tocar el número ni los finales de línea, para no invalidar
  las citas por línea de los estudios. El script acepta `--file` y `--only`.
- Las **fuentes JPG/JPEG** de `src/assets/imgs/` dejan de versionarse (187 MB): lo
  servido son los `.webp` de `public/img/`, que sí se publican y se regeneran con
  `node scripts/optimize-images.mjs`.

## [0.5.0] — 2026-10-16

Exégesis comparada: el Nuevo Testamento leído en paralelo entre el Codex
Sinaiticus y la Nueva Traducción Viviente.

### Añadido

- **`/exegesis` — lectura paralela** del Codex Sinaiticus (transcripción
  diplomática en griego, con *nomina sacra* sobrelineados y aparato crítico) y de
  la NTV, versículo a versículo. Columnas sincronizadas, sigilos del aparato que
  resaltan su variante, notas del traductor en superíndice y enlace al facsímil
  del manuscrito.
- **`/biblia/ntv` — lector de la NTV** al estilo del lector de la Biblia
  Patrística: pliego de dos páginas, temas de papel (claro, sepia, nocturna),
  tamaño de letra, navegación por libro, capítulo y sección, y notas del
  traductor.
- **Datos de exégesis versionados** en `public/textos/exegesis/`: `ntv/<libro>.json`
  (7.943 versículos con sus notas), `codex/<libro>.json` (7.918 versículos y 13.894
  variantes del aparato) e `index.json`. Se generan con
  `npm run exegesis` (`scripts/build-ntv.mjs`, `scripts/fetch-codex.mjs` y
  `scripts/build-exegesis-index.mjs`).
- **`npm run qa:exegesis`**: comprueba el índice, la limpieza de los dos textos
  (sin ruido del PDF, sin HTML residual, numeración creciente) y, con `--browser`,
  el render de las dos vistas.

### Cambiado

- El menú estrena un grupo **Biblia** (Biblia Patrística, Biblia NTV y Exégesis
  comparada); el pie incorpora las dos vistas nuevas.
- La auditoría de accesibilidad (`qa:a11y`) y la de búsqueda (`qa:buscar`) cubren
  ya `/biblia/ntv` y `/exegesis` (0 violaciones critical/serious).
- Fuentes `.md` del Segundo Cerebro Bíblico versionadas en `src/assets/texts/`;
  la caché del rastreo del Codex queda fuera de git
  (`src/assets/texts/.cache-codex/`).

### Notas

- El texto del Codex se usa con permiso personal, educativo y no comercial, y se
  acredita a la British Library, la Universidad de Leipzig, el Monasterio de Santa
  Catalina (Sinaí) y la Biblioteca Nacional de Rusia.

## [0.4.1] — 2026-10-14

Portadas definitivas de los apóstoles.

### Cambiado

- **Once portadas de apóstol** sustituyen a las imágenes «pendiente» provisionales:
  Santiago el Mayor, Juan el Apóstol, Andrés, Felipe, Bartolomé, Mateo, Tomás,
  Santiago el Menor, Simón el Zelote, Matías y Judas Iscariote. Junto a Judas Tadeo
  (ya con ilustración), los doce apóstoles muestran su retrato definitivo.
  Las fuentes viven en `src/assets/imgs/Personajes/<Nombre>/<Nombre>Portada.jpg` y se
  optimizan a `public/img/personajes/<Nombre>/<Nombre>Portada.webp` (1100 px, ~300 KB
  cada una) con `node scripts/optimize-images.mjs`.

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
