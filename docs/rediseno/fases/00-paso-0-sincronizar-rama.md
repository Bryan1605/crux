# Paso 0 — Sincronizar la rama (obligatorio)

La carpeta local está en `docs/proyecto-biblico-plan`, que **no** tiene la portada nueva
(por eso el proyecto local se ve como antes aunque la web sí cambió). Antes de nada:

```bash
git status                      # sin cambios pendientes
git switch main && git pull     # trabajar sobre main…
# …o, si se quiere seguir en la rama de docs:
git switch docs/proyecto-biblico-plan && git merge main
```

Trabaja en `main` (el deploy sale de ahí) con **un commit por fase**.
