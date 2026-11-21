# Crux

Sitio de estudios bíblicos: fichas de estudio, Biblia Patrística, Biblia NTV,
exégesis comparada (Codex Sinaiticus × NTV), videos y personajes.
Este repositorio contiene **dos proyectos**:

| Ruta | Qué es | Build | Deploy |
|------|--------|-------|--------|
| `/` (raíz) | Portafolio estático en HTML/CSS/JS | ninguno | — |
| `/Web Crux` | SPA en React 19 + Vite + Three.js | Vite | GitHub Pages (`/crux/`) |

Todo lo de abajo se ejecuta **desde la carpeta `Web Crux/`**.

> El proyecto bíblico (fuentes, traducciones y fichas) tiene su memoria de
> trabajo en [`docs/proyecto-biblico/`](docs/proyecto-biblico/README.md).

---

## Requisitos

- Node.js 20+
- npm

```bash
cd "Web Crux"
npm install
npm run dev        # servidor de desarrollo en http://localhost:5173/
```

> **Windows:** también puedes hacer doble clic en **`dev.bat`** (dentro de `Web Crux/`).
> Comprueba Node, instala dependencias si faltan, arranca el servidor y abre el panel
> en el navegador. Usa `dev.bat noopen` si no quieres que abra el navegador.

## Comandos

```bash
npm run dev         # servidor de desarrollo (incluye el panel /admin)
npm run build       # build de producción (valida el contenido y regenera el índice)
npm run preview     # sirve localmente el build de producción
npm run index:wiki  # regenera content/ desde el wiki de origen (destructivo, ver abajo)
npm run exegesis    # regenera public/textos/exegesis/ (NTV + Codex + índice + buscadores + lemas + léxico)
npm run exegesis:trad # valida y publica las traducciones de trabajo (`src/assets/texts/trad/` → `public/textos/exegesis/trad/`)
npm run og          # regenera la imagen social `public/img/og/crux.jpg`
npm run check:lee   # comprueba las citas en inglés de Shincheonji contra el libro fuente (y sin marca de agua)
npm run qa          # QA completa (datos + navegador; requiere `npm run dev` en otra terminal)
npm run qa:prod     # audita el sitio publicado en GitHub Pages (`CRUX_BASE` para otra URL)
npm run qa:audio    # comprueba las narraciones (audio, onda y reproductor de la NTV)
npm run qa:imagenes # comprueba las imágenes referenciadas y las de las páginas
npm run qa:enlaces  # comprueba enlaces internos, anclas y citas externas (dentro y fuera)
npm run qa:a11y     # audita la accesibilidad con axe-core (0 critical/serious) en escritorio y móvil
node scripts/optimize-images.mjs     # optimiza fuentes de `src/assets/imgs/` a `.webp` en `public/img/`
node scripts/build-audio-peaks.mjs   # recalcula la onda de las narraciones (necesita Chrome)
node scripts/fix-biblia-doc.mjs --file <ruta> --write   # repara la Biblia Patrística (simula sin --write)
```

`npm run qa` agrupa 16 comprobaciones: `check:search`, `qa:timeline`, `qa:concilios`,
`qa:buscar`, `qa:vistas`, `qa:biblia`, `qa:exegesis`, `qa:trad`, `qa:libros`, `qa:admin`,
`qa:shincheonji`, `qa:lexico`, `qa:audio`, `qa:imagenes`, `qa:enlaces` y `qa:a11y`. Todas
las suites de navegador necesitan el servidor de desarrollo en `http://localhost:5173` (y Chrome instalado).
Para auditar el sitio publicado, ejecuta cualquiera de ellas con
`CRUX_BASE=https://bryan1605.github.io/crux`.
Los informes quedan en `%TEMP%\opencode\crux\`.

---

## Secciones del sitio

| Ruta | Qué es |
|------|--------|
| `/` | Portada: héroe 3D con Nicodemo y buscador, cifras reales, categorías, banner, las tres puertas de la Biblia, apologética «Preguntas con la Biblia», personajes y concilios |
| `/estudio` | Índice de estudios con tres vistas (tarjetas / lista / carrusel), sidebar por temas y línea de tiempo |
| `/estudio?cat=…` | Índice filtrado por categoría (enlazado desde `/temas`) |
| `/estudio/:slug` | Ficha de estudio (Markdown) |
| `/estudio/personajes/:slug` | Ficha de personaje: portada, escenas, biografía y línea de tiempo |
| `/biblia` | Biblia Patrística: Domo 3D, línea temporal de obras, índice con portadas por obra y lector paginado (libro o desplazamiento) |
| `/biblia/libros` | Índice de libros de la Biblia (73 libros canónicos y solo-Codex), con filtro por testamento y enlace a las fichas publicadas |
| `/biblia/libros/:id` | Ficha introductoria de un libro (género, contexto, composición, teología, texto, recepción, claves, debates y fuentes) |
| `/biblia/ntv` | Lector de la Nueva Traducción Viviente completa: 66 libros (39 AT + 27 NT), en rejilla por versículo o pliego, con notas del traductor, selector de versículo, buscador, panel de libro y narración en el raíl |
| `/exegesis` | Exégesis comparada: Codex Sinaiticus ↔ NTV (y traducción de trabajo donde exista) en rejilla por versículo, con aparato crítico, diccionario griego interactivo, notas y buscador; incluye los 7 libros que solo conserva el Codex |
| `/apologetica/shincheonji` | 100 preguntas solo con la Biblia (Codex Sinaiticus × NTV con palabras clave resaltadas) y pestaña «¿Qué cree Shincheonji?» con contraste doctrinal |
| `/videos` | Parrilla de videos de YouTube |
| `/concilios` | Concilios y herejías, con ancla por id (`/concilios#nicea`) |
| `/temas` | Índice de categorías y etiquetas (enlaza a `/estudio?cat=…` y `/estudio?q=…`) |
| `/buscar` | Búsqueda global de estudios, libros de la Biblia, apologética, personajes, concilios, herejías y videos |
| `/admin` | Panel de edición — **solo en desarrollo** |

---

## Panel de edición (`/admin`)

El panel de administración **solo existe en desarrollo** (`npm run dev`). Se abre en:

```
http://localhost:5173/admin
```

Desde ahí se puede editar casi todo el sitio sin tocar código:

- **Estudios** — ficha (frontmatter) + editor visual TipTap (fase 1, con vista Visual, Markdown y Vista previa responsiva).
- **Personajes** — ficha completa: portada, escenas, biografía, línea de tiempo.
- **Videos** — parrilla de YouTube (con miniatura de comprobación).
- **Banner** — imágenes, texto y enlace de la portada.
- **Versículos** — frases del marquee.
- **Anuncios** — barra de anuncios (activar, cerrar, items).
- **Línea de tiempo** — hitos propios de `/estudio` (los de personajes y concilios se derivan solos).
- **Concilios** — concilios, herejías, doctrinas, decisiones y enlaces a estudios.
- **Categorías** — nombre, descripción corta y orden.
- **Ajustes del sitio** — marca, menú de navegación, pie de página, copy de la portada y SEO.
- **Medios** — biblioteca de imágenes en `public/img/` (subir, previsualizar, borrar).

> **Importante:** la web publicada **no incluye** la ruta `/admin` ni ningún punto de
> escritura. No hay autenticación porque no hace falta: no se despliega.

### Validación

Cada guardado se valida en el servidor antes de escribir el archivo. Si algo está mal
(por ejemplo un ID de YouTube que no tiene 11 caracteres), se muestra un error y **no se
escribe nada**. El mismo validador corre en `npm run build`, de modo que un contenido
inválido rompe el build con un mensaje claro en vez de publicar una web rota.

### Copias de seguridad

Antes de sobrescribir un archivo, el panel guarda una copia en `content/.history/`
(ignorada por git). Se pueden ver y restaurar desde el propio panel (bloque «Publicar» →
Historial de backups).

---

## Publicar cambios

Hay dos formas de publicar lo que edites:

1. **Botón «Publicar» del panel.** Hace `git add` + `commit` + `push` a `main`, y GitHub
   Pages redespliega automáticamente. Necesita un token de GitHub:

   ```bash
   cp .env.example .env.local
   ```

   Y en `.env.local` (ignorado por git):

   ```ini
   GH_TOKEN=github_pat_xxx   # PAT con permiso Contents: Read and write
   GH_REPO=bryan1605/crux
   SITE_URL=https://bryan1605.github.io/crux
   ```

   El token solo lo lee el servidor de desarrollo (nunca se expone al navegador).

2. **Git manual.** Como siempre:

   ```bash
   git add content public/img
   git commit -m "content: ..."
   git push
   ```

**Deploy:** un push a `main` → `.github/workflows/pages.yml` compila con `BASE_PATH=/crux/`
y publica en GitHub Pages. La URL de producción es
`https://bryan1605.github.io/crux/`.

---

## Modelo de contenido (`content/`)

| Archivo / carpeta | Qué es |
|---|---|
| `content/estudios/*.md` | Fichas de estudio (frontmatter + Markdown). Fuente de verdad. |
| `content/estudios.json` | Índice generado desde los `.md` (no editar a mano). |
| `content/personajes/*.json` | Fichas de personajes. |
| `content/categorias.json` | Categorías, descripción corta y orden. |
| `content/temas.json` | Orden, lema e imagen opcional de los temas por categoría en `/estudio`. |
| `content/site.json` | Marca, menú, pie, copy de portada y SEO. |
| `content/videos.json` | Parrilla de videos. |
| `content/slides.json` | Imágenes del banner de portada. |
| `content/versiculos.json` | Frases del marquee. |
| `content/anuncios.json` | Barra de anuncios. |
| `content/narraciones.json` | Pistas de audio y sus ondas (`.ogg` + `.peaks.json` en `public/audio/ntv/`). |
| `content/concilios.json` | Concilios y herejías (decisiones, año, herejías condenadas). |
| `content/timeline.json` | Hitos propios de la línea de tiempo (los demás se derivan de personajes y concilios). |
| `content/obras-patristica.json` | Portadas por obra en el índice de `/biblia` (`.webp` en `public/img/obras/`). |
| `content/lexico/griego.json` | Glosas y notas del léxico griego (250 entradas editables). |
| `content/libros/fuentes.json` | Registro de fuentes verificadas para fichas y páginas bíblicas. |
| `content/libros/*.json` | Fichas introductorias por libro de la Biblia (p. ej. `tobit.json`). |
| `content/apologetica/shincheonji-*.json` | 100 preguntas, palabras clave y contraste doctrinal de Shincheonji. |
| `content/busquedas.json` | Índice de búsqueda global (se regenera en cada `build`; no lo edites a mano). |
| `public/textos/biblia-patristica.md` | Texto de la Biblia Patrística (copia fiel del archivo original del proyecto; se carga bajo demanda desde `/textos/`). |
| `public/textos/exegesis/{ntv,codex}/*.json` | Datos de exégesis por libro (generados; versionados para que el build funcione sin red): NTV 66 libros y Codex 59. |
| `public/textos/exegesis/lemas/*.json` | Mapas de lemas griegos del NT (27 libros; generados). |
| `public/textos/exegesis/trad/*.json` | Traducciones de trabajo publicadas desde `src/assets/texts/trad/` (`exegesis:trad`). |
| `public/textos/exegesis/lexico.json` | Diccionario griego compilado (generado). |
| `public/textos/exegesis/index.json` | Cobertura de cada testigo (generado). |
| `public/textos/exegesis/buscar-at.json` | Índice de búsqueda por palabras del AT (NTV + Codex; generado). |
| `public/textos/exegesis/buscar-nt.json` | Índice de búsqueda por palabras del NT (NTV + Codex; generado). |
| `src/assets/texts/*.md` | Fuentes de la NTV y del Codex Sinaiticus 1911 (las usan los scripts, no el build). |
| `src/assets/texts/trad/*.json` | Fuentes editables de las traducciones de trabajo (p. ej. `tobit.json`). |

`content/estudios.json` y `content/busquedas.json` se regeneran automáticamente en cada
`build` (y al editar desde el panel). No los edites a mano.

### Exégesis comparada

`npm run exegesis` regenera `public/textos/exegesis/` a partir de las fuentes de
`src/assets/texts/`:

```bash
npm run exegesis:ntv    # parsea la NTV completa (66 libros) y escribe ntv/<libro>.json
npm run exegesis:codex  # descarga el Codex (con caché en src/assets/texts/.cache-codex/) y escribe codex/<libro>.json
npm run exegesis:index  # cruza ambos testigos y escribe index.json
npm run exegesis:search # indexa los versículos en buscar-at.json y buscar-nt.json
npm run exegesis:lemas  # genera lemas/*.json para los 27 libros del NT
npm run exegesis:lexico # compila public/textos/exegesis/lexico.json desde content/lexico/griego.json
npm run exegesis:trad   # valida y publica las traducciones de trabajo de src/assets/texts/trad/
npm run qa:exegesis     # QA de datos + navegador de /exegesis y /biblia/ntv
```

El rastreo del Codex es único: la respuesta cruda queda cacheada (ignorada por git) y los
JSON resultantes **sí se versionan**, de modo que el build y el despliegue no necesitan red.
Transcripción de [codexsinaiticus.org](https://codexsinaiticus.org) — uso personal,
educativo y no comercial, con atribución.

### Regenerar desde el wiki (destructivo)

`npm run index:wiki` migra desde el vault de origen y **sobrescribe** `content/estudios/*.md`.
Para no perder las ediciones hechas en `/admin`, el script **aborta** si ya hay estudios.

```bash
npm run index:wiki -- --force   # regenera y guarda un backup en content/.history/
```

---

## Arquitectura (resumen)

- **SPA en GitHub Pages** (`/crux/`): `base` se define con `BASE_PATH`; se emite un `404.html`
  que restaura enlaces profundos vía `sessionStorage` antes de que monte el router.
- **Prerender por ruta** (`plugins/prerender.mjs` + `scripts/routes-lib.mjs`): el build
  escribe `dist/<ruta>/index.html` para las 213 rutas públicas (11 de sección + 184 estudios
  + 1 ficha de libro + 17 fichas de personaje) con el `<title>`, la `description`, el `canonical`, las etiquetas
  `og:*`/`twitter:*` y el JSON-LD de esa ruta ya en el HTML, sin depender de JavaScript.
  `routes-lib.mjs` es la fuente única de rutas y SEO (la comparten el prerender, el sitemap
  y la QA) y el mismo plugin genera `sitemap.xml` (212 URLs indexables, excluyendo `/buscar`) y `robots.txt`.
- **API de contenido** (`plugins/content-api.mjs`): sirve `/api/content/*` para leer en
  desarrollo y en el build; los endpoints de escritura solo existen con `npm run dev`.
- **Rutas de assets**: usa siempre `assetUrl('/img/...')` de `src/lib/assets.js`; las rutas
  `/img/` crudas se rompen en el subpath de Pages.
- **Config del sitio**: `src/lib/site.js` (defaults + `content/site.json`) expone `useSite()`
  y `useSeo()`.

## Estructura

```
Web Crux/
├─ content/              # contenido editable (ver arriba)
├─ docs/proyecto-biblico/ # fuentes, traducción y fichas (memoria de trabajo)
├─ plugins/              # content-api.mjs (API solo-dev)
├─ scripts/              # validación, índice, migración
├─ public/img/           # imágenes (biblioteca de medios)
├─ src/
│  ├─ components/        # componentes reutilizables
│  ├─ data/              # lectores de content/ (estudios, personajes, videos…)
│  ├─ lib/               # site.js, assets.js, markdown, frontmatter
│  └─ pages/             # páginas + Admin/
└─ vite.config.js        # validación de contenido + sitemap/robots en build
```
