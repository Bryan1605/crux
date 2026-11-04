# Estado del proyecto bíblico

> Verificado el **2026-10-28** sobre el árbol de trabajo. Si cambias datos,
> vuelve a contar y actualiza este archivo. No copies cifras de memoria.

## 1. Versión y despliegue

| Dato | Valor |
|---|---|
| Versión de `package.json` | **0.11.0** |
| Repositorio | `Bryan1605/crux` (GitHub Pages) |
| URL publicada | <https://bryan1605.github.io/crux/> |
| Rama | `main` |
| Último commit antes de esta documentación | `f2fdaa2` — «Evita descargar la NTV de los libros solo-Codex» |
| Build CI | `.github/workflows/pages.yml`, `BASE_PATH=/crux/` |
| Rutas | **214** (212 indexables) |

## 2. Lo que ya funciona

### Lectores

- **Biblia Patrística** (`/biblia`): lector por pliegos, buscador, geometría de
  página; fuente `public/textos/biblia-patristica.md`.
- **NTV** (`/biblia/ntv`): 66 libros, rejilla/pliego, notas del traductor,
  selector de versículo, buscador, narración en el raíl.
- **Exégesis comparada** (`/exegesis`): Codex × NTV, aparato crítico, notas,
  léxico, buscador; incluye los 7 libros solo-Codex.
- **Buscar** (`/buscar`): índice de estudios.
- **Administración** (`/admin`): solo en dev; estudios, personajes, videos,
  banner, versículos, anuncios, timeline, concilios, categorías, ajustes, medios.

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
| NTV: secciones | **2.368** |
| NTV: notas | **4.744** |
| Codex: capítulos | **859** |
| Codex: versículos | **21.127** |
| Codex: variantes de aparato | **57.381** |
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
| Estudios | 188 |
| Personajes | 17 |
| Concilios/herejías | 17 |
| Narraciones de audio | 2 |

### Calidad

Última verificación registrada **antes** de esta documentación:

- Build local y QA local en verde.
- `qa:prod` 63/63.
- Auditorías de móvil y accesibilidad sobre producción en verde.
- `main` limpio en `f2fdaa2` antes de crear `AGENTS.md` y `docs/`.
- Build local verificado el **2026-10-28** después de crear esta documentación:
  **214 rutas** prerenderizadas. No se tocó código de la app; el QA completo no
  se repitió en esa pasada.

Línea base del **2026-10-31** (dev server local):

- `npm run build`: OK, 214 rutas.
- `npm run qa`: todo en verde salvo `qa:enlaces`, que falla solo en la
  comprobación de los 7 enlaces externos de páginas a `codexsinaiticus.org`
  (`UND_ERR_CONNECT_TIMEOUT`; desde esta máquina el sitio no respondía a `curl`
  tampoco). Las 39 citas externas del contenido responden. Es un fallo de red
  externa, no del código; repetir cuando el sitio responda.
- Como `qa` encadena con `&&`, `qa:a11y` no llegó a correr dentro de la suite;
  ejecutado aparte: 0 violaciones critical/serious, 0 controles < 24 px
  (avisos de 24–44 px, como antes).

No des estas cifras por vigentes sin volver a ejecutar. La documentación no
cambia el build, pero el árbol queda con archivos nuevos sin commitear.

## 3. Lo que **no** existe todavía

- Lector de hebreo (`/biblia/hebreo`).
- Columna hebrea en `/exegesis`.
- Traducción de los seis libros solo-Codex (`trad/`).
- Fichas de los 73 libros (`content/libros/`, `/biblia/libros`).
- Comentarios capítulo a capítulo.
- Editor de traducciones o fichas en `/admin`.

No los trates como si estuvieran hechos porque aparezcan en la planificación.

## 4. Plan y rutas

| Fase | Qué añade | Rutas nuevas | Total |
|---|---|---:|---:|
| Actual | — | — | 214 |
| Hebreo, fase 1 | `/biblia/hebreo` + datos | 1 | 215 |
| Hebreo, fase 2 | columna de exégesis + alineación | 0 | 215 |
| Fichas, índice | `/biblia/libros` | 1 | 216 |
| Fichas, 7 solo-Codex | 7 páginas | 7 | 223 |
| Fichas, 66 NTV | 66 páginas | 66 | 289 |

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
2. **Tobit**: glosario mínimo, traducción piloto, ficha, panel, índice de
   fichas, registro de fuentes, revisión del usuario.
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
- [ ] Paso 5: ficha, panel, índice de fichas y registro de fuentes; publicar.

El borrador completo ya está en `public/textos/exegesis/trad/tobit.json` y lo
usa la web **en local**; se publica con el siguiente push a `main`.

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
