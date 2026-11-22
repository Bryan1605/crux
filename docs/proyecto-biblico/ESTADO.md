# Estado del proyecto bíblico

> Verificado el **2026-11-22** sobre el árbol de trabajo (pendiente de commit/push). Si
> cambias datos, vuelve a contar y actualiza este archivo. No copies cifras de memoria.

## 1. Versión y despliegue

| Dato | Valor |
|---|---|
| Versión de `package.json` | **0.11.0** |
| Repositorio | `Bryan1605/crux` (GitHub Pages) |
| URL publicada | <https://bryan1605.github.io/crux/> |
| Rama | `main` |
| Último commit publicado en `main` | `be7e5f7` — «NTV: "Alabanza de la gran multitud" ya no se pega a Apocalipsis 7:8» |
| Build CI | `.github/workflows/pages.yml`, `BASE_PATH=/crux/` |
| Rutas | **288** prerenderizadas (**287** URLs indexables en `sitemap.xml`, sin `/buscar`): 14 de sección/apologética + 184 estudios + 17 personajes + 73 fichas de libros (`66` NTV + `7` solo-Codex). *(Histórico: 214 hasta 2026-10-31; 216 tras añadir Tobit el 2026-11-04; 217 tras apologética/2-Esdras/Judit el 2026-11-20; 287 con 73/73 fichas el 2026-11-21; +1 `/exegesis/guia` el 2026-11-22 → 288).* |

## 2. Lo que ya funciona

### Lectores

- **Biblia Patrística** (`/biblia`): lector por pliegos o desplazamiento, buscador,
  geometría de página, línea temporal de obras y **19 portadas por obra** (`1.1` Didaché – `6` San Hipólito de Roma, 9 verticales `4:5` + 10 horizontales `16:9` integradas en el índice maestro–detalle y en el domo 3D); fuente `public/textos/biblia-patristica.md` actualizada hasta la
  **Parte 6 — San Hipólito de Roma (c. 170–235 d.C.)** (23 partes, 1.504 secciones, 4.175
  páginas).
- **NTV** (`/biblia/ntv`): 66 libros, rejilla/pliego, notas del traductor,
  selector de versículo, buscador, panel de libro y narración en el raíl.
- **Exégesis comparada** (`/exegesis`): Codex × NTV (y columna `Trad` para Tobit completo [14 caps., 232 vv.],
  Judit completo [16 caps., 327 vv.], Salmo 151 [7 vv.] y Joel 4 LXX [21 vv.] en borrador), aparato crítico, notas, léxico griego, buscador y panel de libro;
  incluye los 7 libros solo-Codex.
- **Guía didáctica de lectura** (`/exegesis/guia`): guía interactiva para principiantes de **Griego koiné** (alfabeto de 24 letras con filtros de «falsos amigos», diptongos, espíritus/acentos, *nomina sacra* y casos del Codex, lectura paso a paso de Juan 1:1 y práctica de 8 palabras) y de **Hebreo y Arameo bíblico** (alefato de 22 consonantes con *sofit* y *begadkefat*, 6 pares confundibles, vocales *niqqud* y marcas, raíces trilíteras, prefijos pegados con desmontaje de `וּבְבֵיתוֹ`, Tetragramatón, arameo bíblico, lectura RTL de Génesis 1:1 y Daniel 7:13, y práctica con/sin vocales). Enlazada desde `/exegesis` junto al diccionario, el menú `Aa`, `LexiconPanel` y el pie.
- **Libros de la Biblia** (`/biblia/libros` y `/biblia/libros/:id`): hero con eje
  cronológico interactivo de 6 eras, barra de secciones y buscador, catálogo
  estructurado en 3 bloques (39 AT · 7 adicionales del Codex Sinaiticus · 27 NT)
  con `StudyCard` (portada predeterminada con abreviatura del libro —listo para
  añadir portadas futuras—), registro de fuentes verificadas (`content/libros/fuentes.json`,
  128 fuentes) y **73/73 fichas** en `borrador` (600–834 palabras; 66 libros de la
  NTV y 7 solo-Codex).
- **Apologética** (`/apologetica/<slug>`, guía en `docs/apologetica/FASCICULOS.md`):
  - **Fascículo I — Shincheonji** (`/apologetica/shincheonji`): 100 preguntas en 10 bloques
    (Codex × NTV con palabras clave resaltadas) y pestaña «¿Qué cree Shincheonji?» con 35
    citas contrastadas de Lee Man-hee.
  - **Fascículo II — Adventismo** (`/apologetica/adventismo`): 50 preguntas en 6 bloques
    (Codex × NTV con palabras clave resaltadas).
  - **Fascículo IV — Dispensacionalismo** (`/apologetica/dispensacionalismo`): 50 preguntas
    en 6 bloques (Codex × NTV con palabras clave resaltadas) y pestaña «¿Qué enseña el
    dispensacionalismo?» con 24 citas textuales y páginas de J. Dwight Pentecost (*Eventos
    del Porvenir*).
- **Buscar** (`/buscar`): búsqueda global de estudios, libros de la Biblia, apologética,
  personajes, concilios, herejías y vídeos (**225 entradas**).
- **Administración** (`/admin`): solo en dev; estudios (con editor visual TipTap, fase 1),
  personajes, videos, banner, versículos, anuncios, timeline, concilios, categorías,
  ajustes y medios.

### Datos

| Conjunto | Cantidad |
|---|---|
| Libros en la tabla canónica | **73** |
| Libros con NTV | **66** |
| Libros con Codex | **59** |
| Libros solo-Codex | **7** |
| Paralelos Codex/NTV | **708** |
| NTV: capítulos | **1.189** |
| NTV: versículos | **31.021** |
| NTV: secciones | **2.369** *(2.368 antes de `be7e5f7`)* |
| NTV: notas | **4.744** |
| Codex: capítulos | **859** |
| Codex: versículos | **21.127** |
| Codex: variantes de aparato | **57.381** |
| Traducción de trabajo (`trad/`) | **4 archivos · 587 versículos** (`tobit`: 14 caps. · 232 vv.; `judit`: 16 caps. · 327 vv.; `salmos`: cap. 151 · 7 vv.; `joel`: cap. 4 · 21 vv., en `borrador`) |
| Léxico: entradas curadas (NT) | **252** *(+ **5.077** glosas base TBESG bajo demanda en `lexico-griego-base.json` = **5.329** Strongs NT; V2)* |
| Léxico: tokens y alineación | **136.612** palabras en 27 mapas V2 (**2,76 MB**) · **99,88 %** alineado y con Strong · **4.498** *nomina sacra* |
| Léxico: cobertura curada | **77,35 %** sobre el NT (`lexico.json`, 87 KB) |

Libros solo-Codex y sus versículos:

| Libro | id | Versículos |
|---|---|---:|
| 2 Esdras | `2-esdras` | 454 |
| Tobit | `tobit` | 232 |
| Judit | `judit` | 327 |
| 1 Macabeos | `1-macabeos` | 924 |
| 4 Macabeos | `4-macabeos` | 479 |
| Sabiduría | `sabiduria` | 435 |
| Sirácida | `siracida` | 1.364 |

### Contenido del sitio

| Tipo | Cantidad |
|---|---:|
| Estudios | **184** *(en 9 categorías activas; frente a los 188 iniciales: 1 análisis privado retirado en `e76ad6d` y 3 notas internas de Obsidian retiradas localmente)* |
| Personajes | **17** |
| Concilios/herejías | **17** (8 concilios · 9 herejías) |
| Narraciones de audio | **2** |
| Vídeos | **1** (`0Rou8PPA2Oo`) |
| Fichas de libros | **73** (66 con NTV + 7 solo-Codex, en `borrador`) |
| Páginas de apologética | **3** (`shincheonji`, `adventismo`, `dispensacionalismo`) |
| Portadas de obras (Biblia Patrística) | **19** (`1.1`–`1.8`, `2.1`–`2.5`, `3.1`–`3.2`, `4.1`–`4.2`, `5.1`, `6` en `content/obras-patristica.json`) |

### Calidad

Verificado el **2026-11-22** sobre el árbol de trabajo local tras el último build (19 portadas de la Biblia Patrística + rediseño de `/biblia/libros`):

- `node scripts/optimize-images.mjs --force-obras`: **19/19** portadas convertidas a `.webp` en `public/img/obras/` (9 verticales `640×800` y 10 horizontales `960×540`).
- `npm run build`: **OK** (288 rutas prerenderizadas, `obras-patristica.json` y 73 fichas validados).
- `npm run qa:imagenes` (sobre `vite preview`, `CRUX_BASE=http://localhost:4173`): **84/84 comprobaciones OK** (77 referencias en `content/`, incluidas las 19 portadas, y `/biblia` sin imágenes rotas).
- `npm run qa:libros` (sobre `vite preview`, `CRUX_BASE=http://localhost:4173`): **316/316 comprobaciones OK** (73/73 fichas, validación de `LIBRO_META` frente a `index.json` y navegador escritorio/móvil).
- `npm run qa:biblia` (sobre `vite preview`, `CRUX_BASE=http://localhost:4173`): **80/80 comprobaciones OK**.
- `npm run qa:a11y` (sobre `vite preview`, `CRUX_BASE=http://localhost:4173`): **0 violaciones `critical`/`serious`** y **0 controles < 24 px** en todas las rutas públicas.
- Prueba funcional interactiva de portadas y `/biblia/libros` en Chrome (`1280×900` y `390×844` sobre `vite preview`): **10/10 checks OK** (19/19 portadas cargan en `/biblia` con formato vertical/horizontal, portada `1.7` en móvil sin desbordar, `/biblia/libros` con 6 eras, `39 AT + 7 Codex + 27 NT`, marca `Gn` en Génesis, filtros de era/sección/búsqueda, móvil `390px` sin desbordamiento ni stats recortados, `0 console.error`/`pageerror`).
- Verificaciones previas del mismo **2026-11-22** sobre los lotes anteriores (`lexico V2` y `/exegesis/guia`): `qa:lexico` (24/24), `qa:exegesis` (109/109), prueba funcional léxico V2 (20/20 con contraste `noche`/`sepia`), `check:search` (19/19), `qa:buscar` (32/32), prueba funcional de `/exegesis/guia` (15/15), `qa:enlaces` (6/7, único fallo el timeout externo conocido hacia `codexsinaiticus.org`) y `qa:vistas` (117/117 antes del timeout final de navegador en WebGL).
- En la medición previa del **2026-11-21 / 2026-11-20** también pasaron `qa:trad` (58/58), `qa:shincheonji` (38/38), `qa:apologetica` (28/28) y `qa:admin` (10/10).

*Histórico anterior:*

Última verificación registrada el **2026-10-28**: Build local y QA local en verde, `qa:prod` 63/63, auditorías móvil/a11y sobre producción en verde y `main` en `f2fdaa2`.
Línea base del **2026-10-31**: `npm run build` OK (214 rutas) y `npm run qa` en verde salvo el timeout externo a `codexsinaiticus.org`; `qa:a11y` con 0 critical/serious y 0 controles < 24 px. El **2026-11-02** se publicó el rediseño fases A–H (`qa:prod` 63/63).

## 3. Lo que **no** existe todavía

- Lector de hebreo (`/biblia/hebreo`).
- Columna hebrea en `/exegesis`.
- Traducción de trabajo de los otros cuatro libros solo-Codex (`trad/`: Sabiduría, 4 Macabeos, 1 Macabeos y Sirácida).
- Revisión humana de los borradores publicados en `trad/` (`tobit`, `judit`, `salmos` 151, `joel` 4) y de las 73 fichas en `content/libros/`.
- Comentarios capítulo a capítulo.
- Editor de traducciones o fichas en `/admin`.

No los trates como si estuvieran hechos porque aparezcan en la planificación.

## 4. Plan y rutas

| Fase | Qué añade | Rutas nuevas | Total |
|---|---|---:|---:|
| Base previa (2026-10-31) | — | — | 214 |
| Hito intermedio (2026-11-20) | +Índice `/biblia/libros` + 3 fichas (`2-esdras`, `tobit`, `judit`) + 3 fascículos de apologética (`shincheonji`, `adventismo`, `dispensacionalismo`) − 1 análisis privado (`e76ad6d`) − 3 notas internas | +3 neto | 217 |
| Estado actual (2026-11-21) | +Judit 4–16, Salmo 151 y Joel 4 LXX en `trad/` + 70 fichas restantes (73/73 en `/biblia/libros/:id`) | +70 | 287 |
| Guía didáctica (2026-11-22) | +Guía de lectura `/exegesis/guia` (griego koiné + hebreo y arameo bíblico) | +1 | **288** |
| Hebreo, fase 1 | `/biblia/hebreo` + datos | 1 | 289 |
| Hebreo, fase 2 | columna de exégesis + alineación | 0 | 289 |

- La versión **0.12.0** está reservada para el hebreo; no la bumpees antes de
  implementarlo.
- Las rutas de fichas se generan solo si el JSON existe; no se publican páginas
  vacías.
- `scripts/routes-lib.mjs` es la fuente única; hay que actualizarlo y volver a
  generar `sitemap.xml`/`robots.txt` con el build.
- Si el orden cambia, actualiza la tabla y `DECISIONES.md`.

## 5. Orden de trabajo

Reordenado el **2026-10-31** (antes: hebreo primero; ver `DECISIONES.md` §6).

0. ~~**Línea base**~~ — hecho (`21e29d4`, 2026-10-31).
1. ~~**Refactor de columnas de `/exegesis`**~~ — hecho el 2026-11-02
   (`DECISIONES.md` §9).
2. **Tobit**: ~~glosario mínimo, traducción piloto (232 vv en borrador), ficha, panel, índice de
   fichas y registro de fuentes~~ (piloto completado); pendiente la **revisión del usuario**.
3. **Los otros libros solo-Codex y pasajes especiales**:
   - **2 Esdras**: ~~ficha (`content/libros/2-esdras.json`, 782 palabras, `borrador`)~~ — hecho el 2026-11-20 (no lleva traducción propia porque la NTV ya cubre Esdras y Nehemías).
   - **Judit**: ~~ficha (`content/libros/judit.json`, 820 palabras, `borrador`) + traducción de trabajo completa caps. 1–16 (`src/assets/texts/trad/judit.json`, 327 vv., `borrador`, tablas en `docs/proyecto-biblico/revision/judit-01-03.md` y `judit-04-16.md`)~~ — completado el 2026-11-21.
   - **Pasajes especiales de la LXX sin NTV**: ~~**Salmo 151** (cap. 151, 7 vv.) y **Joel 4 LXX** (cap. 4, 21 vv.) en `src/assets/texts/trad/{salmos,joel}.json` (tabla en `docs/proyecto-biblico/revision/pasajes-especiales.md`)~~ — completado el 2026-11-21.
   - **Sabiduría, 4 Macabeos, 1 Macabeos, Sirácida**: ~~sus 4 fichas en `content/libros/`~~ — completadas el 2026-11-21; pendientes sus traducciones de trabajo (`trad/`).
4. **Hebreo, fase 1**: OSHB/WLC solo texto y marcas (arameo por palabra,
   ketiv/qere), lector RTL, Ezra SIL; sin lema ni morfología.
5. **Hebreo, fase 2**: columna de exégesis, alineación, fallback; bump 0.12.0.
6. ~~**Las 66 fichas de la NTV**~~ — completadas en `borrador` el 2026-11-21 (73/73 fichas totales en `content/libros/`, 128 fuentes verificadas en `content/libros/fuentes.json`); pendiente revisión del usuario.
7. **Comentarios por capítulo** (fase futura).

No empieces por las 73 fichas ni por Sirácida. El piloto de Tobit y la primera
ficha fijan el formato antes de escalar.

## 6. Riesgos y bloqueos

- **La traducción y las fichas necesitan revisión del usuario.** La IA puede
  preparar borradores, pero no aprobar `revisado` por su cuenta.
- **El parser de la NTV es frágil.** Corregir el parser, no el JSON de salida.
  Cualquier cambio en `exegesis-lib.mjs` exige `qa:exegesis`.
- **El Codex requiere red si falta la caché.** La caché está ignorada por git;
  el build no la necesita porque los JSON están versionados.
- **Los QA de navegador requieren Chrome** en la ruta fijada y el dev server.
- **No hay que tocar el portafolio de la raíz** ni añadir cookies/analítica.
- **La NTV tiene derechos.** No se puede tratar como texto libre.
- **El hebreo aún no está descargado.** Antes de implementar, verifica versión,
  licencia, número de archivos y conteos; no des por buenos los 23.213/269/1.254
  sin comprobarlos.

## 7. Próximo paso

**Tobit** (ver `TRADUCCION.md` §8): glosario mínimo, traducción piloto, ficha,
panel, índice de fichas y registro de fuentes, para revisión del usuario.

Avance del piloto (2026-11-02):

- [x] Pasos 1–2: glosario mínimo y **borrador de Tobit 1–3** (53 vv, misma
      numeración que el Codex, 19 notas de traducción) desde el griego del
      Codex. Fuente editable: `src/assets/texts/trad/tobit.json`
      (`status: borrador`). Tabla de revisión:
      `docs/proyecto-biblico/revision/tobit-01-03.md`. Las decisiones del
      glosario quedan como **propuesta** en `GLOSARIO.md`.
- [x] Glosario, 2026-11-02: el usuario aprueba ἐλεημοσύνη, δικαιοσύνη, ἀδελφός,
      «padre» literal, ναός y los nombres Ajicar, **Asaradón** y **Cadés** (aplicados
      al borrador). El resto sigue como propuesta.
- [x] 2026-11-04: el usuario deja la tabla para revisarla más adelante y delega
      las elecciones pendientes (glosario: **adoptado, revisable**). Se pulió la
      sintaxis de 1:6, 2:2, 2:14, 3:4 y 3:9. Sigue en `borrador`.
- [ ] **Revisión del usuario** de los versículos de 1–3 (pendiente, sin prisa).
- [x] Paso 3 (2026-11-04): `build-trad` (`npm run exegesis:trad`), testigo
      `trad` en el índice, columna «Trad» en `/exegesis` (Codex × Trad, `?modo=trad`,
      panel de notas, créditos, aviso de cobertura parcial), enlace desde
      `/biblia/ntv?libro=tobit` y `qa:trad` (18/18). **Publicable**: el borrador
      va con su etiqueta «Traducción de trabajo · Borrador».
- [x] Paso 4 (2026-11-04): **capítulos 4–14** traducidos (179 vv, 26 notas) →
      Tobit completo: **232/232** versículos del Codex, 14 capítulos. Lagunas del
      Codex anotadas y sin rellenar: 4:8–18, 9:3, 13:8–10, 14:8. Tabla de
      revisión: `docs/proyecto-biblico/revision/tobit-04-14.md`. `qa:trad` 18/18.
- [ ] Revisión del usuario de 4–14 (pendiente, junto con 1–3).
- [x] Paso 5 (2026-11-04): **ficha de Tobit** (`content/libros/tobit.json`, 834
      palabras, 2 debates, `borrador`), **registro de fuentes**
      (`content/libros/fuentes.json`: Toy 1906, Drum 1912, Di Lella/NETS y el
      Codex Sinaiticus Project, leídas y verificadas ese día), **índice**
      `/biblia/libros`, **panel** en `/exegesis` y `/biblia/ntv`, validador en el
      build y `qa:libros` (22/22). Rutas: 216.
- [ ] **Revisión del usuario** de la traducción de Tobit (caps. 1–14) y de su ficha (pendiente, sin prisa).
- [x] Bloques previos publicados en `main` hasta `be7e5f7` (Tobit piloto + `/apologetica/shincheonji` + Cipriano + editor `/admin` + Apocalipsis 7:8).
- [x] **2026-11-20 (local)**:
  - **Fascículos de Apologética II y IV**: `/apologetica/adventismo` (50 preguntas, 6 bloques) y `/apologetica/dispensacionalismo` (50 preguntas, 6 bloques + pestaña doctrinal con 24 citas de J. Dwight Pentecost, *Eventos del Porvenir*) + guía `docs/apologetica/FASCICULOS.md`.
  - **Ficha de 2 Esdras** (`content/libros/2-esdras.json`, 782 palabras, 2 debates, `borrador`) y **ficha de Judit** (`content/libros/judit.json`, 820 palabras, 2 debates, `borrador`), con 6 fuentes verificadas añadidas a `content/libros/fuentes.json` (Gottheil/Littmann/Kohler 1906, Souvay 1909, Wooden/NETS 2009, Toy/Torrey 1906, Pope 1910, Boyd-Taylor/NETS 2009).
  - **Traducción de trabajo de Judit 1–3** (`src/assets/texts/trad/judit.json` → `public/textos/exegesis/trad/judit.json`, 54 vv., 13 notas, `borrador`), tabla de revisión `docs/proyecto-biblico/revision/judit-01-03.md` y nombres/topónimos en `docs/proyecto-biblico/GLOSARIO.md`.
- [x] **Completado el 2026-11-21 — Fase 4 (traducción de Judit 4–16, pasajes especiales y 73/73 fichas)**:
  - **Judit completo (caps. 1–16)**: ampliado `src/assets/texts/trad/judit.json` (327/327 vv., conservando las lagunas físicas del folio 38.8 sin rellenar), tabla de revisión en `docs/proyecto-biblico/revision/judit-04-16.md` y glosario actualizado.
  - **Pasajes especiales sin NTV**: `src/assets/texts/trad/salmos.json` (Salmo 151, 7 vv.) y `src/assets/texts/trad/joel.json` (Joel 4 LXX, 21 vv.), con tabla en `docs/proyecto-biblico/revision/pasajes-especiales.md`, adaptación de `build-trad.mjs`, `qa-trad.mjs`, `Exegesis.jsx` y `LibroFicha.jsx` (587 vv. totales en `trad/`).
  - **73/73 fichas introductorias de libros**: ampliado `content/libros/fuentes.json` de 11 a **128 fuentes verificadas** y redactadas las **70 fichas restantes** en `content/libros/*.json` (4 solo-Codex + 39 AT NTV + 27 NT NTV, todas en `borrador` con 600–834 palabras), más filtro «Solo en el Codex» en `src/pages/Libros.jsx`.
- [x] **Completado el 2026-11-22 (local) — Guía didáctica `/exegesis/guia` + saneamiento y base V2 del diccionario griego**:
  - **Guía de lectura** (`/exegesis/guia`): alfabeto griego koiné + alefato hebreo/arameo con lectura interactiva paso a paso y práctica (288 rutas).
  - **Diccionario griego V2** (`DECISIONES.md` §10): agregación por Strong (`G1520` `εἷς` / `G5100` `τις` separados), limpieza de *nomina sacra* (4.498 reales), 27 mapas V2 compactos (**2,76 MB**, **99,88 %** alineado y con Strong), núcleo compartido multi-idioma (`src/lib/lexicon.js`), **252** fichas curadas (**77,35 %** NT, **27** notas), respaldo bajo demanda `lexico-griego-base.json` (**5.077** Strongs TBESG), concordancia clicable, familia léxica, AT no interactivo, accesibilidad móvil y contraste WCAG AA en temas `claro`, `sepia` y `noche`.
  - **19 portadas de la Biblia Patrística y rediseño de `/biblia/libros`**: optimizadas las 19 ilustraciones (`1.1`–`6`, 9 verticales `4:5` y 10 horizontales `16:9`) en `public/img/obras/` e integradas en `/biblia` (índice maestro–detalle + domo 3D); rediseñada `/biblia/libros` con hero y eje cronológico interactivo de 6 eras, chips de sección, buscador y 3 bloques (`39 AT · 7 Codex · 27 NT`) usando `StudyCard` con portada predeterminada de abreviatura (`Gn`, `Éx`…).
- [ ] **Seguir con traducciones solo-Codex** (Sabiduría, 4 Macabeos, 1 Macabeos, Sirácida) o pasar a **Hebreo fase 1**.
- [ ] **Revisión, commit y push** de los cambios locales actuales y, tras desplegar, ejecutar `npm run qa:prod`.

El borrador completo de Tobit ya está publicado en `public/textos/exegesis/trad/tobit.json`
y `/biblia/libros/tobit` en `main`; el último lote local (Fase I, buscador ampliado,
portada apologética, Hipólito, vídeo y limpieza) queda verificado en local y pendiente de
commit/push.

Hecho antes (2026-11-02): la línea base y el refactor de columnas de
`/exegesis` (`COLUMNS` + `modesFor()`; añadir `trad` es una entrada más). Ese
día, sobre el dev server local: `npm run build` OK (214 rutas),
`qa:exegesis` 109/109 (incluye las dos comprobaciones nuevas del modo
guardado), `qa:a11y` 0 critical/serious, `qa:vistas` OK, y `qa:enlaces` en
verde salvo los enlaces externos a `codexsinaiticus.org` (sin respuesta desde
esta máquina, como en la línea base). El rediseño del sitio (`docs/rediseno/`,
fases A–H) se publicó el mismo día; `qa:prod` 63/63.

Hebreo (más adelante): ya verificado que OSHB publica el texto WLC en dominio
público y lema/morfología en CC BY 4.0, con 39 XML por libro y `VerseMap.xml`
(versificación hebrea). Los conteos 23.213 / 269 / 1.254 / 789 de 929 siguen
**sin comprobar** hasta descargar los datos.

## 8. Cómo actualizar este archivo

- Usa datos contados, no recuerdos.
- Anota la fecha de verificación.
- Si cambia una decisión, actualiza también `DECISIONES.md`.
- Si cambia el alcance, actualiza `README.md`, `TRADUCCION.md` o `FICHAS.md`
  según corresponda.
- No borres el histórico: marca lo superado y explica qué lo reemplazó.
