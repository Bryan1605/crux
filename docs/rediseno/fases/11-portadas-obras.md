# Fase I — Portada de cada autor u obra (índice de la Biblia Patrística)

Cada obra del índice de `/biblia` puede llevar una **portada** (ilustración vertical 3:4) en el
panel de detalle, a la izquierda del título. La primera es la de **Ignacio de Antioquía
(Parte 1.3)**. Las obras sin portada se quedan **exactamente como hoy**.

Diseño de referencia (canvas, página «Biblia Patrística»): artboard
`Biblia-Portada-Obra` (con portada / sin portada / móvil / miniatura opcional) y el panel de
`Biblia-Portada`, que ya la muestra para la Parte 1.3.

**Archivos:** `content/obras-patristica.json` (nuevo), `scripts/validate-content.mjs`,
`vite.config.js`, `scripts/optimize-images.mjs`, `src/data/obras.js` (nuevo),
`src/components/BookIndex/BookIndex.jsx` + `.css`, `public/img/obras/` (generado).

**No se toca:** el texto de la Biblia (`public/textos/biblia-patristica.md`), la paginación
(`bookPages`), el lector, el cajón compacto del lector (`BookIndex compact`), el Domo ni
«Acerca de esta obra».

---

## I.1 Imagen fuente y versión web

- Fuente (ya existe, **no moverla ni renombrarla**):
  `src/assets/imgs/Personajes/Ignacio de Antioquia/Portada_Ignacio_de_Antioquia_Estilo_Crux.jpg`
  (1792×2400, 3:4). Recuerda: los JPG de `src/assets/imgs/` **no se versionan** (gotcha 11).
- Salida: `public/img/obras/1-3-ignacio-de-antioquia.webp`, **600 px de ancho, calidad 78**
  (se muestra a 184 px; 600 cubre pantallas 3×). Este `.webp` **sí** se versiona.
- En `scripts/optimize-images.mjs`:
  1. Nuevo bloque «Portadas de obras»: lee `content/obras-patristica.json` y, por cada item,
     añade el job `[join(IMG, item.fuente), join(ROOT, 'public', item.portada), 600, 78]`.
  2. En el recorrido de `Personajes`, **salta las fuentes que ya usa una obra** (las
     `fuente` del JSON) para no generar además un `public/img/personajes/…/Portada_….webp`
     de 1100 px que nadie usa.
- Ejecuta `node scripts/optimize-images.mjs` y comprueba que sale
  `public/img/obras/1-3-ignacio-de-antioquia.webp` (≈ 40–90 KB).

## I.2 Datos: `content/obras-patristica.json`

Una entrada por obra con portada; la clave es el **número de Parte** del índice (el `num` que
devuelve `partInfo(part.label)`: `"1.3"`, `"2.1"`, `"4.1"`…). Añadir otra portada = una
entrada más y volver a correr el script de imágenes.

```json
{
  "version": 1,
  "items": [
    {
      "parte": "1.3",
      "titulo": "Ignacio de Antioquía",
      "fuente": "Personajes/Ignacio de Antioquia/Portada_Ignacio_de_Antioquia_Estilo_Crux.jpg",
      "portada": "/img/obras/1-3-ignacio-de-antioquia.webp",
      "alt": "Ignacio de Antioquía en mosaico: obispo de barba larga con halo y manos cruzadas sobre el pecho"
    }
  ]
}
```

- `titulo` es solo para leer el JSON (no se pinta); `fuente` es relativa a `src/assets/imgs/`
  y solo la usa el script de imágenes.

## I.3 Validación (el build falla si está mal)

En `scripts/validate-content.mjs`, `validateObrasPatristica(obj)` y su entrada
`'obras-patristica': validateObrasPatristica` en `VALIDATORS`:

- `version` número; `items` array.
- Cada item: `parte` string con `/^\d+(\.\d+)?$/`, **única**; `portada` string que empieza por
  `/img/obras/` y acaba en `.webp`; `alt` string no vacío (≤ 160 caracteres); `titulo` y
  `fuente` strings opcionales.
- En `vite.config.js` (`contentGuard`), añade `'obras-patristica'` a la lista
  `['videos', 'slides', …]` y comprueba además que **cada `portada` existe** en `public/`
  (como se hace con el audio de `narraciones`). Si falta el `.webp`, el build falla con
  «content/obras-patristica.json → falta public/img/obras/…».
- `npm run qa:imagenes` ya recorre toda ruta `/img/...` de `content/`: la portada queda cubierta
  sin cambios.

## I.4 Lectura en la app: `src/data/obras.js`

Mismo patrón que `src/data/slides.js` (import estático del JSON):

```js
// Portadas de las obras de la Biblia Patrística: fuente única en content/obras-patristica.json
import obras from '../../content/obras-patristica.json';
import { assetUrl } from '../lib/assets';

const BY_PARTE = new Map(obras.items.map(o => [o.parte, { src: assetUrl(o.portada), alt: o.alt }]));

/** Portada de la Parte `num` («1.3»), o null si aún no tiene. */
export const portadaDe = num => BY_PARTE.get(num) || null;
```

## I.5 Panel de detalle (`WorkDetail` en `BookIndex.jsx`)

Hoy: kicker → título → meta + «Empezar a leer →» → entradas → «Dentro de la obra». Cambia solo
la cabecera:

```jsx
const portada = portadaDe(info.num);
…
<div className={`toc-work__head ${portada ? 'has-cover' : ''}`.trim()}>
  {portada && (
    <button
      type="button"
      className="toc-work__cover"
      onClick={() => onSelect(work.part.id)}
      aria-label={`Empezar a leer ${info.title || work.part.label}`}
    >
      <img src={portada.src} alt={portada.alt} width="600" height="800" loading="lazy" decoding="async" />
    </button>
  )}
  <div className="toc-work__head-text">
    {/* kicker, h3 y meta + «Empezar a leer →» tal cual están hoy */}
  </div>
</div>
```

- Sin portada no se pinta nada nuevo: la cabecera se ve como hoy.
- El `alt` es el del JSON (la imagen es la portada, no decoración); el botón lleva su propio
  `aria-label`.
- Sirve igual en escritorio (panel `.toc__detail`) y en móvil (acordeón `.toc__inline`),
  porque los dos usan `WorkDetail`.

## I.6 Estilos (`BookIndex.css`)

```css
.toc-work__head.has-cover {
  display: flex;
  align-items: flex-end;
  gap: 1.6rem;
}
.toc-work__head-text { flex: 1 1 auto; min-width: 0; }

.toc-work__cover {
  flex: 0 0 auto;
  width: 184px;
  aspect-ratio: 3 / 4;
  padding: 0;
  overflow: hidden;
  background: var(--panel);
  border: 1px solid var(--border-strong);   /* rgba(255,255,255,.14) en el diseño */
  border-radius: 14px;
  cursor: pointer;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}
.toc-work__cover img { display: block; width: 100%; height: 100%; object-fit: cover; }
.toc-work__cover:hover { transform: translateY(-3px); box-shadow: 0 18px 40px rgba(0, 0, 0, 0.55); }
.toc-work__cover:focus-visible { outline: 2px solid var(--toc-gold); outline-offset: 3px; }

@media (max-width: 899px) {
  .toc-work__head.has-cover { gap: 1rem; }
  .toc-work__cover { width: 104px; border-radius: 10px; }
}
@media (prefers-reduced-motion: reduce) {
  .toc-work__cover { transition: none; }
  .toc-work__cover:hover { transform: none; }
}
```

- Con portada, el título baja a la base de la imagen (`align-items: flex-end`); el título y la
  meta conservan sus tamaños actuales. Si el título no cabe a 40 px junto a la portada, que haga
  salto de línea; **no** reducir la portada.
- En móvil la portada mide 104 px y la meta + «Empezar a leer →» quedan a su derecha
  (artboard `Biblia-Portada-Obra`, columna «Móvil»).

## I.7 Opcional, más adelante (no hacer ahora)

Miniatura de 36×48 en la lista de obras (columna izquierda), con la inicial del autor cuando no
hay portada. Solo tiene sentido cuando haya portada para casi todas las obras; está dibujada en
el canvas como «fase 2».

## Hecho cuando

- [ ] `public/img/obras/1-3-ignacio-de-antioquia.webp` existe (600 px) y no se ha generado un
      `public/img/personajes/Ignacio de Antioquia/Portada_….webp`.
- [ ] `content/obras-patristica.json` valida; un `parte` repetido o una `portada` inexistente
      rompen `npm run build` con un mensaje claro (pruébalo y deshazlo).
- [ ] `/biblia` → índice → «Ignacio de Antioquía»: portada a la izquierda del título; clic en la
      portada abre la obra en su página (p. 67), igual que «Empezar a leer →».
- [ ] «Policarpo de Esmirna» (sin portada) se ve idéntico a antes.
- [ ] En 390 px el acordeón de 1.3 muestra la portada de 104 px sin desbordar.
- [ ] `npm run build`, `npm run qa:biblia`, `npm run qa:imagenes`, `npm run qa:a11y` y
      `npm run qa:vistas` en verde.
- [ ] Un commit: «Biblia Patrística: portada por obra en el índice (Ignacio de Antioquía)».
      **Sin push** hasta que el autor lo confirme.
