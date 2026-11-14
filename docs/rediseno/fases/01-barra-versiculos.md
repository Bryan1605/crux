# Fase A — Barra de versículos arriba, fina y con su ✕

**Qué:** la marquesina pasa de abajo (130 px) a una franja de ~34 px **arriba de todo**,
encima del menú (`CardNav`). Mismo estilo de texto (serif, cruz ✝ como separador), más
pequeño, y el botón de cierre redondo de siempre, a escala.

**Archivos:** `src/components/MarqueeBar/MarqueeBar.jsx` y `.css`,
`src/components/CardNav/CardNav.css`, `src/pages/Home.css`, `scripts/qa-vistas.mjs`.

1. `.marquee-bar`: `top: 0` en lugar de `bottom: 0`; fondo `#0a0a0b`, borde inferior
   `1px solid rgba(255,255,255,.08)`.
2. Pasar a `BendingMarquee` `fontSize={13}` y `height={34}` (ya acepta ambas props). Si el
   componente curva el texto, revisar su API y dejarlo plano o con curva mínima en esta barra.
3. Botón ✕: 28–32 px de diámetro, centrado vertical, `right: 8px`. Para no bajar el área
   táctil (la QA de a11y falla por debajo de 24 px y avisa por debajo de 44), añadir un
   área invisible: `.marquee-bar__close::after { content:''; position:absolute; inset:-8px; }`.
4. Se sigue publicando `--marquee-h` (ahora ~34px). Usarla **arriba**:
   - `CardNav.css`: `top: calc(var(--marquee-h, 0px) + 1.4em)`.
   - `Home.css` `.hero__copy`: el `padding-bottom` deja de sumar `--marquee-h`; el
     `padding-top` pasa a `calc(var(--marquee-h, 0px) + 60px + 1.4em + var(--sp-6))`.
   - Buscar otros usos: `grep -rn "marquee-h" src` (p. ej. páginas con cabecera propia o el
     padding del `body`/pie) y moverlos de abajo a arriba.
5. Al cerrar (sessionStorage, como hoy) `--marquee-h` se borra y el menú sube solo.
6. **QA** (`scripts/qa-vistas.mjs`, bloque «La barra fija…»): cambiar las dos comprobaciones
   para que verifiquen que la barra **no tapa el menú** (`barra.bottom <= nav.top + 1`) y
   que el pie ya no necesita padding inferior.

**Hecho cuando:** la barra se ve arriba en todas las rutas, el menú queda debajo sin
solaparse, el ✕ la oculta durante la sesión y `npm run qa:vistas` pasa.
