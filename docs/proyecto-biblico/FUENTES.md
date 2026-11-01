# Fuentes y licencias

Regla de oro: **cada texto que se publica tiene que poder rastrearse hasta un
archivo, una URL o un script del repositorio**. Si no se puede, no se publica.

## 1. NTV — Nueva Traducción Viviente

| Campo | Dato |
|---|---|
| Nombre | *Biblia Nueva Traducción Viviente* |
| Traducción | Tyndale House Foundation |
| Volcado | `src/assets/texts/nueva-traduccion-viviente.md` (unos 5,2 MB) |
| Procedencia del volcado | ePub/PDF convertido; el archivo conserva la marca `www.lectulandia.com`, la ficha «Anónimo, 2010» y «Traducción: Tyndale House Foundation» |
| Script | `scripts/build-ntv.mjs` + `scripts/exegesis-lib.mjs` (`parseNtv`) |
| Salida | `public/textos/exegesis/ntv/<libro>.json` (66 libros) |
| Cobertura | 66 libros, 1.189 capítulos, 31.021 versículos, 2.368 secciones, 4.744 notas |
| Derechos | **Traducción con derechos de Tyndale House Foundation.** No es dominio público. |

Notas:

- El volcado tiene ruido de conversión (encabezados, números de página, notas,
  ` ``` `, caracteres mal codificados, versículos fusionados). El parser limpia
  la salida; **no se corrige el JSON generado a mano**.
- El índice de testigos (`public/textos/exegesis/index.json`) la fecha en 2009;
  el volcado dice 2010. Es una diferencia de edición, no un dato que haya que
  “arreglar” sin fuente.
- La NTV se usa como texto español existente del sitio y como columna de
  comparación. **No se redistribuye como texto libre** ni se usa para rellenar
  lagunas del Codex.
- Una traducción nueva de los libros solo-Codex **no es NTV** y no puede llevar
  esa etiqueta.

## 2. Codex Sinaiticus

| Campo | Dato |
|---|---|
| Testigo | Codex Sinaiticus (s. IV, c. 330–360) |
| Fuente | Codex Sinaiticus Project, <https://codexsinaiticus.org/> |
| Transcripción | Visor del proyecto, por cuaderno/folio/cara (`handler/transcription.ashx`) |
| Script | `scripts/fetch-codex.mjs` (`--refresh`, `--metadata`) |
| Caché | `src/assets/texts/.cache-codex/` (ignorada por git; 1.193 archivos) |
| Salida | `public/textos/exegesis/codex/<libro>.json` (59 libros) |
| Cobertura | 59 libros, 859 capítulos, 21.127 versículos, 57.381 variantes de aparato |
| Licencia | **CC BY-NC-SA 3.0 Unported** (atribución, no comercial, compartir igual) |
| Atribución literal | `WITNESS_ATTRIBUTION` en `src/data/exegesis.js` |

La atribución que exige el proyecto y que debe acompañar a cualquier reutilización:

> Codex Sinaiticus by The Codex Sinaiticus Project (http://www.codexsinaiticus.org)
> is licensed under a Creative Commons Attribution-NonCommercial-ShareAlike 3.0
> Unported License. Based on a work at www.codexsinaiticus.org.

Notas:

- `src/assets/texts/codex-sinaiticus-1911.md` es un facsímil/introducción de 1911
  con OCR; **no lo usa el build**. La transcripción real viene del visor y de la
  caché. No lo cites como si fuera el texto griego que se muestra.
- El texto del Codex no lleva acentos y usa sigma lunada (`ϲ`). Conserva las
  marcas de transcripción: `§N` (ancla del aparato), `>`, `‹›` (sobrelínea),
  `κ(αι)` (abreviaturas), etc.
- El aparato crítico **no se traduce**. Se conserva en griego y se explica, si
  hace falta, en una nota de la traducción.
- La traducción de los libros solo-Codex es una **obra derivada** de esta
  transcripción: hereda CC BY-NC-SA 3.0 y la atribución.

## 3. Léxico griego y lemas

| Fuente | Uso | Licencia | Dónde |
|---|---|---|---|
| TBESG — STEPBible, *Translators Brief lexicon of Extended Strongs for Greek* | Lema, transcripción, categoría, Strong | CC BY 4.0; basado en Abbott-Smith (1922), dominio público | `scripts/fetch-lexico.mjs`; caché `.cache-lexico/tbesg.txt` |
| MorphGNT — lematización/morfología del SBLGNT | Análisis morfológico | CC BY-SA 3.0; solo se usan las columnas de análisis, no se redistribuye el texto SBLGNT | `scripts/fetch-lexico.mjs`; caché `.cache-lexico/morphgnt/` |
| Glosas españolas | Traducción/adaptación propia | del proyecto | `content/lexico/griego.json` |

- Salida: `public/textos/exegesis/lexico.json` (250 entradas; 136.612 tokens;
  77,31 % de cobertura) y `public/textos/exegesis/lemas/<libro>.json`.
- Scripts: `scripts/build-lexico.mjs`, `scripts/build-lemas.mjs`,
  `scripts/lexico-lib.mjs`, `scripts/lexico-files.mjs`.
- **MorphGNT y Strong son solo del Nuevo Testamento.** No hay lematización ni
  léxico equivalente para el hebreo ni para el griego del AT del Codex. No
  inventes códigos Strong para el AT.
- El léxico publicado está pensado para el NT; los libros solo-Codex y el AT no
  tienen mapa de lemas. Si se amplía, hay que elegir una fuente nueva y
  documentarla aquí.

## 4. Hebreo (planificado, aún no implementado)

| Campo | Decisión |
|---|---|
| Fuente | **OSHB** (Open Scriptures Hebrew Bible) sobre **WLC** (Westminster Leningrad Codex) |
| Texto | WLC, dominio público |
| Morfología/OSHB | CC BY 4.0 |
| Enlace previsto | <https://github.com/openscriptures/morphhb> |
| Tipografía | **Ezra SIL** (SIL Open Font License) |
| Cobertura | 39 libros del AT, 23.213 versículos |
| Arameo | 269 versículos, marcados palabra por palabra |
| Ketiv/qere | 1.254 casos |
| Alineables con la NTV | 789 de 929 capítulos (según el análisis de diseño) |
| Ruta | `/biblia/hebreo` (nueva; 215 rutas) |
| Versión prevista | 0.12.0 |

Rangos de arameo que hay que respetar:

- Daniel 2:4–7:28
- Esdras 4:8–6:18 y 7:12–26
- Génesis 31:47
- Jeremías 10:11

Notas:

- El lector debe ser **RTL**, con el arameo marcado por palabra y el ketiv/qere
  visible sin convertir el texto en una reconstrucción.
- La columna de exegesis hebrea irá **apagada por defecto**; si un capítulo no
  alinea, se muestra el texto hebreo sin forzar el paralelo.
- No normalices el texto hebreo a NFC/NFD sin una decisión explícita: los
  acentos y la morfología dependen de la forma transmitida.
- Esta sección es un **plan**, no una fuente ya descargada. Antes de implementar,
  verifica la versión, la licencia y el número de archivos; actualiza `ESTADO.md`.

## 5. Traducción nueva de los libros solo-Codex

| Campo | Decisión |
|---|---|
| Base | `public/textos/exegesis/codex/<libro>.json` |
| Libros | Tobit, Judit, Sabiduría, 4 Macabeos, 1 Macabeos, Sirácida |
| Total | 3.761 versículos; 67.487 palabras griegas (conteo del tokenizador del sitio) |
| 2 Esdras | **No se traduce**: es Esdras–Nehemías griego del Codex, ya cubierto por la NTV |
| Salmo 151 / Joel 4 | Se traducen después de Tobit, como pasajes especiales (7 y 21 vv) |
| Licencia | CC BY-NC-SA 3.0 (obra derivada del Codex) |
| Etiqueta | «Traducción de trabajo · Borrador»; nunca «NTV» |
| Método | Borrador asistido + revisión del usuario |

Detalle completo en `TRADUCCION.md`.

## 6. Audio e imágenes

- **Audio**: `content/narraciones.json` apunta a `public/audio/ntv/*.ogg` y a sus
  ondas `*.peaks.json`. El repo no documenta la fuente/licencia de los audios;
  no los reutilices fuera del sitio sin verificarlo. Las ondas se generan con
  `node scripts/build-audio-peaks.mjs` (Chrome).
- **Imágenes**: las fuentes viven en `src/assets/imgs/`; los JPG/JPEG no se
  versionan. Lo publicado son los `.webp` de `public/img/`, generados con
  `node scripts/optimize-images.mjs`. `qa:imagenes` comprueba que toda
  referencia `/img/...` responde 200.
- **Biblia Patrística**: `public/textos/biblia-patristica.md` es un texto fuente
  del sitio; no lo reformatees ni lo regeneres sin necesidad. `qa:biblia`
  verifica su geometría y su contenido.

## 7. Fuentes para las fichas de los 73 libros

Cada ficha debe llevar **3–5 fuentes reales**, no una bibliografía decorativa.
La política completa está en `FICHAS.md`; en corto:

- Prioriza fuentes públicas y verificables (p. ej. *Catholic Encyclopedia* de
  1913, *Jewish Encyclopedia* de 1906, *Encyclopaedia Biblica* de 1903) para
  datos históricos y de recepción.
- Para el estado de la investigación, usa introducciones y comentarios
  académicos estándar; cita autor, título, año y, si existe, URL/DOI estable.
- Separa `[Tradición]` de `[Estudio]`; no presentes una hipótesis como consenso.
- No inventes páginas, citas ni URLs. Si un enlace no responde, `qa:enlaces` lo
  detecta; si es de pago, enlaza a la editorial/WorldCat y anótalo.
- No copies párrafos largos de fuentes modernas; parafrasea y cita.

## 8. Cómo verificar una fuente

1. ¿Existe el archivo local o la URL?
2. ¿La licencia permite el uso que se le da?
3. ¿La atribución está en la página o en el JSON?
4. ¿El script que la procesa está versionado?
5. ¿El QA correspondiente pasa?

Si alguna respuesta es “no”, no se publica.
