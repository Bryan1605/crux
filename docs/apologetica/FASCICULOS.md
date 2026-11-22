# Fascículos de Apologética — guía de trabajo

«Preguntas con la Biblia» (`/apologetica/<slug>`). Esta guía explica cómo se añade, amplía o corrige un fascículo sin romper el build. Todo se ejecuta desde `Web Crux/`.

## Estado actual

| # | Fascículo | Slug | Preguntas | Pestaña doctrinal | Estado |
|---|---|---|---|---|---|
| I | Shincheonji | `shincheonji` | 100 (10 bloques) | «¿Qué cree Shincheonji?» (Lee Man-hee, bilingüe) | Publicado |
| II | Adventismo | `adventismo` | 50 (6 bloques) | Pendiente | Publicado (1 pestaña) |
| III | Catolicismo Romano Papista | `catolicismo-romano` | — | — | Próximamente |
| IV | Dispensacionalismo | `dispensacionalismo` | 50 (6 bloques) | «¿Qué enseña el dispensacionalismo?» (Pentecost, 24 citas) | Publicado |
| V | Gnósticos | `gnosticos` | — | — | Próximamente |

## Piezas de un fascículo

| Pieza | Archivo | Quién lo escribe |
|---|---|---|
| Registro (SEO, búsqueda, conteos) | `src/lib/apologeticaSeo.js` → `APOLOGETICA_FASCICULOS` | a mano |
| Tarjeta de la portada | `src/data/apologetica.js` | a mano |
| Preguntas (fuente) | `scripts/apologetica-data/<slug>.mjs` | a mano |
| Preguntas hidratadas | `content/apologetica/<slug>-preguntas.json` | **generado** |
| Palabras clave resaltadas | `content/apologetica/<slug>-claves.json` | a mano, verificado |
| Doctrina con fuente primaria (opcional) | `content/apologetica/<slug>-doctrina.json` | a mano, verificado |
| Página | `src/pages/<Nombre>.jsx` (envuelve `ApologeticaFasciculo`) | a mano |
| Ruta | `src/App.jsx` (lazy, un chunk por fascículo) | a mano |

No edites a mano `*-preguntas.json`, `content/busquedas.json` ni `content/estudios.json`.

## Flujo para un fascículo nuevo

1. **Fuentes primero.** Reúne los estudios propios (`D:\Biblia\plan-apologetica`, wiki `06-apologetica`) y, para la pestaña doctrinal, la obra oficial del movimiento (PDF/texto). Sin fuente primaria verificable → fascículo de una sola pestaña. No se inventan citas, páginas, fechas ni consensos.
2. **Redacta** `scripts/apologetica-data/<slug>.mjs`: `{ actualizado, reglas, bloques: [{ id, titulo, preguntas: [{ n, texto, clave }] }] }`. Las referencias bíblicas se extraen del `texto` (`Libro cap:v`); usa `refs`/`claveRefs` solo para afinar.
3. **Hidrata**: `node scripts/build-apologetica.mjs --slug <slug> --write`. Copia NTV y griego del Codex desde `public/textos/exegesis/`, añade notas de numeración LXX y **falla** si hay un desfase sin mapear (Salmos ≥10, Jeremías ≥25, Joel ≥2, Malaquías ≥3, Ester). Si falla, comprueba el capítulo real en `codex/<libro>.json` y añádelo a `resolveLxxEquiv()`.
4. **Palabras clave** (`<slug>-claves.json`): una entrada por pregunta y referencia; `es` = frase literal de la NTV; `grc` = palabras seguidas del Codex (sigma lunada `ϲ`, sin `‹›`), solo si la referencia tiene griego. Copia las subcadenas del JSON generado, no de memoria. Reejecuta el paso 3 hasta tener «Claves OK».
5. **Doctrina (opcional)**: citas literales con `paginas`; si el libro está en español basta `es` (se pinta a ancho completo); si es otro idioma, `en` + `es` con los mismos tramos `…`. `autorCitado` cuando el autor cita a otro. Cada `biblia.cita.texto` y `b.cita` debe estar literal en la NTV (lo comprueba el paso 3).
6. **Regístralo** en `APOLOGETICA_FASCICULOS` (slug, path, archivos, `expectedCount`, `expectedBlocks`, `seo`, `search`) y crea `src/pages/<Nombre>.jsx` + la ruta en `App.jsx`.
7. **Activa la tarjeta** (`estado: 'disponible'`, `href`, `footRight` con el conteo real de temas/citas).
8. **Verifica** (ver abajo). Añade el slug a `scripts/qa-apologetica.mjs` y a `qa-a11y` / `qa-enlaces` / `check-prod` si procede.

## Convenciones editoriales

- Tono respetuoso, firme con el texto, sin apodos ni burla («BRUTI», etc. no entran a la web).
- Incluir `equidad` («Para ser justos»): lo que el movimiento sí afirma de la fe cristiana histórica, antes de examinar lo distintivo.
- Sin generalizaciones contra pueblos (nota especial en escatología/Israel: distinguir el juicio del año 70 de cualquier juicio sobre el pueblo judío).
- NTV tiene derechos (Tyndale House Foundation): nunca etiquetar otra traducción como NTV. El Codex se usa con la atribución del Codex Sinaiticus Project.
- Pasajes del AT sin Codex (Éxodo, Daniel, Ezequiel, Oseas, Amós, Miqueas, Samuel, Reyes…) muestran solo NTV con aviso honesto: es esperado.

## Pendientes conocidos

- **Adventismo, pestaña 2** («¿Qué enseñan los adventistas?»): requiere texto oficial (*28 Creencias Fundamentales* y/o Ellen G. White) con página. Hasta entonces, la página enlaza al estudio `/estudio/06-apologetica--origenes-usa--03-adventismo`.
- **Catolicismo** y **Gnósticos**: fuentes sugeridas — Catecismo (CIC) con numeración de párrafo y Padres apostólicos; Nag Hammadi (traducción citada con edición/página) y Ireneo, *Contra las herejías*.
- Si se añade una pestaña doctrinal a un fascículo existente: poner `doctrinaFile` en el registro, importar el JSON en su página y pasar `doctrina` a `ApologeticaFasciculo` (aparecen solas las pestañas).

## Verificación antes de dar por terminado

```bash
node scripts/build-apologetica.mjs --write   # datos, NTV/Codex, claves, doctrina
npm run build                                # contentGuard, índices, prerender, sitemap
npm run check:search                         # entradas de búsqueda
# con `npm run dev` en marcha:
npm run qa:shincheonji && npm run qa:apologetica
npm run qa:buscar && npm run qa:a11y && npm run qa:vistas && npm run qa:enlaces
```

Notas de entorno (Windows): `node`/`npm` viven en `nvm4w`; en el sandbox puede hacer falta ejecutar con permisos fuera del sandbox. Si `qa:vistas`/`qa:enlaces` fallan en `/` con `504 Outdated Optimize Dep`, es el optimizador de Vite en frío: precalienta las rutas y repite. Los fallos `UND_ERR_CONNECT_TIMEOUT` hacia `codexsinaiticus.org` son externos.
