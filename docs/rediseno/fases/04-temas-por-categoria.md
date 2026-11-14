# Fase D — Temas por categoría (Fundamentos como Parábolas)

**Qué:** las 92 fichas de Fundamentos no tienen `subcategory`; se les asigna un tema y se
define el orden y la presentación de los temas de cada categoría.

### D.1 `content/temas.json` (nuevo, validado en el build)

Copiar tal cual **`docs/rediseno/datos/temas.json`** a `content/temas.json`. Contiene el orden,
el lema y la imagen opcional de los temas de Fundamentos (13), Parábolas (7), Apologética (2)
y Personajes (1).

- `key` = valor exacto de `subcategory` en el frontmatter; `label` (opcional) = cómo se
  muestra (si falta, se usa `key`); `lema` e `image` opcionales.
- El orden del array es el orden de la sidebar.
- Validar en `scripts/validate-content.mjs`: categorías existentes, `key` únicas, `image`
  que exista en `public/img/`, y avisar de fichas cuya `subcategory` no esté en la lista.
- Exponerlo en `src/data/temas.js` (con `assetUrl()` en `image`).
- Editor en `/admin` (opcional, fase posterior): lista ordenable por categoría.

### D.2 Asignar el tema a cada ficha de Fundamentos

Script de un solo uso `scripts/asignar-temas-fundamentos.mjs`: **simula por defecto** y solo
escribe con `--write`; antes de escribir copia cada archivo a `content/.history/` (mismo
mecanismo que el panel). Añade `subcategory: "<tema>"` al frontmatter sin tocar el resto.
Después: `npm run build` (regenera `estudios.json` y `busquedas.json`).

**Fuente de datos del script: `docs/rediseno/datos/asignacion-fundamentos.json`** (slug → tema,
las 92 fichas, generado del índice real; `null` = la ficha de entrada, que no lleva tema).
El script debe abortar si algún slug de `01-fundamentos` no está en el archivo o al revés.

Resumen de la asignación (por el número del slug `01-fundamentos--NN-…`):

| Tema | Fichas (NN) | Total |
|---|---|---|
| Salvación | 01–06, 08–10, 18, 21–26 · `legalismofranciscoisrael` | 17 |
| Santificación | 11–14 | 4 |
| Identidad y servicio | 15, 16, 17, 19, 20 | 5 |
| La Escritura | 07, 27 · `pablo-no-contradice-la-escritura` | 3 |
| Cristo | 28–35 | 8 |
| Dios y la Trinidad | 36–40 | 5 |
| Espíritu Santo | 41–45, 87, 88 | 7 |
| El ser humano | 46–50 | 5 |
| La Iglesia | 51–57 | 7 |
| Últimos tiempos | 58–65 | 8 |
| Vida cristiana | 66–76, 84 | 12 |
| Mundo espiritual | 77–79 | 3 |
| Soberanía y misión | 80–83, 85, 86, 89 | 7 |
| *(sin tema: ficha de entrada)* | `fundamentos-teologia-ntv` | 1 |

Total 92. `fundamentos-teologia-ntv` («Fundamentos de doctrina — NTV») es un panorama:
mostrarla **fija arriba** como «Empieza aquí», fuera de los grupos.
