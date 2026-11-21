# Estado del proyecto bíblico

> Verificado el **2026-11-20** sobre el árbol de trabajo (pendiente de commit/push). Si
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
| Rutas | **213** prerenderizadas (**212** URLs indexables en `sitemap.xml`, sin `/buscar`): 11 de sección + 184 estudios + 17 personajes + 1 ficha de libro (`tobit`). *(Histórico: 214 hasta 2026-10-31; 216 tras añadir Tobit el 2026-11-04; +1 por `/apologetica/shincheonji`, −1 análisis privado en `e76ad6d` y −3 notas internas del vault → 213).* |

## 2. Lo que ya funciona

### Lectores

- **Biblia Patrística** (`/biblia`): lector por pliegos o desplazamiento, buscador,
  geometría de página, línea temporal de obras y portadas por obra (Fase I: Parte 1.3
  Ignacio de Antioquía); fuente `public/textos/biblia-patristica.md` actualizada hasta la
  **Parte 6 — San Hipólito de Roma (c. 170–235 d.C.)** (23 partes, 1.504 secciones, 4.175
  páginas).
- **NTV** (`/biblia/ntv`): 66 libros, rejilla/pliego, notas del traductor,
  selector de versículo, buscador, panel de libro y narración en el raíl.
- **Exégesis comparada** (`/exegesis`): Codex × NTV (y columna `Trad` para Tobit en
  borrador), aparato crítico, notas, léxico griego, buscador y panel de libro; incluye los
  7 libros solo-Codex.
- **Libros de la Biblia** (`/biblia/libros` y `/biblia/libros/:id`): índice de los 73
  libros, registro de fuentes verificadas (`content/libros/fuentes.json`) y primera ficha
  piloto (`tobit`, 834 palabras, `borrador`).
- **Apologética** (`/apologetica/shincheonji`): 100 preguntas en 10 bloques (Codex × NTV
  con palabras clave resaltadas) y pestaña «¿Qué cree Shincheonji?» con 35 citas
  contrastadas de Lee Man-hee.
- **Buscar** (`/buscar`): búsqueda global de estudios, libros de la Biblia, apologética,
  personajes, concilios, herejías y vídeos (**221 entradas**).
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
| Traducción de trabajo (`trad/`) | **1 libro · 232 versículos** (`tobit`, `borrador`) |
| Léxico: entradas | **250** |
| Léxico: tokens | **136.612** |
| Léxico: cobertura | **77,31 %** |

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
| Fichas de libros | **1** (`tobit`, `borrador`) |
| Páginas de apologética | **1** (`shincheonji`) |
| Portadas de obras (Biblia Patrística) | **1** (Parte 1.3 — Ignacio de Antioquía) |

### Calidad

Verificado el **2026-11-20** sobre el árbol de trabajo local (build de producción y dev server `http://localhost:5173`):

- `npm run build`: **OK** (213 rutas prerenderizadas, 212 URLs en `dist/sitemap.xml`, `content/busquedas.json` con 221 entradas).
- `npm run check:search`: **17/17 checks OK** (cubre `estudio`, `libro`, `apologetica`, `personaje`, `concilio`, `herejia` y `video`).
- `npm run qa:biblia`: **80/80 comprobaciones OK** (23 partes, 1.504 secciones, 4.175 páginas).
- `npm run qa:imagenes`: **66/66 comprobaciones OK** (incluye `/img/obras/1-3-ignacio-de-antioquia.webp`).
- `npm run qa:buscar`: **32/32 checks OK** (incluye `tobit` y `shincheonji` en navegador).
- `npm run qa:vistas`: **124/124 comprobaciones OK**.
- `npm run qa:libros`: **22/22 comprobaciones OK**.
- `npm run qa:a11y`: **0 violaciones `critical`/`serious`** y **0 controles < 24 px**.
- `npm run qa:enlaces`: **6/7 OK** — las 21 páginas, 675 destinos internos, 70 anclas y 39 citas externas de estudios en verde; falla solo el bloque de enlaces externos de páginas hacia `codexsinaiticus.org` por `UND_ERR_CONNECT_TIMEOUT` desde esta máquina (como en mediciones previas).
- Comprobación visual de Fase I (`1280px` y `390px`): Ignacio 1.3 muestra la portada (184 px en escritorio, 104 px en móvil, 0 px de desbordamiento, clic abre `?pag=p1-3.1`); Policarpo 1.4 no muestra portada.
- Antes del último bloque (sobre el árbol previo al cierre de Fase I y buscador ampliado) también pasaron `qa:shincheonji` (38/38) y `qa:admin` (10/10).

*Histórico anterior:*

Última verificación registrada el **2026-10-28**: Build local y QA local en verde, `qa:prod` 63/63, auditorías móvil/a11y sobre producción en verde y `main` en `f2fdaa2`.
Línea base del **2026-10-31**: `npm run build` OK (214 rutas) y `npm run qa` en verde salvo el timeout externo a `codexsinaiticus.org`; `qa:a11y` con 0 critical/serious y 0 controles < 24 px. El **2026-11-02** se publicó el rediseño fases A–H (`qa:prod` 63/63).

## 3. Lo que **no** existe todavía

- Lector de hebreo (`/biblia/hebreo`).
- Columna hebrea en `/exegesis`.
- Traducción de los otros cinco libros solo-Codex (`trad/`: Judit, Sabiduría, 4 Macabeos, 1 Macabeos y Sirácida; Tobit ya tiene borrador completo de 232 vv pendiente de revisión del usuario).
- Fichas de los 72 libros restantes (`content/libros/`; el índice `/biblia/libros` y Tobit en borrador ya existen).
- Comentarios capítulo a capítulo.
- Editor de traducciones o fichas en `/admin`.

No los trates como si estuvieran hechos porque aparezcan en la planificación.

## 4. Plan y rutas

| Fase | Qué añade | Rutas nuevas | Total |
|---|---|---:|---:|
| Base previa (2026-10-31) | — | — | 214 |
| Estado actual (2026-11-20) | +Tobit (`/biblia/libros`, `/biblia/libros/tobit`) + `/apologetica/shincheonji` − 1 análisis privado (`e76ad6d`) − 3 notas internas | −1 neto | **213** |
| Hebreo, fase 1 | `/biblia/hebreo` + datos | 1 | 214 |
| Hebreo, fase 2 | columna de exégesis + alineación | 0 | 214 |
| Fichas, 6 solo-Codex restantes | 6 páginas (2 Esdras, Judit, Sabiduría, 4 Mac, 1 Mac, Sirácida) | 6 | 220 |
| Fichas, 66 NTV | 66 páginas | 66 | 286 |

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
3. **Los otros cinco**: Judit, Sabiduría, 4 Macabeos, 1 Macabeos, Sirácida, y
   la ficha de 2 Esdras.
4. **Hebreo, fase 1**: OSHB/WLC solo texto y marcas (arameo por palabra,
   ketiv/qere), lector RTL, Ezra SIL; sin lema ni morfología.
5. **Hebreo, fase 2**: columna de exégesis, alineación, fallback; bump 0.12.0.
6. **Las 66 fichas de la NTV**, por lotes.
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
- [ ] **Revisión, commit y push** de los cambios locales actuales (sección apologética de portada, Hipólito de Roma Parte 6, vídeo `0Rou8PPA2Oo`, limpieza de notas/rutas locales en estudios, Fase I portadas de obras en `/biblia`, buscador global ampliado, documentación) y, tras desplegar, ejecutar `npm run qa:prod`.

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
