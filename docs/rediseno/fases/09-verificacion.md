# Verificación (al final de cada fase)

```bash
npm run dev          # en otra terminal
npm run build        # valida contenido + temas.json, regenera índices
npm run qa:vistas    # vistas, portada, barra
npm run qa:a11y      # 0 critical/serious, escritorio y móvil
npm run qa:imagenes  # todas las /img/… responden
npm run qa:enlaces   # anclas #tema-… incluidas
npm run qa:biblia    # fase H
```

Añadir a `qa-vistas.mjs`:

- `/estudio?cat=01-fundamentos` pinta la sidebar con 13 temas y la suma de recuentos es 92.
- Al hacer clic en un tema, la página baja a su grupo y ese tema queda `aria-current`.
- En las tres vistas aparecen los mismos 92 elementos.
- El pie del banner cambia en menos de 300 ms tras empezar la transición.
- La barra de versículos está arriba (`top === 0`) y no solapa el menú.
- Todas las cards de `/estudio` en modo Tarjetas (cualquier categoría) usan `.study-card` con
  `.study-card__stats` y `.study-card__cta` visibles y sin desbordar a 1280, 900 y 390 px.
- En `/biblia`, la sección «Acerca de esta obra» es la siguiente a `.biblia__dome`.

Revisar también las capturas en `%TEMP%\opencode\crux\` (la cruz 3D solo se ve en la QA o en
una pestaña visible del navegador).
