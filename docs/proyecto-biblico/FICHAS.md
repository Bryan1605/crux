# Fichas de los 73 libros

## 1. Alcance

Se escriben **73 fichas**, una por libro de la tabla canónica
(`src/data/exegesis.js`):

- 66 libros con NTV (39 AT + 27 NT).
- 7 libros que solo conserva el Codex: 2 Esdras, Tobit, Judit, 1 Macabeos,
  4 Macabeos, Sabiduría y Sirácida.

Cada ficha tiene **600–900 palabras** de cuerpo (sin contar la ficha técnica ni
las fuentes). No es un comentario verso a verso: eso es una fase posterior.

La ficha debe ser **histórica y literaria, neutral**. No es catequesis, no es
apologética y no decide cuestiones de fe.

## 2. Principios

### 2.1. Tres capas separadas

Toda afirmación debe poder clasificarse en una de estas capas:

| Capa | Qué es | Cómo se marca |
|---|---|---|
| **Texto** | Lo que el libro dice, su trama, sus géneros, sus palabras. | Se explica sin etiqueta o con `[Texto]` si hace falta. |
| **Tradición** | Lo que una comunidad ha transmitido sobre el libro: autoría, canon, uso litúrgico, interpretación. | `[Tradición]` |
| **Estudio** | Hipótesis y resultados de la investigación histórica, filológica y arqueológica. | `[Estudio]` |

No mezcles las tres en una misma frase sin decirlo. “La tradición atribuye a
X” no es lo mismo que “X escribió”. “Los estudiosos discuten” no es una fuente.

### 2.2. Fechas

- Fecha **narrativa** (cuándo se sitúa la historia) y fecha de **composición**
  (cuándo se escribió el libro) son cosas distintas.
- Usa rangos, no fechas exactas, salvo que haya un dato externo firme.
- Indica el grado de certeza: `segura`, `probable`, `discutida`, `desconocida`.
- No inventes un año para “que quede completo”.

### 2.3. Neutralidad

- Presenta las posiciones con sus argumentos, no como errores.
- No digas “todos los estudiosos” sin una fuente que lo respalde.
- No presentes una hipótesis mayoritaria como certeza, ni una minoritaria como
  consenso.
- No uses “la Iglesia” como un bloque monolítico: distingue tradiciones,
  épocas y confesiones.
- No uses supersesionismo ni polémica antijudía. El canon judío no es una
  “falta”; es otro canon.
- No conviertas la ficha en un sermón, una defensa de la fe o un ataque.
- Si un tema es disputado, escribe una sección de **Debates** con 2–3
  posiciones y sus razones.

### 2.4. Canon

Incluye una tabla de recepción canónica con, al menos:

- canon judío;
- canon católico;
- canon ortodoxo (con la variante que corresponda);
- canon protestante.

No homogenices los deuterocanónicos. En 2 Esdras, además, hay que explicar que
el “2 Esdras” del Codex es **Esdras–Nehemías griego**, no el 2 Esdras/4 Ezra.

## 3. Estructura de una ficha

### Ficha técnica (no cuenta para las 600–900 palabras)

- Título, abreviatura, orden, testamento.
- Género(s) literario(s).
- Lengua original y testigos principales.
- Fecha narrativa / fecha de composición / certeza.
- Canon (judío, católico, ortodoxo, protestante).
- Estado (`borrador`/`revisado`) y fecha de actualización.

### Cuerpo (600–900 palabras)

1. **Género y forma** — qué tipo de libro es, cómo está construido, qué se
   parece y qué no.
2. **Contexto histórico** — mundo narrativo y mundo de composición; imperios,
   diáspora, comunidad, conflictos. Separa lo que el texto dice de lo que se
   reconstruye.
3. **Composición y autoría** — tradición, atribución, hipótesis; fecha y
   lugar; lenguas; fuentes y redacción.
4. **Mensaje y teología** — temas centrales, sin convertir la ficha en
   homilética; distingue lo que el texto afirma de lo que una tradición lee.
5. **Texto y transmisión** — manuscritos, versiones, diferencias de canon,
   lagunas, numeración, estado del texto en el Codex cuando corresponda.
6. **Recepción e historia de la lectura** — cómo se leyó, qué debates provocó,
   qué usos litúrgicos o literarios tuvo.
7. **Claves de lectura** — 3–5 puntos para leer hoy; preguntas que el libro
   plantea; qué evitar (por ejemplo, leer la ficción como crónica).

### Debates (aparte, si hay)

Formato:

```json
{
  "debates": [
    {
      "question": "¿Se escribió en hebreo o en griego?",
      "positions": [
        { "label": "Tradición", "body": "…" },
        { "label": "Estudio", "body": "…" }
      ]
    }
  ]
}
```

- 2–3 posiciones como máximo.
- Cada posición con su mejor argumento, no un hombre de paja.
- Si no hay debate real, no lo inventes.

### Fuentes (3–5)

- 3–5 fuentes **reales**, no una lista decorativa.
- Al menos una fuente pública/verificable y una de investigación moderna.
- Formato: autor, título, año, editorial/URL/DOI.
- No inventes páginas ni citas. Si no has consultado la obra, no la pongas.
- Las fuentes modernas se parafrasean; no se copian párrafos largos.

## 4. Modelo de datos propuesto

> Estado: **propuesta**. No existe todavía `content/libros/`. Si la
> implementación cambia el esquema, actualiza este documento.

### Archivos

| Archivo | Función |
|---|---|
| `content/libros/<id>.json` | Ficha editable y versionada (fuente). |
| `scripts/build-libros.mjs` | Valida y genera la salida pública. |
| `public/textos/libros/index.json` | Índice de fichas disponibles. |
| `public/textos/libros/<id>.json` | Ficha que consume la web. |
| `scripts/qa-libros.mjs` | QA de estructura, conteo, fuentes y enlaces (a crear). |

### Esquema

```json
{
  "id": "tobit",
  "title": "Tobit",
  "abbr": "Tob",
  "order": 17.1,
  "testament": "AT",
  "summary": "…",
  "genre": ["relato sapiencial", "novela judía"],
  "language": "griego; original semítico discutido",
  "date": {
    "narrative": "época del exilio asirio (s. VIII a. C.)",
    "composition": "s. III–II a. C.",
    "certainty": "discutida",
    "note": "…"
  },
  "canon": {
    "judio": "no incluido",
    "catolico": "deuterocanónico",
    "ortodoxo": "deuterocanónico",
    "protestante": "no incluido"
  },
  "notice": null,
  "sections": [
    { "id": "genero", "title": "Género y forma", "body": "…" },
    { "id": "contexto", "title": "Contexto histórico", "body": "…" },
    { "id": "composicion", "title": "Composición y autoría", "body": "…" },
    { "id": "teologia", "title": "Mensaje y teología", "body": "…" },
    { "id": "texto", "title": "Texto y transmisión", "body": "…" },
    { "id": "recepcion", "title": "Recepción e historia de la lectura", "body": "…" },
    { "id": "lectura", "title": "Claves de lectura", "body": "…" }
  ],
  "debates": [],
  "sources": [
    {
      "author": "…",
      "title": "…",
      "year": "…",
      "publisher": "…",
      "url": "…"
    }
  ],
  "status": "borrador",
  "updated": "2026-10-28"
}
```

Reglas:

- `id` debe existir en `src/data/exegesis.js`.
- `title`, `abbr`, `order`, `testament` deben coincidir con la tabla canónica.
- `summary`: 2–3 frases; se usa en el índice y en el SEO.
- `sections`: las siete; si una no aplica, se explica por qué, no se borra sin
  más.
- `debates`: puede ir vacío; si hay, 2–3 posiciones.
- `sources`: 3–5; `url` preferible; si no hay URL, editor/año.
- `status`: `borrador` o `revisado`.
- `notice`: para 2 Esdras, numeración, canon o cualquier aviso que deba verse
  antes que el cuerpo.
- El cuerpo se mide sin la ficha técnica ni las fuentes: 600–900 palabras.

## 5. UI

### Página

- `/biblia/libros` — índice de las 73 fichas, con filtros por testamento,
  canon y estado. Debe funcionar sin JavaScript de más: es una ruta pública.
- `/biblia/libros/<id>` — ficha completa. Si el `id` no existe, 404 real (no
  una página vacía).
- La ficha incluye un bloque de aviso de neutralidad:

  > Esta ficha distingue lo que el texto dice, lo que la tradición transmite y
  > lo que la investigación propone. Las fechas son aproximadas. No decide
  > cuestiones de fe.

- Enlaces al lector: NTV (`/biblia/ntv?libro=<id>&cap=1`), exégesis
  (`/exegesis?libro=<id>&cap=1`) y, si existe, traducción (`?modo=trad`).

### Panel en los lectores

- Un componente compartido (`BookIntroPanel` o similar) muestra un resumen de
  3–5 líneas y un enlace a la ficha.
- Debe aparecer en:
  - `/biblia/ntv` (cabecera del libro),
  - `/exegesis` (panel del libro),
  - `/biblia/hebreo` cuando exista.
- Si la ficha no existe todavía, muestra “Ficha en preparación” y el enlace al
  índice; no rompe el lector.
- No debe tapar el texto ni abrirse solo en cada cambio de capítulo: es un panel
  discreto, cerrado por defecto en móvil.

### SEO y accesibilidad

- Título y descripción de cada ficha en `scripts/routes-lib.mjs`, idénticos a
  `useSeo()`.
- `og:image` y canonical como el resto de rutas.
- Un solo `h1`, jerarquía de encabezados correcta, contraste y foco visible.
- `qa:a11y` debe pasar en escritorio y móvil; `qa:enlaces` debe validar los
  enlaces a fuentes.

## 6. Rutas y build

Estado actual: **214 rutas**. Plan:

| Fase | Rutas nuevas | Total |
|---|---|---:|
| Hebreo | `/biblia/hebreo` | 215 |
| Índice de fichas | `/biblia/libros` | 216 |
| 7 fichas solo-Codex | 7 páginas | 223 |
| 66 fichas NTV | 66 páginas | 289 |

- `scripts/routes-lib.mjs` debe generar las rutas de las fichas **solo si el
  JSON existe**; no se publican 73 páginas vacías.
- `plugins/prerender.mjs` y `sitemap.xml` las leen de ahí; no hay listas
  duplicadas.
- `public/textos/libros/index.json` es la fuente del índice y del panel.
- `content/libros/*.json` se valida en `scripts/validate-content.mjs` y en
  `contentGuard` de `vite.config.js`; un JSON inválido rompe el build.
- `npm run build` debe seguir funcionando sin red.
- No hay editor en `/admin` en la primera fase. Se edita el JSON; si se añade
  después, usa el mismo validador y el historial de `content/.history/`.

## 7. Fuentes y citas

- 3–5 fuentes por ficha.
- Prioriza:
  - fuentes públicas: *Catholic Encyclopedia* (1913), *Jewish Encyclopedia*
    (1906), *Encyclopaedia Biblica* (1903), ediciones críticas de dominio
    público;
  - introducciones y comentarios académicos estándar para el estado de la
    investigación;
  - cuando exista, el texto del Codex y la NTV para las diferencias de texto,
    no como autoridades históricas.
- No uses una fuente confesional como única base de un dato histórico.
- No cites una obra que no hayas consultado. Si solo conoces una cita de
  segunda mano, dilo o búscala.
- `qa:enlaces` comprueba las URLs externas; si una fuente bloquea el rastreo,
  anótalo en el informe de QA, no la borres sin más.
- No copies texto de fuentes modernas. Paráfrasis + cita.

## 8. Orden de escritura

Primero los **7 solo-Codex**, porque son los que no tienen NTV y los que
necesitan la ficha para explicar el canon y la numeración:

1. 2 Esdras (con el aviso de identificación)
2. Tobit
3. Judit
4. 1 Macabeos
5. 4 Macabeos
6. Sabiduría
7. Sirácida

Después, los 66 de la NTV. Dentro de cada grupo, orden canónico del sitio
(`order` de `src/data/exegesis.js`). No hace falta escribirlos todos de golpe:
cada ficha se revisa y se publica antes de pasar a la siguiente.

### 2 Esdras

- No es 4 Ezra. Es el **Esdras–Nehemías griego** del Codex (caps. 9–23).
- La NTV tiene Esdras y Nehemías por separado; la correspondencia no es 1:1.
- La ficha debe explicar la confusión de nombres y por qué no se traduce.
- No lo llames “2 Esdras apocalíptico” sin aclarar la diferencia.

### Tobit, Judit, Macabeos, Sabiduría, Sirácida

- Son deuterocanónicos para católicos y ortodoxos; no están en el canon judío
  ni en el protestante.
- La ficha debe decir qué canon los recibe y con qué estatuto, sin presentarlos
  como “añadidos” o “apócrifos” sin matices.
- En los Macabeos, distingue 1 y 4 Macabeos (histórico/novelesco y
  filosófico/martirial); no los mezcles.
- En Sabiduría y Sirácida, distingue sabiduría sapiencial de otros géneros y
  explica la relación con Proverbios/Eclesiastés.

## 9. Revisión

Checklist por ficha:

- [ ] 600–900 palabras de cuerpo.
- [ ] Ficha técnica completa y coherente con `src/data/exegesis.js`.
- [ ] Fechas como rangos y con certeza; narrativa vs composición separadas.
- [ ] Texto/tradición/estudio distinguidos.
- [ ] Canon judío/católico/ortodoxo/protestante.
- [ ] Debates con 2–3 posiciones (si hay).
- [ ] 3–5 fuentes reales; ninguna inventada.
- [ ] Sin supersesionismo, sin polémica, sin homilética.
- [ ] Enlaces al lector y a la traducción (si existe).
- [ ] `npm run build`, `qa:libros`, `qa:enlaces`, `qa:a11y` pasan.
- [ ] `ESTADO.md` actualizado.

## 10. Fase futura: comentarios por capítulo

No están en este alcance. Cuando se hagan:

- serán un dato distinto (`content/comentarios/<id>/<cap>.json` o similar);
- no inflarán la ficha del libro;
- seguirán las mismas reglas de fuentes y neutralidad;
- se enlazarán desde el lector, no desde la ficha;
- tendrán su propio QA y su propia revisión.

No mezcles un comentario capítulo a capítulo con la ficha de 600–900 palabras.
