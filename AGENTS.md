# AGENTS.md — Web Crux

Guía operativa para trabajar en **`Web Crux/`**. Todo se ejecuta desde esta carpeta; no desde el portafolio de la raíz.

> El `../AGENTS.md` es un resumen del portafolio completo y puede quedar desfasado.
> Para Web Crux mandan este archivo, `package.json` y los scripts. El proyecto
> bíblico tiene su propia memoria en **`docs/proyecto-biblico/`**.

## Arranque

```bash
cd "Web Crux"
npm install
npm run dev        # http://localhost:5173/  (panel /admin solo en dev)
```

- Node 20+.
- Windows: `dev.bat` (o `dev.bat noopen` para no abrir el navegador).
- Stack real: React 19, Vite 8, React Router 7, Three.js (`@react-three/fiber`,
  `drei`, `rapier`), GSAP, Motion, `marked`, Hugeicons, `sharp`, `puppeteer-core`,
  `axe-core`. No hay Zustand ni `ogl` en este proyecto.

## Comandos que importan

| Comando | Qué hace |
|---|---|
| `npm run build` | Build de producción. Valida contenido, regenera índices, prerenderiza las rutas y escribe `sitemap.xml`/`robots.txt`. Falla a propósito con JSON inválido o sin la imagen OG. |
| `npm run preview` | Sirve `dist/` para probar el build. |
| `npm run exegesis` | Regenera **todo** lo de `public/textos/exegesis/`: NTV, Codex, índice, buscadores AT/NT, lemas y léxico. No lo ejecuta el build. |
| `npm run qa` | Suite completa; **requiere `npm run dev` en otra terminal** y Chrome instalado. Incluye `qa:lexico` (el README a veces lo omite). |
| `npm run qa:prod` | Audita el sitio publicado; `CRUX_BASE` para otra URL. |
| `npm run qa:a11y` | axe-core + objetivos táctiles. Falla con `critical`/`serious`, o táctil < 24 px; avisa entre 24 y 44 px. |
| `npm run qa:exegesis` / `qa:biblia` / `qa:audio` | Incluyen navegador real; necesitan el dev server. |
| `npm run exegesis:ntv` / `:codex` / `:index` / `:search` / `:lemas` / `:lexico` | Pasos sueltos, en ese orden si se hacen a mano. |
| `npm run exegesis:trad` | Valida y publica las traducciones de trabajo (`src/assets/texts/trad/` → `public/textos/exegesis/trad/`). No está dentro de `exegesis`; después, `exegesis:index`. |
| `npm run qa:trad` | QA de la traducción (datos + navegador); necesita el dev server. Va dentro de `npm run qa`. |
| `node scripts/optimize-images.mjs` | Pasa las fuentes de `src/assets/imgs/` a `.webp` en `public/img/`. |
| `node scripts/build-audio-peaks.mjs` | Recalcula las ondas de `content/narraciones.json` (usa Chrome). |
| `node scripts/fix-biblia-doc.mjs --file <ruta> [--write]` | Simula/limpia el documento de la Biblia Patrística. Sin `--write` solo informa. |
| `npm run index:wiki` | Migración destructiva desde el wiki; pide `--force` si ya hay estudios y guarda backup en `content/.history/`. |
| `npm run og` | Regenera `public/img/og/crux.jpg`; el build lo exige. |

- Los QA de navegador dejan informes/capturas en `%TEMP%\opencode\crux`.
- Los scripts tienen Chrome fijado en `C:\Program Files\Google\Chrome\Application\chrome.exe`. Si no está ahí, instálalo o ajusta el script; no hay variable de entorno para eso.
- `CRUX_BASE` sirve para auditar otra base, p. ej. `CRUX_BASE=https://bryan1605.github.io/crux`.
- `CRUX_A11Y_TAGS`, `CRUX_TAP_MIN` (44) y `CRUX_TAP_BLOCK` (24) ajustan la auditoría.

## Arquitectura (lo que no se ve en los nombres)

- **SPA en GitHub Pages con subpath `/crux/`**. `BrowserRouter` usa `basename={import.meta.env.BASE_URL}`. Todo archivo estático debe pasar por `assetUrl()` de `src/lib/assets.js`; un `/img/...` crudo rompe en Pages.
- **Doble estrategia para rutas profundas**: `404.html` guarda la ruta en `sessionStorage` y `src/main.jsx` la restaura antes de montar el router. Además, `plugins/prerender.mjs` escribe `dist/<ruta>/index.html` para las rutas públicas con su título, descripción, canonical y OG.
- **Rutas y SEO**: `scripts/routes-lib.mjs` es la fuente única. Al añadir una ruta hay que registrarla ahí; el `sitemap`, el prerender y `qa:prod` la leen. Los títulos/descripciones deben coincidir literalmente con `useSeo()`.
- **Contenido**: `content/` se sirve por `plugins/content-api.mjs` (`/api/content/*`). Solo `configureServer` (dev) tiene escritura; en build no existe. `/admin` está gateado con `import.meta.env.DEV` en `src/App.jsx`.
- **Validación**: `vite.config.js` ejecuta `contentGuard` y `writeIndexes()`: valida `site`, `videos`, `slides`, `versiculos`, `anuncios`, `categorias`, `concilios`, `narraciones`, `lexico`, personajes y timeline, y regenera `content/estudios.json` y `content/busquedas.json`. No edites esos dos a mano.
- **Exégesis**: `src/data/exegesis.js` es la tabla canónica de los 73 libros (`id` estable, `codexNo` solo si el Codex lo conserva). `public/textos/exegesis/{ntv,codex,lemas}/`, `index.json`, `buscar-at.json`, `buscar-nt.json` y `lexico.json` son **generados y versionados**; las fuentes están en `src/assets/texts/` y las cachés en `.cache-codex/`/`.cache-lexico/` (ignoradas). No edites los JSON generados a mano.
- **NTV**: el volcado de `src/assets/texts/nueva-traduccion-viviente.md` viene de un ePub/PDF con ruido, encabezados, notas y versículos fusionados. El parser frágil es `scripts/exegesis-lib.mjs` + `scripts/build-ntv.mjs`: corregir el parser y regenerar, nunca “arreglar” el JSON de salida. `qa:exegesis`/`qa:biblia` detectan regresiones.
- **Griego**: `src/lib/greek.js` define el tokenizador y el plegado que comparten la UI, los lemas y el léxico. Si lo cambias, `qa:lexico` es obligatorio.
- **2 Esdras** no es el 2 Esdras apocalíptico: es Esdras–Nehemías griego del Codex (caps. 9–23). No tiene NTV; su ficha sí existe.
- **Numeración**: Salmos (incluye Sal 151), Jeremías, Ester y los libros solo-Codex no coinciden con la NTV. Usa los avisos existentes; no fuerces la numeración de la NTV.
- **Config del sitio**: `content/site.json` + `src/lib/site.js` (`useSite`, `useSeo`); la navegación y el pie se editan ahí, no en los componentes.
- **Publicar**: botón «Publicar» en `/admin` (commit+push con `GH_TOKEN`/`GH_REPO` de `.env.local`) o push a `main`. El workflow `.github/workflows/pages.yml` construye con `BASE_PATH=/crux/`. El primer deploy exige Settings → Pages → Source: GitHub Actions.

## Gotchas

1. **No ejecutes comandos de Web Crux desde `Portafolio/`**: son dos proyectos distintos.
2. **`BASE_PATH` solo se define en CI**. En local es `/`; no lo hardcodees.
3. **`assetUrl()` es obligatorio** para `/img/` y `/textos/`; los enlaces internos usan el router o el base.
4. **`/admin` no existe en producción** y no tiene autenticación; no lo uses como API pública.
5. **No borres ni reescribas contenido del usuario** sin revisar. Los backups del panel viven en `content/.history/` (ignorado).
6. **Imágenes**: los JPG/JPEG de `src/assets/imgs/` no se versionan (están en `.gitignore`); lo publicado son los `.webp` de `public/img/`. `qa:imagenes` comprueba que toda referencia `/img/...` responde 200.
7. **Audio**: `content/narraciones.json` valida que el `.ogg` y el `.peaks.json` existan; las ondas se generan con Chrome, no en el navegador.
8. **El build es el gate**: si cambias contenido, `npm run build` debe pasar. Si cambias UI/rutas, además `qa:vistas`, `qa:enlaces` y `qa:a11y`.
9. **No hay página de privacidad, cookies ni analítica**; el sitio no las necesita. No añadas banner ni ruta legal.
10. **No toques el portafolio de la raíz** (`index.html`, `css/`, `js/`, etc.) para resolver algo de Web Crux.
11. **No reformatees `public/textos/biblia-patristica.md`** ni los textos fuente sin necesidad; `qa:biblia` verifica su geometría y contenido.
12. **NTV es una traducción con derechos** (Tyndale House Foundation). No la trates como dominio público ni etiquetes una traducción nueva como NTV. Las traducciones nuevas del Codex son obras derivadas con **CC BY-NC-SA 3.0** y etiqueta «Traducción de trabajo · Borrador».
13. **El proyecto bíblico tiene reglas propias**: antes de tocar hebreo, traducciones o fichas, lee `docs/proyecto-biblico/README.md`. No inventes fechas, consensos ni fuentes.

## Antes de terminar

- Contenido/JSON: `npm run build`.
- Exégesis/traducción: `npm run exegesis` + `npm run qa:exegesis` + `npm run qa:lexico`.
- UI/rutas: `npm run qa:vistas` + `npm run qa:enlaces` + `npm run qa:a11y`.
- Publicado: `npm run qa:prod`.
- Reporta los comandos ejecutados y su resultado; no afirmes que está verde sin haberlo corrido.
- Si cambias una decisión del proyecto bíblico, actualiza `docs/proyecto-biblico/ESTADO.md` y `DECISIONES.md`.
