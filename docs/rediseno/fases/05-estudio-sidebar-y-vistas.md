# Fase E — /estudio: sidebar de temas y agrupación

**Archivos:** `src/pages/Estudio.jsx`, `src/pages/Estudio.css`, `src/data/temas.js`.

1. Si la categoría activa tiene temas en `temas.json` (o fichas con `subcategory`):
   - Layout `grid-template-columns: 236px minmax(0, 1fr)`; la sidebar es un `<nav
     aria-label="Temas de …">` **sticky** (`top: calc(var(--marquee-h,0px) + 100px)`) con
     cada tema y su número de fichas; enlaces a `#tema-<slug>`.
   - Tema activo con *scrollspy* (`IntersectionObserver` sobre los encabezados de grupo):
     `aria-current="true"`, fondo `--panel` y filete dorado (`box-shadow: inset 2px 0 0 #c9a96a`).
   - Las entradas se agrupan por tema (orden de `temas.json`; lo no listado al final) con un
     `<h2>` por grupo («Salvación · 17 fichas» + lema).
   - Con búsqueda activa, los grupos vacíos se ocultan y la sidebar muestra los recuentos
     filtrados.
2. Sin categoría (Todos) o categoría sin temas: todo como hoy (sin sidebar, sin grupos).
3. Móvil (≤900 px): la sidebar se convierte en una fila de pestañas con scroll horizontal
   bajo los chips (subrayado dorado en la activa). Nunca `position: sticky` en móvil.
4. Las **tres vistas** usan la misma agrupación:
   - **Tarjetas:** una rejilla por grupo (3 columnas en escritorio) con la **card común**
     de la fase F (`06-card-comun.md`), igual en todas las categorías.
   - **Lista:** índice tipo libro: cabecera de columnas «Nº · Ficha · Pasaje», filas con
     número, título serif + resumen en una línea, pasaje en cursiva dorada alineado a la
     derecha y flecha. Se elimina el cuadrado con la inicial (ninguna ficha tiene portada).
   - **Carrusel:** una sola secuencia ordenada por tema; debajo, contador «11 de 40 · Gracia»,
     barra de progreso dorada y enlaces «Saltar a: …» que llevan el carrusel al primer
     elemento de ese tema. Revisar si `ConcaveCarousel` expone el índice activo; si no,
     añadir `onIndexChange` y un método/prop para ir a un índice.
5. **Los efectos no cambian:** aparición escalonada (`is-revealed`, `--reveal-d`) e
   inclinación 3D al pasar el ratón en tarjetas; desplazamiento en hover de la lista; curva
   cóncava con giro hacia el centro en el carrusel. Mantener las clases `.study-card` y
   `.estudio__grid` que usa ese JS (o actualizar los selectores a la vez).
