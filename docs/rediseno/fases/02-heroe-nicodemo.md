# Fase B — Héroe: Jesús con Nicodemo como primera imagen

**Qué:** `herobanner4-nicodemo.webp` ocupa **todo el fondo del héroe** (no solo la columna
de la cruz). La cruz 3D sigue igual en la columna derecha. Nicodemo **se queda también** como
1.ª diapositiva del banner.

**Archivos:** `src/pages/Home.jsx`, `src/pages/Home.css`.

1. En `.hero`, antes de `.hero__grid`, añadir dos capas `aria-hidden`:
   - `.hero__bg` → `background-image: url(assetUrl('/img/banners/herobanner4-nicodemo.webp'))`
     (vía `style`, como hoy), `background-size: cover`, `background-position: center 30%`,
     `opacity: .5`.
   - `.hero__scrim` → `linear-gradient(90deg, #0a0a0b 0%, rgba(10,10,11,.88) 30%,
     rgba(10,10,11,.3) 68%, rgba(10,10,11,.55) 100%)` para que el titular se lea.
2. Quitar `.hero__stage-bg` (la imagen tenue de `herobanner1`) y su CSS.
3. Móvil (≤900 px): degradado vertical (`180deg`), con la imagen visible arriba detrás de la
   cruz y oscura bajo el texto.
4. Comprobar en la captura de la QA (`%TEMP%\opencode\crux\v-home.png`) que la cruz blanca
   contrasta con el fondo; si no, bajar la opacidad a `.4`.
