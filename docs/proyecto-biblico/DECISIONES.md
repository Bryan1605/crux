# Decisiones del proyecto bíblico

Registro de las decisiones que no deben cambiarse por accidente. Si una decisión
cambia, edita esta página y `ESTADO.md`; no la cambies solo en el código.

Las decisiones se tomaron en la planificación de **octubre de 2026**. Donde hay
una cifra, se verificó en el árbol de trabajo el **2026-10-28**.

## 1. Hebreo

| Decisión | Detalle | Estado |
|---|---|---|
| Fuente | OSHB (`openscriptures/morphhb`, rev. `db6c5c9`, `2026-11-14`) sobre WLC; WLC dominio público, marcado OSHB CC BY 4.0 | implementado (Fase 1) |
| Cobertura | 39 libros del AT, **929** capítulos, **23.213** versículos, **305.499** palabras (`6,47 MB`) | implementado (Fase 1) |
| Arameo | **269** versículos (**4.828** palabras) marcados **palabra por palabra**; Daniel 2:4–7:28, Esdras 4:8–6:18 y 7:12–26, Génesis 31:47, Jeremías 10:11 | implementado (Fase 1) |
| Ketiv/qere | **1.260** casos (`1.245` K+Q, `6` solo K, `9` solo Q), visibles sin convertir el texto en reconstrucción | implementado (Fase 1) |
| Lector | `/biblia/hebreo`, RTL, tipografía **Ezra SIL 2.51** (`SILEOT.woff`, SIL OFL 1.1) | implementado (Fase 1) |
| Normalización | `normalization: "none"` — no normalizar NFC/NFD sin decisión explícita | implementado (Fase 1) |
| Alineación | **789 / 929** capítulos con alineación exacta NTV; los **140** restantes avisan en el lector y en `/exegesis` caen a texto hebreo sin forzar el paralelo | implementado (Fase 2) |
| Exegesis | columna hebrea **apagada por defecto** (`א Hebreo` / `?hebreo=1` / `?modo=hebreo`); no fuerza paralelo si no alinea; `.exg-grid--3` para 3 testigos | implementado (Fase 2) |
| Rutas/versión | Ruta `#289` (`/biblia/hebreo`) + columna en `/exegesis` + lematización y léxico hebreo/arameo (`0.13.0`) | implementado (0.13.0) |

Por qué: el hebreo es el texto base del AT y permite comparar la NTV con el
testimonio hebreo, pero la alineación no es total. Marcar el arameo y el
ketiv/qere evita presentar una reconstrucción como si fuera el texto recibido.

## 2. Traducción de los libros solo-Codex

| Decisión | Detalle | Estado |
|---|---|---|
| Libros | Tobit, Judit, Sabiduría, 4 Macabeos, 1 Macabeos, Sirácida | implementado (borrador) |
| Total | 3.761 versículos; 67.487 palabras griegas | verificado |
| 2 Esdras | **no se traduce**: es Esdras–Nehemías griego del Codex, ya cubierto por la NTV | decidido |
| Salmo 151 / Joel 4 | se traducen después de Tobit, como pasajes especiales (7 y 21 vv) | decidido |
| Base | griego del Codex (`public/textos/exegesis/codex/<libro>.json`) | decidido |
| Aparato | no se traduce; se conserva en griego | decidido |
| Lagunas | no se rellenan; se traduce lo que hay y se anota | decidido |
| Versículos vacíos | prohibidos | decidido |
| Etiqueta | «Traducción de trabajo · Borrador»; columna «Trad» | decidido |
| Licencia | CC BY-NC-SA 3.0, obra derivada del Codex, con atribución | decidido |
| NTV | nunca se etiqueta una traducción nueva como NTV | decidido |
| Método | borrador asistido + revisión del usuario; el usuario aprueba `revisado` | decidido |
| Piloto | Tobit primero | decidido |
| UI | modo `paralelo` = Codex × Trad en libros solo-Codex; `?modo=trad` = solo traducción; `codex` = solo Codex | propuesto |
| Admin | sin editor en `/admin` para el piloto | decidido |
| Archivos | `src/assets/texts/trad/<id>.json` → `public/textos/exegesis/trad/<id>.json` | propuesto |
| QA | `qa:trad` + `qa:exegesis` + `qa:lexico` | implementado (qa:trad) |

Por qué: la NTV no cubre estos libros y el Codex es el único testigo griego
completo del sitio. Traducir el aparato o rellenar lagunas crearía una falsa
sensación de texto completo. La licencia del Codex obliga a compartir igual y a
no usar comercialmente.

## 3. Fichas de los 73 libros

| Decisión | Detalle | Estado |
|---|---|---|
| Cobertura | **73 libros**: 66 NTV + 7 solo-Codex | decidido |
| Extensión | **600–900 palabras** de cuerpo, sin ficha técnica ni fuentes | decidido |
| Enfoque | histórico y literario, neutral; no catequesis ni apologética | decidido |
| Capas | texto / tradición / estudio separados; etiquetas `[Tradición]` y `[Estudio]` | decidido |
| Fechas | rangos y certeza; narrativa vs composición | decidido |
| Debates | 2–3 posiciones cuando haya debate real; si no, no inventarlo | decidido |
| Fuentes | 3–5 fuentes reales por ficha; sin citas inventadas | decidido |
| Canon | judío, católico, ortodoxo y protestante, sin homogeneizar | decidido |
| UI | panel en NTV/Hebreo/Exegesis + página `/biblia/libros/<id>` + índice `/biblia/libros` | decidido |
| Datos | `content/libros/<id>.json` → `public/textos/libros/`; índice compartido | propuesto |
| Rutas | 214 → 215 con hebreo → 216 con el índice → 223 con las 7 fichas → 289 con las 73 | decidido |
| Orden | primero los 7 solo-Codex; después los 66 NTV | decidido |
| Comentarios por capítulo | fase futura; no inflan la ficha | decidido |
| Admin | sin editor en la primera fase; JSON + validador | decidido |
| 2 Esdras | ficha sí; explicar que es Esdras–Nehemías griego, no 4 Ezra | decidido |

Por qué: las fichas son la puerta de entrada al lector y deben servir tanto para
un lector confesional como para uno no confesional. 600–900 palabras permiten
contexto y debates sin convertirlas en comentarios. Las 7 fichas solo-Codex son
las más urgentes porque no tienen NTV que las explique.

## 4. Canon, búsqueda y numeración

| Decisión | Detalle | Estado |
|---|---|---|
| Canon del sitio | 73 libros: 66 NTV + 7 solo-Codex | existente |
| 2 Esdras | Esdras–Nehemías griego del Codex (caps. 9–23), no 2 Esdras/4 Ezra | existente |
| Búsqueda | índices AT/NT separados; no se busca el hebreo hasta que exista | existente |
| Numeración | avisos para Salmos (incl. 151), Jeremías, Ester y solo-Codex; no forzar la NTV | existente |
| Léxico | NT (`MorphGNT / TBESG`, `252` + `5.077` Strongs) y AT hebreo/arameo (`OSHB / TBESH`, `331` + `8.200` Strongs); sin lematización LXX | implementado (0.13.0) |
| NTV | 66 libros; los deuterocanónicos no están en la NTV | existente |

## 5. Reglas de contenido y publicación

| Decisión | Detalle | Estado |
|---|---|---|
| No inventar | fechas, consensos, citas, fuentes, variantes | decidido |
| Etiquetas | `[NTV]`, `[Tradición]`, `[Estudio]` | decidido |
| NTV | traducción con derechos; no es dominio público | decidido |
| Biblia Patrística | preservar el texto y su geometría; no reformatear sin necesidad | decidido |
| Portafolio raíz | no tocarlo para resolver Web Crux | decidido |
| Privacidad/cookies | no añadir página ni banner; el sitio no recoge datos | decidido |
| Build | `npm run build` es el gate; QA antes de publicar | decidido |
| Datos generados | no editar a mano `public/textos/exegesis/`, `estudios.json` ni `busquedas.json` | decidido |

## 6. Orden del proyecto

**Vigente desde 2026-10-31** (aprobado por el usuario):

1. Refactor de columnas de `/exegesis` (modos por testigo).
2. Tobit (traducción + ficha + panel + índice + registro de fuentes).
3. Judit, Sabiduría, 4 Macabeos, 1 Macabeos, Sirácida y ficha de 2 Esdras.
4. Hebreo, fase 1 (solo texto y marcas; sin lema ni morfología).
5. Hebreo, fase 2 (exegesis + alineación + 0.12.0).
6. Las 66 fichas de la NTV, por lotes.
7. Comentarios por capítulo (futuro).

Por qué: los libros solo-Codex dejan hoy a `/biblia/ntv` sin texto, y Tobit es
un tramo vertical pequeño que fija el esquema de traducción y de fichas. El
hebreo es independiente, aún sin datos descargados y más arriesgado. `trad` y
`hebreo` añaden columnas a `/exegesis`: el modelo de columnas se cambia una sola
vez, antes. Las fuentes de las fichas salen de un registro verificado
(`content/libros/fuentes.json`, propuesto): cada ficha cita claves y el
validador rechaza las inexistentes.

**Reemplazado:** el orden anterior (hebreo fase 1 y 2 antes de Tobit). El total
de rutas (289) no cambia; la versión 0.12.0 sigue reservada al hebreo.

## 7. Decisiones de implementación abiertas

Estas no cambian el objetivo, pero hay que resolverlas al implementar y anotar
la elección:

- ~~**Modos de exegesis**~~ — **resuelto el 2026-11-02** (ver §9).
- **Esquema de ficha**: los campos de `FICHAS.md`/`PLANTILLA-FICHA.md` son una
  propuesta; si se añaden campos (por ejemplo, `related`), validarlos y
  documentarlos.
- ~~**Índice de fichas**~~ — **resuelto el 2026-11-04**: `/biblia/libros` lista
  los 73 libros de la tabla canónica; los que tienen ficha enlazan (también en
  `borrador`, con la etiqueta visible) y los demás dicen «Ficha en preparación».
  Filtros: todos, AT, NT y «con ficha» (el filtro por canon espera a que haya
  más fichas, porque el canon solo consta en las fichas escritas).
- **Revisión**: cómo marca el usuario una traducción/ficha como `revisado`
  (comentario, commit, checklist firmado). Hasta entonces, `borrador`.
- ~~**Hebreo**~~ — formato y lector verificados el **2026-11-22** (ver §11); **Fase 2 completada el 2026-11-23** con columna apagada por defecto, paralelo 2/3 columnas y fallback sin paralelo forzado en `/exegesis`, versión **`0.12.0`** (ver §12). Quedan para una fase futura la lematización y diccionario morfológico hebreo/arameo del AT.
- **Audio**: la fuente/licencia de los `.ogg` no está documentada; no ampliar
  narraciones sin resolverlo.

## 8. Cómo cambiar una decisión

1. Comprueba que el usuario lo aprueba.
2. Edita esta página: añade la decisión nueva y marca la anterior como
   reemplazada (no la borres).
3. Actualiza `ESTADO.md` y el documento afectado (`TRADUCCION.md`, `FICHAS.md`,
   `FUENTES.md`, `README.md`).
4. Si toca código, actualiza rutas, validadores y QA.
5. Ejecuta el build y los QA.
6. Dilo en la entrega: qué cambió, por qué y qué falta.

## 9. Columnas de `/exegesis` por testigo

**Decidido e implementado el 2026-11-02.**

- `src/pages/Exegesis.jsx` ya no tiene `MODES` fijos. Hay una lista `COLUMNS`
  (hoy `codex` y `ntv`, en ese orden) y `modesFor(disponibles)` deriva los modos
  de cada capítulo: `paralelo` (todas las columnas disponibles, solo si hay dos o
  más) y uno por testigo (`codex`, `ntv`).
- El id de la columna es la clave del versículo en la fila (`row.codex`,
  `row.ntv`) y el sufijo de las clases (`exg-row__cell--<id>`,
  `exg-grid__witness--<id>`). La cabecera y la celda se pintan con
  `renderHead(id)` y `renderCell(id, row)`.
- **Añadir un testigo** (p. ej. `trad` para Tobit, después `hebreo`): una
  entrada en `COLUMNS`, su `renderHead`/`renderCell`, su clave en las filas y su
  disponibilidad en `availableColumns`. Botones, modos y rejilla salen solos. Con
  tres columnas el paralelo se llama «Todas las columnas».
- **Modo guardado** (`crux.exegesis.columnas`): se migra `dos`/`uno`, un valor
  desconocido vuelve a `paralelo` y, al pintar, se valida contra los testigos
  del capítulo (si no está, se usa el primero disponible) **sin sobrescribir**
  la preferencia. `qa:exegesis` lo comprueba.
- Lo que ve el usuario no cambia: mismos botones, etiquetas y clases.

**2026-11-04**: entra la tercera columna, `trad` (Tobit 1–3). Va después de
`codex` y `ntv`; como ningún libro tiene NTV y Trad a la vez, en la práctica el
paralelo es Codex × NTV o Codex × Trad. `?modo=<id>` en la URL manda sobre la
preferencia guardada sin sobrescribirla.

**2026-11-23**: entra la columna `hebreo` en `COLUMNS` de `/exegesis` (ver §12),
**apagada por defecto** (`readMode()` ignora `'hebreo'` guardado si no media
`?hebreo=1`, `?modo=hebreo` o el botón `א Hebreo`). Cuando un capítulo del AT
alinea 1:1 con la NTV (`ntvAligned: true`), permite 2 columnas (`Hebreo × NTV`)
o 3 columnas (`.exg-grid--3`, `Hebreo × Codex × NTV`); si no alinea (`140 / 929`
capítulos), cae a solo Hebreo sin forzar el paralelo.

## 10. Léxico V2 multi-idioma y mapas de lemas compactos

**Decidido e implementado el 2026-11-22.**

- **Agregación por código Strong (`G####`)**: `scripts/lexico-lib.mjs` agrupa
  frecuencias, formas del Codex y citas representativas (`refs`) por Strong
  (`morph.strong`) en lugar de por lema plegado. Esto elimina colisiones entre
  homógrafos de distinta raíz/categoría (en especial `εἰς` `G1519` vs. `εἷς`
  `G1520`, y `τίς` `G5101` vs. `τις` `G5100`), limpia los falsos *nomina sacra*
  (solo abreviaturas contraídas reales: **4.498** ocurrencias en el NT) y logra
  un **99,88 %** de palabras alineadas con lema y con Strong gracias a alias
  TBESG verificados y plegado de itacismo.
- **Mapas de lemas V2 compactos**: `public/textos/exegesis/lemas/*.json` pasa al
  esquema `{ version: 2, lang: 'grc', book, dict, verses }`, con diccionario local
  `[lemma, strong, pos]` y tuplas `[dictIdx, parse?, ns?]` —o arrays de
  morfemas `[[dictIdx, parse?, ns?], …]` preparados para prefijos/sufijos
  hebreos—. Los 27 ficheros del NT (136.612 tokens) pasan de 5,20 MB en V1 a
  **2,76 MB** (**2.828,4 KB**).
- **Núcleo compartido multi-idioma**: `src/lib/lexicon.js` centraliza la
  decodificación (`decodeToken`, `decodeVerseLemmas`), el registro de adaptadores
  `LEXICON_LANGS` (`grc` activo; listo para añadir `heb` con `dir: 'rtl'`), los
  filtros/ordenación y la búsqueda por relevancia (Strong exacto con o sin ceros
  como `25` o `G25`, lema, acepción principal en glosa y formas del códice). Se
  elimina el techo fijo de 250 entradas en `scripts/build-lexico.mjs` y en
  `scripts/validate-content.mjs`.
- **Respaldo TBESG y AT no interactivo**: `scripts/build-lexico.mjs` genera,
  además de las **252** fichas curadas en `public/textos/exegesis/lexico.json`
  (87 KB, **77,35 %** del NT), el respaldo bajo demanda
  `public/textos/exegesis/lexico-griego-base.json` (332,8 KB, **5.077** Strongs
  adicionales de TBESG, hasta **5.329** Strongs totales del NT), presentado con
  la insignia explícita «Glosa base (TBESG · inglés)». En capítulos del AT en el
  Codex, las palabras griegas se muestran sin botón interactivo (`.exg-word--plain`,
  conservando las sobrelíneas de *nomina sacra*) mientras no exista lematización LXX.

## 11. Hebreo — Fase 1 (esquema de texto, Ezra SIL y lector RTL `/biblia/hebreo`)

**Decidido e implementado el 2026-11-22.**

- **Fuente verificada y preservación textual**: se consume el subconjunto `wlc/*.xml` + `wlc/VerseMap.xml` de `openscriptures/morphhb` (rev. `db6c5c9`, `2026-11-14`) mediante `scripts/fetch-hebreo.mjs` → `scripts/build-hebreo.mjs` (`scripts/hebreo-lib.mjs`), eliminando únicamente el separador morfológico `/` de OSHB dentro de `<w>`, conservando el texto completo de las 11 palabras con `<seg type="x-large|x-suspended|x-small">` anidado (p. ej. Dt 6:4), descartando notas editoriales no-`variant` y prohibiendo `.normalize()` en todo el flujo (`normalization: "none"`).
- **Marcado de arameo y Ketiv/Qere sin reconstrucción**: al verificarse que OSHB no utiliza `xml:lang` en `<w>`, el arameo se detecta por el prefijo `morph="A..."` (**269** versículos, **4.828** palabras) emitiendo `{ "a": "…" }` (`lang="arc"`). Las **1.260** notas `<note type="variant">` se representan como `{ "k": "…", "q": "…" }` (y `"a": 1` si el ketiv o el qere es arameo), cubriendo las **1.245** parejas completas, los **6** *ketiv veló qeré* (`q: ""`) y los **9** *qeré veló ketiv* (`k: ""`), visibles ambos inline con explicación emergente en `<VersePopover>`.
- **Tipografía y filtros no destructivos**: `Ezra SIL 2.51` (`SILEOT.woff` SIL OFL 1.1) se versiona bajo `src/assets/fonts/ezra-sil/` e importa vía CSS relativo (`src/styles/fonts.css`) para funcionar idénticamente bajo `/` y `/crux/`. Los conmutadores del lector (`Cantilación` y `Vocales`) se aplican solo al renderizar desde `src/lib/hebrew.js` sin alterar los JSON fuente.
- **Alcance respetado**: no se emiten códigos Strong, lemas ni morfología hebreos en `public/textos/hebreo/`, ni se activa la columna en `/exegesis`, manteniendo `package.json` en `0.11.0` hasta completar la Fase 2.

## 12. Hebreo — Fase 2 (columna en `/exegesis`, alineación 789/929, fallback y `0.12.0`)

**Decidido e implementado el 2026-11-23.**

- **Columna apagada por defecto**: `COLUMNS` en `src/pages/Exegesis.jsx` antepone `hebreo` únicamente para los 39 libros del AT cuando el usuario pulsa el conmutador **`א Hebreo`** (`?hebreo=1`) o abre `?modo=hebreo`. Sin esos parámetros, `/exegesis` conserva por defecto la vista `Codex × NTV` o `NTV`, y `readMode()` devuelve `paralelo` si quedase `'hebreo'` en `localStorage`, evitando además peticiones de JSON hebreos cuando está apagada.
- **Paralelo 2/3 columnas en capítulos alineados (`789 / 929`) y fallback honesto (`140 / 929`)**: si `chapter.ntvAligned === true`, el usuario dispone de 2 columnas (`Hebreo × NTV`), 3 columnas (`.exg-grid--3` con anchura ensanchada `.exg--cols-3 .exg__shell` hasta `1420 px`, e.g. Génesis 21: `Hebreo × Codex × NTV`, apiladas con `.exg-cell__tag` bajo `1024 px`), o solo Hebreo (`?modo=hebreo`). Si `chapter.ntvAligned === false` (p. ej. Génesis 31, Salmos con sobrescritura masorética, Malaquías 3 o Joel 4), `/exegesis` no fuerza la correspondencia verso a verso: cae a solo Hebreo (`1` columna masorética completa) con el aviso `.exg__notice--hebreo` y enlace a `/biblia/hebreo`.
- **Renderizado compartido y fidelidad textual**: `<HebrewVerseTokens />` (`src/components/HebrewVerseTokens.jsx`) unifica `/biblia/hebreo` y `/exegesis` conservando la prohibición de normalizar NFC/NFD, el arameo palabra por palabra (`lang="arc"`), las fichas interactivas *ketiv / qere* en `<VersePopover>`, las marcas de margen (`אר` / `ק`), los conmutadores no destructivos de cantilación y *niqqud* en `ReaderMenu`, la barra de herramienta en una sola fila de escritorio y la atribución WLC / OSHB (`CC BY 4.0`) / Ezra SIL (`SIL OFL 1.1`). Se sube `package.json` a la versión **`0.12.0`**.

## 13. Hebreo — Fase 3 (lematización OSHB, léxico TBESH, morfología OSHM en español y `0.13.0`)

**Decidido e implementado el 2026-11-24.**

- **Fuentes y licencia unificada**: lemas y morfología de **OSHB** (`openscriptures/morphhb`, **CC BY 4.0**) cruzados con **TBESH** de STEPBible (*Translators Brief lexicon of Extended Strongs for Hebrew*, **CC BY 4.0**), descargado mediante `scripts/fetch-hebreo-lexico.mjs` en `src/assets/texts/.cache-hebreo/tbesh.txt` (sin tocar `public/textos/hebreo/<libro>.json` ni aplicar normalización NFC/NFD).
- **Mapas V2 alineados 1:1**: `scripts/build-hebreo-lemas.mjs` reutiliza `parseOsisVerse` para garantizar alineación índice a índice con `verse.t` (**39** archivos en `public/textos/hebreo/lemas/<libro>.json`, **7,68 MB**, **304.239 / 304.239** palabras `<w>` = **100 %**, **8.531** Strongs únicos, `0` ausentes en TBESH), conservando prefijos inseparables, raíz léxica y sufijos en arrays ordenados de morfemas. En `indexTbesh()` se penalizan homónimos de nombre propio (`N:N-`) y subsentidos para que prevalezca el lema léxico común y se desambiguan sufijos OSHB (`a/b`).
- **Léxico curado y respaldo TBESH**: `content/lexico/hebreo.json` (validado en build por `validateLexicoHebreo`) aporta **331** entradas curadas en español (cubriendo el **79,0 %** de los morfemas del AT, con prefijos `H9002–H9009`, sufijos clave y vocabulario arameo frecuente) y `scripts/build-hebreo-lexico.mjs` publica `public/textos/hebreo/lexico.json` junto con **8.200** glosas base bajo demanda en `public/textos/hebreo/lexico-hebreo-base.json`.
- **Decodificación OSHM e interfaz dual**: `src/lib/hebrew.js` (`describeHebrewMorph`) traduce al español todos los códigos OSHM hebreos y arameos (tronco verbal, conjugación, persona/género/número/estado, partículas y sufijos); `src/lib/lexicon.js` registra `LEXICON_LANGS.heb` (`dir: 'rtl'`, filtro `Arameo` y `pickPrimaryMorpheme`, que prioriza la raíz léxica sobre los prefijos `H9001–H9019`). Tanto `/biblia/hebreo` como la columna hebrea de `/exegesis` (`?hebreo=1`) permiten pulsar cualquier palabra `<w>` con lema y abrir `<LexiconPanel lang="heb" />` (`0.13.0`).
