# Estado del proyecto bíblico

> Verificado el **2026-11-24** sobre el árbol de trabajo (pendiente de commit/push). Si
> cambias datos, vuelve a contar y actualiza este archivo. No copies cifras de memoria.

## 1. Versión y despliegue

| Dato | Valor |
|---|---|
| Versión de `package.json` | **0.12.0** |
| Repositorio | `Bryan1605/crux` (GitHub Pages + Cloudflare `cruxestudios.com`) |
| URL publicada | <https://cruxestudios.com/> |
| Rama | `main` |
| Último commit publicado en `main` | `1e0be6f` — Diccionario griego V2 + guía `/exegesis/guia` + 19 portadas Biblia Patrística + rediseño `/biblia/libros` (`qa:prod` 81/81 OK) |
| Build CI | `.github/workflows/pages.yml`, `BASE_PATH=/crux/` |
| Rutas | **289** prerenderizadas (**288** URLs indexables en `sitemap.xml`, sin `/buscar`): 15 de sección/apologética (con `/biblia/hebreo`) + 184 estudios + 17 personajes + 73 fichas de libros (`66` NTV + `7` solo-Codex). *(Histórico: 214 hasta 2026-10-31; 216 tras añadir Tobit el 2026-11-04; 217 tras apologética/2-Esdras/Judit el 2026-11-20; 287 con 73/73 fichas el 2026-11-21; +1 `/exegesis/guia` el 2026-11-22 → 288; +1 `/biblia/hebreo` el 2026-11-22 → 289).* |

## 2. Lo que ya funciona

### Lectores

- **Biblia Patrística** (`/biblia`): lector por pliegos o desplazamiento, buscador,
  geometría de página, línea temporal de obras y **19 portadas por obra** (`1.1` Didaché – `6` San Hipólito de Roma, 9 verticales `4:5` + 10 horizontales `16:9` integradas en el índice maestro–detalle y en el domo 3D); fuente `public/textos/biblia-patristica.md` actualizada hasta la
  **Parte 6 — San Hipólito de Roma (c. 170–235 d.C.)** (23 partes, 1.504 secciones, 4.175
  páginas).
- **NTV** (`/biblia/ntv`): 66 libros, rejilla/pliego, notas del traductor,
  selector de versículo, buscador, panel de libro y narración en el raíl.
- **Biblia Hebrea** (`/biblia/hebreo`, **Fases 1 y 2**): los **39** libros del Antiguo Testamento sobre WLC/OSHB (rev. `db6c5c9`), lectura RTL con tipografía **Ezra SIL 2.51** (`SILEOT.woff`), marcado palabra por palabra de arameo (`4` libros, `269` vv., `4.828` palabras), variantes *ketiv / qere* visibles con ficha explicativa (`1.260` casos), buscador en hebreo/arameo insensible a vocales, conmutadores no destructivos de cantilación/*niqqud*, 3 temas de papel, panel de libro y atribución completa. Enlazada directamente con `/exegesis`.
- **Navegación móvil híbrida** (`≤ 768 px`, `<MobileNav />`): barra superior minimalista (con `Índice` de secciones + `Aa` en estudios/fichas/guía, sin duplicar en lectores bíblicos), barra inferior fija de 4 accesos (`Inicio`, `Estudio`, `Buscar`, `Menú`) con Auto-hide al hacer scroll y `env(safe-area-inset-bottom)`, más Drawer tipo Hoja Inferior sin recortes y acceso en portada «Preguntas con la Biblia» (`/#preguntas-con-la-biblia`).
- **Exégesis comparada** (`/exegesis`): Codex × NTV (y columna `Trad` en `borrador` para los **6/6 libros solo-Codex completos** [Tobit 232 vv., Judit 327 vv., Sabiduría 435 vv., 4 Macabeos 479 vv., 1 Macabeos 924 vv. y Sirácida 1.364 vv. = **3.761 vv.**] más **Salmo 151** [7 vv.] y **Joel 4 LXX** [21 vv.] = **3.789 vv.** en 8 archivos), **columna hebrea (`Hebreo (WLC)` · OSHB, Fase 2)** para los 39 libros del AT —apagada por defecto y activable con **`א Hebreo`** (`?hebreo=1` / `?modo=hebreo`)—, lectura paralela en **2 columnas** (`Hebreo × NTV`) o **3 columnas** (`Hebreo × Codex × NTV` con `.exg-grid--3`) en los **789 / 929** capítulos alineados con la NTV, fallback honesto a **solo Hebreo** con aviso masorético (sin forzar el paralelo) en los **140** capítulos restantes, `<HebrewVerseTokens />` compartido (RTL, Ezra SIL, arameo `lang="arc"`, *ketiv / qere* en `<VersePopover>`, *parashá* y filtros no destructivos en `ReaderMenu`), aparato crítico, notas, léxico griego, buscador y panel de libro; incluye los 7 libros solo-Codex.
- **Guía didáctica de lectura** (`/exegesis/guia`): guía interactiva para principiantes de **Griego koiné** (alfabeto de 24 letras con filtros de «falsos amigos», diptongos, espíritus/acentos, *nomina sacra* y casos del Codex, lectura paso a paso de Juan 1:1 y práctica de 8 palabras) y de **Hebreo y Arameo bíblico** (alefato de 22 consonantes con *sofit* y *begadkefat*, 6 pares confundibles, vocales *niqqud* y marcas, raíces trilíteras, prefijos pegados con desmontaje de `וּבְבֵיתוֹ`, Tetragramatón, arameo bíblico, lectura RTL de Génesis 1:1 y Daniel 7:13, y práctica con/sin vocales). Enlazada desde `/exegesis` junto al diccionario, el menú `Aa`, `LexiconPanel` y el pie.
- **Libros de la Biblia** (`/biblia/libros` y `/biblia/libros/:id`): hero con eje
  cronológico interactivo de 6 eras, barra de secciones y buscador, catálogo
  estructurado en 3 bloques (39 AT · 7 adicionales del Codex Sinaiticus · 27 NT)
  con `StudyCard` (portada predeterminada con abreviatura del libro —listo para
  añadir portadas futuras—), registro de fuentes verificadas (`content/libros/fuentes.json`,
  128 fuentes) y **73/73 fichas** en `borrador` (600–834 palabras; 66 libros de la
  NTV y 7 solo-Codex).
- **Apologética** (`/apologetica/<slug>`, guía en `docs/apologetica/FASCICULOS.md`, **9 fascículos** en portada: 3 publicados y 6 `proximamente`):
  - **Fascículo I — Shincheonji** (`/apologetica/shincheonji`): 100 preguntas en 10 bloques
    (Codex × NTV con palabras clave resaltadas) y pestaña «¿Qué cree Shincheonji?» con 35
    citas contrastadas de Lee Man-hee.
  - **Fascículo II — Adventismo** (`/apologetica/adventismo`): **100 preguntas en 10 bloques**
    (Codex × NTV con palabras clave resaltadas) y pestaña doctrinal en **8 partes** con 27 citas primarias, 7 testimonios patrísticos sobre el Día del Señor y 4 referencias históricas.
  - **Fascículo IV — Dispensacionalismo** (`/apologetica/dispensacionalismo`): 50 preguntas
    en 6 bloques (Codex × NTV con palabras clave resaltadas) y pestaña «¿Qué enseña el
    dispensacionalismo?» con 24 citas textuales y páginas de J. Dwight Pentecost (*Eventos
    del Porvenir*).
  - **Próximamente en portada (6 fascículos)**: Catolicismo Romano Papista (III), Gnósticos (V), Islam (VI), Mormonismo · Santos de los Últimos Días (VII), Testigos de Jehová (VIII) y Judaizantes y Raíces Hebreas (IX).
- **Buscar** (`/buscar`): búsqueda global de estudios, libros de la Biblia, apologética,
  personajes, concilios, herejías y vídeos (**295 entradas**).
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
| Hebreo (OSHB / WLC, Fases 1 y 2) | **39** libros · **929** capítulos · **23.213** versículos · **305.499** palabras (`6,47 MB`, rev. `db6c5c9`, sin normalizar NFC/NFD; lector `/biblia/hebreo` + columna apagada por defecto en `/exegesis`) |
| Hebreo: arameo palabra por palabra | **4** libros · **269** versículos · **4.828** palabras (`Gn 31:47`, `Esd 4:8–6:18` y `7:12–26`, `Jer 10:11`, `Dn 2:4–7:28`) |
| Hebreo: *ketiv / qere* | **1.260** casos (**1.245** K+Q · **6** solo K · **9** solo Q) · **789 / 929** capítulos alineados exactamente con la NTV |
| Traducción de trabajo (`trad/`) | **8 archivos · 3.789 versículos** (6/6 libros solo-Codex completos en `borrador`: `tobit` 14 caps. · 232 vv., `judit` 16 caps. · 327 vv., `sabiduria` 19 caps. · 435 vv., `4-macabeos` 18 caps. · 479 vv., `1-macabeos` 16 caps. · 924 vv., `siracida` 51 caps. · 1.364 vv. = **3.761 vv.**; más pasajes especiales: `salmos` cap. 151 · 7 vv. y `joel` cap. 4 LXX · 21 vv.) |
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
| Páginas de apologética | **3** publicados (`shincheonji`, `adventismo`, `dispensacionalismo`) + **6** «Próximamente» en portada (Catolicismo Romano Papista, Gnósticos, Islam, Mormonismo · Santos de los Últimos Días, Testigos de Jehová, Judaizantes y Raíces Hebreas; 9 fascículos en `docs/apologetica/FASCICULOS.md`) |
| Portadas de obras (Biblia Patrística) | **19** (`1.1`–`1.8`, `2.1`–`2.5`, `3.1`–`3.2`, `4.1`–`4.2`, `5.1`, `6` en `content/obras-patristica.json`) |

### Calidad

Verificado el **2026-11-24** sobre el árbol de trabajo local tras completar las **4 traducciones solo-Codex restantes** (`sabiduria`, `4-macabeos`, `1-macabeos`, `siracida`), añadir los **4 nuevos fascículos `proximamente`** en apologética (Islam, Mormonismo · Santos de los Últimos Días, Testigos de Jehová y Judaizantes y Raíces Hebreas) e incorporar las rutas de `qa:a11y`, auditando sobre `vite preview` (`CRUX_BASE=http://localhost:4173`):

- `npm run build`: **OK** (v. `0.12.0`, **289** rutas prerenderizadas, **288** en `sitemap.xml`).
- `npm run check:search`: **19/19 OK** (**295** entradas: `estudio` 184, `libro` 73, `personaje` 17, `herejia` 9, `concilio` 8, `apologetica` 3, `video` 1).
- `npm run qa:trad`: **114/114 comprobaciones superadas** (8/8 archivos en `borrador`: `1-macabeos`, `4-macabeos`, `joel`, `judit`, `sabiduria`, `salmos`, `siracida`, `tobit`, con verificación en navegador).
- `npm run qa:apologetica`: **31/31 comprobaciones OK** (Adventismo: 10 bloques · 100 preguntas + 8 partes doctrinales, 27 citas, 7 patrísticas, 4 históricas; Dispensacionalismo: 6 bloques · 50 preguntas + 24 citas Pentecost; portada con los 9 fascículos).
- `npm run qa:exegesis`: **109/109 comprobaciones superadas** (con navegador).
- `npm run qa:hebreo`: **30/30 comprobaciones superadas** (con navegador; versión `0.12.0`).
- `npm run qa:libros`: **316/316 comprobaciones superadas**.
- `npm run qa:vistas`: **126/126 comprobaciones OK**.
- `npm run qa:a11y`: **0 violaciones `critical`/`serious`** y **0 controles < 24 px** (incluye vistas con Hebreo, Sabiduría Codex × Trad, Sirácida Codex × Trad y 2 Esdras solo Codex).
- `npm run qa:enlaces`: **6/7 comprobaciones OK** (26/26 páginas cargan, **1.211/1.211** destinos internos, **113/113** anclas, 0 enlaces sin texto, 39/39 citas externas OK; único fallo el timeout ambiental conocido hacia `codexsinaiticus.org`).

Verificaciones previas registradas el **2026-11-23** sobre **Hebreo Fase 2** (`0.12.0`): `npm run qa:lexico` (**24/24 OK**, 252 lemas curados, 99,88 % alineado). Y el **2026-11-22** sobre lotes anteriores (`1e0be6f` / locales): `qa:biblia` (80/80), `qa:prod` en `https://cruxestudios.com` (**81/81 OK** sobre 288 rutas), `qa:imagenes` (84/84), `qa:buscar` (32/32), `qa:shincheonji` (38/38) y `qa:admin` (10/10).

*Histórico anterior:*

Última verificación registrada el **2026-10-28**: Build local y QA local en verde, `qa:prod` 63/63, auditorías móvil/a11y sobre producción en verde y `main` en `f2fdaa2`.
Línea base del **2026-10-31**: `npm run build` OK (214 rutas) y `npm run qa` en verde salvo el timeout externo a `codexsinaiticus.org`; `qa:a11y` con 0 critical/serious y 0 controles < 24 px. El **2026-11-02** se publicó el rediseño fases A–H (`qa:prod` 63/63).

## 3. Lo que **no** existe todavía

- Lematización y diccionario morfológico hebreo/arameo para el AT (fase futura; requiere fuente y licencia dedicadas).
- Revisión humana de los **8 borradores** publicados en `trad/` (`tobit`, `judit`, `sabiduria`, `4-macabeos`, `1-macabeos`, `siracida`, `salmos` 151, `joel` 4 — **3.789 vv.**) y de las 73 fichas en `content/libros/`.
- Comentarios capítulo a capítulo.
- Editor de traducciones o fichas en `/admin`.

No los trates como si estuvieran hechos porque aparezcan en la planificación.

## 4. Plan y rutas

| Fase | Qué añade | Rutas nuevas | Total |
|---|---|---:|---:|
| Base previa (2026-10-31) | — | — | 214 |
| Hito intermedio (2026-11-20) | +Índice `/biblia/libros` + 3 fichas (`2-esdras`, `tobit`, `judit`) + 3 fascículos de apologética (`shincheonji`, `adventismo`, `dispensacionalismo`) − 1 análisis privado (`e76ad6d`) − 3 notas internas | +3 neto | 217 |
| Estado previo (2026-11-21) | +Judit 4–16, Salmo 151 y Joel 4 LXX en `trad/` + 70 fichas restantes (73/73 en `/biblia/libros/:id`) | +70 | 287 |
| Guía didáctica (2026-11-22) | +Guía de lectura `/exegesis/guia` (griego koiné + hebreo y arameo bíblico) | +1 | 288 |
| Hebreo, fase 1 (2026-11-22) | `/biblia/hebreo` + 39 JSON OSHB/WLC + Ezra SIL | +1 | **289** |
| Hebreo, fase 2 (2026-11-23) | columna `hebreo` apagada por defecto en `/exegesis`, paralelo 2/3 cols (`789/929`), fallback sin paralelo forzado (`140`) y bump **`0.12.0`** | 0 | **289** |
| Solo-Codex y apologética (2026-11-24) | +4 traducciones restantes (`sabiduria`, `4-macabeos`, `1-macabeos`, `siracida` → **8/8 archivos, 3.789 vv.** en `borrador`), +4 fascículos `proximamente` (VI–IX) y actualización Adventismo (`100` preg. + 8 partes doctrinales) | 0 | **289** |

- La versión **0.12.0** queda publicada para el hebreo completo (Fases 1 y 2) y las traducciones solo-Codex en borrador.
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
   - **Sabiduría, 4 Macabeos, 1 Macabeos, Sirácida**: ~~sus 4 fichas en `content/libros/` (2026-11-21) + sus 4 traducciones de trabajo completas en `src/assets/texts/trad/` (`3.202 vv.`, `borrador`, tablas en `docs/proyecto-biblico/revision/{sabiduria-01-19,4-macabeos-01-18,1-macabeos-01-16,siracida-01-51}.md`)~~ — completadas el 2026-11-24 (pendiente revisión del usuario).
4. ~~**Hebreo, fase 1**~~ — hecho el 2026-11-22: OSHB/WLC solo texto y marcas (arameo por palabra,
   ketiv/qere), lector RTL `/biblia/hebreo`, Ezra SIL; sin lema ni morfología.
5. ~~**Hebreo, fase 2**~~ — hecho el 2026-11-23: columna hebrea en `/exegesis` (apagada por defecto, paralelo 2/3 cols, fallback sin paralelo forzado en los 140 capítulos no alineados) y bump **`0.12.0`**.
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
- **Hebreo Fases 1 y 2 verificados.** Descargada y parseada la rev. `db6c5c9` (`openscriptures/morphhb`), WLC dominio público / OSHB CC BY 4.0, 39 libros, `23.213` vv., `305.499` palabras, `269` vv. / `4.828` palabras arameas y `1.260` ketiv/qere (`1.245` + `6` + `9`), `789/929` capítulos alineados con NTV y `140` con fallback masorético sin paralelo forzado en `/exegesis` (`0.12.0`).

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
- [x] **Completado el 2026-11-22 (local) — Hebreo Fase 1 + Navegación móvil híbrida**:
  - **Biblia Hebrea (`/biblia/hebreo`)**: 39 libros del AT en `public/textos/hebreo/` (OSHB/WLC rev. `db6c5c9`, `23.213` vv., `305.499` palabras, `6,47 MB`, sin normalizar NFC/NFD), tipografía **Ezra SIL 2.51** empaquetada (`src/assets/fonts/ezra-sil/SILEOT.woff`), arameo marcado palabra por palabra (`269` vv., `4.828` palabras), `1.260` variantes *ketiv/qere* visibles con ficha explicativa, buscador insensible a vocales, conmutadores Cantilación/*niqqud* y suite `qa:hebreo` (22/22). Rutas: **289** (`288` en sitemap).
  - **Navegación móvil híbrida (`≤ 768 px`)**: `<MobileNav />` con barra superior minimalista (y `Índice`/`Aa` en lecturas largas sin duplicar lectores bíblicos), barra inferior fija de 4 accesos (`Inicio`, `Estudio`, `Buscar`, `Menú`) con Auto-hide + Safe Area, Drawer Hoja Inferior con todas las secciones y acceso «Preguntas con la Biblia» en portada (`/#preguntas-con-la-biblia`).
- [x] **Completado el 2026-11-23 (local) — Hebreo Fase 2 (`0.12.0`)**:
  - Extraído `<HebrewVerseTokens />` compartido (`src/components/HebrewVerseTokens.jsx`), temas y apilado `.exg-grid--3`, integración de `Hebreo (WLC)` en `/exegesis` (apagada por defecto, paralelo de 2 o 3 columnas en `789/929` capítulos alineados, fallback honesto a solo hebreo sin paralelo forzado en los `140` no alineados, `KetivQereBody` en `<VersePopover>`, arameo `lang="arc"`, conmutadores cantilación/*niqqud* y créditos), enlace «Comparar en Exégesis» en `/biblia/hebreo` y bump de versión a **`0.12.0`**. Verificado con `qa:hebreo` (30/30), `qa:exegesis` (109/109), `qa:vistas` (126/126) y `qa:a11y` (0 violaciones).
- [x] **Completado el 2026-11-24 (local) — 4 traducciones solo-Codex restantes + Apologética (`proximamente` y Adventismo)**:
  - **Traducciones de trabajo completas (6/6 solo-Codex)**: `sabiduria` (19 caps., 435 vv.), `4-macabeos` (18 caps., 479 vv.), `1-macabeos` (16 caps., 924 vv.) y `siracida` (51 caps., 1.364 vv.) en `src/assets/texts/trad/` → `public/textos/exegesis/trad/` (**3.202 vv.** nuevos; total en `trad/`: **8 archivos · 3.789 vv.** en `borrador`), con tablas de revisión en `docs/proyecto-biblico/revision/{sabiduria-01-19,4-macabeos-01-18,1-macabeos-01-16,siracida-01-51}.md` y términos resueltos en `GLOSARIO.md`. Verificado con `qa:trad` (**114/114**) y `qa:a11y` (0 violaciones).
  - **Apologética**: añadidos 4 nuevos fascículos `proximamente` en `src/data/apologetica.js` (`islam`, `mormonismo`, `testigos-de-jehova`, `judaizantes-raices-hebreas` — 9 fascículos totales en portada y `docs/apologetica/FASCICULOS.md`) e integrado Adventismo actualizado (`100` preguntas en 10 bloques + 8 partes doctrinales). Verificado con `qa:apologetica` (**31/31**).
- [ ] **Revisión humana** de los **8 borradores** publicados en `trad/` (**3.789 vv.**) y de las **73 fichas** en `content/libros/`.
- [ ] **Commit y push a `main`** del lote acumulado (Hebreo Fases 1 y 2 `0.12.0` + navegación móvil híbrida + 4 traducciones solo-Codex restantes + 4 fascículos `proximamente` + Adventismo) para despliegue automático en Cloudflare (`cruxestudios.com`) y auditoría con `npm run qa:prod`.

El lote acumulado queda compilado (`289` rutas) y verificado en local, pendiente de commit, push a `main` y `qa:prod`.

Hecho antes (2026-11-02): la línea base y el refactor de columnas de
`/exegesis` (`COLUMNS` + `modesFor()`; añadir `trad` es una entrada más). Ese
día, sobre el dev server local: `npm run build` OK (214 rutas),
`qa:exegesis` 109/109 (incluye las dos comprobaciones nuevas del modo
guardado), `qa:a11y` 0 critical/serious, `qa:vistas` OK, y `qa:enlaces` en
verde salvo los enlaces externos a `codexsinaiticus.org` (sin respuesta desde
esta máquina, como en la línea base). El rediseño del sitio (`docs/rediseno/`,
fases A–H) se publicó el mismo día; `qa:prod` 63/63.

*(Histórico anterior: ver commit `1e0be6f` en `main` — Lexico V2, `/exegesis/guia`, 19 portadas Biblia Patrística y rediseño `/biblia/libros`, verificado en producción con `qa:prod` 81/81).*

## 8. Cómo actualizar este archivo

- Usa datos contados, no recuerdos.
- Anota la fecha de verificación.
- Si cambia una decisión, actualiza también `DECISIONES.md`.
- Si cambia el alcance, actualiza `README.md`, `TRADUCCION.md` o `FICHAS.md`
  según corresponda.
- No borres el histórico: marca lo superado y explica qué lo reemplazó.
