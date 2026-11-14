# Rediseño de Crux — plan para el agente de código

Plan completo para implementarlo con **Claude Code (Opus 5.5)** desde la carpeta `Web Crux/`.
Cada fase es un archivo autocontenido: qué cambia, qué archivos tocar, reglas y cuándo está
hecha. Léelo junto con `AGENTS.md` (raíz del repo), que manda sobre cualquier cosa de aquí.

## Cómo usarlo

- **Todo de una vez:** pega en Claude Code el contenido de [`PROMPT.md`](PROMPT.md).
- **Fase a fase:** `/rediseno A`, `/rediseno B`… (comando en `.claude/commands/rediseno.md`).

## Orden de trabajo

| Fase | Archivo | Qué |
|---|---|---|
| 0 | [`fases/00-paso-0-sincronizar-rama.md`](fases/00-paso-0-sincronizar-rama.md) | Trabajar sobre `main` (la portada nueva está ahí) |
| A | [`fases/01-barra-versiculos.md`](fases/01-barra-versiculos.md) | Versículos arriba, en una barra fina con ✕ |
| B | [`fases/02-heroe-nicodemo.md`](fases/02-heroe-nicodemo.md) | Jesús con Nicodemo como fondo del héroe (la cruz 3D se queda) |
| C | [`fases/03-banner-texto-inmediato.md`](fases/03-banner-texto-inmediato.md) | El pie del banner cambia al empezar cada diapositiva |
| D | [`fases/04-temas-por-categoria.md`](fases/04-temas-por-categoria.md) | `content/temas.json` + tema para las 92 fichas de Fundamentos |
| E | [`fases/05-estudio-sidebar-y-vistas.md`](fases/05-estudio-sidebar-y-vistas.md) | Sidebar de temas y tarjetas / lista / carrusel agrupados |
| F | [`fases/06-card-comun.md`](fases/06-card-comun.md) | Una card común, oscura, para todas las vistas de tarjetas |
| G | [`fases/07-erratas-contenido.md`](fases/07-erratas-contenido.md) | Erratas de las fichas |
| H | [`fases/08-biblia-patristica.md`](fases/08-biblia-patristica.md) | Biblia Patrística: Domo y «Acerca de» intactos; línea de tiempo, índice y lector |
| I | [`fases/11-portadas-obras.md`](fases/11-portadas-obras.md) | Portada por autor u obra en el índice de la Biblia Patrística (primera: Ignacio) |
| — | [`fases/09-verificacion.md`](fases/09-verificacion.md) | Comandos de QA y comprobaciones nuevas |
| — | [`fases/10-commits-y-despliegue.md`](fases/10-commits-y-despliegue.md) | Un commit por fase; push solo con confirmación |

## Material de apoyo

- [`datos/temas.json`](datos/temas.json) → se copia tal cual a `content/temas.json` (fase D).
- [`datos/asignacion-fundamentos.json`](datos/asignacion-fundamentos.json) → slug → tema de las
  92 fichas de Fundamentos, generado del índice real (fase D).
- [`referencia/study-card.html`](referencia/study-card.html) → HTML + CSS exactos de la card
  común (fase F). Con `npm run dev` en marcha se ve en
  `http://localhost:5173/docs/rediseno/referencia/study-card.html` (las imágenes salen de
  `public/img/`).
- Diseño visual completo (canvas, privado del autor):
  https://claude.ai/artifact/WAEqySr5L7T3qNHKqUhhNN — páginas Portada, Estudio
  (`Card-Estudio`, `Card-Variantes`, `Estudio-Fundamentos`…) y Biblia Patrística. El agente no
  lo necesita: todo lo que hace falta está en estos archivos.

## Reglas para el agente

1. Trabaja en `Web Crux/` y en `main`; un commit por fase; **no hagas push** sin confirmación.
2. No ejecutes `npm run index:wiki`. No edites `content/estudios.json` ni
   `content/busquedas.json` a mano (se regeneran en `npm run build`).
3. Rutas de imágenes siempre con `assetUrl()`.
4. Scripts que escriben contenido (`asignar-temas-fundamentos.mjs`, `fix-biblia-doc.mjs`):
   simula primero, enseña el resultado y espera confirmación antes de `--write`.
5. Los efectos actuales se mantienen: aparición e inclinación 3D de tarjetas, hover de la
   lista, carrusel cóncavo, cruz 3D, LiquidSwap y DomeGallery.
6. Al final de cada fase: `npm run build`, `npm run qa:vistas`, `npm run qa:a11y` (y la QA
   propia de la fase). Si algo falla, corrígelo antes de seguir.
