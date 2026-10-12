# Crux

Sitio de estudios bíblicos: fichas de estudio, Biblia Patrística, videos y personajes.
Este repositorio contiene **dos proyectos**:

| Ruta | Qué es | Build | Deploy |
|------|--------|-------|--------|
| `/` (raíz) | Portafolio estático en HTML/CSS/JS | ninguno | — |
| `/Web Crux` | SPA en React 19 + Vite + Three.js | Vite | GitHub Pages (`/crux/`) |

Todo lo de abajo se ejecuta **desde la carpeta `Web Crux/`**.

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
```

---

## Panel de edición (`/admin`)

El panel de administración **solo existe en desarrollo** (`npm run dev`). Se abre en:

```
http://localhost:5173/admin
```

Desde ahí se puede editar casi todo el sitio sin tocar código:

- **Estudios** — ficha (frontmatter) + contenido en Markdown, con vista previa.
- **Personajes** — ficha completa: portada, escenas, biografía, línea de tiempo.
- **Videos** — parrilla de YouTube (con miniatura de comprobación).
- **Banner** — imágenes, texto y enlace de la portada.
- **Versículos** — frases del marquee.
- **Anuncios** — barra de anuncios (activar, cerrar, items).
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
   GH_REPO=bryan1605/Portafolio
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
| `content/site.json` | Marca, menú, pie, copy de portada y SEO. |
| `content/videos.json` | Parrilla de videos. |
| `content/slides.json` | Imágenes del banner de portada. |
| `content/versiculos.json` | Frases del marquee. |
| `content/anuncios.json` | Barra de anuncios. |
| `content/textos/biblia-patristica.md` | Texto de la Biblia Patrística (se carga bajo demanda). |

`content/estudios.json` se regenera automáticamente en cada `build` (y al editar desde el
panel). No lo edites a mano.

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
- **API de contenido** (`plugins/content-api.mjs`): en desarrollo sirve `/api/content/*`
  para leer y escribir. Solo se registra en `npm run dev`.
- **Rutas de assets**: usa siempre `assetUrl('/img/...')` de `src/lib/assets.js`; las rutas
  `/img/` crudas se rompen en el subpath de Pages.
- **Config del sitio**: `src/lib/site.js` (defaults + `content/site.json`) expone `useSite()`
  y `useSeo()`.

## Estructura

```
Web Crux/
├─ content/              # contenido editable (ver arriba)
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
