# Decisiones del proyecto bíblico

Registro de las decisiones que no deben cambiarse por accidente. Si una decisión
cambia, edita esta página y `ESTADO.md`; no la cambies solo en el código.

Las decisiones se tomaron en la planificación de **octubre de 2026**. Donde hay
una cifra, se verificó en el árbol de trabajo el **2026-10-28**.

## 1. Hebreo

| Decisión | Detalle | Estado |
|---|---|---|
| Fuente | OSHB sobre WLC; WLC dominio público, morfología OSHB CC BY 4.0 | planificado |
| Cobertura | 39 libros del AT, 23.213 versículos | planificado |
| Arameo | 269 versículos, marcados **palabra por palabra**; rangos Daniel 2:4–7:28, Esdras 4:8–6:18 y 7:12–26, Génesis 31:47, Jeremías 10:11 | planificado |
| Ketiv/qere | 1.254 casos, visibles sin convertir el texto en reconstrucción | planificado |
| Alineación | 789 de 929 capítulos alineables con la NTV; el resto cae a texto hebreo sin paralelo | planificado |
| Lector | `/biblia/hebreo`, RTL, tipografía Ezra SIL (OFL) | planificado |
| Exegesis | columna hebrea **apagada por defecto**; no forzar el paralelo si no alinea | planificado |
| Normalización | no normalizar NFC/NFD sin decisión explícita | planificado |
| Rutas/versión | 215 rutas; versión 0.12.0 | planificado |

Por qué: el hebreo es el texto base del AT y permite comparar la NTV con el
testimonio hebreo, pero la alineación no es total. Marcar el arameo y el
ketiv/qere evita presentar una reconstrucción como si fuera el texto recibido.

## 2. Traducción de los libros solo-Codex

| Decisión | Detalle | Estado |
|---|---|---|
| Libros | Tobit, Judit, Sabiduría, 4 Macabeos, 1 Macabeos, Sirácida | planificado |
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
| QA | `qa:trad` (a crear) + `qa:exegesis` + `qa:lexico` | planificado |

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
| Léxico | solo NT (MorphGNT/Strong); no hay léxico hebreo | existente |
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
- **Hebreo**: formato exacto de los datos, tipografía y estrategia de alineación
  en la fase 2; no fijar sin verificar OSHB.
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

Pendiente para el hebreo: el ancho de la rejilla
(`exg-grid--3`) y la columna hebrea **apagada por defecto** (§1), que
no debe entrar en el paralelo si no alinea.
