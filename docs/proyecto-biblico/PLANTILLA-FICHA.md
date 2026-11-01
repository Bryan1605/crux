# Plantilla de ficha

Copia esta plantilla a `content/libros/<id>.json` cuando exista el pipeline de
fichas. **No la publiques tal cual**: los `…` son huecos que hay que escribir.

## 1. Esqueleto JSON

```json
{
  "id": "<id-de-src/data/exegesis.js>",
  "title": "<Título>",
  "abbr": "<Abreviatura>",
  "order": 0,
  "testament": "AT",
  "summary": "<2–3 frases para el índice y el SEO>",
  "genre": ["<género principal>", "<género secundario>"],
  "language": "<lengua original y testigos>",
  "date": {
    "narrative": "<época en la que se sitúa la historia>",
    "composition": "<rango probable de composición>",
    "certainty": "segura | probable | discutida | desconocida",
    "note": "<por qué se elige ese rango>"
  },
  "canon": {
    "judio": "<incluido / no incluido / discutido>",
    "catolico": "<canónico / deuterocanónico / no incluido>",
    "ortodoxo": "<canónico / deuterocanónico / no incluido>",
    "protestante": "<canónico / no incluido>"
  },
  "notice": null,
  "sections": [
    { "id": "genero", "title": "Género y forma", "body": "<…>" },
    { "id": "contexto", "title": "Contexto histórico", "body": "<…>" },
    { "id": "composicion", "title": "Composición y autoría", "body": "<…>" },
    { "id": "teologia", "title": "Mensaje y teología", "body": "<…>" },
    { "id": "texto", "title": "Texto y transmisión", "body": "<…>" },
    { "id": "recepcion", "title": "Recepción e historia de la lectura", "body": "<…>" },
    { "id": "lectura", "title": "Claves de lectura", "body": "<…>" }
  ],
  "debates": [],
  "sources": [
    {
      "author": "<autor>",
      "title": "<título>",
      "year": "<año>",
      "publisher": "<editorial>",
      "url": "<https://…>"
    }
  ],
  "status": "borrador",
  "updated": "<AAAA-MM-DD>"
}
```

## 2. Guion del cuerpo (600–900 palabras)

No escribas las siete secciones como bloques rígidos si el libro no lo pide;
esto es una guía de contenido, no un formulario. El total debe quedar entre 600
y 900 palabras.

| Sección | Palabras orientativas | Preguntas que debe responder |
|---|---:|---|
| Género y forma | 90–130 | ¿Qué tipo de libro es? ¿Cómo se estructura? ¿Qué modelos literarios usa? ¿Qué no es? |
| Contexto histórico | 120–180 | ¿Qué mundo describe? ¿Qué mundo lo produjo? ¿Qué imperios, comunidades o conflictos se ven? Separa narración de reconstrucción. |
| Composición y autoría | 120–180 | ¿Quién lo escribió según la tradición? ¿Qué hipótesis hay? ¿En qué lengua, dónde y cuándo? ¿Qué fuentes o redacciones se proponen? |
| Mensaje y teología | 100–150 | ¿Qué temas centrales tiene? ¿Qué afirma el texto? ¿Qué lectura teológica ha recibido? Sin homilética. |
| Texto y transmisión | 100–150 | ¿Qué manuscritos y versiones hay? ¿Qué diferencias de canon o numeración? ¿Qué pasa en el Codex? |
| Recepción | 80–120 | ¿Cómo se leyó? ¿Qué debates o usos tuvo? ¿Qué influencia literaria o litúrgica? |
| Claves de lectura | 70–100 | 3–5 puntos prácticos; qué evitar; preguntas que quedan abiertas. |

Consejos:

- Empieza por el género y el contexto; sin eso, la teología se vuelve
  impresionista.
- No repitas la ficha técnica en el cuerpo.
- Cada párrafo debe tener una idea y, si afirma un dato discutido, su etiqueta.
- Usa `[Tradición]` y `[Estudio]` al inicio de la frase o del párrafo; no los
  escondas en una nota.
- Las fechas van como rangos: “s. III–II a. C.”, no “año 200 a. C.”.
- Si una sección no aplica, escribe por qué; no la dejes vacía.

## 3. Ficha técnica: ejemplo (Tobit)

Esto es solo un ejemplo de campos, **no una ficha aprobada**:

| Campo | Ejemplo |
|---|---|
| Título | Tobit |
| Abreviatura | Tob |
| Orden | 17.1 |
| Testamento | AT |
| Género | relato sapiencial, novela judía |
| Lengua | griego en el Codex; original semítico discutido |
| Fecha narrativa | época del exilio asirio (s. VIII a. C.) |
| Composición | s. III–II a. C. (discutida) |
| Canon | no incluido en el canon judío; deuterocanónico católico/ortodoxo; no incluido en el protestante |
| Estado | borrador |

## 4. Debates: ejemplo de formato

```json
"debates": [
  {
    "question": "¿El libro se escribió primero en hebreo/arameo o en griego?",
    "positions": [
      {
        "label": "Tradición",
        "body": "La tradición textual y algunas versiones antiguas apuntan a un original semítico; explicar qué testigos lo sugieren."
      },
      {
        "label": "Estudio",
        "body": "Parte de la investigación defiende una composición griega directa; explicar los argumentos y sus límites."
      }
    ]
  }
]
```

- No pongas una sola posición y la llames “debate”.
- No caricaturices la posición que no compartes.
- Si la evidencia es insuficiente, escribe “no hay consenso” y explica por qué.

## 5. Fuentes: formato

```json
"sources": [
  {
    "author": "Autor",
    "title": "Título de la obra",
    "year": "1913",
    "publisher": "Editorial",
    "url": "https://…"
  },
  {
    "author": "Autor moderno",
    "title": "Introducción o comentario",
    "year": "2000",
    "publisher": "Editorial",
    "url": "https://doi.org/…"
  }
]
```

- 3–5 fuentes.
- No inventes páginas ni URLs.
- Si no hay URL estable, usa editorial/año y, si quieres, WorldCat.
- No copies párrafos; parafrasea.

## 6. Aviso de neutralidad (texto fijo)

La página debe mostrar, antes del cuerpo:

> Esta ficha distingue lo que el texto dice, lo que la tradición transmite y lo
> que la investigación propone. Las fechas son aproximadas. No decide
> cuestiones de fe.

No lo cambies por ficha salvo que el usuario lo apruebe.

## 7. Checklist antes de publicar

- [ ] `id`, `title`, `abbr`, `order`, `testament` coinciden con
      `src/data/exegesis.js`.
- [ ] Cuerpo entre 600 y 900 palabras.
- [ ] Siete secciones presentes o justificadas.
- [ ] Fechas como rangos; narrativa vs composición.
- [ ] `[Tradición]`/`[Estudio]` donde toca.
- [ ] Canon judío/católico/ortodoxo/protestante.
- [ ] Debates con 2–3 posiciones, si hay.
- [ ] 3–5 fuentes reales.
- [ ] Sin supersesionismo, polémica o sermón.
- [ ] Enlaces al lector y a la traducción (si existe).
- [ ] `status` correcto (`borrador` hasta revisión).
- [ ] `npm run build`, `qa:libros`, `qa:enlaces`, `qa:a11y`.
- [ ] `ESTADO.md` actualizado.
