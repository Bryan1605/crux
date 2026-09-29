---
title: "Guía de Notebook Navigator 3 (NN3)"
category: "07-herramientas"
description: "Reemplaza el explorador de archivos por defecto de Obsidian por un panel de dos paneles (árbol + lista) con vista previa, búsqueda, calendario, etiquetas (tags), propiedades, carpetas de…"
tags: ["wiki/herramientas", "obsidian", "notebook-navigator"]
aliases: []
updated: "2026-09-26"
---

# Guía de Notebook Navigator 3 (NN3)

## ¿Qué es?

Reemplaza el explorador de archivos por defecto de Obsidian por un panel de dos paneles (árbol + lista) con vista previa, búsqueda, calendario, etiquetas (tags), propiedades, carpetas de notas y atajos. Desarrollado por **Johan Sanneblad** (v3.3.4 instalada, GPL-3.0).

> Conexión: NN3 filtra y organiza la wiki sin alterar los archivos fuente.

## Atajos de teclado core (v3)

| Acción | Tecla |
|---|---|
| Mover arriba/abajo en la lista archivos | `↑` / `↓` |
| Página arriba/abajo | `PgUp` / `PgDn` |
| Ir al inicio / final de lista | `Home` / `End` |
| Renombrar | `F2` |
| Colapsar carpeta / ir a padre | `←` |
| Expandir carpeta / pasar a lista | `→` |
| Ir de lista → una vez en archivo | `Tab` |
| Volver a la barra lateral | `Shift+Tab` |
| Multi-seleccionar | `Cmd/Ctrl` + clic |
| Abrir en pestaña nueva | `Cmd/Ctrl+Enter` |
| Seleccionar todo | `Cmd/Ctrl+A` |
| Borrar | `Supr` / `Retroceso` |
| Orden manual arriba/abajo | `Cmd/Ctrl+↑/↓` |

> Reconfigurables en **Settings → Hotkeys** (los atajos se guardan en `data.json` bajo `keyboardShortcuts`).

## Sintaxis de búsqueda (Omnisearch / filtros)

NN3 mantiene su propia barra de búsqueda con filtros:

- **Tags**: escribe el tag precedido de `#` (ej. `#shincheonji`).
- **Propiedades**: `clave=valor` (ej. `ver=` bíblica).
- **Ruta**: `path:` o escribiendo la carpeta.
- **Exclusión**: prefijo `-` (ej. `-shincheonji`).
- **Vista rápida**: en cualquier nota, `Ctrl+F` busca dentro del archivo.

## Carpetas de notas (Folder Notes)

NN3 permite asociar una nota índice a cada carpeta. En esta wiki está habilitado con el patrón de nombre `_index`, de modo que:

- `wiki/09-parabolas/_index.md` se abre al hacer clic en la carpeta.
- Cada carpeta del wiki tiene su propia nota-índice.
- Para crear una nueva carpeta con nota: clic derecho → **Create folder with note**.

## Calendario

- Actívalo con el ícono de calendario en la barra del navegador de NN3 o desde **Settings → Calendar**.
- Integrado con **Daily Notes**: crea notas del día en `Periodic Notes/Daily` con la plantilla de Obsidian.
- Vista anual y semanas con tareas pendientes (para tu ciclo de estudio diario).

## Descendants (detalle descendiente)

- Con **Descendants** activado, una carpeta muestra también las notas de sus subcarpetas (ver en **List pane settings → Include descendant notes**).
- Útil para `06-apologetica/` (con subcarpeta `origenes-usa`).

## Shortcuts / Favoritos

Configuración de atajos guardada en `vaultProfiles[0].shortcuts` (tipo `note`, `folder`, `search`, `tag`, `property`). Creados para este vault:

- Notas: `home.md`, `tasks-dashboard.md`, `wiki/_index.md`, `wiki/_log.md`
- Carpetas: `wiki/01-fundamentos`, `wiki/06-apologetica`, `wiki/09-parabolas`, `wiki/10-apocalipsis`
- Búsquedas: `apocalipsis`, `silencio`

Añade más: rol derecho en carpeta/nota → **Add to shortcuts**, o editar `data.json`.

## Colores e iconos por carpeta

Definidos en `folderColors` / `folderIcons` (valor por carpeta). Mapa actual:

| Carpeta | Icono | Color |
|---|---|---|
| `wiki` | `lucide-library` | `#4472C4` |
| `00-portada` | `lucide-dashboard` | `#E6A23C` |
| `01-fundamentos` | `lucide-book-open` | `#2E75B6` |
| `02-libros-biblicos` | `lucide-scroll` | `#7F7F7F` |
| `03-personajes` | `lucide-users` | `#548235` |
| `04-doctrinas` | `lucide-cross` | `#7030A0` |
| `05-estudios` | `lucide-graduation-cap` | `#00B0F0` |
| `06-apologetica` | `lucide-shield` | `#C00000` |
| `07-herramientas` | `lucide-wrench` | `#808080` |
| `08-recursos` | `lucide-folder-down` | `#A0522D` |
| `09-parabolas` | `lucide-message-square` | `#ED7D31` |
| `10-apocalipsis` | `lucide-flame` | `#B22222` |

## Homepage / Home

NN3 tiene su propio homepage: en **General → Homepage** configurado para `home.md`. Al abrir Obsidian se muestra el dashboard home.md.

## Estructura del archivo de configuración

`data.json` (en `.obsidian/plugins/notebook-navigator/`) usa el esquema de la v3 (`NotebookNavigatorSettings`). Las claves relevantes para este vault:

- `homepage.source: "file"` y `homepage.file: "home.md"`
- `vaultProfiles[0].shortcuts`: atajos
- `folderIcons` / `folderColors` / `folderBackgroundColors`
- `folderAppearances`: apariencia de lista por carpeta (modo, preview, tags)
- `searchProvider: "omnisearch"`
- `calendarIntegrationMode: "daily-notes"`
- `includeDescendantNotes: true`
- `previewProperties: ["updated"]`

## Solución de problemas

- **Sin vista previa**: activa **Show file preview** en Notes settings (2-3 filas recomendadas).
- **Texto ilegible en consola**: es solo la consola de Windows; los archivos están en UTF-8 correcto.
- **Homepage no abre `home.md`**: revisa **General → Homepage → file**; si el plugin Homepage está activo y abierto en otra pestaña, este configurado también.
- **Calendario no muestra notas diarias**: elige `Calendar integration mode = Daily notes` (ya configurado) y crea una nota del día.
- **Cambios en `data.json` no se aplican**: reinicia Obsidian (NN3 lee la configuración al iniciar el plugin).
