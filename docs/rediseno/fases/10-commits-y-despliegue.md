# Commits y despliegue

Un commit por fase en `main`, con mensaje en español y el formato del repo:

| Fase | Archivo | Commit sugerido |
|---|---|---|
| A | `01-barra-versiculos.md` | `Barra de versículos arriba, fina y con cierre` |
| B | `02-heroe-nicodemo.md` | `Héroe de la portada con Jesús y Nicodemo` |
| C | `03-banner-texto-inmediato.md` | `El pie del banner cambia al empezar la transición` |
| D | `04-temas-por-categoria.md` | `Temas por categoría y asignación de Fundamentos` |
| E | `05-estudio-sidebar-y-vistas.md` | `Sidebar de temas y vistas agrupadas en /estudio` |
| F | `06-card-comun.md` | `Card común para todas las vistas de tarjetas` |
| G | `07-erratas-contenido.md` | `Corrige erratas de las fichas` |
| H | `08-biblia-patristica.md` | `Mejora la portada, el índice y el lector de la Biblia Patrística` |

**No hacer `git push` sin confirmación del usuario.** Cuando la confirme:
`git push origin main` → GitHub Pages despliega solo. Comprobar en
https://bryan1605.github.io/crux/ (Ctrl+F5).
