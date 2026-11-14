# Fase H — Biblia Patrística (`/biblia`): portada, índice y vista libro

Mejoras **sin cambiar cómo funciona**: misma paginación (`bookPages`), mismo `Book`, el mismo
`BookIndex` como fuente de datos y las mismas claves de `localStorage` (modo, tamaño, papel,
última página).

**Archivos:** `src/pages/Biblia.jsx`, `src/pages/Biblia.css`,
`src/components/BookIndex/BookIndex.jsx` + `.css`, `src/components/Book/BlockView.jsx`.

## H.1 Portada — orden final de la página

1. **Héroe con el Domo — SIN CAMBIOS.** `DomeGallery` y su bloque de texto
   (`.biblia__dome-head`: eyebrow «Padres de la Iglesia», «Biblia Patrística», el lead, el
   botón «Continuar leyendo · p. X» si hay posición guardada) y la pastilla «Índice de la obra
   ↓» se quedan exactamente como están hoy.
2. **«Acerca de esta obra» — el actual, sin rediseñar, movido justo debajo del Domo.** Es la
   sección `.biblia__about` de hoy (portada, «📖 Acerca de esta obra», «Del fuego de los
   primeros siglos a tu biblioteca», el `TextType`, la nota y las tres cifras con `CountUp`:
   páginas de lectura, partes de la obra, 700 años de tradición). Solo cambia de sitio si no
   está ya ahí: va inmediatamente después de `.biblia__dome`. Se mantienen sus textos, emoji,
   cifras y estilos. **No** se añade otra franja de cifras.
3. **«La obra en el tiempo»** (nuevo): una fila por obra con fecha en su título
   (`c. 70-100 d.C.` → barra de 70 a 100) sobre una regla de siglos (I, II, III…). Datos de
   las etiquetas de `book.parts` (regex `c\.\s*(\d+)\s*[–-]\s*(?:c\.\s*)?(\d+)`, o un solo año);
   las obras sin fecha no se pintan. Cada nombre/barra abre la obra en su página
   (`gotoId(part.id)`). Barras doradas `#c9a96a` de 8 px, nombre a la izquierda (220 px), fechas
   en gris a la derecha de la barra.
4. **Índice maestro–detalle** (H.2).
5. `BibleCta` («La misma Escritura, en otros dos lectores») al final, como hoy.

## H.2 Índice: maestro–detalle

Hoy son 855 entradas en dos columnas larguísimas. Pasa a:

- **Columna izquierda (~520 px):** los bloques (0 Introducción · 1 Padres Apostólicos ·
  2 Apologistas Griegos · 3–4 Ireneo, herejías y Tertuliano) y dentro **solo las obras**:
  número, título serif (sin la fecha), fecha o subtítulo debajo, una barra con su extensión
  (páginas; escala logarítmica) y el folio. Cada obra es un `<button aria-pressed>`; la elegida
  lleva fondo `--panel` y filete dorado (`box-shadow: inset 2px 0 0 #c9a96a`).
- **Panel derecho (sticky):** la obra elegida — «Parte 1.3 · Padres Apostólicos», título serif
  40 px, `fecha · N páginas · desde la p. X`; las **tres entradas estándar** como tarjetas
  (Resumen · Citas clave · Obra completa, cada una con su folio y un glifo ¶ “ §), y debajo
  «Dentro de la obra» en dos columnas (cartas, libros, capítulos…). Las listas muy largas
  (los cientos de capítulos de Tertuliano) se agrupan por obra o se muestran con «Ver todos».
- Al cargar, la obra elegida es la de la última posición guardada o, si no hay, la primera.
- **Buscador** arriba a la derecha: filtra las obras y, si coincide una sección, la muestra
  resaltada en el panel (mismo motor que hoy).
- Móvil (<900 px): acordeón (la obra se despliega en su sitio).
- `BookIndex` conserva su modo compacto para el cajón del lector (H.3).
- Iconos: los emojis de las **entradas del índice y de las cabeceras de página**
  (📖 📜 📄 🗂️ 🧭 📋 🗄️) se sustituyen por glifos o iconos de trazo (¶ resumen, “ citas,
  § obra completa, ▦ cuadro, ◇ lección…), mapeados por el texto del encabezado en `BookIndex`
  y `BlockView`. **El `.md` no se toca.** (El «📖» del eyebrow de «Acerca de esta obra» se
  queda, porque esa sección no cambia.)

Extensión de cada obra = folio de la siguiente − folio propio (con `folioOfPart`). Ejemplo
a 1440 px: Didaché 21 págs., Ignacio 23, Justino 96, Ireneo 493.

## H.3 Vista libro (lector)

1. **Barra del lector:**
   - Izquierda: «‹ Índice» (vuelve a la portada), **«Contenido»** (abre el cajón; antes
     «Índice rápido») y «Buscar».
   - Centro: `‹  p. 10 de 3.541 · Didaché — Citas clave explicadas  ›`.
   - Derecha: A− A+ · **tres muestras de papel** (crema / sepia / noche, con `aria-pressed`)
     en lugar del botón que va ciclando · **selector segmentado «Libro | Scroll»** en lugar del
     botón único que hoy muestra el modo contrario.
   - Iconos SVG de trazo (`currentColor`) en lugar de ☰ 🔍 📑 ☀.
2. **Progreso de la obra:** línea de 2 px bajo la barra con el avance (`folio / totalPages`) en
   dorado y una marca por bloque (folios de las partes de primer nivel) con su `title`.
3. **Cajón «Contenido»:** panel izquierdo de 320 px con el `BookIndex` compacto del **bloque
   actual** (sus obras y, de la actual, sus secciones, con la sección actual marcada). En
   pantallas de 1280 px o más desplaza el pliego; por debajo se superpone con sombra. Se cierra
   con Esc y al elegir una entrada. Sustituye al panel que hoy empuja el libro hacia abajo.
4. **Cabeceras de página** sin emojis («1.1 · Didaché | Citas clave explicadas»), versalitas de
   11 px.
5. **Flechas de página** de 48 px a ambos lados del pliego (ya existen; subirles el contraste) y
   la pista inferior en una sola línea de 12 px.
6. Con la barra de versículos arriba (fase A) el libro deja de quedar tapado por abajo; ajustar
   `viewportH` para restar `--marquee-h` y la altura de la barra del lector.
7. Al final de cada sección estándar, aviso «Siguiente: Obra completa · p. 12» (dato de
   `folioOfSection`), sin cambiar la paginación.

## H.4 Contenido de la obra (opcional, pedir confirmación antes)

- Encabezados inconsistentes en `public/textos/biblia-patristica.md`: Tatiano, Teófilo y
  Atenágoras usan `#` en vez de `##`; Tertuliano está en mayúsculas («# PARTE 4.1 —
  TERTULIANO…») y **no existe el encabezado «Parte 4»**, por eso Tertuliano aparece suelto en el
  índice. Normalizar con `scripts/fix-biblia-doc.mjs` (simula sin `--write`).
- Errata: «EMBARJADA EN FAVOR DE LOS CRISTIANOS» → «EMBAJADA».

**Hecho cuando:** `npm run qa:biblia` y `npm run qa:a11y` pasan; el Domo y «Acerca de esta obra»
se ven como hoy (y en ese orden); el índice abre cualquier obra en su folio; el lector conserva
modo, tamaño, papel y última página tras recargar.
