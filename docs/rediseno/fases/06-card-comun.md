# Fase F — Card común para todas las vistas de tarjetas

**Qué:** una sola card, oscura y con aire, para **todas** las vistas de tarjetas de la web.
Sustituye a las tarjetas actuales de texto solo. La referencia visual exacta (HTML + CSS
listos para portar) está en **`docs/rediseno/referencia/study-card.html`**; ábrela en el
navegador para ver las tres variantes.

**Dónde se usa (todas iguales):**

- `/estudio` en modo **Tarjetas**, en **todas** las categorías y en «Todos».
- Tarjetas de **personaje** dentro de `/estudio` (categoría Personajes) — misma card con su
  retrato y mini carrusel de escenas.
- **Destacados** de `/estudio` (`SkewedCarousel`) y el carrusel cóncavo de `/estudio`.
- Portada: la sección «Personajes con historia» (`.char-card`). Si la QA cuenta
  `.char-card`, conservar esa clase junto a la nueva.

No se usa en la lista (vista Lista), ni en las «Tres puertas» ni en los concilios de la
portada, que tienen su propio diseño.

## F.1 Datos reales por ficha (en el build)

En `scripts/content-lib.mjs`, al indexar cada estudio, añadir:

| Campo | Cálculo |
|---|---|
| `minutes` | palabras del cuerpo (sin frontmatter) / 200, redondeado, mínimo 1 |
| `citations` | nº de referencias bíblicas: regex de nombres/abreviaturas de libros + `\d+:\d+` |
| `sections` | nº de encabezados `^## ` |
| `number` | `NN` del último segmento numérico del slug (`--(\d+)-`), si existe |

Valores comprobados: Perdón 3 min · 14 citas · 6 secc.; Justificación 5 · 21 · 6;
Encarnación 8 · 40 · 9; El Hijo Pródigo 6 · 5 · 10. Mediana de Fundamentos: 4 min.

Personajes (en `src/data/personajes.js`): cifras = `escenas.length` «Escenas»,
`timeline.length` «Hitos» y la época abreviada («s. I»).

## F.2 Componente `src/components/StudyCard/StudyCard.jsx` + `StudyCard.css`

Props: `entry` (estudio o personaje), `headingLevel` (2 o 3), `index` (para `--reveal-d`).

Estructura (ver la referencia):

```
<div class="study-card">                         ← raíz; conserva la clase para reveal/tilt
  <Link class="study-card__link">                ← enlace único que ocupa toda la card
    <div class="study-card__media">               ← 210 px, radio 15 px
      <img class="study-card__img">                ← portada | imagen del tema | (sin imagen)
      <span class="study-card__mark">Ro</span>     ← solo sin imagen: abreviatura del libro
      <span class="study-card__badge">Nº 02</span>
      <span class="study-card__dots">• • •</span>  ← solo con varias imágenes (aria-hidden)
    </div>
    <div class="study-card__body">
      <p class="study-card__meta">01 · Fundamentos · Salvación</p>
      <h2 class="study-card__title">Justificación</h2>
      <p class="study-card__sub">Romanos 3:22-24</p>          ← personaje: su rol
      <p class="study-card__desc">…3 líneas…</p>
    </div>
    <div class="study-card__foot">
      <dl class="study-card__stats">5 min Lectura · 21 Citas · 6 Secciones</dl>
      <span class="study-card__cta" aria-hidden="true">Leer ficha →</span>
    </div>
  </Link>
  <button class="study-card__nav study-card__nav--prev" aria-label="Imagen anterior">   ← hermanos
  <button class="study-card__nav study-card__nav--next" aria-label="Imagen siguiente">  ← del Link
</div>
```

Reglas:

- **Sin aplastar:** las cifras van en su **propia fila** (rejilla de 3 columnas con
  divisores) y el botón ocupa **todo el ancho** debajo. Nunca cifras y botón en la misma fila
  ni anchos fijos. Altura mínima 572 px; en rejilla, todas las cards de una fila se igualan
  (`height: 100%`).
- **Colores (acordes a la página):** fondo `linear-gradient(180deg,#17171c,#121216)`, borde
  `rgba(255,255,255,.10)`, título `#f4f4f5` serif 24 px, meta `#8b8b92` 11 px versalitas,
  pasaje en **cursiva dorada** `#c9a96a`, resumen `#a8a8ad` 14 px/1.6, etiquetas de cifras
  `#8b8b92`, botón en hueso `#f1ece2` con borde `rgba(241,236,226,.28)` y fondo
  `rgba(241,236,226,.06)`. Todos pasan 4.5:1 sobre el fondo.
- **Imagen:** `entry.portada` → `tema.image` (de `content/temas.json`) → sin imagen: fondo
  `#0d0d10` con la abreviatura del libro del pasaje en serif 112 px al dorado 22 %.
- **Mini carrusel** (personajes con `escenas`): imágenes = `[portada, ...escenas]`; flechas
  de 32 px `<button>` **fuera** del `<Link>` (posición absoluta sobre la media), puntos
  `aria-hidden`. Las flechas cambian la imagen sin navegar (`event.stopPropagation()`).
- **Hover** (mantener el efecto actual): inclinación 3D en `.study-card__link`
  (`--tilt-x/--tilt-y` del JS que ya existe en `Estudio.jsx`), zoom 1.04 de la imagen, borde a
  `rgba(255,255,255,.22)` y el botón se vuelve sólido (`#f1ece2` sobre `#0a0a0b`).
  `prefers-reduced-motion`: sin zoom ni inclinación.
- **Aparición** (mantener): `.study-card` sigue recibiendo `is-revealed` y `--reveal-d`.
- Accesibilidad: un solo enlace por card; el título es el nombre accesible; el botón es un
  `span aria-hidden`; las cifras son un `<dl>`.

## F.3 Portadas opcionales con el arte que ya existe

Poner `portada` en el frontmatter (o desde `/admin`) para que no se repita la imagen del tema:

| Ficha | `portada` |
|---|---|
| 01 Perdón | `/img/banners/herobanner1.webp` |
| 02 Justificación | `/img/banners/herobanner3-reforma.webp` |
| 03 Reconciliación | `/img/personajes/ApostolPablo/ApostolPabloPoseNormal.webp` |
| 22 Arrepentimiento | `/img/personajes/ApostolPedro/ApostolPedroPoseNormal.webp` |
| 23 Redención | `/img/biblia/portada-ntv.webp` |
| 26 Regeneración | `/img/banners/herobanner4-nicodemo.webp` |

**Hecho cuando:** todas las vistas de tarjetas usan `StudyCard`; `npm run qa:vistas`
(reveal, tilt, carrusel) y `npm run qa:a11y` pasan; ninguna card muestra cifras o botón
cortados a 1280 px, 900 px ni 390 px.
