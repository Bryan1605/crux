# Traducción de los libros solo-Codex

## 1. Alcance

Se traducen **seis libros completos** que el Codex Sinaiticus conserva y la NTV
no:

| Libro | id | Versículos | Palabras griegas |
|---|---|---:|---:|
| Tobit | `tobit` | 232 | 7.344 |
| Judit | `judit` | 327 | 8.746 |
| Sabiduría | `sabiduria` | 435 | 6.960 |
| 4 Macabeos | `4-macabeos` | 479 | 7.877 |
| 1 Macabeos | `1-macabeos` | 924 | 18.142 |
| Sirácida | `siracida` | 1.364 | 18.418 |
| **Total** | | **3.761** | **67.487** |

Conteo hecho con el tokenizador de `src/lib/greek.js` sobre
`public/textos/exegesis/codex/`. Si el Codex se regenera, vuelve a contar.

### Lo que queda fuera de la traducción

- **2 Esdras**: el “2 Esdras” del Codex es **Esdras–Nehemías griego** (caps.
  9–23), no el 2 Esdras/4 Ezra apocalíptico. La NTV ya tiene Esdras y Nehemías.
  **No se traduce**; sí lleva ficha, con el aviso de identificación.
- **Salmo 151** (7 vv) y **Joel 4** (21 vv): se traducen después de Tobit como
  pasajes especiales, con aviso de numeración. No son libros completos.
- Los 59 libros que ya tienen NTV no se retraducen. La NTV sigue siendo la
  columna española de esos libros.

## 2. Texto base

La traducción se hace **desde el griego del Codex**, no desde la NTV ni desde
otra traducción moderna.

Base: `public/textos/exegesis/codex/<libro>.json`.

- El texto no lleva acentos y usa sigma lunada (`ϲ`).
- Se conservan las marcas de transcripción: `§N` (ancla del aparato), `>`,
  `‹›` (sobrelínea), `κ(αι)` (abreviaturas), etc.
- **El aparato no se traduce.** No se convierten las variantes en notas de la
  traducción ni se elige una variante sin decirlo.
- **No se rellenan lagunas.** Si el Codex no tiene texto en un versículo, no se
  completa con la NTV, la Vulgata ni una reconstrucción. Se traduce lo que hay y
  se anota.
- **No se crean versículos vacíos.** El JSON no debe contener `"text": ""`.
- La numeración es la del Codex. Si no coincide con la NTV, se avisa en la UI;
  no se renumera para “cuadrar”.

## 3. Método: borrador asistido + revisión

El usuario revisa. La IA no publica una traducción “aprobada” por su cuenta.

1. **Preparar**: cargar el libro del Codex, capítulo a capítulo, con el aparato
   visible y el texto griego al lado.
2. **Borrador**: proponer una traducción española versículo a versículo. Se
   permite apoyo de modelos, diccionarios y del léxico del sitio, pero la base
   es el griego.
3. **Contraste**: leer el borrador contra el griego; corregir sintaxis,
   nombres, términos y ambigüedades. **No copiar la NTV.** Si una frase coincide
   por casualidad, no es un problema; si se usa como fuente, sí.
4. **Revisión del usuario**: el usuario marca los versículos que aprueba y
   corrige lo que haga falta. Sin esa revisión, la ficha y la traducción siguen
   en `borrador`.
5. **Cierre**: actualizar `ESTADO.md`, ejecutar los QA y publicar con la etiqueta.

### Criterios de traducción

- Fidelidad al griego del Codex por delante de la elegancia.
- Español natural, sin arcaísmos innecesarios; el registro del sitio es culto
  pero legible.
- Conservar la ambigüedad cuando el griego la tiene; no resolverla a la fuerza.
- No armonizar con la NTV ni con la teología de una confesión.
- Nombres propios y topónimos: forma española estable del sitio (Tobit, Tobías
  para el personaje cuando el contexto lo pida, Judit, Nínive, etc.). El
  `GLOSARIO.md` manda.
- Términos clave: decisión registrada en `GLOSARIO.md`. Si un término no está,
  se decide y se añade antes de seguir.
- Los añadidos sintácticos mínimos del español no se marcan; las
  reconstrucciones o conjeturas sí, y con nota.
- No se traducen las notas del traductor de la NTV (no existen en estos libros)
  ni el aparato del Codex.

### Plantilla de revisión por versículo

Para el piloto se puede trabajar con una tabla como esta (fuera de la web, en
Markdown o en una hoja de cálculo):

| v | Griego del Codex | Borrador | Decisión / nota | Revisor |
|---|---|---|---|---|
| 1:1 | `βιβλοϲ λογων τωβειθ…` | … | … | … |
| 1:2 | `οϲ ηχμαλωτευθη…` | … | … | … |

- Una fila por versículo; no se publica una fila sin `text`.
- La columna “Decisión / nota” recoge por qué se eligió un término, no el
  aparato.
- El revisor marca “OK” o deja la corrección; el estado del libro no pasa a
  `revisado` hasta que el usuario lo apruebe.
- Al cerrar el capítulo, las decisiones nuevas se trasladan a `GLOSARIO.md`.

## 4. Etiqueta, licencia y atribución

La traducción es una **obra derivada** de la transcripción del Codex:

- Etiqueta visible: **«Traducción de trabajo · Borrador»**.
- Nombre corto de columna: **Trad**.
- Licencia: **CC BY-NC-SA 3.0 Unported**.
- Atribución: la misma del Codex (`WITNESS_ATTRIBUTION` en
  `src/data/exegesis.js`), más una línea de “traducción de trabajo del proyecto
  Crux”.
- **Nunca** se etiqueta como NTV, “Nueva Traducción Viviente”, “NTV revisada” ni
  se presenta como traducción oficial.
- Mientras no haya revisión del usuario, el estado es `borrador`. No se quita la
  etiqueta para “que se vea más limpio”.

## 5. Datos: esquema

> Estado: **implementado el 2026-11-04** con el piloto de Tobit (caps. 1–3).
> Diferencias con la propuesta original: las notas van **por versículo**
> (`verses[].note`, opcional) en vez de un `notes` general; la fuente admite un
> `scope` (texto) que explica la cobertura parcial; `name`, `abbr`, `order` y
> `codexNo` los pone `build-trad` desde `src/data/exegesis.js` (la fuente no
> necesita repetirlos). Un capítulo traducido debe cubrir **todos** sus
> versículos del Codex; los capítulos aún no traducidos simplemente no están.

### Archivos

| Archivo | Función |
|---|---|
| `src/assets/texts/trad/<id>.json` | Original editable y versionado; lo revisa el usuario. |
| `scripts/build-trad.mjs` | Valida y publica la traducción; no inventa texto. |
| `public/textos/exegesis/trad/<id>.json` | Salida que consume la web. |
| `scripts/qa-trad.mjs` | QA de cobertura, versículos vacíos, etiquetas, metadatos, integridad y UI (`npm run qa:trad`). |

### Forma del JSON

```json
{
  "id": "tobit",
  "name": "Tobit",
  "abbr": "Tob",
  "order": 17.1,
  "codexNo": 10,
  "label": "Traducción de trabajo · Borrador",
  "status": "borrador",
  "base": "codex",
  "license": "CC BY-NC-SA 3.0",
  "chapters": [
    {
      "num": 1,
      "verses": [
        { "n": 1, "text": "…" }
      ]
    }
  ]
}
```

Reglas del esquema:

- `id`, `name`, `abbr`, `order`, `codexNo` deben coincidir con
  `src/data/exegesis.js` y con el JSON del Codex.
- `chapters[].num` y `verses[].n` son los del Codex; no se renumeran.
- Cada versículo del Codex en el alcance debe tener su `text` no vacío.
- No se incluyen versículos que el Codex no tiene.
- `status`: `borrador` o `revisado`. Solo el usuario puede aprobar `revisado`.
- `verses[].note` (opcional): nota de traducción, no del aparato. Debe explicar
  una decisión (o por qué se sigue a un corrector), no reemplazar el aparato. En
  la web sale como `*` en la celda y en el panel «Notas de la traducción».

### Integración con la exégesis

- `public/textos/exegesis/index.json` gana un testigo `trad` (nombre,
  atribución, licencia) y, por libro, la cobertura `trad`.
- `src/lib/exegesisTexts.js` debe poder cargar `trad` igual que `ntv`/`codex`.
- `src/pages/Exegesis.jsx`:
  - libros con NTV: modos actuales `paralelo` (Codex × NTV), `codex`, `ntv`.
  - libros solo-Codex con traducción: `paralelo` pasa a ser **Codex × Trad**;
    se añade `trad` (solo traducción); `ntv` no está disponible.
  - `?modo=trad` abre la traducción sola. El modo guardado en
    `localStorage` debe validarse contra los modos disponibles del libro; si no,
    vuelve a `paralelo`.
  - La etiqueta «Traducción de trabajo · Borrador» y la licencia deben verse en
    la columna y en el panel de información, no solo en el JSON.
- `src/pages/BibliaNtv.jsx`: el estado vacío de un libro solo-Codex debe enlazar
  a `/exegesis?libro=<id>&cap=1` (y, cuando exista, a `?modo=trad`), no dejar al
  lector sin salida.
- **No hay editor en `/admin` para el piloto.** Se edita el JSON y se revisa con
  el usuario. Un editor posterior debe usar el mismo validador.

### Pipeline

Implementado (`exegesis:trad` y `qa:trad`):

```bash
npm run exegesis        # NTV + Codex + índice + buscadores + lemas + léxico
npm run exegesis:trad   # valida y publica trad/
npm run build
npm run qa:trad
npm run qa:exegesis
npm run qa:lexico
```

`exegesis:trad` solo procesa los archivos que existen en `src/assets/texts/trad/`,
así que no falla por los libros que faltan; aun así sigue **fuera** del script
`exegesis`. Orden a mano: `exegesis:trad` → `exegesis:index` (el índice lee
`public/textos/exegesis/trad/` y declara el testigo `trad` y su cobertura).

## 6. QA de la traducción

`scripts/qa-trad.mjs` comprueba (implementado; está en `npm run qa`):

- **Cobertura**: por cada libro en alcance, todos los versículos del Codex
  tienen traducción; no sobran versículos.
- **No vacíos**: ningún `text` vacío, solo espacios o formado solo por marcas.
- **Aparato intacto**: la traducción no contiene `§`, `‹`, `›`, `>` ni las
  abreviaturas del aparato; el griego sigue teniéndolas.
- **Metadatos**: `label`, `status`, `base`, `license`, `id`, `codexNo` y
  `order` correctos; `label` no contiene “NTV”.
- **Numeración**: `chapters[].num` y `verses[].n` coinciden con el Codex.
- **Integridad**: el JSON de salida es igual al de origen validado (o se
  regenera de forma determinista).
- **UI**: en el navegador, Tobit abre por defecto en Codex × Trad; `?modo=trad`
  muestra solo la traducción; el aviso de licencia/borrador es visible; no hay
  errores de consola; móvil y axe sin `critical`/`serious`.
- **Enlaces**: el estado vacío de `/biblia/ntv?libro=tobit` lleva a la
  exégesis/traducción.

Los QA manuales que no se automaticen deben quedar escritos en el informe de la
entrega: qué se revisó, con qué texto y qué quedó pendiente.

## 7. Revisión del usuario

Checklist para cerrar un libro:

- [ ] El usuario leyó el libro completo (o autorizó explícitamente el alcance
      revisado).
- [ ] Los términos nuevos están en `GLOSARIO.md`.
- [ ] Los nombres propios son consistentes en todo el libro.
- [ ] No hay versículos vacíos ni rellenos de lagunas.
- [ ] El aparato no se tradujo.
- [ ] La etiqueta y la licencia se ven en la UI.
- [ ] `npm run build`, `qa:trad`, `qa:exegesis`, `qa:lexico`, `qa:vistas`,
      `qa:enlaces` y `qa:a11y` pasan.
- [ ] `ESTADO.md` y, si cambió una decisión, `DECISIONES.md` están al día.

## 8. Piloto: Tobit

Tobit es el primero porque:

- es manejable (232 vv) y tiene un arco narrativo claro;
- mezcla narrativa, oración, sabiduría y limosna, así que prueba el glosario;
- ya tiene ficha planificada y es el ejemplo natural del panel;
- su estado vacío en `/biblia/ntv` es el caso que hay que resolver primero.

Orden del piloto:

1. Preparar el glosario mínimo (los términos de Tobit).
2. Traducir Tobit 1–3 y revisar con el usuario.
3. Ajustar el esquema/UI con esa muestra.
4. Completar 4–14 y revisar. *(Traducido el 2026-11-04; la revisión del usuario
   queda pendiente.)*
5. Publicar con etiqueta y ficha; actualizar `ESTADO.md`.
6. Solo entonces empezar Judit.

No empieces por Sirácida (1.364 vv) ni por 1 Macabeos (924 vv): son los más
largos y esconden los problemas de formato hasta el final.
